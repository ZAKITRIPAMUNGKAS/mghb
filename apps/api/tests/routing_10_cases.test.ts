import { describe, it, expect } from 'vitest';
import { app } from '../src/index.js';

describe('10 Real Route Test Cases (Agent 2 Specification)', () => {
  const testCases = [
    {
      name: 'Kasus 1: Blok M -> Kota',
      from: '-6.2444,106.7983', // Blok M
      to: '-6.1376,106.8146',   // Kota
      expectedMaxTransfers: 1
    },
    {
      name: 'Kasus 2: Bekasi -> Dukuh Atas',
      from: '-6.2361,106.9997', // Bekasi
      to: '-6.2008,106.8227',   // Dukuh Atas
      expectedMaxTransfers: 2
    },
    {
      name: 'Kasus 3: Lebak Bulus -> Manggarai',
      from: '-6.2891,106.7744', // Lebak Bulus
      to: '-6.2099,106.8502',   // Manggarai
      expectedMaxTransfers: 2
    },
    {
      name: 'Kasus 4: Depok -> Sudirman',
      from: '-6.4058,106.8180', // Depok
      to: '-6.2022,106.8236',   // Sudirman
      expectedMaxTransfers: 1
    },
    {
      name: 'Kasus 5: Tangerang -> Duri',
      from: '-6.1772,106.6330', // Tangerang
      to: '-6.1558,106.8016',   // Duri
      expectedMaxTransfers: 0
    },
    {
      name: 'Kasus 6: Pegangsaan Dua -> Velodrome (LRT Jakarta)',
      from: '-6.1558,106.9130', // Pegangsaan Dua
      to: '-6.1930,106.8847',   // Velodrome
      expectedMaxTransfers: 0
    },
    {
      name: 'Kasus 7: Harjamukti Cibubur -> Dukuh Atas (LRT Jabodebek)',
      from: '-6.3713,106.8966', // Harjamukti
      to: '-6.2016,106.8225',   // Dukuh Atas
      expectedMaxTransfers: 0
    },
    {
      name: 'Kasus 8: Tanah Abang -> Rangkasbitung',
      from: '-6.1855,106.8111', // Tanah Abang
      to: '-6.3611,106.2500',   // Rangkasbitung
      expectedMaxTransfers: 0
    },
    {
      name: 'Kasus 9: Kampung Rambutan -> Monas',
      from: '-6.3116,106.8797', // Kampung Rambutan
      to: '-6.1754,106.8272',   // Monas
      expectedMaxTransfers: 2
    },
    {
      name: 'Kasus 10: Tanjung Priok -> Jakarta Kota',
      from: '-6.1111,106.8819', // Tanjung Priok
      to: '-6.1376,106.8146',   // Jakarta Kota
      expectedMaxTransfers: 1
    }
  ];

  testCases.forEach((tc, idx) => {
    it(`memverifikasi ${tc.name}`, async () => {
      const res = await app.request(`/plan?from=${tc.from}&to=${tc.to}&time=07:00:00`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.itineraries.length).toBeGreaterThan(0);

      const bestItinerary = json.itineraries[0];
      expect(bestItinerary.transfers).toBeLessThanOrEqual(tc.expectedMaxTransfers);
      expect(bestItinerary.duration_seconds).toBeGreaterThan(0);
      expect(bestItinerary.legs.length).toBeGreaterThanOrEqual(1);

      // Verify transit leg exists
      const transitLeg = bestItinerary.legs.find((l: any) => l.type === 'TRANSIT');
      expect(transitLeg).toBeDefined();
    });
  });
});
