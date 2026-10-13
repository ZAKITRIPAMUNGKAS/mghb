import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { stringify } from 'csv-stringify/sync';
import { GTFSFeed } from '../types.js';

export async function exportCombinedGTFSZip(feed: GTFSFeed, outputPath: string): Promise<void> {
  const zip = new JSZip();

  // 1. agency.txt
  const agencyRows = feed.agencies.map(a => ({
    agency_id: a.agency_id,
    agency_name: a.agency_name,
    agency_url: a.agency_url,
    agency_timezone: a.agency_timezone,
    agency_lang: a.agency_lang || 'id',
    agency_phone: a.agency_phone || ''
  }));
  zip.file('agency.txt', stringify(agencyRows, { header: true }));

  // 2. routes.txt
  const routeRows = feed.routes.map(r => ({
    route_id: r.route_id,
    agency_id: r.agency_id,
    route_short_name: r.route_short_name,
    route_long_name: r.route_long_name,
    route_desc: r.route_desc || '',
    route_type: r.route_type,
    route_color: r.route_color.replace(/^#/, ''),
    route_text_color: r.route_text_color.replace(/^#/, '')
  }));
  zip.file('routes.txt', stringify(routeRows, { header: true }));

  // 3. stops.txt
  const stopRows = feed.stops.map(s => ({
    stop_id: s.stop_id,
    stop_name: s.stop_name,
    stop_lat: s.stop_lat,
    stop_lon: s.stop_lon,
    location_type: s.location_type || 0,
    parent_station: s.parent_station || '',
    wheelchair_boarding: s.wheelchair_boarding || 0
  }));
  zip.file('stops.txt', stringify(stopRows, { header: true }));

  // 4. trips.txt
  const tripRows = feed.trips.map(t => ({
    route_id: t.route_id,
    service_id: t.service_id,
    trip_id: t.trip_id,
    trip_headsign: t.trip_headsign,
    direction_id: t.direction_id,
    shape_id: t.shape_id || ''
  }));
  zip.file('trips.txt', stringify(tripRows, { header: true }));

  // 5. stop_times.txt
  const stopTimeRows = feed.stop_times.map(st => ({
    trip_id: st.trip_id,
    arrival_time: st.arrival_time,
    departure_time: st.departure_time,
    stop_id: st.stop_id,
    stop_sequence: st.stop_sequence,
    stop_headsign: st.stop_headsign || '',
    pickup_type: st.pickup_type || 0,
    drop_off_type: st.drop_off_type || 0
  }));
  zip.file('stop_times.txt', stringify(stopTimeRows, { header: true }));

  // 6. shapes.txt
  if (feed.shapes.length > 0) {
    const shapeRows = feed.shapes.map(sh => ({
      shape_id: sh.shape_id,
      shape_pt_lat: sh.shape_pt_lat,
      shape_pt_lon: sh.shape_pt_lon,
      shape_pt_sequence: sh.shape_pt_sequence
    }));
    zip.file('shapes.txt', stringify(shapeRows, { header: true }));
  }

  // 7. transfers.txt
  const transferRows = feed.transfers.map(tr => ({
    from_stop_id: tr.from_stop_id,
    to_stop_id: tr.to_stop_id,
    transfer_type: tr.transfer_type,
    min_transfer_time: tr.min_transfer_time
  }));
  zip.file('transfers.txt', stringify(transferRows, { header: true }));

  // 8. calendar.txt (Daily service)
  const calendarRows = [
    {
      service_id: 'DAILY',
      monday: 1,
      tuesday: 1,
      wednesday: 1,
      thursday: 1,
      friday: 1,
      saturday: 1,
      sunday: 1,
      start_date: '20260101',
      end_date: '20271231'
    }
  ];
  zip.file('calendar.txt', stringify(calendarRows, { header: true }));

  // 9. fare_attributes.txt & fare_rules.txt
  const fareAttrRows = feed.fares.map(f => ({
    fare_id: f.fare_id,
    price: f.price,
    currency_type: f.currency_type,
    payment_method: f.payment_method,
    transfers: f.transfers ?? '',
    transfer_duration: f.transfer_duration ?? ''
  }));
  zip.file('fare_attributes.txt', stringify(fareAttrRows, { header: true }));

  const fareRulesRows = feed.fares.map(f => ({
    fare_id: f.fare_id,
    route_id: ''
  }));
  zip.file('fare_rules.txt', stringify(fareRulesRows, { header: true }));

  // Generate output ZIP
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputPath, content);
  console.log(`[GTFS Exporter] Combined GTFS successfully saved to ${outputPath} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
}
