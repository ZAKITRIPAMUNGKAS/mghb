import { describe, it, expect } from 'vitest';
import { mergeStopsWithHubs, TRANSIT_HUBS_MASTER } from '../src/normalize/merge_stops.js';
import { Stop } from '../src/types.js';

describe('Transit Hub Physical Stop Merging', () => {
  it('assigns parent_station to stops belonging to Dukuh Atas Hub', () => {
    const stops: Stop[] = [
      {
        stop_id: 'mrt:DKA',
        stop_name: 'Stasiun MRT Dukuh Atas BNI',
        stop_lat: -6.2008,
        stop_lon: 106.8227,
        source_url: 'https://jakartamrt.co.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'sync'
      },
      {
        stop_id: 'krl:SUD',
        stop_name: 'Stasiun Sudirman',
        stop_lat: -6.2022,
        stop_lon: 106.8236,
        source_url: 'https://commuterline.id',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'sync'
      },
      {
        stop_id: 'other:123',
        stop_name: 'Halte Lain',
        stop_lat: -6.100,
        stop_lon: 106.800,
        source_url: 'https://example.com',
        fetched_at: '2026-10-13T00:00:00Z',
        method: 'sync'
      }
    ];

    const result = mergeStopsWithHubs(stops);
    const mrtDka = result.find(s => s.stop_id === 'mrt:DKA');
    const krlSud = result.find(s => s.stop_id === 'krl:SUD');
    const other = result.find(s => s.stop_id === 'other:123');

    expect(mrtDka?.parent_station).toBe('hub:dukuh_atas');
    expect(krlSud?.parent_station).toBe('hub:dukuh_atas');
    expect(other?.parent_station).toBeUndefined();

    // Verifies parent hub node was appended
    const hubNode = result.find(s => s.stop_id === 'hub:dukuh_atas');
    expect(hubNode).toBeDefined();
    expect(hubNode?.location_type).toBe(1);
  });
});
