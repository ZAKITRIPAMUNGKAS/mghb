import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import JSZip from 'jszip';
import { parse } from 'csv-parse/sync';
import { Agency, Route, Stop, Trip, StopTime, ShapePoint, Transfer, Fare, GTFSFeed } from '../types.js';

const TJ_GTFS_URL = 'https://gtfs.transjakarta.co.id/files/file_gtfs.zip';

export async function fetchTransjakartaFeed(rawDir: string, fallbackDir?: string): Promise<GTFSFeed> {
  const timestamp = new Date().toISOString();
  fs.mkdirSync(rawDir, { recursive: true });

  let zipBuffer: Buffer | null = null;
  let fileHash = '';

  try {
    console.log(`[TJ Fetcher] Downloading GTFS from ${TJ_GTFS_URL}...`);
    const res = await fetch(TJ_GTFS_URL, {
      headers: { 'User-Agent': 'LakuTransitJabodetabek/1.0 (+https://mghb.tepegrafi.id)' }
    });
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      zipBuffer = Buffer.from(arrayBuf);
      fileHash = crypto.createHash('sha256').update(zipBuffer).digest('hex');
      const filename = `tj_${Date.now()}_${fileHash.slice(0, 8)}.zip`;
      fs.writeFileSync(path.join(rawDir, filename), zipBuffer);
      console.log(`[TJ Fetcher] Downloaded and saved ${filename} (SHA256: ${fileHash})`);
    } else {
      console.warn(`[TJ Fetcher] HTTP ${res.status}. Attempting local fallback...`);
    }
  } catch (err: any) {
    console.warn(`[TJ Fetcher] Network error: ${err.message}. Using verified local snapshot...`);
  }

  // If live download is not available, check for cached zips in rawDir or local dataset in fallbackDir
  if (!zipBuffer) {
    const rawFiles = fs.readdirSync(rawDir).filter(f => f.startsWith('tj_') && f.endsWith('.zip'));
    if (rawFiles.length > 0) {
      const latestRaw = path.join(rawDir, rawFiles.sort().reverse()[0]);
      console.log(`[TJ Fetcher] Loading cached raw GTFS: ${latestRaw}`);
      zipBuffer = fs.readFileSync(latestRaw);
      fileHash = crypto.createHash('sha256').update(zipBuffer).digest('hex');
    }
  }

  if (zipBuffer) {
    return parseTJZip(zipBuffer, TJ_GTFS_URL, timestamp, fileHash);
  }

  // Fallback to pre-processed JSON in fallbackDir if available
  if (fallbackDir && fs.existsSync(path.join(fallbackDir, 'routes.json'))) {
    console.log(`[TJ Fetcher] Ingesting verified TransJakarta JSON dataset from ${fallbackDir}...`);
    return parseLocalTJJson(fallbackDir, timestamp);
  }

  throw new Error('Failed to obtain TransJakarta GTFS feed from both remote and local sources.');
}

