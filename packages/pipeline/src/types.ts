export type MethodType = 'gtfs' | 'sync' | 'survei';

export interface Provenance {
  source_url: string;
  fetched_at: string;
  method: MethodType;
}

export interface Agency extends Provenance {
  agency_id: string;
  agency_name: string;
  agency_url: string;
  agency_timezone: string;
  agency_lang?: string;
  agency_phone?: string;
}

export interface Route extends Provenance {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc?: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
  mode: 'brt' | 'non-brt' | 'mikrotrans' | 'krl' | 'mrt' | 'lrt' | 'angkot';
}

export interface Stop extends Provenance {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type?: number;
  parent_station?: string;
  wheelchair_boarding?: number;
}

export interface Trip extends Provenance {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign: string;
  direction_id: number;
  shape_id?: string;
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;
}

export interface ShapePoint {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
}

export interface Transfer {
  from_stop_id: string;
  to_stop_id: string;
  transfer_type: number;
  min_transfer_time: number;
}

export interface Fare extends Provenance {
  fare_id: string;
  price: number;
  currency_type: string;
  payment_method: number;
  transfers?: number;
  transfer_duration?: number;
  mode: string;
}

export interface FeedVersion {
  source: string;
  hash: string;
  fetched_at: string;
  status: 'VALID' | 'WARNING' | 'FAILED';
  record_count: Record<string, number>;
  notes?: string;
}

export interface GTFSFeed {
  agencies: Agency[];
  routes: Route[];
  stops: Stop[];
  trips: Trip[];
  stop_times: StopTime[];
  shapes: ShapePoint[];
  transfers: Transfer[];
  fares: Fare[];
  feed_versions: FeedVersion[];
}
