const API_BASE = '/api';

export interface StopItem {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  mode: string;
}

export interface RouteItem {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_color: string;
  mode: string;
}

export interface JourneyLeg {
  type: 'WALK' | 'TRANSIT';
  mode?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_color?: string;
  from_stop_name: string;
  to_stop_name: string;
  duration_seconds: number;
  distance_meters: number;
  description: string;
}

export interface ItineraryItem {
  duration_seconds: number;
  walking_distance_meters: number;
  transfers: number;
  estimated_fare_idr: number;
  departure_time: string;
  arrival_time: string;
  legs: JourneyLeg[];
}

export async function searchStops(q: string): Promise<StopItem[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${API_BASE}/stops/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.stops || [];
}

export async function planRoute(fromLat: number, fromLon: number, toLat: number, toLon: number, time?: string): Promise<ItineraryItem[]> {
  const url = `${API_BASE}/plan?from=${fromLat},${fromLon}&to=${toLat},${toLon}${time ? `&time=${encodeURIComponent(time)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.itineraries || [];
}

export async function fetchMetadata() {
  const res = await fetch(`${API_BASE}/meta`);
  if (!res.ok) return null;
  return res.json();
}

export interface LiveVehicle {
  id: string;
  label: string;
  mode: string;
  line_id: string;
  line_name: string;
  color: string;
  operator: string;
  lat: number;
  lon: number;
  heading: number;
  speed_kmh: number;
  status: string;
  next_stop: string;
  eta_mins: number;
  crowding: 'low' | 'medium' | 'high';
  crowding_label: string;
  updated_at: string;
}

export async function fetchLiveVehicles(mode?: string): Promise<LiveVehicle[]> {
  const url = `${API_BASE}/vehicles${mode && mode !== 'all' ? `?mode=${encodeURIComponent(mode)}` : ''}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.vehicles || [];
  } catch {
    return [];
  }
}
