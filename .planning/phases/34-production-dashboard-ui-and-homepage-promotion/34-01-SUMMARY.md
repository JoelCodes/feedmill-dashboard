---
phase: 34
plan: 01
subsystem: foundation
tags: [nuqs, radix-dialog, sidebar, header, search-params, tdd]
dependency_graph:
  requires: []
  provides:
    - src/lib/search-params.ts (STATE_ORDER, searchParamsCache)
    - src/app/layout.tsx (NuqsAdapter mounted)
    - src/components/ui/StatusBadge.tsx (BadgeStatus union, ProductionState support)
    - src/components/Sidebar.tsx (Dashboard + Import nav)
    - src/components/Header.tsx (Dashboard/Import titles)
    - commitImportAction D-21 patch (revalidateTag import-batches)
  affects:
    - All downstream Phase 34 plans that import from search-params.ts
    - /import route page header title (now 'Import')
    - All authenticated pages (NuqsAdapter now wraps children globally)
tech_stack:
  added:
    - nuqs@2.8.9 (URL state management for RSC + client)
    - "@radix-ui/react-dialog@1.1.15" (block-reason modal, used in later plans)
  patterns:
    - React.cache() singleton workaround via @jest-environment node in nuqs tests
    - parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)) for D-04 unknown-value drop
    - BadgeStatus = OrderStatus | ProductionState union in StatusBadge
key_files:
  created:
    - src/lib/search-params.ts
    - src/lib/__tests__/search-params.test.ts
  modified:
    - src/app/layout.tsx (NuqsAdapter added)
    - src/app/page.tsx (transitional stub)
    - src/app/page.test.tsx (rewritten for transitional stub)
    - src/components/ui/StatusBadge.tsx (ProductionState support)
    - src/components/ui/StatusBadge.test.tsx (4 new TDD tests)
    - src/components/Sidebar.tsx (Dashboard + Import nav)
    - src/components/Sidebar.test.tsx (3 new TDD tests + existing test updated)
    - src/components/Header.tsx (Dashboard/Import titles)
    - src/components/Header.test.tsx (4 new TDD tests + existing test updated)
    - src/components/DashboardLayout.test.tsx (Coming Soon → Dashboard)
    - src/actions/import.ts (D-21 revalidateTag patch)
    - src/actions/__tests__/import-commit.test.ts (3 new D-21 TDD tests)
    - src/lib/auth.ts (JSDoc updated)
    - next.config.ts (transpilePackages nuqs)
    - jest.config.ts (transformIgnorePatterns nuqs)
    - package.json (nuqs 2.8.9, @radix-ui/react-dialog 1.1.15)
    - package-lock.json
  deleted:
    - src/components/MillReadOnlyStub.tsx
decisions:
  - "Restructured search-params tests to use @jest-environment node annotation to fix nuqs/jsdom URLSearchParams cross-realm incompatibility. Each test creates a fresh createSearchParamsCache() instance to avoid React.cache() singleton issues in Jest."
  - "Added transpilePackages: ['nuqs'] to next.config.ts so next/jest includes nuqs in SWC transform pipeline. This is required because nuqs is ESM-only."
  - "Used BadgeStatus = OrderStatus | ProductionState union type in StatusBadge to preserve backward compatibility while extending for ProductionState. STATUS_CONFIG is now keyed on BadgeStatus."
metrics:
  duration: ~25 minutes
  completed: "2026-05-14T19:28:55Z"
---

# Phase 34 Plan 01: Foundation (nuqs, NuqsAdapter, search-params, StatusBadge, Sidebar, Header, D-21) Summary

Phase 34 foundation: installed nuqs@2.8.9 and @radix-ui/react-dialog@1.1.15, wired NuqsAdapter in the root layout, created the shared searchParamsCache and STATE_ORDER constant, extended StatusBadge for the production state set, updated Sidebar + Header for the new production nav, patched commitImportAction with the revalidateTag('import-batches','max') D-21 invalidation, and deleted MillReadOnlyStub.tsx while leaving src/app/page.tsx in a clean transitional state.

