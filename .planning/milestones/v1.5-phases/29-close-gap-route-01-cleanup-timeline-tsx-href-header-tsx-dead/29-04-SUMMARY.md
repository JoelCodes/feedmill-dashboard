---
phase: 29
plan: "04"
subsystem: e2e
tags:
  - cleanup
  - e2e
  - playwright-config
dependency_graph:
  requires: []
  provides:
    - "INT-04 closed: production-smoke spec deleted, orphaned Playwright project block removed"
    - "INT-05 closed: route-protection spec targets live /demo/* paths"
    - "PLAYWRIGHT_BASE_URL leak closed: demo-user/norole-user pinned to localhost:3000"
  affects:
    - e2e/route-protection.spec.ts
    - playwright.config.ts
tech_stack:
  added: []
  patterns:
    - "Playwright project-level baseURL overrides global use.baseURL to isolate authenticated projects from .env.local leaks"
key_files:
  created: []
  modified:
    - e2e/route-protection.spec.ts
  deleted:
    - e2e/production-smoke.spec.ts
    - "playwright.config.ts (production-smoke project block removed; demo-user/norole-user gained baseURL)"
decisions:
  - "D-09: deleted production-smoke.spec.ts + its playwright.config.ts project block atomically to prevent Playwright 'no matching test files' error"
  - "D-10: repointed protectedRoutes constant and PROT-02 test body to /demo/* paths; /settings unchanged"
  - "D-16: added explicit baseURL: 'http://localhost:3000' to demo-user and norole-user project blocks; global use.baseURL still reads env var for chromium project"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-12T18:39:52Z"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 29 Plan 04: E2E Cleanup (production-smoke, route-protection, baseURL leak) Summary

Delete stale `e2e/production-smoke.spec.ts` (Phase 27 replaced its coverage), remove its orphaned Playwright project block, repoint `route-protection.spec.ts` to live `/demo/*` paths, and pin `demo-user`/`norole-user` projects to `http://localhost:3000` so `.env.local`'s `PLAYWRIGHT_BASE_URL` cannot leak into authenticated E2E runs.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Delete production-smoke spec + playwright project block (atomic) | 7891184 | e2e/production-smoke.spec.ts (deleted), playwright.config.ts |
| 2 | Repoint route-protection.spec.ts paths to /demo/* | 224ffc6 | e2e/route-protection.spec.ts |
| 3 | Pin demo-user/norole-user Playwright projects to localhost:3000 | bcbc9c8 | playwright.config.ts |

## Changes Made

### Task 1 — Delete production-smoke spec and playwright project block

Deleted `e2e/production-smoke.spec.ts` entirely. The file contained production Clerk sign-in smoke tests that navigated to the now-dead `/orders` route; Phase 27's `demo-route-protection.spec.ts` replaced this coverage with Clerk session fixtures.

Removed the `production-smoke` project block (lines 32-40) from `playwright.config.ts` in the same commit. Per RESEARCH.md Pitfall 2, an orphaned project entry with no matching test files causes Playwright to error on `npx playwright test`.

### Task 2 — Update route-protection.spec.ts (5 substitutions)

Updated `protectedRoutes` constant: `'/orders'`, `'/customers'`, `'/mill-production'` → `/demo/*` equivalents. `'/settings'` unchanged (protected by Clerk `auth.protect()` not demo middleware).

Updated PROT-02 test body: `await page.goto('/orders')` → `'/demo/orders'` and `expect(returnBackUrl).toContain('/orders')` → `toContain('/demo/orders')`. Per RESEARCH.md Pitfall 5, leaving the PROT-02 body stale would produce false-passing tests against deleted routes.

### Task 3 — Pin demo-user/norole-user to localhost:3000

Added `baseURL: 'http://localhost:3000'` to the `use:` block of both `demo-user` and `norole-user` project entries. The global `use.baseURL` at line 16 still reads `process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'` so the `chromium` (unauthenticated) project retains the ability to target a custom URL via env var.

## Verification Results

- `[ ! -f e2e/production-smoke.spec.ts ]` — PASS
- `grep -c "production-smoke" playwright.config.ts` = 0 — PASS
- `grep -cE "'/orders'|'/customers'|'/mill-production'" e2e/route-protection.spec.ts` = 0 — PASS
- `grep -c "baseURL: 'http://localhost:3000'" playwright.config.ts` = 2 — PASS

## Deviations from Plan

None — plan executed exactly as written. All 5 string substitutions in route-protection.spec.ts applied, both playwright project blocks gained explicit baseURL, deletion and config block removal committed atomically.

## Known Stubs

None.

## Threat Flags

None — these changes delete a test file and update test configuration; no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- `[ ! -f e2e/production-smoke.spec.ts ]` — file absent, confirmed
- `grep "production-smoke" playwright.config.ts` — no matches, confirmed
- `grep -E "'/orders'|'/customers'|'/mill-production'" e2e/route-protection.spec.ts` — no matches, confirmed
- `grep "baseURL: 'http://localhost:3000'" playwright.config.ts` — 2 matches (demo-user, norole-user), confirmed
- Commits 7891184, 224ffc6, bcbc9c8 — all present in git log
