---
phase: 13
slug: customer-detail-infrastructure
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-05
last_audit: 2026-05-05
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + @testing-library/react 16.3.2 |
| **Config file** | jest.config.ts (Next.js-integrated via next/jest) |
| **Quick run command** | `npm test -- --testPathPattern="customers/\[id\]/page.test" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="customers/\[id\]" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | CDET-01 | — | N/A | unit | `npm test -- src/components/CustomerDetailHeader.test.tsx -t "renders customer name" --bail` | ✅ | ✅ green |
| 13-01-02 | 01 | 1 | CDET-02 | — | N/A | unit | `npm test -- src/components/CustomerDetailHeader.test.tsx -t "Total Orders" --bail` | ✅ | ✅ green |
| 13-01-03 | 01 | 1 | CDET-02 | — | N/A | unit | `npm test -- src/services/customers.test.ts -t "activeBins" --bail` | ✅ | ✅ green |
| 13-02-01 | 02 | 2 | CDET-01 | — | N/A | unit | `npm test -- "src/app/customers/\[id\]/page.test.tsx" -t "renders customer name" --bail` | ✅ | ✅ green |
| 13-02-02 | 02 | 2 | D-04 | — | N/A | unit | `npm test -- "src/app/customers/\[id\]/page.test.tsx" -t "notFound" --bail` | ✅ | ✅ green |
| 13-02-03 | 02 | 2 | D-05 | — | N/A | unit | `npm test -- "src/app/customers/\[id\]/page.test.tsx" -t "fallback" --bail` | ✅ | ⚠️ warning |
| 13-03-01 | 03 | 2 | CDET-03 | — | N/A | integration | N/A | — | ⏸️ Phase 14 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ warning · ⏸️ deferred*

---

## Wave 0 Requirements

- [x] `src/app/customers/[id]/page.test.tsx` — tests for CDET-01, D-04, D-05
- [x] `src/components/CustomerDetailHeader.test.tsx` — tests for CDET-01, CDET-02 (11 test cases)
- [x] `src/services/customers.test.ts` — tests for activeBins calculation (3 test cases)
- [x] Framework install: None needed — Jest already configured (jest.config.ts exists)

*Pattern reference: See `src/app/customers/page.test.tsx` for established testing patterns*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual match to customer-detail.pen | CDET-01 | Design fidelity requires visual inspection | 1. Navigate to /customers/CUST-001 2. Compare header layout to customer-detail.pen lines 217-475 |
| D-05 FALLBACK_STATS not implemented | D-05 | Implementation gap — constant defined in plan but not in code | See escalation note below |

---

## Implementation Gap — D-05 Escalation

**Issue:** Plan 13-03-PLAN.md (lines 123-131) specifies FALLBACK_STATS constant for graceful degradation when stats fail. The current implementation does not include this constant.

**Test Coverage:** A test exists (`should use fallback stats when stats are unavailable`) but it simulates the expected behavior by providing mock fallback stats — it does not verify the actual FALLBACK_STATS constant exists.

**Recommended Fix:** Add FALLBACK_STATS constant to `src/app/customers/[id]/page.tsx`:
```typescript
const FALLBACK_STATS: CustomerStats = {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  hasChanges: false,
  binAlertLevel: 'none',
  activeBins: 0,
};
```

**Risk Assessment:** LOW — Current implementation returns null if customer not found (triggering 404). The FALLBACK_STATS is only needed if stats calculation fails independently from customer fetch, which is not the current data flow (getCustomerById returns CustomerWithStats atomically).

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ VALIDATED (PARTIAL)

---

## Validation Audit 2026-05-05

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 1 (D-05 implementation gap — low risk) |
| Tests added | 4 (3 activeBins + 1 fallback) |

**Auditor Notes:**
- G-01 (activeBins): FILLED — 3 unit tests added to customers.test.ts verifying activeBins calculation counts bins with alertLevel !== 'none'
- G-02 (fallback stats): WARNING — Test added but reveals FALLBACK_STATS constant is not implemented in page.tsx. Low risk as data fetching is atomic.