## Installed Dependency Versions

| Package | Version | Commit |
|---------|---------|--------|
| nuqs | 2.8.9 (pinned) | 210aa85 |
| @radix-ui/react-dialog | 1.1.15 (pinned) | 210aa85 |

Both packages added to `package.json` dependencies at exact pinned versions (no `^` prefix).

## Created Files

### `src/lib/search-params.ts`
- Exports `STATE_ORDER = ['Pending', 'Mixing', 'Completed', 'Blocked'] as const satisfies readonly ProductionState[]`
- Exports `searchParamsCache` via `createSearchParamsCache({ status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]), q: parseAsString.withDefault(''), order: parseAsString.withDefault('') })`
- All imports from `nuqs/server`; `ProductionState` imported from `@/db/schema/orders`

### `src/lib/__tests__/search-params.test.ts`
- `@jest-environment node` annotation required for nuqs/URLSearchParams compatibility
- 6 tests: status parse (D-04), unknown-value drop (D-04), empty default, q round-trip (D-05), order round-trip (D-06), STATE_ORDER tuple assertion
- All 6 tests GREEN

## D-21 Patch Sites in `src/actions/import.ts`

| Location | Line (post-patch) | Path |
|----------|-------------------|------|
| Degraded-success path | 794 | After `revalidateTag('production-orders', 'max')` in batch-insert catch |
| Success path | 810 | After `revalidateTag('production-orders', 'max')` in main try block |

Both sites now call `revalidateTag('import-batches', 'max')` immediately after the existing `revalidateTag('production-orders', 'max')` call.

## Files Deleted

- `src/components/MillReadOnlyStub.tsx` — deleted; no runtime imports remain
- All references swept: `src/app/page.tsx`, `src/app/page.test.tsx`, `src/lib/auth.ts` (JSDoc)
- Post-sweep verification: `grep -rn "MillReadOnlyStub" src/` returns 0 matches

## Test Counts

| Module | Test Count | Status |
|--------|-----------|--------|
| search-params (6 behaviors) | 6 | GREEN |
| StatusBadge new tests (4) | 4 | GREEN |
| Sidebar new tests (3) | 3 | GREEN |
| Header new tests (4) | 4 | GREEN |
| import-commit D-21 tests (3) | 3 | GREEN |
| page.tsx transitional (3) | 3 | GREEN |
| All other pre-existing tests | 571 | GREEN |
| Settings pre-existing failures | 14 | PRE-EXISTING (deferred from Phase 27) |

**Total: 594 passing, 14 pre-existing failures (ClerkProvider in settings/__tests__)**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed nuqs/jsdom URLSearchParams cross-realm incompatibility**
- **Found during:** Task 1 GREEN phase
- **Issue:** nuqs/server uses Node.js's URLSearchParams in `createLoader`/`extractSearchParams`. In jsdom test environment, a cross-realm incompatibility causes `instanceof URLSearchParams` to fail, making `createLoader` return default values even with valid inputs.
- **Fix:** Added `@jest-environment node` annotation to `src/lib/__tests__/search-params.test.ts`. Each test creates a fresh `createSearchParamsCache()` instance to avoid React.cache() singleton issues.
- **Files modified:** `src/lib/__tests__/search-params.test.ts`
- **Commit:** 210aa85 (included in GREEN commit)

**2. [Rule 1 - Bug] Added `transpilePackages: ['nuqs']` to next.config.ts**
- **Found during:** Task 1 RED phase
- **Issue:** nuqs is ESM-only (`type: "module"` in package.json). Next.js's jest config doesn't automatically transform it unless `transpilePackages` is set.
- **Fix:** Added `transpilePackages: ['nuqs']` to `next.config.ts`. Also added `transformIgnorePatterns` to `jest.config.ts` as belt-and-suspenders (next/jest processes `transpilePackages`).
- **Files modified:** `next.config.ts`, `jest.config.ts`
- **Commit:** 210aa85 (included in GREEN commit)

