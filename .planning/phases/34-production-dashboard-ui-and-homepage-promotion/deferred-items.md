# Phase 34 Deferred Items

## Pre-existing issues (not introduced by plan 34-07)

### Build failure: @aws-sdk/client-s3 missing
- **File:** `src/actions/import.ts` (via `read-excel-file/node` → `unzipper` → `@aws-sdk/client-s3`)
- **Error:** `Module not found: Can't resolve '@aws-sdk/client-s3'` in Turbopack build
- **Status:** Pre-existing at base commit `85c6e3e`. Not introduced by plan 34-07.
- **Impact:** `npm run build` fails but `npm run dev` works. Tests pass.
- **Resolution needed:** Either install `@aws-sdk/client-s3` or configure Next.js to externalize the `unzipper` package from the client/edge bundle.

### Settings page test failures
- **File:** `src/app/settings/__tests__/page.test.tsx`
- **Error:** Missing ClerkProvider in test environment
- **Status:** Pre-existing. Not introduced by plan 34-07.

## UAT retest cosmetic notes (2026-05-14)

### Search box on `/` is slightly small
- **File:** `src/components/ProductionDashboard.tsx` (search input around line 217-223)
- **Observation:** T3 retest passed (URL syncing works), but the operator noted the search box feels small for the dashboard.
- **Status:** Non-blocking. Visual polish — candidate for a styling tweak (wider input or larger min-width) in a follow-up UI pass.

### `e2e-demo` user should not carry `mill_operator` powers
- **Surfaced by:** Phase 34 T11b retest, 2026-05-14.
- **Current state:** `e2e-demo+clerk_test@example.com` has `publicMetadata.roles: ['demo', 'mill_operator']` per Phase 31 D-13 (`docs/clerk-setup.md:37,54-58`). The dual-role fixture was added intentionally to give positive coverage of multi-role users (the `checkRole` chain handles arrays correctly).
- **Operator's preference:** Demo user should be a viewer-only fixture (no `mill_operator` capability).
- **Impact if changed:**
  - Phase 31 D-13 design contract needs amendment (or deprecation of dual-role coverage).
  - `docs/clerk-setup.md` user table must be updated.
  - Clerk Dashboard `publicMetadata.roles` for `e2e-demo` needs to be updated to `['demo']` only.
  - Any test that relied on dual-role coverage (currently: Phase 34 T11b, plus any unit test that fixtures `roles: ['demo', 'mill_operator']`) must be re-evaluated — we may want to create a new `e2e-multirole+clerk_test@example.com` fixture instead so multi-role behavior remains tested without conflating it with the demo role.
- **Status:** Non-blocking for Phase 34 (the RBAC code is correct either way). Route via `/gsd-thread` or a new quick task — not Phase 34 scope.
