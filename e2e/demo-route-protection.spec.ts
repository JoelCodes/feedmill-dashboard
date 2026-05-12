import { test, expect } from '@playwright/test';

// Authenticated demo-route protection scenarios per D-11 (#1, #2, #3). Runs under demo-user and norole-user Playwright projects (storageState supplied at project level). Unauthenticated regression (D-11 #4) lives in demo-route-protection-unauth.spec.ts.

/**
 * Demo Route Protection E2E Tests (authenticated scenarios)
 *
 * Verifies ACCESS-02 end-to-end:
 *   #1 demo user can access /demo/{orders,customers,mill-production}
 *   #2 non-demo (norole) user is redirected from /demo/* to /
 *   #3 both demo and norole users can access /settings
 *
 * Each test runs once per Playwright project (demo-user, norole-user); the
 * project-level storageState supplies the authenticated cookies, so the test
 * bodies just navigate and assert URLs — no in-spec sign-in needed.
 *
 * Rule 1 deviation (Plan 27-05): the planner's locked test layout makes the
 * single spec file run under BOTH demo-user and norole-user projects. Tests
 * #1 and #2 are role-asymmetric (a demo user should NOT redirect from /demo/*,
 * but a norole user SHOULD). We use `test.skip(testInfo.project.name === '…')`
 * inside each role-asymmetric test so the assertion only fires under the
 * project where the expected behavior is correct. Without this guard, ACCESS-02
 * #1 would fail under norole-user and ACCESS-01/#2 would fail under demo-user.
 */

const demoRoutes = ['/demo/orders', '/demo/customers', '/demo/mill-production'] as const;

test.describe('Demo Route Protection', () => {
  test.describe('ACCESS-01 / ACCESS-02 #2: Authenticated user without demo role redirected to root', () => {
    test('authenticated user without demo role is redirected to root', async ({ page }, testInfo) => {
      // Only meaningful under norole-user (the demo user is NOT redirected).
      test.skip(
        testInfo.project.name !== 'norole-user',
        `ACCESS-02 #2 asserts no-role redirect; skipped under project '${testInfo.project.name}' where the demo role would NOT redirect.`,
      );
      for (const route of demoRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/');
      }
    });
  });

  test.describe('ACCESS-02 #1: Demo user accesses /demo/* routes successfully', () => {
    // Runs under the demo-user Playwright project (storageState = playwright/.clerk/demo.json)
    for (const route of demoRoutes) {
      test(`demo user accesses ${route} without redirect`, async ({ page }, testInfo) => {
        test.skip(
          testInfo.project.name !== 'demo-user',
          `ACCESS-02 #1 asserts demo-user access; skipped under project '${testInfo.project.name}' where the role would be redirected.`,
        );
        await page.goto(route);
        await expect(page).toHaveURL(route);
      });
    }
  });

  test.describe('ACCESS-02 #3: Both demo and norole users can access /settings', () => {
    // Runs under both demo-user and norole-user projects; settings is accessible to all authenticated users (Phase 26 D-07).
    test('authenticated user can access /settings regardless of role', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL('/settings');
    });
  });
});
