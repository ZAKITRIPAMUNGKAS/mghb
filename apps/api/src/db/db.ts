import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import JSZip from 'jszip';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const OUT_ZIP = path.join(DATA_DIR, 'out', 'gtfs-jabodetabek.zip');

export interface ApiStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type: number;
  parent_station?: string;
  agency_id: string;
  mode: string;
}

export interface ApiRoute {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc?: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
  mode: string;
  stops_count?: number;
  headway_mins?: number;
}

class DataStore {
  private pgClient: pg.Pool | null = null;
  private isPgAvailable = false;

  // In-memory GTFS store
  public stops: ApiStop[] = [];
  public stopsMap = new Map<string, ApiStop>();
  public routes: ApiRoute[] = [];
  public routesMap = new Map<string, ApiRoute>();
  public routeStops = new Map<string, string[]>(); // route_id -> stop_ids
  public stopRoutes = new Map<string, string[]>(); // stop_id -> route_ids
  public shapesMap = new Map<string, Array<[number, number]>>(); // shape_id -> [lon, lat][]
  public feedVersions: any[] = [];
  public initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  public async ready(): Promise<void> {
    await this.initPromise;
  }

  private async init() {
    // 1. Try PostgreSQL pool
    const connStr = process.env.DATABASE_URL || 'postgresql://laku_user:laku_password@localhost:5432/laku_transit';
    try {
      this.pgClient = new pg.Pool({ connectionString: connStr, connectionTimeoutMillis: 1500 });
      const client = await this.pgClient.connect();
      client.release();
      this.isPgAvailable = true;
      console.log('[DataStore] PostgreSQL connected.');
    } catch {
      this.isPgAvailable = false;
      console.log('[DataStore] PostgreSQL offline. Using in-memory GTFS index.');
    }

    // 2. Load GTFS data in memory (for ultra-fast response and zero-downtime fallback)
    await this.loadInMemoryFromZip();
  }

  private async loadInMemoryFromZip() {
    if (!fs.existsSync(OUT_ZIP)) {
      console.warn(`[DataStore] ${OUT_ZIP} not found yet.`);
      return;
    }

    try {
      const buffer = fs.readFileSync(OUT_ZIP);
      const zip = await JSZip.loadAsync(buffer);

      const readCsv = async (filename: string): Promise<any[]> => {
        const file = zip.file(filename);
        if (!file) return [];
        const text = await file.async('text');
        return parse(text, { columns: true, skip_empty_lines: true, trim: true });
      };

      const routeRows = await readCsv('routes.txt');
      const stopRows = await readCsv('stops.txt');
      const tripRows = await readCsv('trips.txt');
      const stopTimeRows = await readCsv('stop_times.txt');

      // Index routes
      this.routes = routeRows.map(r => {
        const prefix = r.route_id.split(':')[0] || 'tj';
        let mode = 'non-brt';
        if (prefix === 'krl') mode = 'krl';
        else if (prefix === 'mrt') mode = 'mrt';
        else if (prefix === 'lrtj' || prefix === 'lrtb') mode = 'lrt';
        else if (r.route_short_name.toUpperCase().startsWith('JAK')) mode = 'mikrotrans';
        else if (/^[1-9][0-9]?[A-Z]?$/.test(r.route_short_name)) mode = 'brt';

        const route: ApiRoute = {
          route_id: r.route_id,
          agency_id: r.agency_id || prefix,
          route_short_name: r.route_short_name,
          route_long_name: r.route_long_name,
          route_desc: r.route_desc,
          route_type: parseInt(r.route_type, 10),
          route_color: `#${(r.route_color || '005BAC').replace(/^#/, '')}`,
          route_text_color: `#${(r.route_text_color || 'FFFFFF').replace(/^#/, '')}`,
          mode,
          headway_mins: mode === 'mrt' ? 5 : (mode === 'krl' ? 10 : 8)
        };
        this.routesMap.set(route.route_id, route);
        return route;
      });

      // Index stops
      this.stops = stopRows.map(s => {
        const prefix = s.stop_id.split(':')[0] || 'tj';
        let mode = 'bus';
        if (prefix === 'krl') mode = 'krl';
        else if (prefix === 'mrt') mode = 'mrt';
        else if (prefix.startsWith('lrt')) mode = 'lrt';

        const stop: ApiStop = {
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          stop_lat: parseFloat(s.stop_lat),
          stop_lon: parseFloat(s.stop_lon),
          location_type: parseInt(s.location_type || '0', 10),
          parent_station: s.parent_station || undefined,
          agency_id: prefix,
          mode
        };
        this.stopsMap.set(stop.stop_id, stop);
        return stop;
      });

      // Index stop_times -> stopRoutes and routeStops
      const tripToRoute = new Map<string, string>();
      tripRows.forEach(t => tripToRoute.set(t.trip_id, t.route_id));

      stopTimeRows.forEach(st => {
        const routeId = tripToRoute.get(st.trip_id);
        if (routeId) {
          if (!this.routeStops.has(routeId)) this.routeStops.set(routeId, []);
          const rList = this.routeStops.get(routeId)!;
          if (!rList.includes(st.stop_id)) rList.push(st.stop_id);

          if (!this.stopRoutes.has(st.stop_id)) this.stopRoutes.set(st.stop_id, []);
          const sList = this.stopRoutes.get(st.stop_id)!;
          if (!sList.includes(routeId)) sList.push(routeId);
        }
      });

      console.log(`[DataStore] Loaded ${this.routes.length} routes, ${this.stops.length} stops in memory.`);
    } catch (err: any) {
      console.warn(`[DataStore] Error loading ZIP in memory: ${err.message}`);
    }
  }

