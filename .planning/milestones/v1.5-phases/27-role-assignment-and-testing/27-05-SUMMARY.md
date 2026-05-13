---
phase: 27-role-assignment-and-testing
plan: 05
subsystem: testing/e2e
tags: [playwright, clerk-testing, e2e, fixtures, storage-state, uat, rbac]
requires:
  - 27-01  # checkRole / requireRole utilities (server-side reads sessionClaims)
  - 27-02  # middleware sessionClaims-based enforcement
  - 27-03  # docs/clerk-setup.md, .env.example, .gitignore for playwright/.clerk/
  - 27-04  # JWT template active + 3 test users + .env.local populated (operator)
provides:
  - e2e/global.setup.ts                          # Clerk per-role authentication setup
  - playwright.config.ts (global setup, demo-user, norole-user projects)
  - e2e/demo-route-protection-unauth.spec.ts     # PROT-03 unauth regression
  - e2e/demo-route-protection.spec.ts            # ACCESS-02 #1/#2/#3 authenticated scenarios
  - playwright/.clerk/{demo,norole,admin}.json   # persisted storage state (gitignored, generated at runtime)
affects:
  - e2e/demo-route-protection.spec.ts            # split + rewritten
tech-stack:
  added: []                                       # all deps already installed (@clerk/testing@2.0.27, @playwright/test@1.59.1)
  patterns:
    - "Playwright global setup with serial sign-in for @clerk/testing concurrency safety (RESEARCH §Pitfall 6)"
    - "Per-project storageState pattern (one Playwright project per role, no in-spec clerk.signIn)"
    - "Anchored testMatch/testIgnore regex (/spec\\.ts$/) to disambiguate -unauth variant from authenticated spec"
    - "Project-conditional runtime test.skip(testInfo.project.name !== '<expected>', reason) for role-asymmetric tests sharing a single spec file across multiple projects"
key-files:
  created:
    - e2e/global.setup.ts
    - e2e/demo-route-protection-unauth.spec.ts
  modified:
    - playwright.config.ts
    - e2e/demo-route-protection.spec.ts
    - .planning/phases/27-role-assignment-and-testing/deferred-items.md
decisions:
  - "Authoring style: setup loop generating three `authenticate <role>` steps (RESEARCH Pattern 4 canonical shape) instead of three explicit calls; runtime behavior matches plan intent (three setup steps), grep count diverges from a literal acceptance criterion."
  - "Role-asymmetric tests use runtime test.skip(testInfo.project.name !== '...', reason) — Rule 1 deviation: without this, ACCESS-02 #1 would fail under norole-user and ACCESS-01/#2 would fail under demo-user because the single spec file runs once per Playwright project."
metrics:
  duration_seconds: 583
  duration_human: "~10 min"
  completed: "2026-05-12"
  tasks_completed: 5
  tasks_pending_human: 1  # Task 6 UAT
  commits: 5
  files_created: 2
  files_modified: 3
  e2e_tests_passed: 20
  e2e_tests_skipped: 4   # project-conditional skips for role-asymmetric specs
---

# Phase 27 Plan 05: Playwright @clerk/testing E2E + D-11 Scenarios Summary

Wired `@clerk/testing` into Playwright via a serial global-setup project that signs in all three test users (demo, norole, admin) and persists their session storage state; extended `playwright.config.ts` with three new projects and narrowed the existing `chromium` project; split `e2e/demo-route-protection.spec.ts` so authenticated scenarios run under per-role projects and the unauthenticated regression stays under `chromium`; added three new ACCESS-02 describe blocks proving D-11 scenarios #1/#2/#3 end-to-end. Full suite runs green (20 passed, 4 project-conditional skips, 0 failed).

## Per-Task Execution

