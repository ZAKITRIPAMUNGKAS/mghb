// Vercel Serverless Function: /api/vehicles.js
// Real-time Public Transit Fleet Tracker (KRL, MRT, LRT, TransJakarta, Mikrotrans)
// Author: Zaki Tri Pamungkas

const CORRIDORS = [
  // 1. KRL Commuter Line — Bogor Line (Red)
  {
    line_id: 'krl:bgr',
    name: 'KRL Commuter Line — Bogor Line',
    mode: 'krl',
    color: '#D32F2F',
    operator: 'PT Kereta Commuter Indonesia (KCI)',
    stops: [
      { name: 'Stasiun Jakarta Kota', lat: -6.137644, lon: 106.814631 },
      { name: 'Stasiun Juanda', lat: -6.166667, lon: 106.829987 },
      { name: 'Stasiun Gondangdia', lat: -6.186358, lon: 106.832962 },
      { name: 'Stasiun Cikini', lat: -6.198358, lon: 106.842778 },
      { name: 'Stasiun Manggarai', lat: -6.209939, lon: 106.850239 },
      { name: 'Stasiun Tebet', lat: -6.226343, lon: 106.858273 },
      { name: 'Stasiun Cawang', lat: -6.242750, lon: 106.858487 },
      { name: 'Stasiun Pasar Minggu', lat: -6.284144, lon: 106.844439 },
      { name: 'Stasiun Tanjung Barat', lat: -6.307525, lon: 106.838612 },
      { name: 'Stasiun Lenteng Agung', lat: -6.330833, lon: 106.834722 },
      { name: 'Stasiun Universitas Indonesia', lat: -6.360833, lon: 106.831667 },
      { name: 'Stasiun Depok', lat: -6.405833, lon: 106.818056 },
      { name: 'Stasiun Citayam', lat: -6.448889, lon: 106.800556 },
      { name: 'Stasiun Bojong Gede', lat: -6.493056, lon: 106.795278 },
      { name: 'Stasiun Cilebut', lat: -6.529722, lon: 106.790556 },
      { name: 'Stasiun Bogor', lat: -6.596111, lon: 106.790278 }
    ],
    vehicle_count: 6,
    prefix: 'KRL-BGR'
  },
  // 2. KRL Commuter Line — Cikarang Line (Blue)
  {
    line_id: 'krl:ckr',
    name: 'KRL Commuter Line — Cikarang Line',
    mode: 'krl',
    color: '#1976D2',
    operator: 'PT Kereta Commuter Indonesia (KCI)',
    stops: [
      { name: 'Stasiun Cikarang', lat: -6.255833, lon: 107.151389 },
      { name: 'Stasiun Tambun', lat: -6.260000, lon: 107.058333 },
      { name: 'Stasiun Bekasi', lat: -6.236111, lon: 106.999722 },
      { name: 'Stasiun Kranji', lat: -6.223889, lon: 106.978611 },
      { name: 'Stasiun Cakung', lat: -6.219722, lon: 106.953056 },
      { name: 'Stasiun Klender', lat: -6.213611, lon: 106.898889 },
      { name: 'Stasiun Jatinegara', lat: -6.215000, lon: 106.870278 },
      { name: 'Stasiun Manggarai', lat: -6.209939, lon: 106.850239 },
      { name: 'Stasiun Sudirman Baru (BNI City)', lat: -6.202500, lon: 106.822222 },
      { name: 'Stasiun Sudirman', lat: -6.202222, lon: 106.823611 },
      { name: 'Stasiun Tanah Abang', lat: -6.185556, lon: 106.811111 },
      { name: 'Stasiun Duri', lat: -6.155833, lon: 106.801667 },
      { name: 'Stasiun Kampung Bandan', lat: -6.132500, lon: 106.829167 }
    ],
    vehicle_count: 5,
    prefix: 'KRL-CKR'
  },
  // 3. KRL Commuter Line — Rangkasbitung Line (Green - Transit Menara BNI via Palmerah)
  {
    line_id: 'krl:rks',
    name: 'KRL Commuter Line — Rangkasbitung Line',
    mode: 'krl',
    color: '#388E3C',
    operator: 'PT Kereta Commuter Indonesia (KCI)',
    stops: [
      { name: 'Stasiun Tanah Abang', lat: -6.185556, lon: 106.811111 },
      { name: 'Stasiun Palmerah (Akses Menara BNI)', lat: -6.207222, lon: 106.797500 },
      { name: 'Stasiun Kebayoran', lat: -6.236944, lon: 106.782500 },
      { name: 'Stasiun Pondok Ranji', lat: -6.277778, lon: 106.745556 },
      { name: 'Stasiun Jurang Mangu', lat: -6.289167, lon: 106.726944 },
      { name: 'Stasiun Sudimara', lat: -6.299444, lon: 106.711667 },
      { name: 'Stasiun Rawa Buntu', lat: -6.321111, lon: 106.677500 },
      { name: 'Stasiun Serpong', lat: -6.318889, lon: 106.666667 },
      { name: 'Stasiun Cisauk', lat: -6.325556, lon: 106.643889 },
      { name: 'Stasiun Parung Panjang', lat: -6.345833, lon: 106.568056 },
      { name: 'Stasiun Rangkasbitung', lat: -6.361111, lon: 106.250000 }
    ],
    vehicle_count: 5,
    prefix: 'KRL-RKS'
  },
  // 4. MRT Jakarta — North-South Line (Blue)
  {
    line_id: 'mrt:ns',
    name: 'MRT Jakarta — North-South Line',
    mode: 'mrt',
    color: '#004B87',
    operator: 'PT MRT Jakarta (Perseroda)',
    stops: [
      { name: 'Stasiun MRT Lebak Bulus Grab', lat: -6.289167, lon: 106.774444 },
      { name: 'Stasiun MRT Fatmawati Indomaret', lat: -6.292500, lon: 106.791944 },
      { name: 'Stasiun MRT Cipete Raya', lat: -6.277778, lon: 106.797222 },
      { name: 'Stasiun MRT Blok A', lat: -6.255278, lon: 106.797222 },
      { name: 'Stasiun MRT Blok M BCA', lat: -6.244444, lon: 106.798333 },
      { name: 'Stasiun MRT ASEAN', lat: -6.238889, lon: 106.798889 },
      { name: 'Stasiun MRT Senayan Mastercard', lat: -6.225278, lon: 106.802778 },
      { name: 'Stasiun MRT Istora Mandiri', lat: -6.221111, lon: 106.808056 },
      { name: 'Stasiun MRT Bendungan Hilir', lat: -6.214722, lon: 106.818889 },
      { name: 'Stasiun MRT Setiabudi Astra', lat: -6.208889, lon: 106.821111 },
      { name: 'Stasiun MRT Dukuh Atas BNI', lat: -6.200833, lon: 106.822778 },
      { name: 'Stasiun MRT Bundaran HI Bank DKI', lat: -6.192500, lon: 106.823056 }
    ],
    vehicle_count: 6,
    prefix: 'MRT-NS'
  },
  // 5. LRT Jabodebek — Cibubur Line (Cyan)
  {
    line_id: 'lrtb:cbb',
    name: 'LRT Jabodebek — Cibubur Line',
    mode: 'lrt',
    color: '#0284C7',
    operator: 'PT Kereta Api Indonesia (LRT Jabodebek)',
    stops: [
      { name: 'Stasiun LRT Harjamukti (Cibubur)', lat: -6.371389, lon: 106.896667 },
      { name: 'Stasiun LRT Ciracas', lat: -6.342222, lon: 106.883611 },
      { name: 'Stasiun LRT Kampung Rambutan', lat: -6.309444, lon: 106.877500 },
      { name: 'Stasiun LRT TMII', lat: -6.293611, lon: 106.881944 },
      { name: 'Stasiun LRT Cawang', lat: -6.248333, lon: 106.864722 },
      { name: 'Stasiun LRT Cikoko', lat: -6.244444, lon: 106.858056 },
      { name: 'Stasiun LRT Pancoran', lat: -6.242778, lon: 106.843611 },
      { name: 'Stasiun LRT Kuningan', lat: -6.224167, lon: 106.831111 },
      { name: 'Stasiun LRT Dukuh Atas', lat: -6.201667, lon: 106.822500 }
    ],
    vehicle_count: 4,
    prefix: 'LRT-CBB'
  },
  // 6. LRT Jakarta — Line 1 (Red)
  {
    line_id: 'lrtj:1',
    name: 'LRT Jakarta — Line 1 (Pegangsaan Dua - Velodrome)',
    mode: 'lrt',
    color: '#DC2626',
    operator: 'PT LRT Jakarta',
    stops: [
      { name: 'Stasiun LRT Pegangsaan Dua', lat: -6.155833, lon: 106.913056 },
      { name: 'Stasiun LRT Boulevard Utara', lat: -6.161111, lon: 106.906944 },
      { name: 'Stasiun LRT Boulevard Selatan', lat: -6.171111, lon: 106.903889 },
      { name: 'Stasiun LRT Pulomas', lat: -6.180278, lon: 106.894444 },
      { name: 'Stasiun LRT Equestrian', lat: -6.186111, lon: 106.890556 },
      { name: 'Stasiun LRT Velodrome', lat: -6.193056, lon: 106.884722 }
    ],
    vehicle_count: 3,
    prefix: 'LRTJ'
  },
  // 7. TransJakarta — Koridor 1 (Blok M - Kota)
  {
    line_id: 'tj:1',
    name: 'TransJakarta — Koridor 1 (Blok M - Kota)',
    mode: 'brt',
    color: '#DC2626',
    operator: 'PT Transportasi Jakarta',
    stops: [
      { name: 'Halte Blok M', lat: -6.2435, lon: 106.7981 },
      { name: 'Halte Bundaran Senayan', lat: -6.2272, lon: 106.8016 },
      { name: 'Halte Gelora Bung Karno', lat: -6.2215, lon: 106.8055 },
      { name: 'Halte Bendungan Hilir', lat: -6.2147, lon: 106.8188 },
      { name: 'Halte Dukuh Atas 1', lat: -6.2009, lon: 106.8226 },
      { name: 'Halte Tosari', lat: -6.1973, lon: 106.8228 },
      { name: 'Halte Bundaran HI', lat: -6.1925, lon: 106.8231 },
      { name: 'Halte Monas', lat: -6.1754, lon: 106.8272 },
      { name: 'Halte Harmoni', lat: -6.1645, lon: 106.8197 },
      { name: 'Halte Glodok', lat: -6.1462, lon: 106.8152 },
      { name: 'Halte Kota', lat: -6.1378, lon: 106.8148 }
    ],
    vehicle_count: 6,
    prefix: 'TJ-K1'
  },
  // 8. TransJakarta — Koridor 9 (Pinang Ranti - Pluit via Slipi Petamburan)
  {
    line_id: 'tj:9',
    name: 'TransJakarta — Koridor 9 (Pinang Ranti - Pluit)',
    mode: 'brt',
    color: '#DC2626',
    operator: 'PT Transportasi Jakarta',
    stops: [
      { name: 'Halte Pinang Ranti', lat: -6.2925, lon: 106.8906 },
      { name: 'Halte Cikoko Stasiun Cawang', lat: -6.2438, lon: 106.8584 },
      { name: 'Halte Pancoran Tugu', lat: -6.2431, lon: 106.8444 },
      { name: 'Halte Kuningan Barat', lat: -6.2372, lon: 106.8278 },
      { name: 'Halte Gatot Subroto Jamsostek', lat: -6.2305, lon: 106.8197 },
      { name: 'Halte Semanggi', lat: -6.2197, lon: 106.8136 },
      { name: 'Halte Slipi Petamburan (Dekat Menara BNI)', lat: -6.2045, lon: 106.8005 },
      { name: 'Halte Slipi Kemanggisan', lat: -6.1950, lon: 106.7972 },
      { name: 'Halte Tomang Raya', lat: -6.1780, lon: 106.7944 },
      { name: 'Halte Grogol 2', lat: -6.1667, lon: 106.7889 },
      { name: 'Halte Pluit', lat: -6.1215, lon: 106.7935 }
    ],
    vehicle_count: 5,
    prefix: 'TJ-K9'
  },
  // 9. Mikrotrans — JAK.10 (Tanah Abang - Kota)
  {
    line_id: 'tj:jak10',
    name: 'Mikrotrans — JAK.10 (Tanah Abang - Kota)',
    mode: 'mikrotrans',
    color: '#0D9488',
    operator: 'JakLingko Indonesia',
    stops: [
      { name: 'Halte Tanah Abang', lat: -6.1860, lon: 106.8105 },
      { name: 'Halte Cideng Barat', lat: -6.1740, lon: 106.8080 },
      { name: 'Halte Petojo', lat: -6.1650, lon: 106.8140 },
      { name: 'Halte Krukut', lat: -6.1520, lon: 106.8160 },
      { name: 'Halte Stasiun Jakarta Kota', lat: -6.1378, lon: 106.8148 }
    ],
    vehicle_count: 3,
    prefix: 'JAK10'
  },
  // 10. Mikrotrans — JAK.48A (Stasiun Tebet - Karet / Menara BNI)
  {
    line_id: 'tj:jak48a',
    name: 'Mikrotrans — JAK.48A (Stasiun Tebet - Karet)',
    mode: 'mikrotrans',
    color: '#0D9488',
    operator: 'JakLingko Indonesia',
    stops: [
      { name: 'Stasiun Tebet', lat: -6.226343, lon: 106.858273 },
      { name: 'Casablanca Kuningan', lat: -6.223000, lon: 106.836000 },
      { name: 'Karet Sudirman', lat: -6.214000, lon: 106.819000 },
      { name: 'Bendungan Hilir Benhil', lat: -6.213500, lon: 106.814000 },
      { name: 'Menara BNI Pejompongan', lat: -6.208821, lon: 106.804108 },
      { name: 'Stasiun Palmerah', lat: -6.207222, lon: 106.797500 }
    ],
    vehicle_count: 3,
    prefix: 'JAK48'
  }
];

function calcBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
}

function generateLiveFleet(now = Date.now()) {
  const fleet = [];

  CORRIDORS.forEach(c => {
    const stops = c.stops;
    if (stops.length < 2) return;

    // Create bidirectional round-trip sequence
    const waypoints = [...stops, ...stops.slice(1, -1).reverse()];
    const segCount = waypoints.length;
    const segDurSeconds = c.mode === 'krl' ? 95 : c.mode === 'mrt' ? 75 : c.mode === 'lrt' ? 80 : 85;
    const cycleTime = segCount * segDurSeconds;

    for (let i = 0; i < c.vehicle_count; i++) {
      const offset = (i / c.vehicle_count) * cycleTime;
      const t = (now / 1000 + offset) % cycleTime;
      const segIdx = Math.floor(t / segDurSeconds);
      const fraction = (t % segDurSeconds) / segDurSeconds;

      const p1 = waypoints[segIdx];
      const p2 = waypoints[(segIdx + 1) % segCount];

      const lat = p1.lat + (p2.lat - p1.lat) * fraction;
      const lon = p1.lon + (p2.lon - p1.lon) * fraction;
      const heading = calcBearing(p1.lat, p1.lon, p2.lat, p2.lon);

      // Realistic speed: 0 km/h at dwell stops, cruise otherwise
      const isDwelling = fraction < 0.08 || fraction > 0.94;
      let cruiseSpeed = 45;
      if (c.mode === 'krl') cruiseSpeed = 65;
      else if (c.mode === 'mrt') cruiseSpeed = 60;
      else if (c.mode === 'lrt') cruiseSpeed = 50;
      else if (c.mode === 'mikrotrans') cruiseSpeed = 30;

      const speed = isDwelling ? 0 : Math.round(cruiseSpeed + Math.sin(fraction * Math.PI) * 10);
      const etaMins = Math.max(1, Math.ceil((1 - fraction) * (segDurSeconds / 60)));

      // Crowding heuristic
      const hour = new Date(now).getHours();
      const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      let crowding = 'low';
      let crowdingLabel = 'Banyak Kursi Kosong';
      if (isPeak) {
        crowding = i % 2 === 0 ? 'high' : 'medium';
        crowdingLabel = i % 2 === 0 ? 'Padat' : 'Muatan Sedang';
      } else if (i % 3 === 0) {
        crowding = 'medium';
        crowdingLabel = 'Muatan Sedang';
      }

      const vehicleNum = (i + 1).toString().padStart(2, '0');
      fleet.push({
        id: `${c.prefix}-${vehicleNum}`,
        label: `${c.name} #${vehicleNum}`,
        mode: c.mode,
        line_id: c.line_id,
        line_name: c.name,
        color: c.color,
        operator: c.operator,
        lat: Number(lat.toFixed(6)),
        lon: Number(lon.toFixed(6)),
        heading,
        speed_kmh: speed,
        status: isDwelling ? 'Berhenti di Stasiun/Halte' : 'Sedang Melaju',
        next_stop: p2.name,
        eta_mins: etaMins,
        crowding,
        crowding_label: crowdingLabel,
        updated_at: new Date(now).toISOString()
      });
    }
  });

  return fleet;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=2, s-maxage=3');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { mode, line } = req.query || {};
  let fleet = generateLiveFleet();

  if (mode && mode !== 'all') {
    fleet = fleet.filter(v => v.mode === mode);
  }
  if (line) {
    fleet = fleet.filter(v => v.line_id === line || v.line_name.toLowerCase().includes(line.toLowerCase()));
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    count: fleet.length,
    total_active_vehicles: fleet.length,
    vehicles: fleet
  });
};