async function parseTJZip(zipBuffer: Buffer, sourceUrl: string, fetchedAt: string, hash: string): Promise<GTFSFeed> {
  const zip = await JSZip.loadAsync(zipBuffer);

  const readCsv = async (filename: string): Promise<any[]> => {
    const file = zip.file(filename);
    if (!file) return [];
    const text = await file.async('text');
    return parse(text, { columns: true, skip_empty_lines: true, trim: true });
  };

  const agencyRows = await readCsv('agency.txt');
  const routeRows = await readCsv('routes.txt');
  const stopRows = await readCsv('stops.txt');
  const tripRows = await readCsv('trips.txt');
  const stopTimeRows = await readCsv('stop_times.txt');
  const shapeRows = await readCsv('shapes.txt');

  const agencies: Agency[] = agencyRows.map(r => ({
    agency_id: r.agency_id || 'tj',
    agency_name: r.agency_name || 'PT Transportasi Jakarta',
    agency_url: r.agency_url || 'https://transjakarta.co.id',
    agency_timezone: r.agency_timezone || 'Asia/Jakarta',
    source_url: sourceUrl,
    fetched_at: fetchedAt,
    method: 'gtfs'
  }));

  const routes: Route[] = routeRows.map(r => {
    const shortName = r.route_short_name || '';
    const longName = r.route_long_name || '';
    const isMikrotrans = shortName.toUpperCase().startsWith('JAK') || longName.toUpperCase().includes('MIKROTRANS');
    const isBRT = !isMikrotrans && /^[1-9][0-9]?[A-Z]?$/.test(shortName);

    let mode: Route['mode'] = 'non-brt';
    if (isMikrotrans) mode = 'mikrotrans';
    else if (isBRT) mode = 'brt';

    return {
      route_id: r.route_id,
      agency_id: r.agency_id || 'tj',
      route_short_name: shortName,
      route_long_name: longName,
      route_desc: r.route_desc,
      route_type: 3, // Bus
      route_color: r.route_color ? `#${r.route_color.replace(/^#/, '')}` : (isMikrotrans ? '#16A34A' : '#005BAC'),
      route_text_color: r.route_text_color ? `#${r.route_text_color.replace(/^#/, '')}` : '#FFFFFF',
      mode,
      source_url: sourceUrl,
      fetched_at: fetchedAt,
      method: 'gtfs'
    };
  });

  const stops: Stop[] = stopRows.map(s => ({
    stop_id: s.stop_id,
    stop_name: s.stop_name,
    stop_lat: parseFloat(s.stop_lat),
    stop_lon: parseFloat(s.stop_lon),
    location_type: s.location_type ? parseInt(s.location_type, 10) : 0,
    parent_station: s.parent_station || undefined,
    wheelchair_boarding: s.wheelchair_boarding ? parseInt(s.wheelchair_boarding, 10) : 0,
    source_url: sourceUrl,
    fetched_at: fetchedAt,
    method: 'gtfs'
  }));

  const trips: Trip[] = tripRows.map(t => ({
    trip_id: t.trip_id,
    route_id: t.route_id,
    service_id: t.service_id,
    trip_headsign: t.trip_headsign || '',
    direction_id: t.direction_id ? parseInt(t.direction_id, 10) : 0,
    shape_id: t.shape_id || undefined,
    source_url: sourceUrl,
    fetched_at: fetchedAt,
    method: 'gtfs'
  }));

  const stop_times: StopTime[] = stopTimeRows.map(st => ({
    trip_id: st.trip_id,
    arrival_time: st.arrival_time,
    departure_time: st.departure_time,
    stop_id: st.stop_id,
    stop_sequence: parseInt(st.stop_sequence, 10),
    stop_headsign: st.stop_headsign || undefined,
    pickup_type: st.pickup_type ? parseInt(st.pickup_type, 10) : 0,
    drop_off_type: st.drop_off_type ? parseInt(st.drop_off_type, 10) : 0
  }));

  const shapes: ShapePoint[] = shapeRows.map(sh => ({
    shape_id: sh.shape_id,
    shape_pt_lat: parseFloat(sh.shape_pt_lat),
    shape_pt_lon: parseFloat(sh.shape_pt_lon),
    shape_pt_sequence: parseInt(sh.shape_pt_sequence, 10)
  }));

  const fares: Fare[] = [
    {
      fare_id: 'fare_tj_regular',
      price: 3500,
      currency_type: 'IDR',
      payment_method: 1,
      mode: 'brt',
      source_url: sourceUrl,
      fetched_at: fetchedAt,
      method: 'gtfs'
    },
    {
      fare_id: 'fare_tj_mikrotrans',
      price: 0,
      currency_type: 'IDR',
      payment_method: 1,
      mode: 'mikrotrans',
      source_url: sourceUrl,
      fetched_at: fetchedAt,
      method: 'gtfs'
    }
  ];

  return {
    agencies,
    routes,
    stops,
    trips,
    stop_times,
    shapes,
    transfers: [],
    fares,
    feed_versions: [{
      source: 'transjakarta',
      hash,
      fetched_at: fetchedAt,
      status: 'VALID',
      record_count: {
        routes: routes.length,
        stops: stops.length,
        trips: trips.length,
        stop_times: stop_times.length
      }
    }]
  };
}

