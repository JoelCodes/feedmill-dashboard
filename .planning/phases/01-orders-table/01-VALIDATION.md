---
phase: 1
slug: orders-table
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (lint + build only) |
| **Config file** | none — Wave 0 installs if needed |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | TABLE-01 | manual-only | Visual inspection | N/A | ⬜ pending |
| 01-01-02 | 01 | 1 | TABLE-02 | manual-only | Visual inspection | N/A | ⬜ pending |
| 01-01-03 | 01 | 1 | TABLE-03 | manual-only | Visual inspection | N/A | ⬜ pending |
| 01-01-04 | 01 | 1 | TABLE-04 | manual-only | Visual inspection | N/A | ⬜ pending |
| 01-02-01 | 02 | 1 | TABLE-05 | manual-only | Interactive test | N/A | ⬜ pending |
| 01-02-02 | 02 | 1 | TABLE-06 | manual-only | Interactive test | N/A | ⬜ pending |
| 01-03-01 | 03 | 1 | TABLE-07 | manual-only | Interactive test | N/A | ⬜ pending |
| 01-03-02 | 03 | 1 | TABLE-08 | manual-only | Interactive test | N/A | ⬜ pending |
| 01-03-03 | 03 | 1 | TABLE-09 | manual-only | Visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

- TypeScript compilation catches type errors
- ESLint catches code quality issues
- Build verification ensures deployable output

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Order columns display correctly | TABLE-01 | UI visual | Load page, verify all columns visible with correct data |
| Product combines texture + formula | TABLE-02 | UI visual | Check Product column shows "Texture Formula" format |
| Status badges render correctly | TABLE-03 | UI visual | Verify each status type shows correct color/style |
| Red dot shows for hasChanges | TABLE-04 | UI visual | Find order with changes, verify red dot visible |
| Status pills filter correctly | TABLE-05 | UI interactive | Click each status pill, verify table filters |
| Has changes toggle works | TABLE-06 | UI interactive | Toggle filter, verify only changed orders show |
| Search filters by customer/product | TABLE-07 | UI interactive | Type search terms, verify filtering and highlighting |
| Row selection highlights | TABLE-08 | UI interactive | Click rows, verify highlight appears |
| Empty state displays | TABLE-09 | UI visual | Filter to no results, verify empty message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
