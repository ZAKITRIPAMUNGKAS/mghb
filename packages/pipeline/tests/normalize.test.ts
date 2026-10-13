import { describe, it, expect } from 'vitest';
import { prefixId, applyAgencyPrefix } from '../src/normalize/prefix.js';
import { GTFSFeed } from '../src/types.js';

describe('ID Normalization & Prefixing', () => {
  it('correctly adds prefix to raw ID', () => {
    expect(prefixId('tj', '1')).toBe('tj:1');
    expect(prefixId('krl', 'JAKK')).toBe('krl:JAKK');
    expect(prefixId('mrt', 'BLM')).toBe('mrt:BLM');
  });

  it('avoids double prefixing if ID already contains prefix', () => {
    expect(prefixId('tj', 'tj:1')).toBe('tj:1');
    expect(prefixId('krl', 'krl:MRI')).toBe('krl:MRI');
  });

  it('prefixes routes, stops, trips, and fares in a GTFS feed', () => {
    const mockFeed: GTFSFeed = {
      agencies: [],
      routes: [{
        route_id: '1',
        agency_id: 'tj',
        route_short_name: '1',
        route_long_name: 'Blok M - Kota',
        route_type: 3,
        route_color: '#DC2626',
        route_text_color: '#FFFFFF',
        mode: 'brt',
        source_url: 'https://transjakarta.co.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'gtfs'
      }],
      stops: [{
        stop_id: '1-1',
        stop_name: 'Kota',
        stop_lat: -6.137,
        stop_lon: 106.814,
        source_url: 'https://transjakarta.co.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'gtfs'
      }],
      trips: [{
        trip_id: 'trip1',
        route_id: '1',
        service_id: 'DAILY',
        trip_headsign: 'Kota',
        direction_id: 0,
        source_url: 'https://transjakarta.co.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'gtfs'
      }],
      stop_times: [{
        trip_id: 'trip1',
        arrival_time: '06:00:00',
        departure_time: '06:00:00',
        stop_id: '1-1',
        stop_sequence: 1
      }],
      shapes: [],
      transfers: [],
      fares: [{
        fare_id: 'reg',
        price: 3500,
        currency_type: 'IDR',
        payment_method: 1,
        mode: 'brt',
        source_url: 'https://transjakarta.co.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'gtfs'
      }],
      feed_versions: []
    };

    const prefixed = applyAgencyPrefix(mockFeed, 'tj');
    expect(prefixed.routes[0].route_id).toBe('tj:1');
    expect(prefixed.stops[0].stop_id).toBe('tj:1-1');
    expect(prefixed.trips[0].trip_id).toBe('tj:trip1');
    expect(prefixed.trips[0].route_id).toBe('tj:1');
    expect(prefixed.stop_times[0].stop_id).toBe('tj:1-1');
    expect(prefixed.fares[0].fare_id).toBe('tj:reg');
  });
});