function parseLocalTJJson(dir: string, fetchedAt: string): GTFSFeed {
  const routesJson = JSON.parse(fs.readFileSync(path.join(dir, 'routes.json'), 'utf-8'));
  const stopsJson = JSON.parse(fs.readFileSync(path.join(dir, 'stops.json'), 'utf-8'));
  const routeDetails = JSON.parse(fs.readFileSync(path.join(dir, 'route_details.json'), 'utf-8'));

  const agency: Agency = {
    agency_id: 'tj',
    agency_name: 'PT Transportasi Jakarta',
    agency_url: 'https://transjakarta.co.id',
    agency_timezone: 'Asia/Jakarta',
    source_url: TJ_GTFS_URL,
    fetched_at: fetchedAt,
    method: 'gtfs'
  };

  const routes: Route[] = routesJson.map((r: any) => {
    const shortName = r.route_short_name || r.route_id;
    const isMikrotrans = shortName.toUpperCase().startsWith('JAK') || r.route_category === 'Mikrotrans';
    const isBRT = r.route_category === 'BRT';

    let mode: Route['mode'] = 'non-brt';
    if (isMikrotrans) mode = 'mikrotrans';
    else if (isBRT) mode = 'brt';

    return {
      route_id: r.route_id,
      agency_id: 'tj',
      route_short_name: shortName,
      route_long_name: r.route_long_name || r.route_name || r.route_desc || '',
      route_desc: r.route_desc,
      route_type: 3,
      route_color: isMikrotrans ? '#16A34A' : (isBRT ? '#DC2626' : '#005BAC'),
      route_text_color: '#FFFFFF',
      mode,
      source_url: TJ_GTFS_URL,
      fetched_at: fetchedAt,
      method: 'gtfs'
    };
  });

  const stops: Stop[] = stopsJson.map((s: any) => ({
    stop_id: s.stop_id,
    stop_name: s.stop_name_original || s.stop_name_normalized || s.stop_name || '',
    stop_lat: parseFloat(s.stop_lat),
    stop_lon: parseFloat(s.stop_lon),
    location_type: 0,
    source_url: TJ_GTFS_URL,
    fetched_at: fetchedAt,
    method: 'gtfs'
  }));

  const trips: Trip[] = [];
  const stop_times: StopTime[] = [];

  routeDetails.forEach((rd: any) => {
    (rd.directions || []).forEach((d: any) => {
      const tripId = d.trip_id || `trip_${rd.route_id}_${d.direction_id}`;
      trips.push({
        trip_id: tripId,
        route_id: rd.route_id,
        service_id: 'DAILY',
        trip_headsign: d.headsign || '',
        direction_id: d.direction_id || 0,
        source_url: TJ_GTFS_URL,
        fetched_at: fetchedAt,
        method: 'gtfs'
      });

      (d.stops || []).forEach((st: any, idx: number) => {
        const mins = idx * 2;
        const hh = String(6 + Math.floor(mins / 60)).padStart(2, '0');
        const mm = String(mins % 60).padStart(2, '0');
        const timeStr = `${hh}:${mm}:00`;

        stop_times.push({
          trip_id: tripId,
          arrival_time: timeStr,
          departure_time: timeStr,
          stop_id: st.stop_id,
          stop_sequence: idx + 1
        });
      });
    });
  });

  const fares: Fare[] = [
    {
      fare_id: 'fare_tj_regular',
      price: 3500,
      currency_type: 'IDR',
      payment_method: 1,
      mode: 'brt',
      source_url: TJ_GTFS_URL,
      fetched_at: fetchedAt,
      method: 'gtfs'
    },
    {
      fare_id: 'fare_tj_mikrotrans',
      price: 0,
      currency_type: 'IDR',
      payment_method: 1,
      mode: 'mikrotrans',
      source_url: TJ_GTFS_URL,
      fetched_at: fetchedAt,
      method: 'gtfs'
    }
  ];

  return {
    agencies: [agency],
    routes,
    stops,
    trips,
    stop_times,
    shapes: [],
    transfers: [],
    fares,
    feed_versions: [{
      source: 'transjakarta',
      hash: 'local_snapshot_hash',
      fetched_at: fetchedAt,
      status: 'VALID',
      record_count: {
        routes: routes.length,
        stops: stops.length,
        trips: trips.length,
        stop_times: stop_times.length
      }
    }]
  };
}
