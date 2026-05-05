---
phase: 12
slug: customer-list-page
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-05
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x with @testing-library/react |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- src/app/customers -x` |
| **Full suite command** | `npm test -- src/app/customers src/utils/customerSort.test.ts` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/app/customers -x`
- **After every plan wave:** Run `npm test -- src/app/customers src/utils/customerSort.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | CUST-04 | — | Sort by delivery date, no-orders at end | unit | `npm test -- src/utils/customerSort.test.ts` | ✅ | ✅ green |
| 12-02-01 | 02 | 2 | CUST-01 | T-12-01 | Search input filters client-side, no server storage | integration | `npm test -- src/app/customers/page.test.tsx --testNamePattern="filters"` | ✅ | ✅ green |
| 12-02-02 | 02 | 2 | CUST-02 | — | Package icon + count, red dot for changes | integration | `npm test -- src/app/customers/page.test.tsx --testNamePattern="Package\|red dot"` | ✅ | ✅ green |
| 12-02-03 | 02 | 2 | CUST-03 | — | Yellow/red AlertTriangle for bin alerts | integration | `npm test -- src/app/customers/page.test.tsx --testNamePattern="AlertTriangle"` | ✅ | ✅ green |
| 12-02-04 | 02 | 2 | — | — | 5 skeleton rows during loading | integration | `npm test -- src/app/customers/page.test.tsx --testNamePattern="skeleton"` | ✅ | ✅ green |
| 12-02-05 | 02 | 2 | — | — | Empty state when no matches | integration | `npm test -- src/app/customers/page.test.tsx --testNamePattern="empty state"` | ✅ | ✅ green |
| 12-02-06 | 02 | 2 | — | — | Row click navigates to customer detail | integration | `npm test -- src/app/customers/page.test.tsx --testNamePattern="router.push"` | ✅ | ✅ green |
| 12-03-01 | 03 | 1 | CUST-02 | — | Numeric count displayed next to Package icon | integration | `npm test -- src/app/customers/page.test.tsx --testNamePattern="numeric count"` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

Test infrastructure was already present:
- Jest configured via jest.config.ts
- @testing-library/react installed
- Mocking patterns established (next/navigation, services)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual appearance (colors, spacing, alignment) | UI-SPEC.md | CSS custom properties, visual design | Navigate to /customers, verify skeleton loading, status indicator colors, layout matches spec |
| Debounce timing feels natural (300ms) | CUST-01 | UX feel | Type in search, verify no jank, smooth filtering |
| Hover states on customer rows | UI-SPEC.md | Interaction design | Hover over rows, verify bg-gray-50 highlight |

*These behaviors were verified in UAT (12-UAT.md) and passed all 8 tests.*

---

## Test Summary

| Test File | Test Count | Status |
|-----------|------------|--------|
| src/utils/customerSort.test.ts | 7 | ✅ All pass |
| src/app/customers/page.test.tsx | 10 | ✅ All pass |
| **Total** | **17** | ✅ **Green** |

### Test Coverage Details

**customerSort.test.ts (7 tests):**
1. Sort by most recent delivery date (descending)
2. Customers with no orders at end
3. Stable order for customers with no orders
4. Handle empty array
5. Handle single customer
6. Sort by exact datetime (not just date)
7. Do not mutate input array

**page.test.tsx (10 tests):**
1. Renders search input with placeholder
2. Renders customer names from service
3. Filters customers by name (case-insensitive)
4. Shows Package icon with numeric count when activeOrders > 0
5. Shows red dot when hasChanges is true
6. Shows yellow AlertTriangle when binAlertLevel is "low"
7. Shows red AlertTriangle when binAlertLevel is "critical"
8. Shows 5 skeleton rows when loading
9. Shows empty state when no customers match search
10. Calls router.push with customer ID when row clicked

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 3s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-05

---

## Validation Audit 2026-05-05

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

*Phase reconstructed from SUMMARY artifacts. All requirements have automated verification.*

---

_Generated: 2026-05-05_
_Auditor: gsd-validate-phase_