**3. [Rule 1 - Bug] Updated DashboardLayout.test.tsx to reflect '/' → 'Dashboard' title change**
- **Found during:** Task 3 full test suite run
- **Issue:** `src/components/DashboardLayout.test.tsx` expected `"Coming Soon"` for the `/` path, which was the pre-Phase-34 title. Our Header update (Task 2) changed `'/'` to return `'Dashboard'`.
- **Fix:** Updated the test assertion to expect `"Dashboard"`.
- **Files modified:** `src/components/DashboardLayout.test.tsx`
- **Commit:** 9e7fd8b (included in Task 3 GREEN commit)

**4. [Rule 1 - Bug] Updated existing Sidebar test that expected 'Coming Soon'**
- **Found during:** Task 2 GREEN phase
- **Issue:** Existing production context Sidebar test asserted for "Coming Soon" link — which was removed per D-24.
- **Fix:** Updated test to assert for Dashboard link with `href="/"` instead.
- **Files modified:** `src/components/Sidebar.test.tsx`
- **Commit:** f3206de (included in Task 2 GREEN commit)

## Known Stubs

- `src/app/page.tsx` renders `"Dashboard placeholder — wired in plan 07"` — intentional transitional stub. ProductionDashboard wiring lands in plan 07 (Wave 4).

## Threat Flags

None — the new surface (NuqsAdapter, search-params URL parsing) is covered by the plan's threat model (T-34-01-01 through T-34-01-08). No new unmodeled surface introduced.

## Self-Check: PASSED

### Created files:
- [x] src/lib/search-params.ts — FOUND
- [x] src/lib/__tests__/search-params.test.ts — FOUND

### Commits verified:
- [x] c10207a — test(34-01): add failing tests for search-params cache (TDD red)
- [x] 210aa85 — feat(34-01): install nuqs+Radix Dialog, wire NuqsAdapter, create search-params lib (TDD green)
- [x] 3a29fb4 — test(34-01): add failing tests for StatusBadge/Sidebar/Header (TDD red)
- [x] f3206de — feat(34-01): extend StatusBadge for ProductionState, update Sidebar/Header nav (TDD green)
- [x] 0de5f2c — test(34-01): add failing D-21 tests for revalidateTag import-batches patch (TDD red)
- [x] 9e7fd8b — feat(34-01): D-21 revalidateTag patch, delete MillReadOnlyStub, transitional page.tsx (TDD green)

### Key acceptance criteria:
- [x] nuqs@2.8.9 and @radix-ui/react-dialog@1.1.15 at pinned versions
- [x] NuqsAdapter mounted in layout.tsx (exactly 1 NuqsAdapter tag)
- [x] STATE_ORDER and searchParamsCache exported from src/lib/search-params.ts
- [x] 6 search-params unit tests GREEN
- [x] Mixing, Completed, Blocked added to StatusBadge STATUS_CONFIG
- [x] No "Coming Soon" in src/components/Sidebar.tsx
- [x] /import nav entry with href="/import" in Sidebar
- [x] '/' → 'Dashboard', '/import' → 'Import' in Header
- [x] isActive exact-match guard preserved in Sidebar
- [x] revalidateTag('import-batches','max') at 2 sites in import.ts
- [x] MillReadOnlyStub.tsx deleted (0 grep matches)
- [x] page.tsx transitional stub with "Dashboard placeholder" text
- [x] All 594 tests pass (14 pre-existing settings failures excluded)

## TDD Gate Compliance

All three tasks followed strict RED → GREEN sequence:

1. **Task 1:** RED commit `c10207a` (test) → GREEN commit `210aa85` (feat)
2. **Task 2:** RED commit `3a29fb4` (test) → GREEN commit `f3206de` (feat)
3. **Task 3:** RED commit `0de5f2c` (test) → GREEN commit `9e7fd8b` (feat)
