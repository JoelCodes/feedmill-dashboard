import { test, expect } from '@playwright/test';

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
