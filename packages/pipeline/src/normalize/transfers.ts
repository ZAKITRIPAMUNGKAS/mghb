import { Stop, Transfer } from '../types.js';

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function generateIntermodalTransfers(stops: Stop[], maxDistanceMeters: number = 400): Transfer[] {
  const transfers: Transfer[] = [];
  const seenPairs = new Set<string>();

  // Only consider platform/stop level nodes (location_type 0 or undefined)
  const platformStops = stops.filter(s => (s.location_type || 0) === 0);

  // Group stops into coarse spatial grid (0.005 deg ~ 550m) for fast spatial join
  const GRID_SIZE = 0.005;
  const grid = new Map<string, Stop[]>();

  platformStops.forEach(s => {
    const gx = Math.floor(s.stop_lat / GRID_SIZE);
    const gy = Math.floor(s.stop_lon / GRID_SIZE);
    const key = `${gx}:${gy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(s);
  });

  platformStops.forEach(s1 => {
    const gx = Math.floor(s1.stop_lat / GRID_SIZE);
    const gy = Math.floor(s1.stop_lon / GRID_SIZE);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${gx + dx}:${gy + dy}`;
        const neighbors = grid.get(neighborKey) || [];

        neighbors.forEach(s2 => {
          if (s1.stop_id === s2.stop_id) return;

          const pairKey1 = `${s1.stop_id}->${s2.stop_id}`;
          if (seenPairs.has(pairKey1)) return;

          // Prefer inter-agency or hub transfers
          const agency1 = s1.stop_id.split(':')[0];
          const agency2 = s2.stop_id.split(':')[0];
          const sameHub = s1.parent_station && s1.parent_station === s2.parent_station;

          if (agency1 !== agency2 || sameHub) {
            const dist = haversineMeters(s1.stop_lat, s1.stop_lon, s2.stop_lat, s2.stop_lon);
            if (dist <= maxDistanceMeters) {
              const walkSecs = Math.max(90, Math.round(dist / 1.2)); // 1.2 m/s walk speed
              transfers.push({
                from_stop_id: s1.stop_id,
                to_stop_id: s2.stop_id,
                transfer_type: 2,
                min_transfer_time: walkSecs
              });
              seenPairs.add(pairKey1);
            }
          }
        });
      }
    }
  });

  return transfers;
}
