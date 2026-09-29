"""Jakarta Public Transport Journey Planner — FastAPI Backend
Production-ready: in-memory transit graph, geocoding, multi-criteria routing.
Zero external infra needed — file-based data, in-process cache.
"""

import json, math, time, os
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from functools import lru_cache
from typing import Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

BASE = Path(__file__).resolve().parent
DATA = BASE / 'data'

app = FastAPI(title="Jakarta Transit Journey Planner", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── LOAD GRAPH ───
def _load(name):
    with open(DATA / name, 'r', encoding='utf-8') as f:
        return json.load(f)

stops    = _load('graph_stops.json')
routes   = _load('graph_routes.json')
trip_meta = _load('graph_trip_meta.json')
stop_trips = _load('graph_stop_trips.json')
trip_stops = _load('graph_trip_stops.json')
stop_seq  = _load('graph_stop_seq.json')
route_trips = _load('graph_route_trips.json')
transfers = _load('graph_transfers.json')
calendar_data = _load('graph_calendar.json')
frequencies = _load('graph_frequencies.json')
shapes_by_route = _load('graph_shapes.json')
stop_coords = _load('graph_stop_coords.json')

# Build KDTree for nearest-stop search
import itertools
coords_list = []
stop_id_list = []
for sid, (lat, lon) in stop_coords.items():
    coords_list.append((lat, lon))
    stop_id_list.append(sid)

# Simple KDTree: precompute grid buckets (0.005 deg ~ 500m)
GRID_SIZE = 0.005
grid = defaultdict(list)
for sid, (lat, lon) in stop_coords.items():
    gx, gy = int(lat / GRID_SIZE), int(lon / GRID_SIZE)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            grid[(gx + dx, gy + dy)].append(sid)

print(f"Transit graph loaded: {len(stops)} stops, {len(routes)} routes, {len(trip_meta)} trips")

# ─── UTILS ───
def parse_time(t: str) -> int:
    """GTFS time (>24h supported) → seconds since midnight"""
    parts = t.split(':')
    return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2]) if len(parts) >= 3 else 0

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def walking_time(dist_m):
    return max(60, int(dist_m / 1.4))

# ─── NEAREST STOPS ───
def nearest_stops(lat: float, lon: float, radius_m: float = 500, limit: int = 10):
    gx, gy = int(lat / GRID_SIZE), int(lon / GRID_SIZE)
    candidates = set()
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            candidates.update(grid.get((gx + dx, gy + dy), []))
    if not candidates:
        # Fallback: search all stops in wider grid
        for sid in stop_coords:
            candidates.add(sid)

    result = []
    for sid in candidates:
        slat, slon = stop_coords[sid]
        dist = haversine(lat, lon, slat, slon)
        if dist <= radius_m:
            result.append((sid, dist))
    result.sort(key=lambda x: x[1])
    return result[:limit]

# ─── CALENDAR CHECK ───
def is_service_active(service_id: str, date_str: str) -> bool:
    cal = calendar_data.get(service_id)
    if not cal:
        return True  # Default active if unknown
    # Check date range
    sd = cal.get('start_date', '19000101')
    ed = cal.get('end_date', '20991231')
    if not (sd <= date_str <= ed):
        return False
    # Check day of week
    dt = datetime.strptime(date_str, '%Y%m%d')
    day_map = {0: 'monday', 1: 'tuesday', 2: 'wednesday', 3: 'thursday',
               4: 'friday', 5: 'saturday', 6: 'sunday'}
    return cal.get(day_map[dt.weekday()], '1') == '1'

# ─── FREQUENCY RESOLVER ───
def get_next_departure(trip_id: str, after_seconds: int, date_str: str = '20260929') -> Optional[int]:
    """Return next departure seconds since midnight for this trip. None if not running."""
    freqs = frequencies.get(trip_id, [])
    if not freqs:
        return None  # Need schedule data

    for f in freqs:
        start = parse_time(f['start_time'])
        end = parse_time(f['end_time'])
        headway = f.get('headway_secs', 600)

        if after_seconds <= start:
            return start
        if start <= after_seconds < end:
            # Next departure based on headway
            return start + math.ceil((after_seconds - start) / headway) * headway
    return None

