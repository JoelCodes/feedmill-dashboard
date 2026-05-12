// PROT-03 / D-11 #4: Unauthenticated user accessing /demo/* redirects to /sign-in. Runs under the chromium Playwright project (no storageState).

import { test, expect } from '@playwright/test';

const demoRoutes = ['/demo/orders', '/demo/customers', '/demo/mill-production'] as const;

test.describe('PROT-03: Unauthenticated user accessing /demo/* redirects to sign-in', () => {
  for (const route of demoRoutes) {
    test(`unauthenticated user accessing ${route} redirects to sign-in`, async ({ page }) => {
      // Navigate to demo route without authentication
      await page.goto(route);

      // Verify redirect to sign-in page (regex handles query params)
      // Clerk middleware protects all non-public routes first
      await expect(page).toHaveURL(/\/sign-in/);
    });
  }
});
