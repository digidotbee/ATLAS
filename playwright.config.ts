import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173/ATLAS/';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL, browserName: 'chromium', locale: 'en-US' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --base /ATLAS/',
    url: baseURL,
  },
});
