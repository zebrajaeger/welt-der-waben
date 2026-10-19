import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173/welt-der-waben/';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  workers: 1,
  timeout: 30_000,
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
