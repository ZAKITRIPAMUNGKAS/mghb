import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'Mobile Safari / Chrome (390px)',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true
      }
    },
    {
      name: 'Desktop Chrome (1440px)',
      use: {
        viewport: { width: 1440, height: 900 }
      }
    }
  ]
});
