#!/usr/bin/env python3
"""Precompute transit graph indices from existing GTFS JSON data.
Outputs to data/ folder — loaded by FastAPI backend at startup.
"""

import json, csv, math, os
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parent
DATA = BASE / 'data'

def load_json(name):
    with open(DATA / name, 'r', encoding='utf-8') as f:
        return json.load(f)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

print("=== Building transit graph indices ===")

# Load base data
routes = load_json('routes.json')
rd = load_json('route_details.json')
stops_raw = load_json('stops.json')
geo = load_json('route_geometries.json')

# ─── STOPS INDEX ───
stops = {}
stop_coords = {}
for s in stops_raw:
    sid = s['stop_id']
    try:
        lat, lon = float(s['stop_lat']), float(s['stop_lon'])
    except (ValueError, TypeError):
        continue
    stops[sid] = {
        'stop_id': sid,
        'name': s.get('stop_name_original', s.get('stop_name_normalized', '')),
        'lat': lat,
        'lon': lon,
        'location_type': s.get('location_type', ''),
        'parent_station': s.get('parent_station', ''),
    }
    stop_coords[sid] = (lat, lon)

print(f"  Stops: {len(stops)}")

# ─── ROUTES INDEX ───
route_index = {}
for r in routes:
    route_index[r['route_id']] = {
        'route_id': r['route_id'],
        'short_name': r.get('route_short_name', ''),
        'long_name': r.get('route_long_name', ''),
        'category': r.get('route_category', 'Unknown'),
        'route_desc': r.get('route_desc', ''),
        'color': r.get('route_color', ''),
    }
print(f"  Routes: {len(route_index)}")

# ─── STOP_TIMES BY TRIP + ROUTE_TRIPS INDEX ───
stop_times_by_trip = {}
route_trips = defaultdict(lambda: defaultdict(list))
trip_meta = {}

for route_detail in rd:
    rid = route_detail['route_id']
    for d in route_detail.get('directions', []):
        did = d.get('direction_id', 0)
        tid = d.get('trip_id', '')
        headsign = d.get('headsign', '')
        st_seq = d.get('stops', [])

        trip_meta[tid] = {
            'route_id': rid,
            'direction_id': did,
            'headsign': headsign,
        }

        route_trips[rid][did].append(tid)

        sorted_st = sorted(st_seq, key=lambda x: x.get('sequence', 0))
        entries = []
        for s in sorted_st:
            entries.append({
                'stop_id': s.get('stop_id', ''),
                'sequence': s.get('sequence', 0),
                'name': s.get('name', ''),
                'lat': s.get('lat', 0),
                'lon': s.get('lon', 0),
            })
        if tid not in stop_times_by_trip or len(entries) > len(stop_times_by_trip.get(tid, [])):
            stop_times_by_trip[tid] = entries

print(f"  Trips: {len(trip_meta)}")
print(f"  Stop_times entries: {sum(len(v) for v in stop_times_by_trip.values())}")

# ─── Build stop_id → sequence index per trip (for fast direction check) ───
# stop_seq_index[trip_id][stop_id] = sequence
stop_seq_index = {}
for tid, entries in stop_times_by_trip.items():
    stop_seq_index[tid] = {}
    for e in entries:
        stop_seq_index[tid][e['stop_id']] = e['sequence']

# ─── TRIP → STOP LIST (sorted) ───
trip_stops = {}
for tid, entries in stop_times_by_trip.items():
    trip_stops[tid] = [e['stop_id'] for e in entries]

# ─── STOP → TRIPS index (which trips pass through this stop) ───
stop_trips = defaultdict(set)
for tid, entries in stop_times_by_trip.items():
    for e in entries:
        stop_trips[e['stop_id']].add(tid)

# ─── TRANSFERS INDEX (precomputed from 100m proximity) ───
# Pair stops within 100m
transfers = defaultdict(set)
stop_ids = list(stop_coords.keys())
for i in range(len(stop_ids)):
    for j in range(i + 1, len(stop_ids)):
        sid_a, sid_b = stop_ids[i], stop_ids[j]
        lat1, lon1 = stop_coords[sid_a]
        lat2, lon2 = stop_coords[sid_b]
        dist = haversine(lat1, lon1, lat2, lon2)
        if dist <= 100:
            transfers[sid_a].add(sid_b)
            transfers[sid_b].add(sid_a)

