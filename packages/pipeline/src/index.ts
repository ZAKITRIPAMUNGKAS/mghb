import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchTransjakartaFeed } from './fetchers/transjakarta.js';
import { fetchKrlFeed } from './fetchers/krl.js';
import { fetchMrtFeed } from './fetchers/mrt.js';
import { fetchLrtFeed } from './fetchers/lrt.js';
import { processAngkotData } from './fetchers/angkot.js';
import { applyAgencyPrefix } from './normalize/prefix.js';
import { mergeStopsWithHubs } from './normalize/merge_stops.js';
import { generateIntermodalTransfers } from './normalize/transfers.js';
import { validateGTFSFeed } from './validator/index.js';
import { exportCombinedGTFSZip } from './exporter/gtfs_zip.js';
import { importFeedToPostgres } from './db/import.js';
import { GTFSFeed } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../../../');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const OUT_DIR = path.join(DATA_DIR, 'out');

export async function runPipeline(): Promise<GTFSFeed> {
  console.log('====================================================');
  console.log('🚀 LAKU TRANSIT — JABODETABEK GTFS PIPELINE RUNNER');
  console.log('   Author: Zaki Tri Pamungkas');
  console.log('====================================================\n');

  // 1. Fetch from each agency
  const tjFeedRaw = await fetchTransjakartaFeed(RAW_DIR, DATA_DIR);
  const tjFeed = applyAgencyPrefix(tjFeedRaw, 'tj');

  const krlFeedRaw = await fetchKrlFeed();
  const krlFeed = applyAgencyPrefix(krlFeedRaw, 'krl');

  const mrtFeedRaw = await fetchMrtFeed();
  const mrtFeed = applyAgencyPrefix(mrtFeedRaw, 'mrt');

  const lrtFeedRaw = await fetchLrtFeed();
  // LRT feed contains both lrtj and lrtb
  const lrtFeed = {
    ...lrtFeedRaw,
    routes: lrtFeedRaw.routes.map(r => ({ ...r, route_id: `${r.agency_id}:${r.route_id}` })),
    stops: lrtFeedRaw.stops.map(s => ({ ...s, stop_id: s.stop_id.includes('LRT') ? `lrtb:${s.stop_id}` : `lrtj:${s.stop_id}` })),
    trips: lrtFeedRaw.trips.map(t => {
      const pfx = t.route_id.includes('cbb') || t.route_id.includes('bks') ? 'lrtb' : 'lrtj';
      return {
        ...t,
        trip_id: `${pfx}:${t.trip_id}`,
        route_id: `${pfx}:${t.route_id}`
      };
    }),
    stop_times: lrtFeedRaw.stop_times.map(st => ({
      ...st,
      trip_id: `${st.trip_id.includes('cbb') || st.trip_id.includes('bks') ? 'lrtb' : 'lrtj'}:${st.trip_id}`,
      stop_id: st.stop_id.includes('LRT') ? `lrtb:${st.stop_id}` : `lrtj:${st.stop_id}`
    }))
  };

  const angkotFeed = await processAngkotData(DATA_DIR);

  // 2. Combine all feeds
  const combinedAgencies = [
    ...tjFeed.agencies,
    ...krlFeed.agencies,
    ...mrtFeed.agencies,
    ...lrtFeed.agencies,
    ...angkotFeed.agencies
  ];

  const combinedRoutes = [
    ...tjFeed.routes,
    ...krlFeed.routes,
    ...mrtFeed.routes,
    ...lrtFeed.routes
  ];

  let rawCombinedStops = [
    ...tjFeed.stops,
    ...krlFeed.stops,
    ...mrtFeed.stops,
    ...lrtFeed.stops
  ];

  // 3. Merge physical transit hubs
  const mergedStops = mergeStopsWithHubs(rawCombinedStops);

  const combinedTrips = [
    ...tjFeed.trips,
    ...krlFeed.trips,
    ...mrtFeed.trips,
    ...lrtFeed.trips
  ];

  const combinedStopTimes = [
    ...tjFeed.stop_times,
    ...krlFeed.stop_times,
    ...mrtFeed.stop_times,
    ...lrtFeed.stop_times
  ];

  const combinedShapes = [
    ...tjFeed.shapes,
    ...krlFeed.shapes,
    ...mrtFeed.shapes,
    ...lrtFeed.shapes
  ];

  const combinedFares = [
    ...tjFeed.fares,
    ...krlFeed.fares,
    ...mrtFeed.fares,
    ...lrtFeed.fares
  ];

  // 4. Generate intermodal transfers (distance <= 400m)
  console.log('[Pipeline] Generating intermodal transfers within 400m radius...');
  const intermodalTransfers = generateIntermodalTransfers(mergedStops, 400);
  console.log(`[Pipeline] Generated ${intermodalTransfers.length} intermodal transfer pairs.`);

  const combinedFeedVersions = [
    ...tjFeed.feed_versions,
    ...krlFeed.feed_versions,
    ...mrtFeed.feed_versions,
    ...lrtFeed.feed_versions,
    ...angkotFeed.feed_versions
  ];

  const combinedFeed: GTFSFeed = {
    agencies: combinedAgencies,
    routes: combinedRoutes,
    stops: mergedStops,
    trips: combinedTrips,
    stop_times: combinedStopTimes,
    shapes: combinedShapes,
    transfers: intermodalTransfers,
    fares: combinedFares,
    feed_versions: combinedFeedVersions
  };

  // 5. Validate feed
  console.log('[Pipeline] Validating combined GTFS feed...');
  const validation = validateGTFSFeed(combinedFeed);
  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    throw new Error('Fatal GTFS validation errors encountered.');
  }
  console.log('✅ Validation passed without fatal errors.');

  // 6. Export to GTFS zip
  const zipPath = path.join(OUT_DIR, 'gtfs-jabodetabek.zip');
  await exportCombinedGTFSZip(combinedFeed, zipPath);

  // 7. Optional PostgreSQL import
  await importFeedToPostgres(combinedFeed);

  console.log('\n====================================================');
  console.log('🎉 PIPELINE COMPLETED SUCCESSFULLY!');
  console.log(`   Agencies: ${combinedFeed.agencies.length}`);
  console.log(`   Routes:   ${combinedFeed.routes.length}`);
  console.log(`   Stops:    ${combinedFeed.stops.length}`);
  console.log(`   Trips:    ${combinedFeed.trips.length}`);
  console.log(`   Transfers:${combinedFeed.transfers.length}`);
  console.log('====================================================\n');

  return combinedFeed;
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPipeline().catch(err => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  });
}
