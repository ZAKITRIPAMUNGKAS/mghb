import pg from 'pg';
import { GTFSFeed } from '../types.js';

export async function importFeedToPostgres(feed: GTFSFeed, connectionString?: string): Promise<boolean> {
  const connStr = connectionString || process.env.DATABASE_URL || 'postgresql://laku_user:laku_password@localhost:5432/laku_transit';
  const client = new pg.Client({ connectionString: connStr, connectionTimeoutMillis: 3000 });

  try {
    await client.connect();
    console.log('[DB Importer] Connected to PostgreSQL. Importing GTFS tables...');

    await client.query('BEGIN');

    // 1. Agencies
    for (const a of feed.agencies) {
      await client.query(`
        INSERT INTO agencies (agency_id, agency_name, agency_url, agency_timezone, source_url, fetched_at, method)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (agency_id) DO UPDATE SET
          agency_name = EXCLUDED.agency_name,
          agency_url = EXCLUDED.agency_url,
          fetched_at = EXCLUDED.fetched_at;
      `, [a.agency_id, a.agency_name, a.agency_url, a.agency_timezone, a.source_url, a.fetched_at, a.method]);
    }

    // 2. Stops (with geography ST_SetSRID(ST_MakePoint(...), 4326))
    for (const s of feed.stops) {
      await client.query(`
        INSERT INTO stops (stop_id, stop_name, stop_lat, stop_lon, location_type, parent_station, geom, source_url, fetched_at, method)
        VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography, $7, $8, $9)
        ON CONFLICT (stop_id) DO UPDATE SET
          stop_name = EXCLUDED.stop_name,
          stop_lat = EXCLUDED.stop_lat,
          stop_lon = EXCLUDED.stop_lon,
          geom = EXCLUDED.geom,
          parent_station = EXCLUDED.parent_station,
          fetched_at = EXCLUDED.fetched_at;
      `, [s.stop_id, s.stop_name, s.stop_lat, s.stop_lon, s.location_type || 0, s.parent_station || null, s.source_url, s.fetched_at, s.method]);
    }

    // 3. Routes
    for (const r of feed.routes) {
      await client.query(`
        INSERT INTO routes (route_id, agency_id, route_short_name, route_long_name, route_type, route_color, route_text_color, mode, source_url, fetched_at, method)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (route_id) DO UPDATE SET
          route_short_name = EXCLUDED.route_short_name,
          route_long_name = EXCLUDED.route_long_name,
          route_color = EXCLUDED.route_color,
          mode = EXCLUDED.mode,
          fetched_at = EXCLUDED.fetched_at;
      `, [r.route_id, r.agency_id, r.route_short_name, r.route_long_name, r.route_type, r.route_color, r.route_text_color, r.mode, r.source_url, r.fetched_at, r.method]);
    }

    // 4. Transfers
    for (const tr of feed.transfers) {
      await client.query(`
        INSERT INTO transfers (from_stop_id, to_stop_id, transfer_type, min_transfer_time)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (from_stop_id, to_stop_id) DO UPDATE SET
          min_transfer_time = EXCLUDED.min_transfer_time;
      `, [tr.from_stop_id, tr.to_stop_id, tr.transfer_type, tr.min_transfer_time]);
    }

    // 5. Fares
    for (const f of feed.fares) {
      await client.query(`
        INSERT INTO fares (fare_id, price, currency_type, payment_method, mode, source_url, fetched_at, method)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (fare_id) DO UPDATE SET
          price = EXCLUDED.price,
          fetched_at = EXCLUDED.fetched_at;
      `, [f.fare_id, f.price, f.currency_type, f.payment_method, f.mode, f.source_url, f.fetched_at, f.method]);
    }

    // 6. Feed Versions
    for (const v of feed.feed_versions) {
      await client.query(`
        INSERT INTO feed_versions (source, hash, fetched_at, status, record_count, notes)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [v.source, v.hash, v.fetched_at, v.status, JSON.stringify(v.record_count), v.notes || null]);
    }

    await client.query('COMMIT');
    console.log('[DB Importer] Successfully imported feed data into PostgreSQL.');
    return true;
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.warn(`[DB Importer] PostgreSQL import skipped or failed: ${err.message}`);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}
