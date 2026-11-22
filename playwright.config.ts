import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  // The smoke test asserts on the Spanish (source) text; language.spec covers the others.
  use: { baseURL: 'http://localhost:4173', ...devices['Pixel 7'], locale: 'es-ES' },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
});
