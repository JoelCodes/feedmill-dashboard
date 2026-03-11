---
phase: 2
slug: order-details
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (recommended) or Jest 29.x |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DETAIL-01 | integration | `npm test OrdersTable.test.tsx -t "updates selection on row click"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | DETAIL-02 | unit | `npm test OrderDetails.test.tsx -t "renders order information"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | DETAIL-03 | unit | `npm test OrderDetails.test.tsx -t "renders timeline events"` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | DETAIL-04 | unit | `npm test OrderDetails.test.tsx -t "shows change events"` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | DETAIL-05 | unit | `npm test OrderDetails.test.tsx -t "panel remains visible"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` — install test framework
- [ ] `vitest.config.ts` — Vitest configuration with jsdom environment
- [ ] `tests/setup.ts` — React Testing Library config
- [ ] `tests/components/OrdersTable.test.tsx` — covers DETAIL-01 (row click updates selection)
- [ ] `tests/components/OrderDetails.test.tsx` — covers DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05
- [ ] `tests/hooks/useLocalStorage.test.tsx` — covers timeline sort persistence

*(Note: Test infrastructure setup deferred based on project workflow.nyquist_validation config)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual timeline appearance | DETAIL-03 | CSS styling, connector colors | View timeline in browser, verify color coding matches spec (blue=primary, red=error, green=success) |
| localStorage persistence | DETAIL-03 | Requires browser reload | Change sort order, reload page, verify sort preference persisted |
| Panel layout responsiveness | DETAIL-02 | Visual check across viewports | Resize browser, verify panel content adapts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
