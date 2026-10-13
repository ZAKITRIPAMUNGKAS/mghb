import { GTFSFeed } from '../types.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateGTFSFeed(feed: GTFSFeed): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Agency validation
  if (!feed.agencies || feed.agencies.length === 0) {
    errors.push('Fatal: GTFS feed must contain at least one agency in agency.txt');
  }

  // 2. Routes validation
  const routeIds = new Set<string>();
  feed.routes.forEach((r, idx) => {
    if (!r.route_id) {
      errors.push(`Fatal: route at index ${idx} is missing route_id`);
    } else {
      routeIds.add(r.route_id);
    }
    if (!r.source_url || !r.fetched_at || !r.method) {
      errors.push(`Rule violation: route ${r.route_id} missing provenance metadata`);
    }
  });

  // 3. Stops validation
  const stopIds = new Set<string>();
  feed.stops.forEach((s, idx) => {
    if (!s.stop_id) {
      errors.push(`Fatal: stop at index ${idx} missing stop_id`);
    } else {
      stopIds.add(s.stop_id);
    }
    if (isNaN(s.stop_lat) || s.stop_lat < -90 || s.stop_lat > 90) {
      errors.push(`Fatal: stop ${s.stop_id} has invalid latitude: ${s.stop_lat}`);
    }
    if (isNaN(s.stop_lon) || s.stop_lon < -180 || s.stop_lon > 180) {
      errors.push(`Fatal: stop ${s.stop_id} has invalid longitude: ${s.stop_lon}`);
    }
    if (!s.source_url || !s.fetched_at || !s.method) {
      errors.push(`Rule violation: stop ${s.stop_id} missing provenance metadata`);
    }
  });

  // 4. Trips reference validation
  const tripIds = new Set<string>();
  feed.trips.forEach(t => {
    tripIds.add(t.trip_id);
    if (!routeIds.has(t.route_id)) {
      errors.push(`Fatal: trip ${t.trip_id} references non-existent route_id ${t.route_id}`);
    }
  });

  // 5. Stop Times reference validation
  feed.stop_times.forEach(st => {
    if (!tripIds.has(st.trip_id)) {
      errors.push(`Fatal: stop_time references non-existent trip_id ${st.trip_id}`);
    }
    if (!stopIds.has(st.stop_id)) {
      warnings.push(`Warning: stop_time references non-existent stop_id ${st.stop_id}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
