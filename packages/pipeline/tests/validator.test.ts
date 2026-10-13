import { describe, it, expect } from 'vitest';
import { validateGTFSFeed } from '../src/validator/index.js';
import { GTFSFeed } from '../src/types.js';

describe('GTFS Validator', () => {
  it('detects missing provenance metadata', () => {
    const invalidFeed: GTFSFeed = {
      agencies: [{
        agency_id: 'tj',
        agency_name: 'TransJakarta',
        agency_url: 'https://transjakarta.co.id',
        agency_timezone: 'Asia/Jakarta',
        source_url: '',
        fetched_at: '',
        method: 'gtfs'
      }],
      routes: [{
        route_id: 'tj:1',
        agency_id: 'tj',
        route_short_name: '1',
        route_long_name: 'Blok M - Kota',
        route_type: 3,
        route_color: '#DC2626',
        route_text_color: '#FFFFFF',
        mode: 'brt',
        source_url: '', // Missing
        fetched_at: '', // Missing
        method: 'gtfs'
      }],
      stops: [],
      trips: [],
      stop_times: [],
      shapes: [],
      transfers: [],
      fares: [],
      feed_versions: []
    };

    const res = validateGTFSFeed(invalidFeed);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('missing provenance metadata'))).toBe(true);
  });

  it('validates a complete compliant feed', () => {
    const compliantFeed: GTFSFeed = {
      agencies: [{
        agency_id: 'tj',
        agency_name: 'TransJakarta',
        agency_url: 'https://transjakarta.co.id',
        agency_timezone: 'Asia/Jakarta',
        source_url: 'https://transjakarta.co.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'gtfs'
      }],
      routes: [{
        route_id: 'tj:1',
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
        stop_id: 'tj:1-1',
        stop_name: 'Halte Kota',
        stop_lat: -6.137,
        stop_lon: 106.814,
        source_url: 'https://transjakarta.co.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'gtfs'
      }],
      trips: [{
        trip_id: 'tj:trip1',
        route_id: 'tj:1',
        service_id: 'DAILY',
        trip_headsign: 'Kota',
        direction_id: 0,
        source_url: 'https://transjakarta.co.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'gtfs'
      }],
      stop_times: [{
        trip_id: 'tj:trip1',
        arrival_time: '06:00:00',
        departure_time: '06:00:00',
        stop_id: 'tj:1-1',
        stop_sequence: 1
      }],
      shapes: [],
      transfers: [],
      fares: [{
        fare_id: 'tj:fare1',
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

    const res = validateGTFSFeed(compliantFeed);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
});
