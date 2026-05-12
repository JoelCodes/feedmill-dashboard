---
phase: 26
slug: route-restructuring-and-migration
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-12
reconstructed: true
---

# Phase 26 — Validation Strategy

> Reconstructed retroactively from PLAN/SUMMARY/VERIFICATION artifacts after phase completion. All requirements have automated verification.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x + @testing-library/react + jest-environment-jsdom |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- <path>` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~1s per file; ~25s full suite |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- <changed test file>`
- **After every plan wave:** Run `npm test` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~25s (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | NAV-01 | T-26-01 | Navigation links are public route paths; access enforced by middleware | unit (RED) | `npm test -- src/components/Sidebar.test.tsx` | ✅ | ✅ green |
| 26-01-02 | 01 | 1 | NAV-01 | T-26-02 | isDemoContext is UX-only; server middleware enforces access | unit (GREEN) | `npm test -- src/components/Sidebar.test.tsx` | ✅ | ✅ green |
| 26-01-03 | 01 | 1 | NAV-01 | — | N/A | unit (REFACTOR) | `npm test` | ✅ | ✅ green |
| 26-02-01 | 02 | 1 | ROUTE-02 | — | N/A — static title mapping | unit | `npm test -- src/components/Header.test.tsx` | ✅ | ✅ green |
| 26-02-02 | 02 | 1 | ROUTE-02 | T-26-03 | Public static page; Clerk auth at layout level | unit | `npm test -- src/app/page.test.tsx` | ✅ | ✅ green |
| 26-02-03 | 02 | 1 | ROUTE-02 | — | N/A — verify step | unit | `npm test` | ✅ | ✅ green |
| 26-03-01 | 03 | 2 | ROUTE-01 | T-26-04 | Middleware `/demo(.*)` matcher unchanged from Phase 25 | unit | `npm test -- src/app/demo/orders` | ✅ | ✅ green |
| 26-03-02 | 03 | 2 | ROUTE-01 | T-26-04 | Middleware `/demo(.*)` matcher unchanged from Phase 25 | unit | `npm test -- src/app/demo/customers` | ✅ | ✅ green |
| 26-03-03 | 03 | 2 | ROUTE-01 | T-26-04 | Middleware `/demo(.*)` matcher unchanged from Phase 25 | unit | `npm test -- src/app/demo/mill-production` | ✅ | ✅ green |
| 26-03-04 | 03 | 2 | ROUTE-01 | T-26-05 | Old routes intentionally 404 (clean break per D-01) | unit + build | `npm test && npm run build` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Coverage:** 10/10 tasks automated. 3/3 requirements automated (NAV-01, ROUTE-01, ROUTE-02).

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Jest + RTL was already installed; no framework bootstrap needed.

Tests were authored during execution (TDD for Plan 26-01; alongside migration for Plan 26-03) and **retroactively** for Plan 26-02 (Header demo-route titles + Coming Soon homepage) during this validation pass.

---

## Manual-Only Verifications

Five items require manual browser verification (carried over from `26-VERIFICATION.md` Human Verification section). All five were performed and signed off in `26-UAT.md` on 2026-05-12.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Coming Soon page renders with correct centered layout in browser | ROUTE-02 | Visual layout verification requires browser rendering | Navigate to `/`; confirm centered heading, subtitle, sidebar "PRODUCTION" label, Settings link |
| Sidebar swaps to DEMO context on `/demo/*` routes | NAV-01 | Visual context switch requires browser rendering | Navigate to `/demo/orders`; confirm "DEMO" section label, 3 demo links, Settings still visible |
| Demo navigation links route correctly between pages | NAV-01, ROUTE-01 | End-to-end navigation flow requires browser interaction | Click Orders → Customers → Mill Production in sidebar; confirm each page loads with correct Header title |
| Settings link works from both contexts | NAV-01 | Cross-context navigation behavior | Click Settings from `/`, then from `/demo/orders`; both navigate to `/settings` |
| Old root-level routes return 404 (no redirect) | ROUTE-01 (D-01) | 404 behavior requires manual navigation | Visit `/orders`, `/customers`, `/mill-production`; confirm Next.js 404, no redirect to `/demo/*` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-12 (retroactive — phase already verified 2026-05-11, human-signed 2026-05-12)

---

## Reconstruction Audit (2026-05-12)

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 0 |

**Gaps closed:**
- Plan 26-02 Task 1 (Header `getPageTitle` /demo/* routes) — `src/components/Header.test.tsx` created with 7 parameterized cases.
- Plan 26-02 Task 2 (Coming Soon homepage) — `src/app/page.test.tsx` created with 2 tests (content + DashboardLayout wiring).
