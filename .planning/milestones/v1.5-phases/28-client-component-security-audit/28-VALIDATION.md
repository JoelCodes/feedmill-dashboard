---
phase: 28
slug: client-component-security-audit
status: compliant
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-11
audited: 2026-05-12
---

# Phase 28 — Validation Strategy

> Per-phase validation contract. Every must-have requirement is gated by an automated Jest assertion; manual smoke checks are limited to the cross-network redirect / streaming flicker behaviors that unit tests cannot observe.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (existing) — `jest.config.ts` (Next.js `next/jest` preset, jsdom env) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --runInBand src/test/fixtures src/app/demo src/components/__tests__/OrdersTable src/components/__tests__/CustomersList src/components/__tests__/MillProductionUI` |
| **Full suite command** | `npm test -- --runInBand` |
| **Estimated runtime** | ~2s (quick — 8 suites, 75 tests); ~10–15s (full) |

---

## Sampling Rate

- **After every task commit:** Run the targeted file (e.g. `npm test -- --runInBand src/app/demo/orders/__tests__/page.test.tsx`).
- **After every plan wave:** Run `npm test -- --runInBand` (full suite).
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~2 seconds for the targeted Phase 28 set.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement (must-have truth) | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------------------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 28-01-T1 | 28-01 | 0 | Fixture exports `mockAuth`, two factory functions, and three session helpers; consumer pattern proven | T-28-01-01 | Test-only mocks scoped to `src/test/fixtures/` — cannot leak into production bundle | Unit (fixture-contract) | `npm test -- --runInBand src/test/fixtures/clerkAuth.test.ts` | ✅ `src/test/fixtures/clerkAuth.test.ts` (7 it()) | ✅ green |
| 28-01-T2 | 28-01 | 0 | `mockAuth.mockReset()` between tests resets state; sentinel-throw `redirect()` mirrors Next runtime | T-28-01-02 | Inner-only Clerk mock — production middleware (ACCESS-01) untouched (D-04) | Unit | `npm test -- --runInBand src/test/fixtures/clerkAuth.test.ts` | ✅ same suite | ✅ green |
| 28-02-T1 | 28-02 | 1 | `CustomerDetailPage` rejects with `{ url: '/sign-in' }` when unauthenticated; `{ url: '/' }` for `user` and `admin` | T-28-02-01 | Inner page-level demo-role guard catches middleware drift (D-05) | RSC unit (async-as-function) | `npm test -- --runInBand src/app/demo/customers/\[id\]/page.test.tsx` | ✅ `src/app/demo/customers/[id]/page.test.tsx` (10 tests, 3 are redirect-branch) | ✅ green |
| 28-02-T2 | 28-02 | 1 | `await requireRole('demo')` precedes `await params` in `/demo/customers/[id]/page.tsx` | T-28-02-02 | No sensitive fetch runs before role check (D-01) | Source + behavior | `awk '/await requireRole/{r=NR} /await params/{p=NR} END{exit (r<p ? 0 : 1)}' src/app/demo/customers/\[id\]/page.tsx`; same Jest suite covers the runtime branch | ✅ guard line precedes data line in source | ✅ green |
| 28-03-T1 | 28-03 | 2 | `OrdersTable` no longer imports `@/services/orders`, no internal `useState<Order[]>`, receives `orders` via prop | T-28-03-01, T-28-03-03 | No client-side fetch of order data; no stale-fetch race | Component unit + source grep | `npm test -- --runInBand src/components/__tests__/OrdersTable.test.tsx`; `grep -c "getOrders" src/components/OrdersTable.tsx` (=0) | ✅ `src/components/__tests__/OrdersTable.test.tsx` (12 tests) | ✅ green |
| 28-03-T2 | 28-03 | 2 | `/demo/orders/page.tsx` is async RSC; `await requireRole('demo')` precedes `await getOrders()`; 3 redirect branches covered | T-28-03-02 | Page-level guard + server-side fetch boundary | RSC unit | `npm test -- --runInBand src/app/demo/orders/__tests__/page.test.tsx`; `awk '/await requireRole/{r=NR} /await getOrders/{g=NR} END{exit (r<g ? 0 : 1)}' src/app/demo/orders/page.tsx` | ✅ `src/app/demo/orders/__tests__/page.test.tsx` (9 tests, 3 redirect-branch) | ✅ green |
| 28-04-T1 | 28-04 | 2 | `CustomersList` is `'use client'`, accepts `customers` prop, no service import, no `useEffect` fetch | T-28-04-01, T-28-04-04 | No client-side fetch of customer data | Component unit + source grep | `npm test -- --runInBand src/components/__tests__/CustomersList.test.tsx`; `grep -c "from '@/services/customers'" src/components/CustomersList.tsx` (=0) | ✅ `src/components/__tests__/CustomersList.test.tsx` (5 tests) | ✅ green |
| 28-04-T2 | 28-04 | 2 | `/demo/customers/page.tsx` is async RSC; guard precedes `await getCustomers()`; sort runs server-side | T-28-04-02, T-28-04-03 | Page-level guard + server-side fetch + server-side sort | Source + behavior | `awk '/await requireRole/{r=NR} /await getCustomers/{g=NR} END{exit (r<g ? 0 : 1)}' src/app/demo/customers/page.tsx`; same page test suite asserts `sortCustomersByRecentActivity` invoked server-side | ✅ guard line precedes data line in source | ✅ green |
| 28-04-T3 | 28-04 | 2 | Customer page test exercises 3 redirect branches (sign-in / non-demo / admin) via async invocation | T-28-04-02 | Defense-in-depth proof at the page entry, bypassing middleware | RSC unit | `npm test -- --runInBand src/app/demo/customers/__tests__/page.test.tsx` | ✅ `src/app/demo/customers/__tests__/page.test.tsx` (16 tests, 3 redirect-branch) | ✅ green |
| 28-05-T1 | 28-05 | 2 | `MillProductionUI` is `'use client'`, accepts `orders` prop, no service import, no `useEffect` fetch, no `LoadingSkeleton` | T-28-05-01, T-28-05-03 | No client-side fetch of production data | Component unit + source grep | `npm test -- --runInBand src/components/__tests__/MillProductionUI.test.tsx`; `grep -c "from '@/services/millProduction'" src/components/MillProductionUI.tsx` (=0) | ✅ `src/components/__tests__/MillProductionUI.test.tsx` (6 tests) | ✅ green |
| 28-05-T2 | 28-05 | 2 | `/demo/mill-production/page.tsx` is async RSC; guard precedes `await getProductionOrders()`; 3 redirect branches covered | T-28-05-02 | Page-level guard + server-side fetch boundary | RSC unit | `npm test -- --runInBand src/app/demo/mill-production/__tests__/page.test.tsx`; `awk '/await requireRole/{r=NR} /await getProductionOrders/{g=NR} END{exit (r<g ? 0 : 1)}' src/app/demo/mill-production/page.tsx` | ✅ `src/app/demo/mill-production/__tests__/page.test.tsx` (7 tests, 3 redirect-branch) | ✅ green |
| 28-06-T1 | 28-06 | 3 | `docs/security-patterns.md` has 6 H2 sections; no `<Protect>` usage in `src/` (D-10) | T-28-06-01, T-28-06-04 | Forward-looking doc encodes guidance; production code free of misleading patterns | Source assertions (no test file — doc-only plan) | `grep -c "^## " docs/security-patterns.md` (=6); `grep -rn "<Protect" src/` (=0); `grep -l "await requireRole" src/app/demo/orders/page.tsx src/app/demo/customers/page.tsx src/app/demo/customers/\[id\]/page.tsx src/app/demo/mill-production/page.tsx \| wc -l` (=4) | ✅ `docs/security-patterns.md` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Confirmed `@clerk/nextjs/server` Jest mock pattern from `src/lib/auth.test.ts` is reusable (factored into `src/test/fixtures/clerkAuth.ts` in plan 28-01)
- [x] Verified async-RSC-as-function harness works for `/demo/*/page.tsx` — plan 28-02 proved it on the existing async RSC; plans 28-03/04/05 inherited the same `await Page(); render(element)` invocation
- [x] No Playwright fallback needed — fixture stayed stable across all four consumers (no API drift surfaced; no flaky async-RSC tests reported)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-demo user redirected from `/demo/*` to `/` (real Clerk session, not mock) | Success Criterion 3 | Cross-network middleware redirect chain — Phase 27 Playwright covers the full real-Clerk path; unit tests only prove the inner page-level guard | Sign in as user without `demo` role, visit `/demo/orders`, expect redirect to `/` |
| Demo user sees all `/demo/*` pages without flash of unauthorized content | Success Criterion 1 | RSC streaming behavior best verified visually; jsdom does not stream | Sign in as demo user, navigate to each `/demo/*` page, confirm no flicker / no unauthorized markup briefly visible |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task has a Jest command)
- [x] Wave 0 covers all MISSING references — none escalated (the fixture greened every downstream consumer on first pass)
- [x] No watch-mode flags
- [x] Feedback latency < 60s (targeted suite ~2s, full ~15s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** compliant — every must-have has an automated test, source-level invariants are grep-asserted, and 75/75 Phase 28 tests pass against HEAD.

---

## Validation Audit 2026-05-12

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Tasks in map | 12 |
| Automated tests covering Phase 28 | 75 |
| Test suites | 8 |
| Manual-only behaviors | 2 (cross-network redirect, RSC streaming flicker — both deferred to Phase 27 Playwright + visual smoke) |

**Audit method:** Read the 6 PLAN files + 6 SUMMARY files, extracted each must-have-truth, cross-referenced to the existing test files under `src/test/fixtures/`, `src/app/demo/**/__tests__/`, and `src/components/__tests__/`. Ran the full Phase 28 targeted suite (`npm test -- --runInBand src/test/fixtures src/app/demo src/components/__tests__/{OrdersTable,CustomersList,MillProductionUI}`) — 8 suites pass, 75 tests pass. Verified six source-level invariants:

- `grep -l "await requireRole" src/app/demo/*/page.tsx src/app/demo/*/*/page.tsx | wc -l` returns `4` (all `/demo/*` routes guarded; `/settings` correctly excluded per D-06).
- Guard-precedes-fetch awk check passes on all four `/demo/*` pages.
- No client component (`CustomersList`, `OrdersTable`, `OrdersTableContent`, `MillProductionUI`) imports its service module — `grep -c "from '@/services/..."` returns 0 on each.
- `grep -rn "<Protect" src/` returns 0 (D-10: no live Protect usage in production source).
- `docs/security-patterns.md` exists with exactly 6 H2 sections (D-09 ordering).
- Fixture factory-import pattern verified by Jest hoisting tolerance — `src/test/fixtures/clerkAuth.test.ts` (7 tests) proves the consumer contract used by all four `/demo/*` page test files.

No gaps identified; no agent dispatch required.
