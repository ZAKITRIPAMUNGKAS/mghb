import { test, expect } from '@playwright/test';

test.describe('Alur Cari Rute Laku Transit End-to-End', () => {
  test('Memuat halaman, input rute, dan menampilkan hasil itinerary', async ({ page }) => {
    // Intercept /api requests with mock data for deterministic e2e test
    await page.route('**/api/meta', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          last_sync_timestamp: '2026-10-13T02:00:00+07:00',
          total_routes: 249,
          total_stops: 8199
        })
      });
    });

    await page.route('**/api/stops/search?q=Kota', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stops: [
            { stop_id: 'krl:JAKK', stop_name: 'Stasiun Jakarta Kota', stop_lat: -6.1376, stop_lon: 106.8146, mode: 'krl' }
          ]
        })
      });
    });

    await page.route('**/api/stops/search?q=Blok%20M', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stops: [
            { stop_id: 'mrt:BLM', stop_name: 'Stasiun MRT Blok M BCA', stop_lat: -6.2444, stop_lon: 106.7983, mode: 'mrt' }
          ]
        })
      });
    });

    await page.route('**/api/plan?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          itineraries: [
            {
              duration_seconds: 2400,
              walking_distance_meters: 220,
              transfers: 0,
              estimated_fare_idr: 3500,
              departure_time: '07:30',
              arrival_time: '08:10',
              legs: [
                {
                  type: 'WALK',
                  from_stop_name: 'Lokasi Anda',
                  to_stop_name: 'Stasiun MRT Blok M BCA',
                  duration_seconds: 120,
                  distance_meters: 100,
                  description: 'Jalan kaki ke Stasiun MRT Blok M BCA'
                },
                {
                  type: 'TRANSIT',
                  mode: 'brt',
                  route_short_name: '1',
                  route_long_name: 'Blok M - Kota',
                  route_color: '#DC2626',
                  from_stop_name: 'Blok M',
                  to_stop_name: 'Kota',
                  duration_seconds: 2160,
                  distance_meters: 12000,
                  description: 'Naik Koridor 1 ke Kota'
                }
              ]
            }
          ]
        })
      });
    });

    await page.goto('/');

    // 1. Periksa header dan branding
    await expect(page.locator('h1')).toHaveText('LAKU');
    await expect(page.locator('.panel-footer')).toContainText('Data per 13 Okt 2026');

    // 2. Input Asal
    const originInput = page.locator('input[placeholder*="Asal"]');
    await originInput.fill('Blok M');
    await page.locator('text=Stasiun MRT Blok M BCA').click();

    // 3. Input Tujuan
    const destInput = page.locator('input[placeholder*="Tujuan"]');
    await destInput.fill('Kota');
    await page.locator('text=Stasiun Jakarta Kota').click();

    // 4. Klik Cari Rute Transit
    await page.locator('button:has-text("Cari Rute Transit")').click();

    // 5. Verifikasi kartu itinerary tampil
    await expect(page.locator('.itin-duration')).toHaveText('40 Menit');
    await expect(page.locator('.itin-fare')).toHaveText('Rp 3.500');
    await expect(page.locator('.step-badge:has-text("1")')).toBeVisible();
  });
});
