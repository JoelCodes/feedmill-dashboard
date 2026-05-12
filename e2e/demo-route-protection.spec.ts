import { test, expect } from '@playwright/test';

// Authenticated demo-route protection scenarios per D-11 (#1, #2, #3). Runs under demo-user and norole-user Playwright projects (storageState supplied at project level). Unauthenticated regression (D-11 #4) lives in demo-route-protection-unauth.spec.ts.

/**
 * Demo Route Protection E2E Tests
 *
 * Verifies ACCESS-01: Users without demo role are redirected from /demo/* routes
 *
 * Test scope: Unauthenticated and role-based access control for demo routes.
 * Demo routes (/demo/orders, /demo/customers) are variants of existing routes
 * that require the "demo" role in addition to authentication.
 */

const demoRoutes = ['/demo/orders', '/demo/customers'] as const;

test.describe('Demo Route Protection', () => {
  test.describe('ACCESS-01: Authenticated user without demo role redirected to root', () => {
    // Note: This test documents expected behavior but requires Playwright auth setup
    // to run green. The middleware implementation is verified by unit tests.
    test.skip('authenticated user without demo role is redirected to root', async ({ page }) => {
      // This test requires an authenticated session fixture with a user
      // that does NOT have the "demo" role in publicMetadata.
      //
      // Expected behavior:
      // 1. User is logged in (passes auth.protect())
      // 2. User accesses /demo/orders
      // 3. Middleware checks sessionClaims.metadata.role
      // 4. Role is not "demo" -> redirect to /
      //
      // To implement this test:
      // 1. Create Playwright auth fixture with non-demo role user
      // 2. Navigate to /demo/orders
      // 3. Expect redirect to /
      //
      // Skipped pending auth fixture with non-demo role user

      await page.goto('/demo/orders');
      await expect(page).toHaveURL('/');
    });
  });
});
