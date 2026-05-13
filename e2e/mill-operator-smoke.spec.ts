import { test, expect } from '@playwright/test';

/**
 * Mill-Operator Edit-Mode Smoke (Phase 31, AUTH-04)
 *
 * Scope: Verifies that a Clerk user whose `publicMetadata.roles` array contains
 * `'mill_operator'` (D-12 user) authenticates via the persisted storageState,
 * lands on `/` WITHOUT redirect (per D-01 / D-05 — `/` is open to any
 * authenticated user), and that the page renders the `<MillReadOnlyStub>`
 * mode indicator with `data-mode="edit"` and the literal text "Edit mode".
 *
 * Why a single-test spec:
 * - This is the cheapest end-to-end proof that D-12 (new mill-operator user)
 *   and D-14 (auth-mill-operator Playwright project) wired correctly. Branch
 *   coverage for the read-only path is owned by Plan 31-04's Jest unit tests
 *   on `src/app/page.test.tsx`; the E2E layer's job is the integration proof
 *   (Clerk JWT → checkRole → rendered data-mode).
 *
 * Project scoping:
 * - This spec runs ONLY under the `auth-mill-operator` project (see
 *   `playwright.config.ts` — `testMatch: /mill-operator-smoke\.spec\.ts$/`).
 *   No `test.skip(testInfo.project.name !== ...)` guard is needed because the
 *   project's testMatch already scopes the file.
 * - The mill-operator-smoke spec is also added to the `chromium` project's
 *   `testIgnore` to prevent unauthenticated runs.
 *
 * Wave-1 execution status:
 * - This spec is intentionally un-runnable end-to-end during Wave 1. It
 *   compiles, lints, and is discoverable by Playwright, but it depends on:
 *     (a) Plan 31-04 landing `<MillReadOnlyStub>` with the data-testid markers;
 *     (b) Plan 31-05 creating the Clerk mill-operator user and populating
 *         E2E_MILL_OPERATOR_USER_{EMAIL,PASSWORD} in `.env.local`.
 *   The dynamic execution is the verification gate of Plan 31-05.
 * - Phase 32+ broadens E2E coverage as state transitions land.
 */

test.describe('Mill operator role — edit mode smoke', () => {
  test('mill-operator user sees edit mode on /', async ({ page }) => {
    // `/` is open to any authenticated user per D-01 / D-05; the mill-operator
    // storageState satisfies the auth gate without role-level redirect.
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // <MillReadOnlyStub> (Plan 31-04) renders the mode-indicator <p> with
    // data-testid="mill-mode" and data-mode={canEdit ? 'edit' : 'read-only'}.
    // For a user whose roles array contains 'mill_operator', canEdit === true.
    const mode = page.getByTestId('mill-mode');
    await expect(mode).toHaveAttribute('data-mode', 'edit');
    await expect(mode).toContainText('Edit mode');
  });
});
