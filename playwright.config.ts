import { defineConfig } from '@playwright/test';

// P8_PORT lets you run the docs on another port when 4321 is taken by something else.
const port = process.env.P8_PORT ?? '4321';
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://localhost:${port}` },
  webServer: [
    { command: `pnpm dev --port ${port}`, url: `http://localhost:${port}`, reuseExistingServer: true, timeout: 60_000 },
    { command: 'pnpm api', url: 'http://localhost:4322/api/install', reuseExistingServer: true, timeout: 60_000 },
  ],
});
