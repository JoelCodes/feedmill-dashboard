import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local for local development
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // Narrowed per Phase 27 Plan 05: chromium runs unauthenticated specs only.
      // - global.setup.ts runs under its own 'global setup' project.
      // - demo-route-protection.spec.ts (authenticated) runs under demo-user/norole-user.
      // - demo-route-protection-unauth.spec.ts (unauthenticated PROT-03 regression)
      //   MUST still run under chromium; the trailing `$` on the regex prevents
      //   the testIgnore from matching the -unauth variant.
      testIgnore: [/global\.setup\.ts/, /demo-route-protection\.spec\.ts$/],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'global setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'demo-user',
      testMatch: /demo-route-protection\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.clerk/demo.json',
      },
      dependencies: ['global setup'],
    },
    {
      name: 'norole-user',
      testMatch: /demo-route-protection\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.clerk/norole.json',
      },
      dependencies: ['global setup'],
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000/sign-in',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
