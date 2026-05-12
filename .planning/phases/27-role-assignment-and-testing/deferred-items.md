# Phase 27 — Deferred Items

Out-of-scope issues discovered during plan execution. **Not** caused by the plans in this phase. Logged for later remediation.

## From 27-01 (checkRole + requireRole utility, TDD)

**Discovered:** 2026-05-12 during Task 3 (REFACTOR + full-suite regression check)

### 1. Jest picks up Playwright E2E specs (14 pre-existing test failures)

- **Files:**
  - `e2e/route-protection.spec.ts`
  - `e2e/demo-route-protection.spec.ts`
  - `e2e/production-smoke.spec.ts`
- **Symptom:** `npm test` reports 14 failures with `throwIfRunningInsideJest` from `node_modules/playwright/lib/common/testType.js:276:11`.
- **Root cause:** `jest.config.ts` has no `testPathIgnorePatterns` excluding `e2e/`. The Playwright test runner imports `@playwright/test`, which detects it's running under Jest and throws.
- **Pre-existence confirmed:** Reproduces identically at base commit `a78167a` when `src/lib/auth.*` files are temporarily removed.
- **Remediation suggestion:** Add `testPathIgnorePatterns: ['<rootDir>/e2e/']` to `jest.config.ts` (out of scope for Phase 27; track as a hygiene plan).

### 2. Settings page test failure (pre-existing)

- **File:** `src/app/settings/__tests__/page.test.tsx`
- **Pre-existence confirmed:** Fails at base commit `a78167a` with the auth files removed.
- **Scope:** Not touched by Phase 27 plans.

### 3. Pre-existing tsc errors in test fixtures (21 errors)

- **Files affected** (all `*.test.tsx` / `*.test.ts` with mock data drift):
  - `src/__tests__/design-system/theme.test.tsx` — `'capturedProps' is possibly 'null'` (TS18047) on 7 lines.
  - `src/__tests__/design-system/tokens.test.ts` — regex flag requires `target: es2018+` (TS1501) on 3 lines.
  - `src/app/demo/customers/[id]/page.test.tsx` — `() => never` to `Mock` cast issue (TS2352).
  - `src/app/demo/customers/page.test.tsx` (missing `activeBins` on `CustomerStats`)
  - `src/app/demo/orders/__tests__/page.test.tsx` (missing `customerId` on `Order`)
  - `src/components/__tests__/OrderDetails.test.tsx` (missing `customerId`)
  - `src/components/__tests__/OrdersTable.test.tsx` (missing `customerId`)
  - `src/utils/customerSort.test.ts` (missing `activeBins`)
- **Symptom:** `npx tsc --noEmit` reports 21 errors.
- **Pre-existence confirmed:** Identical count (21) at base commit `a78167a` with auth files removed. Zero errors in `src/lib/auth.ts` or `src/lib/auth.test.ts`.
- **Root cause:** Mock data shapes in test files drifted out of sync with their source types (`CustomerStats.activeBins` and `Order.customerId` were added without test mocks being updated).
- **Scope:** Mocks need updating; no production code touched.

---

## From 27-02 (middleware sessionClaims migration)

**Discovered:** 2026-05-12 during the regression-check task

Same set of pre-existing tsc errors documented above — independently confirmed by the 27-02 worktree on baseline `a78167a` with the middleware migration applied. Plan 27-02 touches only `src/middleware.ts` and `src/middleware.test.ts`; the listed errors persist with or without those changes.

---

## From 27-05 (Playwright @clerk/testing wiring + D-11 scenarios)

**Discovered:** 2026-05-12 during Task 5 (full Playwright suite run)

Items 1, 2, 3 above reproduce identically at base commit `526f7d9` — verified by `git stash --include-untracked && git checkout 526f7d9 -- . && npm test -- --testPathIgnorePatterns="e2e/"` returning the same 14-test failure count (settings page test suite, drifted mocks). Item 1's spec-count rose from 3 to 4 because Plan 27-05 added `e2e/demo-route-protection-unauth.spec.ts`, but the underlying issue (Jest scanning `e2e/`) is the same.

### 4. Tailwind v4 dev-server build cache: malformed `text-[var(--text-*)]` rule from `.planning/**/*.md`

- **File:** `src/app/globals.css:4` (`@source not "../../.planning"`) — directive does not appear to recursively exclude `.planning/**/*.md`.
- **Symptom:** A literal occurrence of `text-[var(--text-*)]` inside a Phase 18 UI review markdown (`.planning/milestones/v1.3-phases/18-page-migration/18-UI-REVIEW.md`) is picked up by Tailwind v4's content scanner and compiled into a malformed CSS rule `.text-[var(--text-*)] { color: var(--text-*); }`. LightningCSS rejects with `Unexpected token Delim('*')`. The Next.js dev server then reports `Build Error — Parsing CSS source code failed` and refuses to serve `/sign-in`. `clerk.signIn` times out at `page.waitForFunction(() => window.Clerk?.loaded)` because Clerk never hydrates on the build-error page.
- **Trigger:** Plan 27-05 Task 5 hit this when Playwright started a fresh dev server during its first run. After killing the stale dev server, clearing `.next`, and starting a clean dev server (`PLAYWRIGHT_BASE_URL= npm run dev`), the build error did NOT recur — the suite went green (20 passed, 4 skipped per project-conditional skip).
- **Workaround applied for this plan:** Killed stale dev servers, ran `rm -rf .next`, started fresh `npm run dev`, re-ran with `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test ...` to override the `.env.local` production-URL leak.
- **Suggested permanent fix:** Replace `@source not "../../.planning"` with a more aggressive glob, e.g. `@source not "../../.planning/**/*"; @source not "../../**/*.md";`. Out of scope for Phase 27.
- **Pre-existence:** The offending markdown literal in `18-UI-REVIEW.md` predates Phase 27 (v1.3 Phase 18). The Tailwind v4 content-scanning behavior is pre-existing. The build-error trigger appears latent and cache-state dependent.

### 5. `.env.local` contains `PLAYWRIGHT_BASE_URL` pointing at the production deployment

- **File:** `.env.local` (gitignored, main-repo root) contains `PLAYWRIGHT_BASE_URL=https://feedmill-dashboard.vercel.app`.
- **Symptom:** Without override, `playwright.config.ts` lines 16, 29, and 64 all default to `process.env.PLAYWRIGHT_BASE_URL`, which routes ALL Playwright projects (including the new `demo-user` and `norole-user` projects) to the production deployment. This skips the local `webServer` block and runs E2E against production middleware — which does NOT yet have Phase 27's `sessionClaims`-based role logic deployed.
- **Workaround applied for this plan:** Run with explicit override `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test ...` so the suite targets the local dev server (which has Plan 27-02's middleware changes).
- **Suggested permanent fix:** Either (a) move `PLAYWRIGHT_BASE_URL` out of `.env.local` (production-smoke can set it explicitly via shell) or (b) namespace the production URL to a dedicated `PRODUCTION_BASE_URL` and update `production-smoke.spec.ts` accordingly. Out of scope for Phase 27.
- **Pre-existence:** The env-var leak predates Phase 27 (production-smoke was the original consumer in v1.4). Phase 27 simply surfaced the conflict because it's the first phase whose E2E suite is meant to run against `localhost`.

---

**Audit trail:** All categories verified pre-existing by temporarily reverting the Phase 27 changes and re-running the failing commands — failures persist identically. None of these belong inside Phase 27 scope (role assignment); they should be addressed by a dedicated test-hygiene plan in a future milestone.
