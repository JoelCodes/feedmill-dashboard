---
phase: 18
slug: page-migration
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-07
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern={ComponentName}` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds (304 tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern={affected-component}` (< 30s)
- **After every plan wave:** Run `npm test` (full suite)
- **Before `/gsd-verify-work`:** `npm run lint && npm test` (ESLint clean + all tests green)
- **Max feedback latency:** 30 seconds

---

## Per-Requirement Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| MIG-01 | Orders page uses only tokens/components | integration + unit | `npm test -- --testPathPatterns="orders/__tests__\|components/__tests__/Orders"` | ✅ exists | ✅ green |
| MIG-02 | Customers page uses only tokens/components | integration + unit | `npm test -- --testPathPatterns="customers/__tests__/page\|customers/\[id\]/page"` | ✅ exists | ✅ green |
| MIG-03 | Mill Production page uses only tokens/components | unit | `npm test -- mill-production` | ✅ exists | ✅ green |
| MIG-04 | Settings page uses theme toggle + tokens | integration | `npm test -- settings/__tests__` | ✅ exists | ✅ green |
| MIG-05 | ESLint reports zero hardcoded value violations | static analysis | `npm run lint 2>&1 \| grep "custom/no-hardcoded-values" \| wc -l` | N/A (ESLint) | ✅ green |

---

## Token Usage Validation Pattern

All migrated components follow the StatusBadge.test.tsx pattern:

| Behavior | Test Type | Automated Command | Source Pattern |
|----------|-----------|-------------------|----------------|
| Component uses var(--tokens) not hardcoded hex | unit | `npm test -- {Component}.test` | StatusBadge.test.tsx |
| No #hex or [Npx] patterns in className | unit | Verify via test assertion | StatusBadge.test.tsx lines 45-62 |

---

## Wave 0 Requirements

- [x] `src/app/mill-production/__tests__/page.test.tsx` — covers MIG-03 (mill production token usage)
- [x] `src/app/settings/__tests__/page.test.tsx` — covers MIG-04 (settings + theme toggle integration)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark mode visual appearance | MIG-05 | Visual verification | Toggle theme, verify all pages render correctly |
| Theme toggle persists across page navigation | MIG-04 | E2E interaction | Change theme on Settings, navigate to Orders, verify theme persists |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (mill-production, settings tests)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved

---

## Validation Audit 2026-05-07

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 0 |

**Tests Added:**
- `src/app/mill-production/__tests__/page.test.tsx` (6 tests)
- `src/app/settings/__tests__/page.test.tsx` (14 tests)

**Final Test Count:** 212 tests (up from 192)

---

## Validation Audit 2026-05-09

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 0 |

**Gap 1 (MIG-01 - Orders page):**
- STATUS_PILL_CONFIG tokens verified (no hardcoded #f59e0b22, #2b6cb022, #9333ea22, #2f855a22)
- FilterPill import from @/components/ui/FilterPill verified
- OrderDetails Card component usage verified
- Orders page skeleton tokens verified (rounded-[var(--radius-xl)], bg-[var(--divider)])

**Gap 2 (MIG-02 - Customers page):**
- Card component wrapper verified
- No hardcoded gray-* classes (bg-gray-200, text-gray-300, text-gray-400, hover:bg-gray-50)
- Design tokens verified (bg-[var(--divider)], text-[var(--text-secondary)], hover:bg-[var(--bg-page)])

**Tests Added:**
- `src/app/orders/__tests__/page.test.tsx` (5 tests)
- `src/components/__tests__/OrdersTable.test.tsx` (12 tests)
- `src/components/__tests__/OrderDetails.test.tsx` (8 tests)
- `src/app/customers/__tests__/page.test.tsx` (15 tests)

**Final Test Count:** 304 tests (up from 264)
