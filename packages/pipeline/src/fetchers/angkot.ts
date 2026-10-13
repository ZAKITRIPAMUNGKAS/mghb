import fs from 'node:fs';
import path from 'node:path';
import { stringify } from 'csv-stringify/sync';
import { GTFSFeed } from '../types.js';

const SATU_DATA_JAKARTA_URL = 'https://data.jakarta.go.id/dataset/daftartrayekangkutanumum';

export interface AngkotTrayekRaw {
  nomor_trayek: string;
  jenis_angkutan: string; // KWK, Mikrolet, APB
  terminal_asal: string;
  terminal_tujuan: string;
  rute_berangkat: string;
  rute_kembali: string;
  osm_relation_id?: string;
}

// Sample official routes from Satu Data Jakarta dataset
export const ANGKOT_SAMPLE_TRAYEK: AngkotTrayekRaw[] = [
  {
    nomor_trayek: 'KWK T03',
    jenis_angkutan: 'KWK',
    terminal_asal: 'Terminal Cililitan',
    terminal_tujuan: 'Munjul',
    rute_berangkat: 'Cililitan - Raya Bogor - Kramat Jati - Hek - Raya Hankam - Munjul',
    rute_kembali: 'Munjul - Raya Hankam - Hek - Kramat Jati - Raya Bogor - Cililitan'
  },
  {
    nomor_trayek: 'KWK T22',
    jenis_angkutan: 'KWK',
    terminal_asal: 'Pulo Gadung',
    terminal_tujuan: 'Gudang Air',
    rute_berangkat: 'Pulo Gadung - Pemuda - Pramuka - Matraman - Jatinegara - Gudang Air',
    rute_kembali: 'Gudang Air - Jatinegara - Matraman - Pramuka - Pemuda - Pulo Gadung'
  },
  {
    nomor_trayek: 'Mikrolet M01',
    jenis_angkutan: 'Mikrolet',
    terminal_asal: 'Terminal Senen',
    terminal_tujuan: 'Kampung Melayu',
    rute_berangkat: 'Senen - Salemba Raya - Matraman Raya - Jatinegara Barat - Kampung Melayu',
    rute_kembali: 'Kampung Melayu - Jatinegara Timur - Matraman Raya - Salemba Raya - Senen'
  },
  {
    nomor_trayek: 'Mikrolet M11',
    jenis_angkutan: 'Mikrolet',
    terminal_asal: 'Tanah Abang',
    terminal_tujuan: 'Meruya',
    rute_berangkat: 'Tanah Abang - Jatibaru - KS Tubun - Slipi Palmerah - Kemanggisan - Kebon Jeruk - Meruya',
    rute_kembali: 'Meruya - Kebon Jeruk - Kemanggisan - Slipi Palmerah - KS Tubun - Tanah Abang'
  }
];

export async function processAngkotData(dataDir: string): Promise<GTFSFeed> {
  const fetchedAt = new Date().toISOString();
  console.log(`[Angkot Ingester] Processing Satu Data Jakarta Angkot routes...`);

  // Export survey-todo.csv for routes requiring field GPS survey
  const surveyTodo = ANGKOT_SAMPLE_TRAYEK.map(t => ({
    nomor_trayek: t.nomor_trayek,
    jenis_angkutan: t.jenis_angkutan,
    terminal_asal: t.terminal_asal,
    terminal_tujuan: t.terminal_tujuan,
    rute_lengkap: `${t.rute_berangkat} [PP: ${t.rute_kembali}]`,
    status_osm: t.osm_relation_id ? 'Tersedia di OSM' : 'Perlu Survei Lapangan',
    catatan: 'Belum ada relasi OSM & headway GPS tervalidasi. Disimpan untuk survei lapangan.'
  }));

  const csvOutput = stringify(surveyTodo, { header: true });
  const surveyFilePath = path.join(dataDir, 'survey-todo.csv');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(surveyFilePath, csvOutput, 'utf-8');
  console.log(`[Angkot Ingester] Exported ${surveyTodo.length} routes to ${surveyFilePath}`);

  // Sesuai Aturan Data Real: Trayek yang belum disurvei tidak dimasukkan ke feed routing aktif.
  return {
    agencies: [{
      agency_id: 'akt',
      agency_name: 'Angkutan Kota Non-Integrasi DKI Jakarta',
      agency_url: SATU_DATA_JAKARTA_URL,
      agency_timezone: 'Asia/Jakarta',
      source_url: SATU_DATA_JAKARTA_URL,
      fetched_at: fetchedAt,
      method: 'survei'
    }],
    routes: [],
    stops: [],
    trips: [],
    stop_times: [],
    shapes: [],
    transfers: [],
    fares: [],
    feed_versions: [{
      source: 'satu_data_jakarta_angkot',
      hash: 'angkot_survey_todo_hash',
      fetched_at: fetchedAt,
      status: 'WARNING',
      record_count: {
        survey_pending: surveyTodo.length,
        active_routes: 0
      },
      notes: 'Rute angkot non-integrasi disembunyikan sampai hasil survei GPS track & headway lapangan tersedia.'
    }]
  };
}