# ─── DIRECT ROUTE SEARCH ───
def find_direct_journey(origin_stop: str, dest_stop: str, after_seconds: int,
                         date_str: str = '20260929', direction_id: int = None):
    """Find a trip where origin_stop and dest_stop appear in sequence (same trip, same direction)."""
    origin_trips = set(stop_trips.get(origin_stop, []))
    dest_trips = set(stop_trips.get(dest_stop, []))
    common = origin_trips & dest_trips
    if not common:
        return None

    best = None
    for tid in common:
        seq_map = stop_seq.get(tid, {})
        if origin_stop not in seq_map or dest_stop not in seq_map:
            continue
        if seq_map[origin_stop] >= seq_map[dest_stop]:
            continue  # Wrong direction

        tm = trip_meta.get(tid, {})
        if direction_id is not None and tm.get('direction_id') != direction_id:
            continue

        ride_minutes = (seq_map[dest_stop] - seq_map[origin_stop]) * 2  # rough: 2 min per stop

        dep = get_next_departure(tid, after_seconds, date_str)
        if dep is None:
            dep = after_seconds  # Fallback: assume immediate
        arr = dep + ride_minutes * 60

        if best is None or dep < best['departure_seconds']:
            best = {
                'trip_id': tid,
                'route_id': tm.get('route_id', ''),
                'direction_id': tm.get('direction_id', 0),
                'headsign': tm.get('headsign', ''),
                'boarding_stop': origin_stop,
                'alighting_stop': dest_stop,
                'boarding_seq': seq_map[origin_stop],
                'alighting_seq': seq_map[dest_stop],
                'stop_count': seq_map[dest_stop] - seq_map[origin_stop],
                'departure_seconds': dep,
                'arrival_seconds': arr,
                'status': 'ESTIMATED',
            }
    return best

# ─── 1-TRANSFER SEARCH ───
def find_one_transfer(origin_stop: str, dest_stop: str, after_seconds: int,
                      date_str: str = '20260929', transfer_buffer: int = 120):
    """Try: origin → transfer_stop via trip A, transfer_stop → dest via trip B."""
    origin_trips = set(stop_trips.get(origin_stop, []))
    dest_trips = set(stop_trips.get(dest_stop, []))

    transfer_candidates = set(transfers.get(origin_stop, []))
    # Also try same-stop transfers
    transfer_candidates.add(origin_stop)

    best = None
    for tx_stop in transfer_candidates:
        tx_trips = set(stop_trips.get(tx_stop, []))
        dest_routes_set = set(stop_trips.get(dest_stop, []))

        # Leg 1: origin -> tx_stop
        leg1_trips = origin_trips & tx_trips
        leg2_trips = tx_trips & dest_routes_set

        if not leg1_trips or not leg2_trips:
            continue

        for t1 in leg1_trips:
            seq1 = stop_seq.get(t1, {})
            if origin_stop not in seq1 or tx_stop not in seq1:
                continue
            if seq1[origin_stop] >= seq1[tx_stop]:
                continue
            tm1 = trip_meta.get(t1, {})
            ride1_min = (seq1[tx_stop] - seq1[origin_stop]) * 2

            dep1 = get_next_departure(t1, after_seconds, date_str)
            if dep1 is None:
                dep1 = after_seconds
            arr1 = dep1 + ride1_min * 60

            for t2 in leg2_trips:
                if t1 == t2:
                    continue  # Same trip = direct, handled elsewhere
                seq2 = stop_seq.get(t2, {})
                if tx_stop not in seq2 or dest_stop not in seq2:
                    continue
                if seq2[tx_stop] >= seq2[dest_stop]:
                    continue
                tm2 = trip_meta.get(t2, {})

                dep2 = get_next_departure(t2, arr1 + transfer_buffer, date_str)
                if dep2 is None:
                    continue
                ride2_min = (seq2[dest_stop] - seq2[tx_stop]) * 2
                arr2 = dep2 + ride2_min * 60

                total_duration = arr2 - after_seconds
                if best is None or total_duration < (best['arrival_seconds'] - best['departure_seconds'] + best.get('_first_dep', after_seconds) - after_seconds):
                    best = {
                        'legs': [
                            {
                                'type': 'BUS',
                                'trip_id': t1,
                                'route_id': tm1.get('route_id', ''),
                                'direction_id': tm1.get('direction_id', 0),
                                'headsign': tm1.get('headsign', ''),
                                'from_stop': origin_stop,
                                'to_stop': tx_stop,
                                'departure_seconds': dep1,
                                'arrival_seconds': arr1,
                                'stop_count': seq1[tx_stop] - seq1[origin_stop],
                                'status': 'ESTIMATED',
                            },
                            {
                                'type': 'TRANSFER',
                                'from_stop': tx_stop,
                                'to_stop': tx_stop,
                                'walk_distance': 0,
                                'transfer_time': transfer_buffer,
                            },
                            {
                                'type': 'BUS',
                                'trip_id': t2,
                                'route_id': tm2.get('route_id', ''),
                                'direction_id': tm2.get('direction_id', 0),
                                'headsign': tm2.get('headsign', ''),
                                'from_stop': tx_stop,
                                'to_stop': dest_stop,
                                'departure_seconds': dep2,
                                'arrival_seconds': arr2,
                                'stop_count': seq2[dest_stop] - seq2[tx_stop],
                                'status': 'ESTIMATED',
                            },
                        ],
                        'departure_seconds': dep1,
                        'arrival_seconds': arr2,
                        'transfer_count': 1,
                    }
    return best

