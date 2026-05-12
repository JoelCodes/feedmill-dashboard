import { test, expect } from '@playwright/test';

/**
 * Route Protection E2E Tests
 *
 * Verifies PROT-01: Unauthenticated users are redirected to sign-in page
 * Verifies PROT-02: All dashboard pages require authentication
 *
 * Test scope (per D-04, D-05): Unauthenticated redirect behavior only,
 * success criteria routes only (/orders, /customers, /mill-production, /settings)
 */

const protectedRoutes = [
  '/demo/orders',
  '/demo/customers',
  '/demo/mill-production',
  '/settings',
] as const;

test.describe('Route Protection', () => {
  test.describe('PROT-01: Unauthenticated redirect to sign-in', () => {
    for (const route of protectedRoutes) {
      test(`unauthenticated user accessing ${route} redirects to sign-in`, async ({ page }) => {
        // Navigate to protected route without authentication
        await page.goto(route);

        // Verify redirect to sign-in page (regex handles query params)
        await expect(page).toHaveURL(/\/sign-in/);
      });
    }
  });

  test.describe('PROT-02: Return URL preservation (D-06)', () => {
    test('return URL is preserved after redirect from /orders', async ({ page }) => {
      // Navigate to protected route
      await page.goto('/demo/orders');

      // Wait for redirect to complete
      await expect(page).toHaveURL(/\/sign-in/);

      // Verify returnBackUrl query parameter contains original path
      const url = new URL(page.url());
      const returnBackUrl = url.searchParams.get('redirect_url');

      // Clerk uses redirect_url parameter (not returnBackUrl)
      // The URL-encoded path should contain /demo/orders
      expect(returnBackUrl).toContain('/demo/orders');
    });
  });
});