| Task | Name | Commit | Outcome |
|------|------|--------|---------|
| 1 | Create `e2e/global.setup.ts` — clerkSetup + per-role authentication | `ab8eb3f` | Done. Imports `clerk`, `clerkSetup` from `@clerk/testing/playwright`; serial-mode describe; three setup steps generated via for-loop (one per role); fails loud with `docs/clerk-setup.md` reference on missing env. |
| 2 | Extend `playwright.config.ts` — global setup, demo-user, norole-user projects + narrowed chromium | `9ab048d` | Done. Three new projects appended; chromium `testIgnore` uses anchored regex `/demo-route-protection\.spec\.ts$/` so the `-unauth` variant still runs under chromium. |
| 3 | Split `e2e/demo-route-protection.spec.ts` — extract PROT-03 to `-unauth` file | `58ba049` | Done. New file holds PROT-03 with extended `demoRoutes` (`/demo/mill-production` added per D-11 #4). Original file retains ACCESS-01 skipped test (Task 4 unskips). |
| 4 | Add D-11 authenticated scenarios + unskip ACCESS-01 | `a902e9d` | Done. Three describe blocks: `ACCESS-01 / ACCESS-02 #2` (norole redirect), `ACCESS-02 #1` (demo access), `ACCESS-02 #3` (settings access for both auth users). Project-conditional `test.skip` inside each role-asymmetric test. |
| 5 | Run full Playwright suite + confirm green | (no commit — verification) | Done. 20 passed, 4 skipped (project-conditional), 0 failed. Storage state files generated at `playwright/.clerk/{demo,norole,admin}.json` and confirmed gitignored. Pre-existing items logged to `deferred-items.md` (`e3eb34e`). |
| 6 | Manual UAT checkpoint (D-15) | (pending operator) | Awaiting `verified` resume-signal — see `## D-15 UAT Checklist` below. |

## D-11 Scenario Coverage

| # | Scenario | Project(s) | Result |
|---|----------|-----------|--------|
| 1 | Demo user accesses `/demo/orders`, `/demo/customers`, `/demo/mill-production` | `demo-user` | 3/3 passed |
| 2 | Non-demo (norole) user is redirected to `/` from each `/demo/*` route | `norole-user` | 1/1 passed (parameterized loop) |
| 3 | Both demo and norole users can access `/settings` | `demo-user`, `norole-user` | 2/2 passed (once per project) |
| 4 | Unauthenticated user accessing `/demo/*` redirects to `/sign-in` | `chromium` | 3/3 passed |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Role-asymmetric test correctness] Added project-conditional `test.skip` to role-asymmetric tests**

