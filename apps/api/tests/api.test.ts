import { describe, it, expect } from 'vitest';
import { app } from '../src/index.js';

describe('Laku Transit API Endpoints', () => {
  it('serves openapi.json specification', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.openapi).toBe('3.1.0');
    expect(json.info.title).toContain('Laku Transit');
  });

  it('searches stops by query (GET /stops/search?q=)', async () => {
    const res = await app.request('/stops/search?q=Kota');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.query).toBe('Kota');
    expect(Array.isArray(json.stops)).toBe(true);
    expect(json.stops.length).toBeGreaterThan(0);
    expect(json.stops[0]).toHaveProperty('stop_id');
    expect(json.stops[0]).toHaveProperty('stop_name');
  });

  it('retrieves stop details (GET /stops/:id)', async () => {
    const res = await app.request('/stops/krl:JAKK');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.stop_id).toBe('krl:JAKK');
    expect(json.stop_name).toContain('Jakarta Kota');
    expect(json).toHaveProperty('passing_routes');
  });

  it('returns 404 for unknown stop', async () => {
    const res = await app.request('/stops/non_existent_stop');
    expect(res.status).toBe(404);
  });

  it('lists routes with optional filter (GET /routes)', async () => {
    const res = await app.request('/routes?mode=all');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.routes)).toBe(true);
    expect(json.total).toBeGreaterThan(0);
  });

  it('retrieves route details (GET /routes/:id)', async () => {
    const res = await app.request('/routes/krl:bgr');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.route_id).toBe('krl:bgr');
    expect(json.mode).toBe('krl');
    expect(json).toHaveProperty('shape_geojson');
  });

  it('plans journey (GET /plan?from=...&to=...)', async () => {
    const res = await app.request('/plan?from=-6.2088,106.8456&to=-6.1376,106.8146&time=07:30:00');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('itineraries');
    expect(Array.isArray(json.itineraries)).toBe(true);
    expect(json.itineraries.length).toBeGreaterThan(0);
    expect(json.itineraries[0]).toHaveProperty('duration_seconds');
    expect(json.itineraries[0]).toHaveProperty('estimated_fare_idr');
    expect(json.itineraries[0]).toHaveProperty('legs');
  });

  it('validates invalid plan coordinate parameters', async () => {
    const res = await app.request('/plan?from=invalid&to=invalid');
    expect(res.status).toBe(400);
  });

  it('provides metadata and provenance audit (GET /meta)', async () => {
    const res = await app.request('/meta');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('feed_version');
    expect(json).toHaveProperty('operators');
    expect(Array.isArray(json.operators)).toBe(true);
    expect(json.operators.some((o: any) => o.id === 'tj')).toBe(true);
    expect(json.operators.some((o: any) => o.id === 'krl')).toBe(true);
  });

  it('provides real-time vehicle fleet tracking (GET /vehicles)', async () => {
    const res = await app.request('/vehicles');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('vehicles');
    expect(Array.isArray(json.vehicles)).toBe(true);
    expect(json.count).toBeGreaterThan(30);

    const first = json.vehicles[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('line_id');
    expect(first).toHaveProperty('mode');
    expect(first).toHaveProperty('lat');
    expect(first).toHaveProperty('lon');
    expect(first).toHaveProperty('heading');
    expect(first).toHaveProperty('speed_kmh');
    expect(first).toHaveProperty('crowding');
  });

  it('filters live vehicles by mode (GET /vehicles?mode=krl)', async () => {
    const res = await app.request('/vehicles?mode=krl');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.vehicles.length).toBeGreaterThan(0);
    expect(json.vehicles.every((v: any) => v.mode === 'krl')).toBe(true);
  });
});
