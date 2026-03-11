---
phase: 0
slug: infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (none — Wave 0 installs) |
| **Config file** | vitest.config.ts (Wave 0 creates) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 00-01-01 | 01 | 0 | INFRA-01 | unit | `npm run test -- src/types/order.test.ts` | ❌ W0 | ⬜ pending |
| 00-01-02 | 01 | 0 | INFRA-02 | unit | `npm run test -- src/services/orders.test.ts` | ❌ W0 | ⬜ pending |
| 00-02-01 | 02 | 1 | INFRA-03 | unit | `npm run test -- src/components/ui/StatusBadge.test.tsx` | ❌ W0 | ⬜ pending |
| 00-02-02 | 02 | 1 | INFRA-04 | unit | `npm run test -- src/components/ui/skeletons/TableSkeleton.test.tsx` | ❌ W0 | ⬜ pending |
| 00-02-03 | 02 | 1 | INFRA-04 | manual-only | Visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom` — testing framework
- [ ] `vitest.config.ts` — Vitest configuration with Next.js + React setup
- [ ] `src/types/order.test.ts` — Order type validation tests
- [ ] `src/services/orders.test.ts` — Mock service async interface tests
- [ ] `src/components/ui/StatusBadge.test.tsx` — Component rendering tests
- [ ] `src/components/ui/skeletons/TableSkeleton.test.tsx` — Skeleton component tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TableSkeleton matches table dimensions | INFRA-04 | Visual alignment cannot be automated | Load page with slow network, compare skeleton layout to loaded table |
| DetailsSkeleton matches details panel | INFRA-04 | Visual alignment cannot be automated | Open order details with slow network, compare skeleton to loaded content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
