---
phase: 18
slug: page-migration
status: draft
nyquist_compliant: true
wave_0_complete: false
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
| **Estimated runtime** | ~5 seconds (179 tests) |

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
| MIG-01 | Orders page uses only tokens/components | integration + unit | `npm test -- OrdersTable.test` | ✅ exists | ⬜ pending |
| MIG-02 | Customers page uses only tokens/components | integration + unit | `npm test -- customers/page.test` | ✅ exists | ⬜ pending |
| MIG-03 | Mill Production page uses only tokens/components | unit | `npm test -- mill-production` | ❌ Wave 0 | ⬜ pending |
| MIG-04 | Settings page uses theme toggle + tokens | integration | `npm test -- settings` | ❌ Wave 0 | ⬜ pending |
| MIG-05 | ESLint reports zero hardcoded value violations | static analysis | `npm run lint 2>&1 \| grep "custom/no-hardcoded-values" \| wc -l` | N/A (ESLint) | ⬜ pending |

---

## Token Usage Validation Pattern

All migrated components follow the StatusBadge.test.tsx pattern:

| Behavior | Test Type | Automated Command | Source Pattern |
|----------|-----------|-------------------|----------------|
| Component uses var(--tokens) not hardcoded hex | unit | `npm test -- {Component}.test` | StatusBadge.test.tsx |
| No #hex or [Npx] patterns in className | unit | Verify via test assertion | StatusBadge.test.tsx lines 45-62 |

---

## Wave 0 Requirements

- [ ] `src/app/mill-production/__tests__/page.test.tsx` — covers MIG-03 (mill production token usage)
- [ ] `src/app/settings/__tests__/page.test.tsx` — covers MIG-04 (settings + theme toggle integration)

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
- [ ] Wave 0 covers all MISSING references (mill-production, settings tests)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
