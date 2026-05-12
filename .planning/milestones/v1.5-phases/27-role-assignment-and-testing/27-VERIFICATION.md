---
phase: 27-role-assignment-and-testing
verified: 2026-05-11T00:00:00Z
status: passed
score: 4/4 success criteria + 1/1 requirement verified
overrides_applied: 0
re_verification:
  previous_status: null
  note: "Initial verification; no prior VERIFICATION.md present"
---

# Phase 27: Role Assignment and Testing — Verification Report

**Phase Goal:** Role-based access control is enforced and verified end-to-end
**Requirement:** ACCESS-02
**Verified:** 2026-05-11
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

Phase 27 delivers ACCESS-02 (`checkRole()` / `requireRole()` for server components) and the operational glue that makes RBAC enforceable against real users in a Clerk dev instance. Goal-backward verification confirms each of the four ROADMAP success criteria maps to concrete code + a passing test + the underlying primitives required to enforce it at runtime.

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Users with demo role can access all /demo/* pages without redirects | VERIFIED | `src/middleware.ts:35` reads `sessionClaims?.metadata?.role !== 'demo'` and only redirects when the claim doesn't match; demo route matcher `'/demo(.*)'` at `src/middleware.ts:17`; Phase 26 mounted `/demo/{orders,customers,mill-production}` (verified by `ls src/app/demo/` → `customers/ mill-production/ orders/`); E2E spec `e2e/demo-route-protection.spec.ts` ACCESS-02 #1 asserts `toHaveURL(route)` for all three demo routes under the `demo-user` Playwright project (20-passed E2E run recorded in 27-05-SUMMARY); D-15 UAT rows 1-3 signed off (commit `4b78452`) |
| SC-2 | Users without demo role are redirected to root when attempting to access /demo/* pages | VERIFIED | `src/middleware.ts:35-38` — `if (sessionClaims?.metadata?.role !== 'demo') return NextResponse.redirect(new URL('/', request.url))`; ACCESS-02 #2 E2E describe block at `e2e/demo-route-protection.spec.ts:29-41` asserts `toHaveURL('/')` for each demo route under `norole-user` project; D-15 UAT rows 5-7 signed off |
| SC-3 | Server components can check roles programmatically using utility functions | VERIFIED | `src/lib/auth.ts:38-41` exports `checkRole(role: Role): Promise<boolean>` reading `(await auth()).sessionClaims?.metadata?.role`; `src/lib/auth.ts:67-75` exports `requireRole(role: Role): Promise<void>` with `redirect('/sign-in')` on missing userId and `redirect('/')` on role mismatch; module-level JSDoc documents server-only constraint; 8/8 unit tests pass (`npx jest src/lib/auth.test.ts`) |
| SC-4 | All users regardless of role can access /settings page | VERIFIED | `/settings` is NOT in `isDemoRoute = createRouteMatcher(['/demo(.*)'])` (`src/middleware.ts:17`); no `settings` substring appears in any `createRouteMatcher(...)` call (`grep -E "createRouteMatcher\(\[[^]]*settings" src/middleware.ts` → 0 matches); no `requireRole`/`checkRole` guards in `src/app/settings/`; only the generic `auth.protect()` applies — any authenticated user can reach `/settings`; ACCESS-02 #3 E2E asserts `toHaveURL('/settings')` under BOTH `demo-user` AND `norole-user` projects (`e2e/demo-route-protection.spec.ts:57-63`); D-15 UAT rows 4, 8, 10 signed off (demo, norole, AND admin can all reach /settings); unit-level invariant locked at `src/middleware.test.ts:159` via `expect(middlewareContent).not.toMatch(/isDemoRoute[\s\S]*settings/i)` |

**Score:** 4/4 success criteria verified.

### Required Artifacts

Three-level check: Level 1 (exists), Level 2 (substantive), Level 3 (wired), Level 4 (data flows).

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/auth.ts` | Exports `checkRole` + `requireRole` reading sessionClaims | VERIFIED | Exists, 75 LOC, two exported async functions with JSDoc; imports `auth` from `@clerk/nextjs/server`, `redirect` from `next/navigation`, `Role` from `@/types/clerk`; no `clerkClient` import; sessionClaims read pattern matches D-02/D-03; flows data from verified JWT via `await auth()` |
| `src/lib/auth.test.ts` | 8 unit cases per D-08 | VERIFIED | Exists, 90 LOC; `describe('checkRole')` has 5 cases, `describe('requireRole')` has 3 cases; sentinel-throw redirect mock; `npx jest src/lib/auth.test.ts` → **8 passed, 8 total** |
| `src/middleware.ts` | Migrated to `sessionClaims?.metadata?.role`; no `clerkClient` import | VERIFIED | Exists, 54 LOC; imports `{ clerkMiddleware, createRouteMatcher }` (clerkClient dropped); `Role` import dropped; `const { userId, sessionClaims } = await auth()` at line 29; role guard at line 35; demo matcher `/demo(.*)` retained; `auth.protect()` retained |
| `src/middleware.test.ts` | Source-string assertions match new shape | VERIFIED | 13 tests pass (`npx jest src/middleware.test.ts` → **13 passed, 13 total**); demo-route describe block renamed to "via sessionClaims" (line 140); positive `toContain("sessionClaims")` + `toContain("metadata")`; negative `.not.toContain("clerkClient")` + `.not.toContain("publicMetadata")` (lines 148-152); SC#4 invariant locked at line 159 |
| `e2e/global.setup.ts` | Authenticates 3 roles via @clerk/testing, persists storage state | VERIFIED | Exists, 79 LOC; imports `{ clerk, clerkSetup }` from `@clerk/testing/playwright`; `setup.describe.configure({ mode: 'serial' })` at line 24 (Pitfall 6 mitigation); `await clerkSetup()` in first step; for-loop generates `authenticate demo`, `authenticate norole`, `authenticate admin` steps; `page.goto('/sign-in')` precedes `clerk.signIn` (Pitfall 3); fail-loud env-var check with runbook reference; `setupClerkTestingToken` anti-pattern absent |
| `e2e/demo-route-protection.spec.ts` | Authenticated D-11 #1/#2/#3 scenarios | VERIFIED | Three describe blocks: `ACCESS-01 / ACCESS-02 #2` (norole redirect), `ACCESS-02 #1` (demo access), `ACCESS-02 #3` (settings access); `demoRoutes` extended to include `/demo/mill-production`; no `clerk.signIn` in spec (project-level storageState pattern); `.skip()` removed from ACCESS-01 test (D-10); runtime-conditional `test.skip(testInfo.project.name !== '...')` guards role-asymmetric tests across the dual-project mount |
| `e2e/demo-route-protection-unauth.spec.ts` | PROT-03 D-11 #4 regression under chromium | VERIFIED | Exists, 18 LOC; PROT-03 describe block with `demoRoutes` including `/demo/mill-production`; asserts `toHaveURL(/\/sign-in/)` for unauthenticated access; runs under chromium project (no storageState); anchored regex `testIgnore: /demo-route-protection\.spec\.ts$/` in playwright.config.ts excludes auth spec but allows -unauth variant |
| `playwright.config.ts` | global-setup + demo-user + norole-user projects | VERIFIED | Five projects: `chromium` (narrowed via testIgnore), `production-smoke` (untouched), `global setup`, `demo-user` (storageState `playwright/.clerk/demo.json`), `norole-user` (storageState `playwright/.clerk/norole.json`); both role projects declare `dependencies: ['global setup']`; chromium `testIgnore` uses anchored `/demo-route-protection\.spec\.ts$/` so `-unauth` variant still runs under chromium |
| `docs/clerk-setup.md` | JWT template + 3 users + sign-out caveat runbook | VERIFIED | 96 lines, 8 `##` sections; JWT template JSON `{"metadata": {"role": "{{user.public_metadata.role}}"}}` present verbatim; three test user emails documented; `Sign-Out/Sign-In Propagation` section (Step 4) covers D-07; `pk_test_` constraint documented; `jwt.io` verification step present |
| `.env.example` | 6 E2E_* credential keys with empty passwords | VERIFIED | `grep -c "^E2E_" .env.example` → 6; all three `_PASSWORD` keys are blank (`E2E_..._PASSWORD=` with nothing after `=`); cross-reference to `docs/clerk-setup.md` in comment header |
| `.gitignore` | Excludes `playwright/.clerk/` | VERIFIED | Line 20: `playwright/.clerk/`; `git check-ignore -q playwright/.clerk/demo.json` exits 0 |
| `.planning/phases/27-role-assignment-and-testing/deferred-items.md` | Pre-existing issues catalogued | VERIFIED | Exists; lists 5 items (Jest scanning e2e/, settings page test, 21 tsc errors, Tailwind dev cache, PLAYWRIGHT_BASE_URL leak); all confirmed pre-existing at base commit `a78167a` / `526f7d9` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/lib/auth.ts` | `@clerk/nextjs/server` | `import { auth }` | WIRED | Line 13 |
| `src/lib/auth.ts` | `next/navigation` | `import { redirect }` | WIRED | Line 14 |
| `src/lib/auth.ts` | `@/types/clerk` | `import type { Role }` | WIRED | Line 15 |
| `src/middleware.ts` | `@clerk/nextjs/server` | `auth()` destructure of `{ userId, sessionClaims }` | WIRED | Line 29 |
| `src/middleware.ts` | role enforcement | `sessionClaims?.metadata?.role !== 'demo'` → redirect to `/` | WIRED | Line 35-38 |
| `e2e/global.setup.ts` | `@clerk/testing/playwright` | `clerk.signIn + clerkSetup` | WIRED | Lines 19, 27, 69 |
| `playwright.config.ts demo-user` | `playwright/.clerk/demo.json` | `storageState` property | WIRED | Line 50 |
| `playwright.config.ts norole-user` | `playwright/.clerk/norole.json` | `storageState` property | WIRED | Line 59 |
| `e2e/demo-route-protection.spec.ts` | middleware enforcement | real HTTP `page.goto('/demo/*')` against dev server | WIRED | Lines 36-39, 46-53 |
| `e2e/demo-route-protection-unauth.spec.ts` | chromium project | `testMatch` (anchored regex in config) | WIRED | playwright.config.ts:28 testIgnore anchored to NOT match `-unauth` |

### Decision Coverage (D-01 through D-15)

Each locked decision from `27-CONTEXT.md` is verified against the codebase:

| Decision | Description | Evidence | Status |
|----------|-------------|----------|--------|
| D-01 | Utilities live in `src/lib/auth.ts` | File exists at expected path | VERIFIED |
| D-02 | `checkRole(role): Promise<boolean>` reads `auth().sessionClaims?.metadata?.role` with no network call | `src/lib/auth.ts:38-41` matches exactly; no `clerkClient` reference | VERIFIED |
| D-03 | `requireRole(role)`: `redirect('/')` on wrong role, `redirect('/sign-in')` on missing userId | `src/lib/auth.ts:67-75` matches exactly | VERIFIED |
| D-04 | Middleware migrated to `auth().sessionClaims?.metadata?.role`; clerkClient + getUser dropped | `src/middleware.ts` has 0 `clerkClient` references; sessionClaims pattern present | VERIFIED |
| D-05 | JWT template `{"metadata": {"role": "{{user.public_metadata.role}}"}}` documented in runbook | Verbatim in `docs/clerk-setup.md:17-19` | VERIFIED |
| D-06 | No fallback to `clerkClient.getUser()` if claim missing — clean migration | No fallback path in middleware or auth.ts | VERIFIED |
| D-07 | Sign-out/sign-in caveat documented; no programmatic session revocation | `docs/clerk-setup.md` Step 4 covers this | VERIFIED |
| D-08 | Unit tests cover 8 cases via `jest.mock('@clerk/nextjs/server')` + sentinel-throw redirect | `src/lib/auth.test.ts` has 5 `checkRole` cases + 3 `requireRole` cases; 8/8 pass | VERIFIED |
| D-09 | `src/middleware.test.ts` updated for sessionClaims source | Whole-file assertions updated; SC#4 invariant locked | VERIFIED |
| D-10 | `.skip()` removed from existing demo-route-protection test | `test.skip(` only appears as runtime-conditional skips with `testInfo.project.name` — no `.skip()` on test declarations | VERIFIED |
| D-11 | Four E2E scenarios green: demo→/demo/*, norole→/, both→/settings, unauth→/sign-in | All four covered across 2 spec files; 20-passed E2E run recorded | VERIFIED |
| D-12 | Three users created in Clerk Dashboard with documented email patterns | Operator-verified per 27-04-SUMMARY; email pattern present in runbook + .env.example | VERIFIED |
| D-13 | Manual Dashboard creation (no seeding script) | Plan 27-04 was `autonomous: false` checkpoint, operator-completed | VERIFIED |
| D-14 | Six `E2E_*` credential keys in `.env.local` / `.env.example` | `.env.example` lists exactly 6 keys; operator confirmed `.env.local` populated (6 keys present locally) | VERIFIED |
| D-15 | Manual UAT signed off by operator | Commit `4b78452` marks Wave 3 complete (UAT verified); 27-05-SUMMARY Test Plan checklist marks all rows checked except the UAT row (which was completed in the subsequent docs commit) | VERIFIED |

### Behavioral Spot-Checks

Per `<verification_approach>` guidance, ran the test commands directly:

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `checkRole` + `requireRole` 8-case suite passes | `npx jest src/lib/auth.test.ts` | Test Suites: 1 passed, 1 total; Tests: 8 passed, 8 total | PASS |
| Middleware sessionClaims migration suite passes | `npx jest src/middleware.test.ts` | Test Suites: 1 passed, 1 total; Tests: 13 passed, 13 total | PASS |
| Full unit suite (excluding e2e) | `npx jest src/ --testPathIgnorePatterns='/e2e/'` | 349 passed / 14 failed (failures in `src/app/settings/__tests__/page.test.tsx` only — pre-existing per deferred-items.md item 2) | PASS (no new failures; pre-existing only) |
| E2E run (Plan 27-05 Task 5) | Recorded in 27-05-SUMMARY | 20 passed, 4 skipped (project-conditional), 0 failed | PASS (per recorded run) |
| Drift check: same role source in middleware AND utility | `grep -F "sessionClaims?.metadata?.role" src/middleware.ts src/lib/auth.ts` | Both files contain the literal pattern | PASS |
| No `clerkClient` import remains in middleware | `grep -c "clerkClient" src/middleware.ts` | 0 | PASS |
| Demo route matcher unchanged | `grep -F "'/demo(.*)'" src/middleware.ts` | 1 match | PASS |
| Settings not in any demo matcher | `grep -E "createRouteMatcher\(\[[^]]*settings" src/middleware.ts` | 0 matches | PASS |
| Storage state directory gitignored | `git check-ignore -q playwright/.clerk/demo.json; echo $?` | 0 (ignored) | PASS |

The E2E full-suite re-run was not performed in this verification (per `<verification_approach>` step 3, the recorded 27-05 run + D-15 UAT operator sign-off is trusted). E2E spec correctness was instead verified statically via grep + reading the spec source. All four D-11 scenarios are reachable in the codebase and demonstrably correct.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ACCESS-02 | 27-01, 27-02, 27-03, 27-04, 27-05 | Role utility functions (`checkRole()`, `requireRole()`) available for server components | SATISFIED | `src/lib/auth.ts` exports both functions with the locked D-02/D-03 contracts; 8 unit tests prove the contract; middleware migration (Plan 02) plus runbook + Dashboard config (Plans 03/04) plus E2E proof (Plan 05) make the contract enforceable against real users; D-15 UAT signed off |

No orphaned requirements: REQUIREMENTS.md maps ACCESS-02 to Phase 27 (the only requirement), and all 5 plans declare `requirements: [ACCESS-02]`. ACCESS-02 in REQUIREMENTS.md is still listed as `Pending` (line 23) — this is a docs-update lag, not a verification gap; the code/tests prove the requirement is satisfied. Recommend the operator flip ACCESS-02 to `[x]` in REQUIREMENTS.md alongside the milestone closeout.

### Anti-Patterns Scan

Scanned files modified in this phase (src/lib/auth.ts, src/lib/auth.test.ts, src/middleware.ts, src/middleware.test.ts, e2e/global.setup.ts, e2e/demo-route-protection.spec.ts, e2e/demo-route-protection-unauth.spec.ts, playwright.config.ts, docs/clerk-setup.md, .env.example, .gitignore):

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No `TBD` / `FIXME` / `XXX` debt markers in modified files | — | None |
| — | — | No empty implementations (`return null`, `return []` as stubs) | — | None |
| — | — | No "coming soon" / "not implemented" placeholders | — | None |
| `e2e/demo-route-protection.spec.ts` | 32, 47 | `test.skip(testInfo.project.name !== '...')` — runtime-conditional skips for role-asymmetric tests | Info | Documented Rule 1 deviation in 27-05-SUMMARY; necessary because the spec runs under BOTH demo-user and norole-user projects; the assertions only hold under their intended role. This is the canonical Playwright pattern (NOT a `.skip()` on test declaration, which D-10 explicitly removed). |

No blockers or warnings.

### Deferred (Pre-existing) Items

Per `deferred-items.md`, the following were verified pre-existing on baseline `a78167a` / `526f7d9` and are NOT caused by Phase 27 plans:

1. Jest scans `e2e/` directory (no `testPathIgnorePatterns` in jest.config.ts) — 14+ Playwright spec failures when running plain `npm test`. Recommended fix: add `testPathIgnorePatterns: ['<rootDir>/e2e/']`.
2. `src/app/settings/__tests__/page.test.tsx` fails with "ClerkLoading can only be used within the <ClerkProvider />" — test renderer missing ClerkProvider wrapper. 14 failing tests.
3. 21 `tsc` errors in test fixtures (drifted mock data: `customerId`, `activeBins`; regex es2018 flag). Zero errors in any Phase 27 file.
4. Tailwind v4 dev-server cache: `@source not "../../.planning"` doesn't recursively exclude `.planning/**/*.md`, picking up the literal `text-[var(--text-*)]` from `18-UI-REVIEW.md` into a malformed CSS rule. Cache-state dependent.
5. `.env.local` (operator) contains `PLAYWRIGHT_BASE_URL=https://feedmill-dashboard.vercel.app` from v1.4 production-smoke. Caused first E2E run to target production until shell-overridden.

All five are tracked for a future test-hygiene plan. They do not block Phase 27's goal.

### Human Verification Required

None outstanding. D-15 manual UAT was completed by the operator (Joel) during Plan 27-05 execution and signed off via commit `4b78452: docs(phase-27): mark wave 3 plan complete (UAT verified)`. The 11-row UAT checklist (covering all four D-11 scenarios plus admin-without-demo and unauthenticated control) is recorded in 27-05-SUMMARY.

### Gaps Summary

No gaps. All four ROADMAP success criteria are observably met in the codebase, the single requirement (ACCESS-02) is satisfied across utility code + middleware + E2E + Dashboard configuration + operator UAT, and all 15 locked decisions (D-01 through D-15) are reflected in the delivered artifacts.

The only follow-up items are the five pre-existing deferred-items, which are explicitly out of Phase 27 scope and tracked for a separate test-hygiene plan.

---

*Verified: 2026-05-11*
*Verifier: Claude (gsd-verifier)*
