export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Laku Transit API — Jabodetabek Multi-Modal Journey Planner',
    version: '1.0.0',
    description: 'API resmi perencana perjalanan transportasi publik Jabodetabek (TransJakarta, Mikrotrans, KRL, MRT, LRT, Angkot)',
    contact: {
      name: 'Zaki Tri Pamungkas',
      url: 'https://mghb.tepegrafi.id'
    }
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local Development Server' },
    { url: 'https://mghb.tepegrafi.id/api', description: 'Production API' }
  ],
  paths: {
    '/stops/search': {
      get: {
        summary: 'Pencarian halte/stasiun',
        description: 'Pencarian teks toleran typo (pg_trgm / fuzzy search), maksimal 20 hasil.',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Query pencarian nama halte/stasiun' }
        ],
        responses: {
          '200': {
            description: 'Daftar halte yang cocok',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    total: { type: 'integer' },
                    stops: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          stop_id: { type: 'string' },
                          stop_name: { type: 'string' },
                          stop_lat: { type: 'number' },
                          stop_lon: { type: 'number' },
                          agency_id: { type: 'string' },
                          mode: { type: 'string' },
                          parent_station: { type: 'string', nullable: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/stops/{id}': {
      get: {
        summary: 'Detail halte/stasiun',
        description: 'Informasi halte, rute yang melintas, dan jadwal keberangkatan berikutnya.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID Halte (misal: tj:1-12, krl:MRI, mrt:DKA)' }
        ],
        responses: {
          '200': {
            description: 'Detail halte dan rute yang melintas',
            content: { 'application/json': { schema: { type: 'object' } } }
          },
          '404': { description: 'Halte tidak ditemukan' }
        }
      }
    },
    '/routes': {
      get: {
        summary: 'Daftar semua rute/koridor',
        description: 'Daftar rute aktif dengan filter moda opsional.',
        parameters: [
          { name: 'mode', in: 'query', schema: { type: 'string', enum: ['brt', 'non-brt', 'mikrotrans', 'krl', 'mrt', 'lrt', 'all'] } }
        ],
        responses: {
          '200': {
            description: 'Daftar rute',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/routes/{id}': {
      get: {
        summary: 'Detail koridor/rute',
        description: 'Urutan halte per arah, jam operasional, estimasi headway, dan geometri shape GeoJSON.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Detail koridor' },
          '404': { description: 'Rute tidak ditemukan' }
        }
      }
    },
    '/plan': {
      get: {
        summary: 'Perencanaan rute multi-modal (A ke B)',
        description: 'Mencari rute terbaik antar koordinat via OpenTripPlanner 2 dengan normalisasi langkah dan kalkulasi tarif.',
        parameters: [
          { name: 'from', in: 'query', required: true, schema: { type: 'string' }, example: '-6.2088,106.8456' },
          { name: 'to', in: 'query', required: true, schema: { type: 'string' }, example: '-6.1376,106.8146' },
          { name: 'time', in: 'query', schema: { type: 'string' }, example: '07:30:00' }
        ],
        responses: {
          '200': {
            description: 'Daftar opsi rencana perjalanan (itineraries)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    origin: { type: 'object' },
                    destination: { type: 'object' },
                    departure_time: { type: 'string' },
                    itineraries: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          duration_seconds: { type: 'integer' },
                          walking_distance_meters: { type: 'number' },
                          transfers: { type: 'integer' },
                          estimated_fare_idr: { type: 'integer' },
                          legs: { type: 'array', items: { type: 'object' } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/meta': {
      get: {
        summary: 'Metadata & status feed sinkronisasi',
        description: 'Informasi versi feed, waktu sinkronisasi terakhir, dan status validitas per operator.',
        responses: {
          '200': {
            description: 'Metadata feed dan provenance audit',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    }
  }
};