- **Found during:** Task 4 (spec authoring) — would have surfaced as test failures during Task 5 had the skip not been added.
- **Issue:** The plan's locked test layout has a single spec file (`e2e/demo-route-protection.spec.ts`) running under BOTH `demo-user` and `norole-user` Playwright projects. The plan's `ACCESS-02 #1` test (demo accesses /demo/*) asserts `toHaveURL(route)`, which is true ONLY under the demo-user project — under norole-user the user is redirected to `/`. The mirror is true for `ACCESS-01 / ACCESS-02 #2` (norole redirected to `/`), which holds only under norole-user. Without a guard, both would fail under the wrong project.
- **Fix:** Added `test.skip(testInfo.project.name !== '<expected>', reason)` at the top of each role-asymmetric test body. The Playwright runtime skips the test cleanly under the wrong project. This is the canonical pattern for project-conditional behavior and is what `playwright/.clerk/<role>.json` storage state implies.
- **Files modified:** `e2e/demo-route-protection.spec.ts`
- **Commit:** `a902e9d`

**2. [Rule 3 — Blocking issue] Cleared stale `.next` and started a fresh dev server before E2E run**

- **Found during:** Task 5 first attempt.
- **Issue:** A long-running dev server had cached a build error from a Tailwind v4 content-scanner false positive — the literal `text-[var(--text-&ast;)]` from `.planning/milestones/v1.3-phases/18-page-migration/18-UI-REVIEW.md` was compiled into a malformed CSS rule, and the dev server stayed in the error state across page requests. `clerk.signIn` timed out at `page.waitForFunction(() => window.Clerk?.loaded)` because the Build Error overlay prevented Clerk from hydrating.
- **Fix:** Killed all running dev-server processes on port 3000, `rm -rf .next`, ran a fresh `npm run dev` (background). The first compile after the cache clear produced clean output and `/sign-in` returned HTTP 200 with the Clerk login UI.
- **Files modified:** None (purely an environmental reset).
- **Note:** The underlying Tailwind cache-state behavior is pre-existing — logged as item 4 in `deferred-items.md` for a future hygiene plan.

**3. [Rule 3 — Blocking issue] Overrode `PLAYWRIGHT_BASE_URL` to `http://localhost:3000` for the suite run**

- **Found during:** Task 5 first attempt.
- **Issue:** `.env.local` contained `PLAYWRIGHT_BASE_URL=https://feedmill-dashboard.vercel.app` (added in v1.4 for `production-smoke.spec.ts`). With this env var set, `playwright.config.ts` defaults all projects to the production deployment AND skips the local `webServer` block. The new `demo-user` / `norole-user` / `chromium` projects then ran against the deployed app, which does not have Plan 27-02's `sessionClaims`-based middleware yet — causing the norole-redirect test to fail because the production middleware still redirects based on the old `clerkClient.getUser()` path.
- **Fix:** Re-ran with explicit shell override: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project='global setup' --project='demo-user' --project='norole-user' --project='chromium'`. Shell env wins over dotenv injection (dotenv default `override: false`).
- **Files modified:** None (test invocation only).
- **Note:** The env-var leak is pre-existing — logged as item 5 in `deferred-items.md` for a future hygiene plan (proper fix: namespace to `PRODUCTION_BASE_URL` or move out of `.env.local`).

**4. [Rule 3 — Blocking issue] Symlinked `.env.local` into the worktree**

- **Found during:** Task 2 verification.
- **Issue:** `playwright.config.ts` loads `dotenv` from `path.resolve(__dirname, '.env.local')`, which resolves to the worktree's own `.env.local`. The main repo had `.env.local` (with the six `E2E_*` keys populated by operator-completed Plan 27-04), but the worktree did not — so `process.env.E2E_DEMO_USER_EMAIL` etc. were unset.
- **Fix:** `ln -sfn /Users/joel/Desktop/Projects/cgm-dashboard/.env.local .env.local` inside the worktree. The symlink is excluded by `.gitignore` (`.env*` rule), so no leak into git.
- **Files modified:** None (filesystem-level symlink, not in git).
- **Note:** This is a worktree-mode-specific issue. A permanent fix would be to share `.env.local` via a config-resolved absolute path, but that's out of scope.

### Plan-Acceptance Notes

**Authoring style deviation (not a correctness issue, just a literal-grep mismatch):** The plan's Task 1 acceptance criterion `grep -cF "setup('authenticate" e2e/global.setup.ts` expecting `>=3` assumes three explicit `setup('authenticate demo', ...)`, `setup('authenticate norole', ...)`, `setup('authenticate admin', ...)` calls. RESEARCH §Pattern 4 (the canonical github.com/clerk/clerk-playwright-nextjs shape, which the plan also cites verbatim) uses a `for ... of Object.entries(roles)` loop instead. I followed RESEARCH Pattern 4 for DRY symmetry; the runtime behavior is identical (three setup steps generated, visible in `npx playwright test --list`: `authenticate demo`, `authenticate norole`, `authenticate admin`). The literal grep returns 1 (the loop's template literal) instead of 3, but no acceptance criterion that matters at runtime is violated.

**`npx tsc --noEmit` exit code:** The plan's acceptance criteria for Tasks 1, 2, 3, 4 each say `npx tsc --noEmit exits zero`. The project has 21 pre-existing tsc errors in test fixtures (drifted mock data — `customerId` / `activeBins` / regex es2018 flag — logged in `deferred-items.md` items 3). My new files (`e2e/global.setup.ts`, `e2e/demo-route-protection-unauth.spec.ts`, updated `e2e/demo-route-protection.spec.ts`, updated `playwright.config.ts`) introduce **zero** new tsc errors. The strict literal "exit zero" is not achievable without addressing the pre-existing tsc cleanup, which is explicitly out of scope.

### Authentication Gates

Plan 27-04 (operator-completed before this plan started) handled the only auth gate: populating `.env.local` with six `E2E_*` keys and assigning roles in the Clerk Dashboard. During Plan 27-05 execution, the runtime auth via `clerk.signIn` succeeded once the dev server was clean and the base URL pointed at localhost (see auto-fix #2 and #3 above).

## D-15 UAT Checklist (Awaiting Operator)

With the dev server running at `http://localhost:3000`, perform each row in this checklist in a real browser. Each row must match the documented expectation exactly.

| # | Sign in as | Navigate to | Expected URL after settle | Expected page content |
|---|------------|-------------|---------------------------|----------------------|
| 1 | `e2e-demo+clerk_test@example.com` | `/demo/orders` | `/demo/orders` | Orders demo page renders, no redirect flash |
| 2 | `e2e-demo+clerk_test@example.com` | `/demo/customers` | `/demo/customers` | Customers demo page renders |
| 3 | `e2e-demo+clerk_test@example.com` | `/demo/mill-production` | `/demo/mill-production` | Mill production demo page renders |
| 4 | `e2e-demo+clerk_test@example.com` | `/settings` | `/settings` | Settings page renders |
| 5 | `e2e-norole+clerk_test@example.com` | `/demo/orders` | `/` | Coming Soon homepage renders |
| 6 | `e2e-norole+clerk_test@example.com` | `/demo/customers` | `/` | Coming Soon homepage renders |
| 7 | `e2e-norole+clerk_test@example.com` | `/demo/mill-production` | `/` | Coming Soon homepage renders |
| 8 | `e2e-norole+clerk_test@example.com` | `/settings` | `/settings` | Settings page renders (D-07 from Phase 26: settings always accessible) |
| 9 | `e2e-admin+clerk_test@example.com` | `/demo/orders` | `/` | Coming Soon homepage renders (admin does NOT have demo role; same redirect as norole) |
| 10 | `e2e-admin+clerk_test@example.com` | `/settings` | `/settings` | Settings page renders |
| 11 | (signed out, incognito) | `/demo/orders` | `/sign-in...` (with query param `?redirect_url=...` from Clerk) | Clerk sign-in page renders |

Between users, sign out from the Clerk UserButton in the Header. Clerk issues a fresh JWT on each sign-in with the `metadata.role` claim from Plan 27-04's JWT template.

**Resume signal:** Reply `verified` if all 11 rows pass. If any row fails, describe the row number, observed vs expected URL, and observed page content — the agent can triage from there (common triage paths are documented in the plan's `<resume-signal>` block).

## Test Plan

- [x] `npx playwright test --list` enumerates `global setup` (4 steps) + `demo-user` (5 entries) + `norole-user` (5 entries) + `chromium` (10 entries including the new `-unauth` spec).
- [x] `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project='global setup' --project='demo-user' --project='norole-user' --project='chromium'` exits zero.
- [x] 20 tests passed (4 D-11 scenarios + chromium PROT-01/PROT-02 regression + chromium PROT-03 regression + chromium production-smoke), 4 skipped (project-conditional), 0 failed.
- [x] `playwright/.clerk/{demo,norole,admin}.json` files exist on disk after the run.
- [x] `git check-ignore -q playwright/.clerk/<role>.json` exits zero (gitignored).
- [x] Unit suite regression: 14 pre-existing failures persist; 0 new failures introduced (verified at base commit `526f7d9`).
- [ ] D-15 manual UAT: 11 rows confirmed by operator.

## Known Stubs

None — all task implementations are wired to live infrastructure (Clerk dev instance + populated `.env.local` + real test users from Plan 27-04). No placeholder values feed into the test output.

## Threat Flags

No new threat surface introduced beyond what the `<threat_model>` in `27-05-PLAN.md` already enumerates (T-27-16 through T-27-20, all `mitigate` disposition). The implementation honors all five mitigations:

- **T-27-16** (storage-state leakage): `playwright/.clerk/` already in `.gitignore` from Plan 27-03; `git check-ignore` verification passed during Task 5.
- **T-27-17** (test cred spoofing): accept disposition — bounded to dev instance, `+clerk_test` mailbox.
- **T-27-18** (concurrency DoS): `setup.describe.configure({ mode: 'serial' })` enforced in `e2e/global.setup.ts:24`; per-test projects use `dependencies: ['global setup']` (verified in `playwright.config.ts`).
- **T-27-19** (in-spec sign-in drift): `grep -F "clerk.signIn" e2e/demo-route-protection.spec.ts` returns 0 matches (Task 4 acceptance verified). Tests rely on project-level storageState only.
- **T-27-20** (UAT failure repudiation): Task 6 resume-signal explicitly asks operator to record failing row + observed vs expected outcome (see "## D-15 UAT Checklist" above).

## Self-Check: PASSED

- e2e/global.setup.ts — FOUND
- e2e/demo-route-protection-unauth.spec.ts — FOUND
- e2e/demo-route-protection.spec.ts — modified (FOUND)
- playwright.config.ts — modified (FOUND)
- .planning/phases/27-role-assignment-and-testing/deferred-items.md — updated (FOUND)
- Commits: ab8eb3f, 9ab048d, 58ba049, a902e9d, e3eb34e — all FOUND in git log
- Storage state files: playwright/.clerk/{demo,norole,admin}.json — FOUND on disk, GITIGNORED
- 20 E2E tests passed, 4 skipped, 0 failed
