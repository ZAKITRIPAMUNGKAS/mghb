import { GTFSFeed } from '../types.js';

export function prefixId(prefix: string, id: string): string {
  if (!id) return id;
  if (id.startsWith(`${prefix}:`)) return id;
  return `${prefix}:${id}`;
}

export function applyAgencyPrefix(feed: GTFSFeed, prefix: string): GTFSFeed {
  const agencyId = prefix;

  const routes = feed.routes.map(r => ({
    ...r,
    route_id: prefixId(prefix, r.route_id),
    agency_id: agencyId
  }));

  const stops = feed.stops.map(s => ({
    ...s,
    stop_id: prefixId(prefix, s.stop_id),
    parent_station: s.parent_station ? prefixId(prefix, s.parent_station) : undefined
  }));

  const trips = feed.trips.map(t => ({
    ...t,
    trip_id: prefixId(prefix, t.trip_id),
    route_id: prefixId(prefix, t.route_id),
    shape_id: t.shape_id ? prefixId(prefix, t.shape_id) : undefined
  }));

  const stop_times = feed.stop_times.map(st => ({
    ...st,
    trip_id: prefixId(prefix, st.trip_id),
    stop_id: prefixId(prefix, st.stop_id)
  }));

  const shapes = feed.shapes.map(sh => ({
    ...sh,
    shape_id: prefixId(prefix, sh.shape_id)
  }));

  const fares = feed.fares.map(f => ({
    ...f,
    fare_id: prefixId(prefix, f.fare_id)
  }));

  const transfers = feed.transfers.map(tr => ({
    ...tr,
    from_stop_id: prefixId(prefix, tr.from_stop_id),
    to_stop_id: prefixId(prefix, tr.to_stop_id)
  }));

  return {
    ...feed,
    routes,
    stops,
    trips,
    stop_times,
    shapes,
    fares,
    transfers
  };
}
