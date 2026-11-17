import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: { command: 'pnpm dev', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 60_000 },
});
