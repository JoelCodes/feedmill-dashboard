---
phase: 21-route-protection
plan: 01
subsystem: testing/e2e
tags: [playwright, e2e-testing, route-protection, clerk]
dependency_graph:
  requires: [clerk-middleware]
  provides: [e2e-test-infrastructure, route-protection-tests]
  affects: [ci-pipeline]
tech_stack:
  added: [@playwright/test, playwright, @clerk/testing]
  patterns: [parameterized-tests, webserver-integration]
key_files:
  created:
    - playwright.config.ts
    - e2e/route-protection.spec.ts
  modified:
    - package.json
    - .gitignore
decisions:
  - "Use /sign-in for webServer health check (public route returns 200)"
  - "120s timeout for dev server startup"
  - "Check redirect_url parameter for return URL preservation"
metrics:
  duration: ~10 minutes
  completed: 2026-05-10T06:09:54Z
  tasks: 3/3
  files_created: 2
  files_modified: 2
  tests_added: 5
---

# Phase 21 Plan 01: Playwright E2E Setup Summary

Playwright E2E testing infrastructure for verifying Clerk route protection via automated browser tests.

## One-Liner

Playwright E2E setup with 5 parameterized tests verifying unauthenticated redirect to /sign-in across all protected routes.

## What Was Built

### E2E Test Infrastructure (Task 1)

Installed and configured Playwright for Next.js:

- **Dependencies:** `@playwright/test`, `playwright`, `@clerk/testing`
- **Config:** `playwright.config.ts` with testDir './e2e', webServer auto-start, chromium browser
- **Scripts:** `test:e2e`, `test:e2e:ui`, `test:e2e:debug` in package.json
- **Gitignore:** Added `/test-results/`, `/playwright-report/`, `/playwright/.auth/`

### Route Protection Tests (Task 2)

Created `e2e/route-protection.spec.ts` with 5 tests:

1. **PROT-01 tests (4):** Parameterized loop testing `/orders`, `/customers`, `/mill-production`, `/settings` redirect to `/sign-in`
2. **PROT-02 test (1):** Return URL preservation - verifies `redirect_url` parameter contains original path

### Test Execution (Task 3)

All 5 tests pass in ~2s:
```
Running 5 tests using 5 workers
  ✓ unauthenticated user accessing /orders redirects to sign-in
  ✓ unauthenticated user accessing /customers redirects to sign-in
  ✓ unauthenticated user accessing /mill-production redirects to sign-in
  ✓ unauthenticated user accessing /settings redirects to sign-in
  ✓ return URL is preserved after redirect from /orders
  5 passed (2.1s)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] WebServer health check URL**
- **Found during:** Task 3
- **Issue:** Playwright webServer checked `http://localhost:3000` which returns 404 due to Clerk middleware protecting root route
- **Fix:** Changed webServer URL to `/sign-in` (public route that returns 200)
- **Files modified:** `playwright.config.ts`
- **Commit:** 40ecaed

**2. [Rule 3 - Blocking] WebServer timeout**
- **Found during:** Task 3
- **Issue:** Default 60s timeout insufficient for Next.js dev server startup
- **Fix:** Increased timeout to 120s
- **Files modified:** `playwright.config.ts`
- **Commit:** 40ecaed

## Key Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Playwright configuration with webServer integration |
| `e2e/route-protection.spec.ts` | 5 E2E tests for route protection verification |
| `package.json` | Added test:e2e scripts |
| `.gitignore` | Added Playwright artifact exclusions |

## Verification

```bash
npm run test:e2e
# Output: 5 passed
```

## Requirements Verified

| Requirement | Status | Evidence |
|-------------|--------|----------|
| PROT-01 | Verified | 4 tests confirm redirect to /sign-in |
| PROT-02 | Verified | All protected routes tested |
| D-06 | Verified | Return URL test confirms redirect_url parameter |

## Notes for Future Phases

- **Authenticated tests:** Future phases can add authenticated flow tests using `@clerk/testing` for session management
- **CI integration:** Tests configured with `forbidOnly: !!process.env.CI` and `retries: process.env.CI ? 2 : 0`
- **Middleware deprecation warning:** Next.js 16 shows "middleware file convention is deprecated" warning - monitor for updates

## Self-Check: PASSED

- [x] playwright.config.ts exists
- [x] e2e/route-protection.spec.ts exists
- [x] package.json has test:e2e scripts
- [x] .gitignore has Playwright exclusions
- [x] All 5 tests pass
- [x] Commits 001ff7c, da544ce, 40ecaed exist
