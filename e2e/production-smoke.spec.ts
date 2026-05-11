import { test, expect } from '@playwright/test';

/**
 * Production Authentication Smoke Tests
 *
 * Verifies authentication works with live Clerk keys on production deployment.
 *
 * Per D-09: Manual smoke test first, then automated E2E for ongoing monitoring
 * Per D-10: Dedicated test user isolates test activity from real user data
 *
 * Environment variables required:
 * - CLERK_TEST_USER_EMAIL: Test user email with +clerk_test pattern
 * - CLERK_TEST_USER_PASSWORD: Test user password
 * - PLAYWRIGHT_BASE_URL: Production deployment URL
 */

test.describe('Production Authentication Smoke Tests', () => {
  test('user can sign in and access protected routes', async ({ page }) => {
    const email = process.env.CLERK_TEST_USER_EMAIL!;
    const password = process.env.CLERK_TEST_USER_PASSWORD!;

    // Navigate to sign-in page
    await page.goto('/sign-in');

    // Fill email/identifier
    await page.fill('input[name="identifier"]', email);
    await page.click('button:has-text("Continue")');

    // Fill password
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Continue")');

    // Verify redirect to dashboard after sign-in
    await expect(page).toHaveURL('/');

    // Navigate to protected route
    await page.goto('/orders');
    await expect(page).toHaveURL('/orders');

    // Verify session persists after reload
    await page.reload();
    await expect(page).toHaveURL('/orders');
  });

  test('no invalid publishable key errors in console', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors containing 'Clerk'
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Clerk')) {
        errors.push(msg.text());
      }
    });

    // Navigate to sign-in page
    await page.goto('/sign-in');

    // Wait for any async errors to appear
    await page.waitForTimeout(2000);

    // Verify no Clerk errors were logged
    expect(errors).toEqual([]);
  });
});
