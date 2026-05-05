---
phase: 13
slug: customer-detail-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-05
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
| 13-01-01 | 01 | 1 | CDET-01 | — | N/A | unit | `npm test -- src/components/CustomerDetailHeader.test.tsx -t "renders contact info" --bail` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | CDET-02 | — | N/A | unit | `npm test -- src/components/CustomerDetailHeader.test.tsx -t "renders summary stats" --bail` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | CDET-02 | — | N/A | unit | `npm test -- src/services/customers.test.ts -t "calculates active bins" --bail` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 2 | CDET-01 | — | N/A | unit | `npm test -- src/app/customers/\[id\]/page.test.tsx -t "renders customer header" --bail` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 2 | D-04 | — | N/A | unit | `npm test -- src/app/customers/\[id\]/page.test.tsx -t "404 for invalid customer" --bail` | ❌ W0 | ⬜ pending |
| 13-02-03 | 02 | 2 | D-05 | — | N/A | unit | `npm test -- src/app/customers/\[id\]/page.test.tsx -t "partial failure handling" --bail` | ❌ W0 | ⬜ pending |
| 13-03-01 | 03 | 2 | CDET-03 | — | N/A | integration | `npm test -- src/app/customers/\[id\]/page.test.tsx -t "order link navigation" --bail` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/customers/[id]/page.test.tsx` — stubs for CDET-01, CDET-03, D-04, D-05
- [ ] `src/components/CustomerDetailHeader.test.tsx` — stubs for CDET-01, CDET-02
- [ ] Framework install: None needed — Jest already configured (jest.config.ts exists)

*Pattern reference: See `src/app/customers/page.test.tsx` for established testing patterns*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual match to customer-detail.pen | CDET-01 | Design fidelity requires visual inspection | 1. Navigate to /customers/CUST-001 2. Compare header layout to customer-detail.pen lines 217-475 |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
