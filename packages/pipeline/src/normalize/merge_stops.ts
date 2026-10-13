import { Stop } from '../types.js';

export interface TransitHub {
  hub_id: string;
  name: string;
  lat: number;
  lon: number;
  match_stop_ids: string[];
}

export const TRANSIT_HUBS_MASTER: TransitHub[] = [
  {
    hub_id: 'hub:dukuh_atas',
    name: 'Kawasan Integrasi Dukuh Atas (Transit Hub)',
    lat: -6.2014,
    lon: 106.8227,
    match_stop_ids: ['mrt:DKA', 'krl:SUD', 'krl:SUDB', 'lrtb:DKA_LRT', 'tj:1-12', 'tj:1-13', 'tj:4-16', 'tj:6-20']
  },
  {
    hub_id: 'hub:manggarai',
    name: 'Stasiun Sentral Manggarai (Transit Hub)',
    lat: -6.2099,
    lon: 106.8502,
    match_stop_ids: ['krl:MRI', 'tj:4-14', 'tj:4-15']
  },
  {
    hub_id: 'hub:tanah_abang',
    name: 'Kawasan Stasiun Tanah Abang (Transit Hub)',
    lat: -6.1855,
    lon: 106.8111,
    match_stop_ids: ['krl:THB', 'tj:9D-1', 'tj:1R-1']
  },
  {
    hub_id: 'hub:csw_asean',
    name: 'Integrasi CSW — Stasiun ASEAN (Transit Hub)',
    lat: -6.2394,
    lon: 106.7989,
    match_stop_ids: ['mrt:ASN', 'tj:1-4', 'tj:13-1']
  },
  {
    hub_id: 'hub:cawang_cikoko',
    name: 'Integrasi Cikoko — Stasiun Cawang (Transit Hub)',
    lat: -6.2435,
    lon: 106.8583,
    match_stop_ids: ['krl:CW', 'lrtb:CKO', 'tj:9-12']
  },
  {
    hub_id: 'hub:velodrome_rawamangun',
    name: 'Integrasi Velodrome — Pemuda Rawamangun (Transit Hub)',
    lat: -6.1930,
    lon: 106.8847,
    match_stop_ids: ['lrtj:VLD', 'tj:4-8']
  },
  {
    hub_id: 'hub:jakarta_kota',
    name: 'Kawasan Stasiun Jakarta Kota (Transit Hub)',
    lat: -6.1376,
    lon: 106.8146,
    match_stop_ids: ['krl:JAKK', 'tj:1-1', 'tj:12-1']
  }
];

export function mergeStopsWithHubs(stops: Stop[]): Stop[] {
  const hubLookup = new Map<string, string>();
  TRANSIT_HUBS_MASTER.forEach(h => {
    h.match_stop_ids.forEach(sid => {
      hubLookup.set(sid, h.hub_id);
    });
  });

  const updatedStops = stops.map(s => {
    const matchedHub = hubLookup.get(s.stop_id);
    if (matchedHub) {
      return {
        ...s,
        parent_station: matchedHub
      };
    }
    return s;
  });

  // Append virtual parent stations for each hub
  const parentHubStops: Stop[] = TRANSIT_HUBS_MASTER.map(h => ({
    stop_id: h.hub_id,
    stop_name: h.name,
    stop_lat: h.lat,
    stop_lon: h.lon,
    location_type: 1, // 1 = Station / Hub
    source_url: 'https://mghb.tepegrafi.id/transit/hubs',
    fetched_at: new Date().toISOString(),
    method: 'sync'
  }));

  return [...updatedStops, ...parentHubStops];
}
