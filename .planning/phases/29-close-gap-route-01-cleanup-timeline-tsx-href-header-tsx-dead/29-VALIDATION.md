---
phase: 29
slug: close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-12
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

| Task ID (planner) | Decision | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD-tdd | D-06 → D-05 (Timeline href, TDD) | 1 | ROUTE-01 | component | `npm test -- --testPathPattern=Timeline` | ✅ | ⬜ pending |
| TBD-tdd | D-11 (Header dead branches, TDD) | 1 | ROUTE-01 | component | `npm test -- --testPathPattern=Header` | ✅ | ⬜ pending |
| TBD | D-07 + D-08 (settings → DashboardLayout) | 1 | NAV-02 | manual / dev-server | dev-server inspection | ✅ (existing tests deferred) | ⬜ pending |
| TBD | D-09 (delete production-smoke.spec) | 1 | — | negative-existence | `[ ! -f e2e/production-smoke.spec.ts ]` | ✅ | ⬜ pending |
| TBD | D-09b (playwright project entry cleanup) | 1 | — | config | `grep -c production-smoke playwright.config.ts` → 0 | ✅ | ⬜ pending |
| TBD | D-10 (route-protection paths) | 1 | — | E2E | `npm run test:e2e -- --project=chromium route-protection` | ✅ | ⬜ pending |
| TBD | D-12 (delete checkRole) | 2 | ACCESS-02 | unit + negative-existence | `npm test -- --testPathPattern=auth` + `grep checkRole src/lib/auth.ts` → 0 | ✅ | ⬜ pending |
| TBD | D-13 (REQUIREMENTS ACCESS-02 edit) | 2 | ACCESS-02 | docs grep | `grep -c checkRole .planning/REQUIREMENTS.md` → 0 | ✅ | ⬜ pending |
| TBD | D-14 (jest testPathIgnorePatterns) | 1 | — | config | `npm test -- --listTests \| grep e2e` → empty | ✅ | ⬜ pending |
| TBD | D-15 (12 tsc fixture errors) | 1 | — | type-check | `npx tsc --noEmit` exit 0 | ✅ | ⬜ pending |
| TBD | D-16 (Playwright env override) | 1 | — | config | `npm run test:e2e -- --project=demo-user` connects to localhost:3000 | ✅ | ⬜ pending |
| TBD | D-17 (Tailwind @source exclude) | 1 | — | manual | dev-server startup; no Tailwind warnings for `.planning/**/*.md` | ✅ | ⬜ pending |

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

**Approval:** pending — planner must attach concrete task IDs and re-sign.