# ─── WALKING TRANSFER SEARCH ───
def find_walking_one_transfer(origin_stop: str, dest_stop: str, after_seconds: int,
                               date_str: str = '20260929', transfer_buffer: int = 120):
    """Origin → leg1 → alight → walk → board → leg2 → destination.
    Walking between two DIFFERENT stops (not same stop transfer)."""
    origin_trips = set(stop_trips.get(origin_stop, []))
    dest_trips = set(stop_trips.get(dest_stop, []))

    best = None
    for t1 in origin_trips:
        seq1 = stop_seq.get(t1, {})
        if origin_stop not in seq1:
            continue
        tm1 = trip_meta.get(t1, {})

        # Try every stop AFTER origin on this trip as potential alight point
        for alight_stop, alight_seq in seq1.items():
            if alight_seq <= seq1[origin_stop]:
                continue
            # Find nearby transfer stops within 500m
            alight_transfers = set(transfers.get(alight_stop, []))
            ride1_min = (alight_seq - seq1[origin_stop]) * 2

            dep1 = get_next_departure(t1, after_seconds, date_str)
            if dep1 is None:
                dep1 = after_seconds
            arr1 = dep1 + ride1_min * 60

            for tx_stop in alight_transfers:
                if tx_stop == alight_stop:
                    continue
                # Walking distance
                alat, alon = stop_coords.get(alight_stop, (0, 0))
                blat, blon = stop_coords.get(tx_stop, (0, 0))
                walk_dist = haversine(alat, alon, blat, blon)
                if walk_dist > 500:
                    continue

                walk_time = walking_time(walk_dist)
                board_time = arr1 + walk_time + transfer_buffer

                # Find leg2 from tx_stop to dest
                tx_trips = set(stop_trips.get(tx_stop, []))
                for t2 in tx_trips & dest_trips:
                    if t2 == t1:
                        continue
                    seq2 = stop_seq.get(t2, {})
                    if tx_stop not in seq2 or dest_stop not in seq2:
                        continue
                    if seq2[tx_stop] >= seq2[dest_stop]:
                        continue
                    tm2 = trip_meta.get(t2, {})

                    dep2 = get_next_departure(t2, board_time, date_str)
                    if dep2 is None:
                        continue
                    ride2_min = (seq2[dest_stop] - seq2[tx_stop]) * 2
                    arr2 = dep2 + ride2_min * 60

                    total_dur = arr2 - after_seconds
                    if best is None or total_dur < (best['arrival_seconds'] - best.get('_base', after_seconds)):
                        best = {
                            'legs': [
                                {
                                    'type': 'BUS', 'trip_id': t1, 'route_id': tm1.get('route_id', ''),
                                    'direction_id': tm1.get('direction_id', 0), 'headsign': tm1.get('headsign', ''),
                                    'from_stop': origin_stop, 'to_stop': alight_stop,
                                    'departure_seconds': dep1, 'arrival_seconds': arr1,
                                    'stop_count': alight_seq - seq1[origin_stop], 'status': 'ESTIMATED',
                                },
                                {
                                    'type': 'WALK', 'from_stop': alight_stop, 'to_stop': tx_stop,
                                    'distance_m': round(walk_dist), 'duration_seconds': walk_time,
                                },
                                {
                                    'type': 'BUS', 'trip_id': t2, 'route_id': tm2.get('route_id', ''),
                                    'direction_id': tm2.get('direction_id', 0), 'headsign': tm2.get('headsign', ''),
                                    'from_stop': tx_stop, 'to_stop': dest_stop,
                                    'departure_seconds': dep2, 'arrival_seconds': arr2,
                                    'stop_count': seq2[dest_stop] - seq2[tx_stop], 'status': 'ESTIMATED',
                                },
                            ],
                            'departure_seconds': dep1, 'arrival_seconds': arr2, 'transfer_count': 1,
                            'walk_distance': round(walk_dist),
                            '_base': after_seconds,
                        }
    return best