transfer_count = sum(len(v) for v in transfers.values())
print(f"  Transfer pairs (100m): {transfer_count}")

# ─── CALENDAR INDEX ───
calendar = {}
cal_paths = [
    Path(r'D:\GEMALA.CREATIVE\BNI MAGANG - ZAKI\jakarta-transit-data\raw\transjakarta_gtfs\calendar.txt'),
    BASE / 'raw/transjakarta_gtfs/calendar.txt',
]
cal_path = None
for cp in cal_paths:
    if cp.exists():
        cal_path = cp
        break

if cal_path and cal_path.exists():
    with open(cal_path, 'r', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            calendar[row['service_id']] = {
                'service_id': row['service_id'],
                'monday': row.get('monday', '1'),
                'tuesday': row.get('tuesday', '1'),
                'wednesday': row.get('wednesday', '1'),
                'thursday': row.get('thursday', '1'),
                'friday': row.get('friday', '1'),
                'saturday': row.get('saturday', '1'),
                'sunday': row.get('sunday', '1'),
                'start_date': row.get('start_date', ''),
                'end_date': row.get('end_date', ''),
            }
else:
    # Default: all services active weekdays
    calendar['1'] = {'service_id': '1', 'monday': '1', 'tuesday': '1', 'wednesday': '1', 'thursday': '1', 'friday': '1', 'saturday': '1', 'sunday': '1', 'start_date': '20260101', 'end_date': '20261231'}

print(f"  Calendar services: {len(calendar)}")

# ─── FREQUENCIES INDEX ───
freq_paths = [
    Path(r'D:\GEMALA.CREATIVE\BNI MAGANG - ZAKI\jakarta-transit-data\raw\transjakarta_gtfs\frequencies.txt'),
    BASE / 'raw/transjakarta_gtfs/frequencies.txt',
]
freq_path = None
for fp in freq_paths:
    if fp.exists():
        freq_path = fp
        break

freq_raw = []
if freq_path:
    with open(freq_path, 'r', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            freq_raw.append(row)
else:
    freqs_file = DATA / 'frequencies.json'
    if freqs_file.exists():
        freq_raw = load_json('frequencies.json')
frequencies_by_trip = defaultdict(list)
for f in freq_raw:
    tid = f.get('trip_id', '')
    if tid:
        frequencies_by_trip[tid].append({
            'start_time': f.get('start_time', ''),
            'end_time': f.get('end_time', ''),
            'headway_secs': int(f.get('headway_secs', 0) or 0),
            'headway_minutes': float(f.get('headway_minutes', 0) or 0),
        })

print(f"  Frequency entries: {sum(len(v) for v in frequencies_by_trip.values())}")

# ─── GEO INDEX (shapes by route) ───
shape_by_route = defaultdict(list)
for rid, features in geo.items():
    for feat in features:
        coords = feat['geometry']['coordinates']
        if len(coords) >= 2:
            shape_by_route[rid].append(coords)

print(f"  Shape routes: {len(shape_by_route)}")

# ─── SERIALIZE ───
outputs = {
    'graph_stops.json': stops,
    'graph_routes.json': route_index,
    'graph_trip_meta.json': trip_meta,
    'graph_stop_trips.json': {k: list(v) for k, v in stop_trips.items()},
    'graph_trip_stops.json': trip_stops,
    'graph_stop_seq.json': stop_seq_index,
    'graph_route_trips.json': {rid: {str(did): trips for did, trips in dirs.items()} for rid, dirs in route_trips.items()},
    'graph_transfers.json': {k: list(v) for k, v in transfers.items()},
    'graph_calendar.json': calendar,
    'graph_frequencies.json': {k: v for k, v in frequencies_by_trip.items()},
    'graph_shapes.json': shape_by_route,
    'graph_stop_coords.json': {k: list(v) for k, v in stop_coords.items()},
}

for fname, data in outputs.items():
    path = DATA / fname
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"  Wrote {fname}: {os.path.getsize(path):,} bytes")

print("\n=== Graph indices built ===")