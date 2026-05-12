---
phase: 29
slug: close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-12
approved: 2026-05-12
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `29-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (via `next/jest`) + Playwright (E2E) |
| **Config file** | `jest.config.ts`, `playwright.config.ts` (project root) |
| **Quick run command** | `npm test -- --testPathPattern=<scope>` |
| **Full suite command** | `npm test` + `npm run test:e2e` |
| **Type-check** | `npx tsc --noEmit` |
| **Estimated runtime** | ~30s Jest, ~2 min E2E full |

---

## Sampling Rate

- **After every task commit:** Run targeted Jest command per task (see Per-Task Verification Map)
- **After every plan wave:** `npm test` (full Jest suite)
- **Before `/gsd-verify-work`:** `npm test` green + `npx tsc --noEmit` exit 0 + targeted E2E pass
- **Max feedback latency:** ≤ 30s for unit/component, ≤ 2min for E2E

---

## Per-Task Verification Map

| Task ID | Plan | Decision | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|------|-------------|-----------|-------------------|-------------|--------|
| 29-01-T1 (RED) | 29-01 | D-06 (Timeline href test) | 1 | ROUTE-01 | component | `npm test -- --testPathPattern=Timeline` | ✅ | ⬜ pending |
| 29-01-T2 (GREEN) | 29-01 | D-05 (Timeline href fix) | 1 | ROUTE-01 | component | `npm test -- --testPathPattern=Timeline` | ✅ | ⬜ pending |
| 29-02-T1 (RED) | 29-02 | D-11 (Header title test) | 1 | ROUTE-01 | component | `npm test -- --testPathPattern=Header` | ✅ | ⬜ pending |
| 29-02-T2 (GREEN) | 29-02 | D-11 (Header dead-branch delete) | 1 | ROUTE-01 | component | `npm test -- --testPathPattern=Header` | ✅ | ⬜ pending |
| 29-03-T1 | 29-03 | D-07 + D-08 (settings → DashboardLayout) | 1 | NAV-02 | tsc + manual / dev-server | `npx tsc --noEmit` clean for settings/page.tsx | ✅ | ⬜ pending |
| 29-04-T1 | 29-04 | D-09 + D-09b (atomic spec + playwright project delete) | 1 | ROUTE-01 | negative-existence | `[ ! -f e2e/production-smoke.spec.ts ]` AND `grep -c production-smoke playwright.config.ts` → 0 | ✅ | ⬜ pending |
| 29-04-T2 | 29-04 | D-10 (route-protection paths + PROT-02 body) | 1 | ROUTE-01 | E2E + negative-existence | `grep -cE "'/orders'\|'/customers'\|'/mill-production'" e2e/route-protection.spec.ts` → 0 | ✅ | ⬜ pending |
| 29-04-T3 | 29-04 | D-16 (Playwright env override) | 1 | ROUTE-01 | config | `grep -c "baseURL: 'http://localhost:3000'" playwright.config.ts` ≥ 1 | ✅ | ⬜ pending |
| 29-05-T1 | 29-05 | D-12 (delete checkRole + 5 tests) | 1 | ACCESS-02 | unit + negative-existence | `npm test -- --testPathPattern=auth` + `grep checkRole src/lib/auth.ts` → 0 | ✅ | ⬜ pending |
| 29-05-T2 | 29-05 | D-13 (REQUIREMENTS ACCESS-02 edit) | 1 | ACCESS-02 | docs grep | `grep -c checkRole .planning/REQUIREMENTS.md` → 0 | ✅ | ⬜ pending |
| 29-06-T1 | 29-06 | D-14 (jest testPathIgnorePatterns) | 1 | — | config | `npm test -- --listTests \| grep -c e2e/` → 0 | ✅ | ⬜ pending |
| 29-06-T2 | 29-06 | D-15 (tokens.test.ts /s flag) | 1 | — | type-check | `npx tsc --noEmit 2>&1 \| grep tokens.test.ts \| wc -l` → 0 | ✅ | ⬜ pending |
| 29-06-T3 | 29-06 | D-15 (theme.test.tsx null assertions) | 1 | — | type-check | `npx tsc --noEmit 2>&1 \| grep theme.test.tsx \| wc -l` → 0 | ✅ | ⬜ pending |
| 29-06-T4 | 29-06 | D-15 (OrderDetails + customerSort fixtures) | 1 | — | type-check | `npx tsc --noEmit 2>&1 \| grep -E "(OrderDetails\|customerSort)" \| wc -l` → 0 | ✅ | ⬜ pending |
| 29-06-T5 | 29-06 | D-17 (Tailwind @source exclude verify) | 1 | — | manual | `grep -E "@source not" src/app/globals.css` ≥ 1 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Note: task IDs marked TBD until planner assigns. Planner MUST cross-reference each task to its decision and validation row.*

---

## Negative-Existence Assertions (deletions)

These tasks succeed only when code/files NO LONGER exist:

| Deleted Item | Verification Command | Expected Result |
|-------------|---------------------|-----------------|
| `e2e/production-smoke.spec.ts` | `ls e2e/production-smoke.spec.ts` | exit 2 (no such file) |
| `checkRole` function | `grep -c "export.*checkRole" src/lib/auth.ts` | 0 |
| `checkRole` describe block | `grep -c "describe.*checkRole" src/lib/__tests__/auth.test.ts` (or actual location) | 0 |
| Legacy `/orders` Header branch | `grep -c "startsWith.*'/orders'" src/components/Header.tsx` | 0 |
| `production-smoke` playwright project | `grep -c "production-smoke" playwright.config.ts` | 0 |
| Old E2E paths in route-protection | `grep -cE "'/orders'\|'/customers'\|'/mill-production'" e2e/route-protection.spec.ts` | 0 |

---

## Wave 0 Requirements

None. All test infrastructure exists. The only "new" test work is updating existing assertions:
- `src/components/ui/Timeline.test.tsx` line 82 — update assertion (D-06)
- `src/components/__tests__/Header.test.tsx` (or actual location) — add title-text assertion for `getPageTitle('/orders')` returning `'Dashboard'` after D-11

*Wave 0 complete: true* (no scaffolding needed)

---

## Manual-Only Verifications

| Behavior | Decision | Why Manual | Test Instructions |
|----------|----------|------------|-------------------|
| `/settings` page renders sidebar + header + content via DashboardLayout | D-07 | Existing settings tests are pre-failing (D-08 defers); no isolated component test for layout wrapping | Start `npm run dev`, visit `/settings`, verify sidebar visible on left and Header on top (Phase 28 visual baseline applies) |
| Tailwind dev-server perf | D-17 | Performance/log-output observation, not assertion | Start `npm run dev`, watch console — no Tailwind warnings scanning `.planning/**/*.md` |

---

## Validation Sign-Off

- [ ] All tasks have automated verify command OR fall into the Manual-Only table above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references — N/A, none required
- [ ] No watch-mode flags
- [ ] Feedback latency < 2 min (E2E)
- [ ] `nyquist_compliant: true` set in frontmatter once planner attaches task IDs

**Approval:** approved 2026-05-12 — task IDs attached, all `<verify>` blocks map to per-task rows, plan-checker PASS.