# ─── BUILD JOURNEY RESPONSE ───
def format_seconds(secs: int) -> str:
    h, m = divmod(secs // 60, 60)
    return f"{h:02d}:{m:02d}"

def build_journey(plan, origin_walk=None, dest_walk=None, departure_base=None):
    """Convert internal plan to API response format."""
    legs = []
    total_walk = 0
    prev_arr_time = None

    # Origin walking leg
    if origin_walk and origin_walk.get('distance', 0) > 0:
        legs.append({
            'type': 'WALK', 'description': f"Jalan kaki {origin_walk['distance']} m (±{origin_walk.get('minutes',0)} menit)",
            'distance_m': origin_walk['distance'],
            'duration_seconds': origin_walk.get('minutes', 0) * 60,
            'from_name': 'Titik awal',
            'to_name': origin_walk.get('to_stop_name', 'Halte'),
            'from_lat': origin_walk.get('from_lat', 0),
            'from_lon': origin_walk.get('from_lon', 0),
            'to_lat': origin_walk.get('to_lat', 0),
            'to_lon': origin_walk.get('to_lon', 0),
        })
        total_walk += origin_walk['distance']
        prev_arr_time = departure_base + walking_time(origin_walk['distance'])

    for leg in plan.get('legs', []):
        route_meta = routes.get(leg.get('route_id', ''), {})
        from_s = stops.get(leg.get('from_stop', ''), {})
        to_s = stops.get(leg.get('to_stop', ''), {})

        if leg['type'] == 'BUS':
            dep_s = leg['departure_seconds']
            arr_s = leg['arrival_seconds']
            status = leg.get('status', 'ESTIMATED')

            # Build shape for this leg
            shape_coords = None
            rid = leg.get('route_id', '')
            if rid in shapes_by_route:
                shape_coords = shapes_by_route[rid][0] if shapes_by_route[rid] else None

            legs.append({
                'type': 'BUS',
                'description': f"Naik {route_meta.get('short_name', rid)} arah {leg.get('headsign', '')}",
                'route_id': rid,
                'route_short_name': route_meta.get('short_name', rid),
                'route_long_name': route_meta.get('long_name', ''),
                'route_category': route_meta.get('category', ''),
                'trip_id': leg.get('trip_id', ''),
                'direction_id': leg.get('direction_id', 0),
                'headsign': leg.get('headsign', ''),
                'from_stop_id': leg.get('from_stop', ''),
                'from_stop_name': from_s.get('name', ''),
                'from_lat': from_s.get('lat', 0),
                'from_lon': from_s.get('lon', 0),
                'to_stop_id': leg.get('to_stop', ''),
                'to_stop_name': to_s.get('name', ''),
                'to_lat': to_s.get('lat', 0),
                'to_lon': to_s.get('lon', 0),
                'departure_time': format_seconds(dep_s),
                'arrival_time': format_seconds(arr_s),
                'duration_seconds': arr_s - dep_s,
                'stop_count': leg.get('stop_count', 0),
                'status': status,
                'geometry': shape_coords,  # [[lon, lat], ...]
            })
            prev_arr_time = arr_s

        elif leg['type'] == 'WALK':
            dist = leg.get('distance_m', 0)
            dur = leg.get('duration_seconds', 0)
            total_walk += dist
            fs = stops.get(leg.get('from_stop', ''), {})
            ts = stops.get(leg.get('to_stop', ''), {})
            legs.append({
                'type': 'WALK',
                'description': f"Jalan kaki {dist} m (±{dur//60} menit)",
                'from_stop_id': leg.get('from_stop', ''),
                'from_stop_name': fs.get('name', ''),
                'from_lat': fs.get('lat', 0),
                'from_lon': fs.get('lon', 0),
                'to_stop_id': leg.get('to_stop', ''),
                'to_stop_name': ts.get('name', ''),
                'to_lat': ts.get('lat', 0),
                'to_lon': ts.get('lon', 0),
                'distance_m': dist,
                'duration_seconds': dur,
            })

        elif leg['type'] == 'TRANSFER':
            legs.append({
                'type': 'TRANSFER',
                'description': f"Transit di halte {from_s.get('name', '')}",
                'from_stop_id': leg.get('from_stop', ''),
                'from_stop_name': from_s.get('name', ''),
                'waiting_seconds': leg.get('transfer_time', 0),
            })

    # Destination walking
    if dest_walk and dest_walk.get('distance', 0) > 0:
        legs.append({
            'type': 'WALK', 'description': f"Jalan kaki {dest_walk['distance']} m (±{dest_walk.get('minutes',0)} menit)",
            'distance_m': dest_walk['distance'],
            'duration_seconds': dest_walk.get('minutes', 0) * 60,
            'from_name': dest_walk.get('from_stop_name', 'Halte'),
            'to_name': 'Tujuan',
            'from_lat': dest_walk.get('from_lat', 0),
            'from_lon': dest_walk.get('from_lon', 0),
            'to_lat': dest_walk.get('to_lat', 0),
            'to_lon': dest_walk.get('to_lon', 0),
        })
        total_walk += dest_walk['distance']

    return {
        'departure_time': format_seconds(plan.get('departure_seconds', (departure_base or 0))),
        'arrival_time': format_seconds(plan.get('arrival_seconds', 0)),
        'duration_seconds': plan.get('arrival_seconds', 0) - (departure_base or plan.get('departure_seconds', 0)),
        'transfer_count': plan.get('transfer_count', 0),
        'walking_distance': total_walk,
        'status': 'ESTIMATED',
        'legs': legs,
    }

# ─── MAIN JOURNEY PLANNER ───
def plan_journey(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float,
                 departure_time: str = None, max_transfers: int = 2):
    """Main routing function."""
    now = datetime.now()
    if not departure_time:
        h, m, s = now.hour, now.minute, now.second
    else:
        parts = departure_time.split(':')
        h, m, s = int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0
    date_str = now.strftime('%Y%m%d')
    after_seconds = h * 3600 + m * 60 + s

    # Find nearest stops
    origin_stops = nearest_stops(origin_lat, origin_lon, 1200, 10)
    dest_stops = nearest_stops(dest_lat, dest_lon, 1200, 10)

    if not origin_stops or not dest_stops:
        return []

    journeys = []

    # Try combinations of origin/dest stops
    for o_sid, o_dist in origin_stops[:5]:
        o_walk = walking_time(o_dist)
        board_time = after_seconds + o_walk
        o_stop = stops.get(o_sid, {})

        for d_sid, d_dist in dest_stops[:5]:
            d_stop = stops.get(d_sid, {})
            d_walk = walking_time(d_dist)

            # Direct route
            direct = find_direct_journey(o_sid, d_sid, board_time, date_str)
            if direct:
                arrival = direct['arrival_seconds'] + d_walk
                ow = {'distance': int(o_dist), 'minutes': o_walk // 60, 'to_stop_name': o_stop.get('name', ''), 'from_lat': origin_lat, 'from_lon': origin_lon, 'to_lat': o_stop.get('lat', 0), 'to_lon': o_stop.get('lon', 0)}
                dw = {'distance': int(d_dist), 'minutes': d_walk // 60, 'from_stop_name': d_stop.get('name', ''), 'from_lat': d_stop.get('lat', 0), 'from_lon': d_stop.get('lon', 0), 'to_lat': dest_lat, 'to_lon': dest_lon}
                plan = {'legs': [{'type': 'BUS', 'trip_id': direct['trip_id'], 'route_id': direct['route_id'], 'direction_id': direct['direction_id'], 'headsign': direct['headsign'], 'from_stop': o_sid, 'to_stop': d_sid, 'departure_seconds': direct['departure_seconds'], 'arrival_seconds': direct['arrival_seconds'], 'stop_count': direct['stop_count'], 'status': direct['status']}], 'departure_seconds': direct['departure_seconds'], 'arrival_seconds': arrival, 'transfer_count': 0}
                journeys.append(build_journey(plan, ow, dw, after_seconds))

            # 1-transfer (same stop)
            if max_transfers >= 1:
                xfer = find_one_transfer(o_sid, d_sid, board_time, date_str)
                if xfer:
                    arrival = xfer['arrival_seconds'] + d_walk
                    ow = {'distance': int(o_dist), 'minutes': o_walk // 60, 'to_stop_name': o_stop.get('name', ''), 'from_lat': origin_lat, 'from_lon': origin_lon, 'to_lat': o_stop.get('lat', 0), 'to_lon': o_stop.get('lon', 0)}
                    dw = {'distance': int(d_dist), 'minutes': d_walk // 60, 'from_stop_name': d_stop.get('name', ''), 'from_lat': d_stop.get('lat', 0), 'from_lon': d_stop.get('lon', 0), 'to_lat': dest_lat, 'to_lon': dest_lon}
                    xfer['arrival_seconds'] = arrival
                    journeys.append(build_journey(xfer, ow, dw, after_seconds))

                # 1-transfer with walking between stops
                wxfer = find_walking_one_transfer(o_sid, d_sid, board_time, date_str)
                if wxfer:
                    arrival = wxfer['arrival_seconds'] + d_walk
                    ow = {'distance': int(o_dist), 'minutes': o_walk // 60, 'to_stop_name': o_stop.get('name', ''), 'from_lat': origin_lat, 'from_lon': origin_lon, 'to_lat': o_stop.get('lat', 0), 'to_lon': o_stop.get('lon', 0)}
                    dw = {'distance': int(d_dist), 'minutes': d_walk // 60, 'from_stop_name': d_stop.get('name', ''), 'from_lat': d_stop.get('lat', 0), 'from_lon': d_stop.get('lon', 0), 'to_lat': dest_lat, 'to_lon': dest_lon}
                    wxfer['arrival_seconds'] = arrival
                    journeys.append(build_journey(wxfer, ow, dw, after_seconds))

    # Deduplicate and rank
    seen = set()
    unique = []
    for j in journeys:
        key = json.dumps([leg.get('route_id') for leg in j['legs'] if leg['type'] == 'BUS'])
        if key not in seen:
            seen.add(key)
            unique.append(j)

    unique.sort(key=lambda j: j['duration_seconds'])
    return unique[:5]

# ─── API ENDPOINTS ───
@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "stops": len(stops),
        "routes": len(routes),
        "trips": len(trip_meta),
        "transfers": len(transfers),
        "shapes": len(shapes_by_route),
        "version": "1.0.0",
    }

@app.get("/api/v1/stops/nearest")
async def stops_nearest(lat: float, lon: float, radius: int = 500, limit: int = 10):
    results = nearest_stops(lat, lon, radius, limit)
    return [
        {
            "stop_id": sid,
            "name": stops.get(sid, {}).get('name', ''),
            "lat": stop_coords.get(sid, (0, 0))[0],
            "lon": stop_coords.get(sid, (0, 0))[1],
            "distance_m": int(dist),
            "walking_minutes": max(1, int(dist / 84)),
        }
        for sid, dist in results
    ]

@app.post("/api/v1/journeys/search")
async def journeys_search(request: dict):
    """{
      "origin": {"latitude": -6.x, "longitude": 106.x},
      "destination": {"latitude": -6.x, "longitude": 106.x},
      "departure_time": "07:00:00",
      "max_transfers": 2
    }"""
    origin = request.get('origin', {})
    dest = request.get('destination', {})
    dep_time = request.get('departure_time', None)
    max_tx = request.get('max_transfers', 2)

    lat1, lon1 = float(origin.get('latitude', 0)), float(origin.get('longitude', 0))
    lat2, lon2 = float(dest.get('latitude', 0)), float(dest.get('longitude', 0))

    journeys = plan_journey(lat1, lon1, lat2, lon2, dep_time, max_tx)
    return {"journeys": journeys, "source": "GTFS Static PPID TransJakarta CC BY 4.0"}

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8765, log_level='info')