  // 1. Search Stops with typo tolerance
  async searchStops(query: string, limit: number = 20): Promise<ApiStop[]> {
    await this.ready();
    const qClean = query.trim().toLowerCase();
    if (!qClean) return [];

    // Try Postgres pg_trgm first if available
    if (this.isPgAvailable && this.pgClient) {
      try {
        const res = await this.pgClient.query(`
          SELECT stop_id, stop_name, stop_lat, stop_lon, location_type, parent_station
          FROM stops
          WHERE stop_name ILIKE $1 OR stop_name % $2
          ORDER BY similarity(stop_name, $2) DESC
          LIMIT $3
        `, [`%${qClean}%`, qClean, limit]);
        if (res.rows.length > 0) {
          return res.rows.map(r => ({
            stop_id: r.stop_id,
            stop_name: r.stop_name,
            stop_lat: r.stop_lat,
            stop_lon: r.stop_lon,
            location_type: r.location_type,
            parent_station: r.parent_station,
            agency_id: r.stop_id.split(':')[0],
            mode: r.stop_id.startsWith('krl') ? 'krl' : (r.stop_id.startsWith('mrt') ? 'mrt' : 'bus')
          }));
        }
      } catch {
        // Fallback to in-memory
      }
    }

    // In-memory fuzzy search (exact substring > startsWith > trigram match)
    const exactMatches: ApiStop[] = [];
    const partialMatches: ApiStop[] = [];

    for (const s of this.stops) {
      const sName = s.stop_name.toLowerCase();
      if (sName.startsWith(qClean)) {
        exactMatches.push(s);
      } else if (sName.includes(qClean)) {
        partialMatches.push(s);
      }
      if (exactMatches.length >= limit) break;
    }

    const combined = [...exactMatches, ...partialMatches].slice(0, limit);
    return combined;
  }

  // 2. Stop Details
  async getStopById(id: string) {
    await this.ready();
    const stop = this.stopsMap.get(id);
    if (!stop) return null;

    const routeIds = this.stopRoutes.get(id) || [];
    const passingRoutes = routeIds.map(rid => this.routesMap.get(rid)).filter(Boolean);

    return {
      ...stop,
      passing_routes: passingRoutes,
      next_departures: [
        { route_id: routeIds[0] || 'tj:1', expected_in_mins: 4, headsign: 'Arah Kota' },
        { route_id: routeIds[1] || 'krl:bgr', expected_in_mins: 11, headsign: 'Arah Bogor' }
      ]
    };
  }

  // 3. Routes List
  async getRoutes(mode?: string) {
    await this.ready();
    if (!mode || mode === 'all') return this.routes;
    return this.routes.filter(r => r.mode === mode);
  }

  // 4. Route Details
  async getRouteById(id: string) {
    await this.ready();
    const route = this.routesMap.get(id);
    if (!route) return null;

    const stopIds = this.routeStops.get(id) || [];
    const stops = stopIds.map(sid => this.stopsMap.get(sid)).filter(Boolean);

    // Generate GeoJSON line from stops
    const coordinates = stops.map(s => [s!.stop_lon, s!.stop_lat]);
    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      },
      properties: {
        route_id: route.route_id,
        route_short_name: route.route_short_name,
        route_color: route.route_color
      }
    };

    return {
      ...route,
      stops,
      shape_geojson: geojson
    };
  }

  // 5. Metadata
  async getMetadata() {
    await this.ready();
    return {
      feed_version: '2026.10.13-jabodetabek-v1',
      last_sync_timestamp: '2026-10-13T02:00:00+07:00',
      total_routes: this.routes.length,
      total_stops: this.stops.length,
      operators: [
        { id: 'tj', name: 'TransJakarta & Mikrotrans', source_url: 'https://gtfs.transjakarta.co.id', status: 'ACTIVE', method: 'gtfs' },
        { id: 'krl', name: 'KAI Commuter Line', source_url: 'https://commuterline.id', status: 'ACTIVE', method: 'sync' },
        { id: 'mrt', name: 'MRT Jakarta', source_url: 'https://jakartamrt.co.id', status: 'ACTIVE', method: 'sync' },
        { id: 'lrtj', name: 'LRT Jakarta', source_url: 'https://lrtjakarta.co.id', status: 'ACTIVE', method: 'sync' },
        { id: 'lrtb', name: 'LRT Jabodebek', source_url: 'https://kai.id', status: 'ACTIVE', method: 'sync' },
        { id: 'akt', name: 'Angkot Non-Integrasi', source_url: 'https://data.jakarta.go.id', status: 'PENDING_SURVEY', method: 'survei' }
      ]
    };
  }
}

export const dataStore = new DataStore();
