---
phase: 34
slug: production-dashboard-ui-and-homepage-promotion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 (jsdom environment, unit + integration) + Playwright 1.59.1 (E2E) |
| **Config file** | `jest.config.ts` (root); `jest.setup.ts`; `playwright.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern=<pattern>` |
| **Full suite command** | `npm test` (Jest) + `npm run test:e2e` (Playwright) |
| **Estimated runtime** | Jest: ~30-45s (current suite + ~19 new bundles ≈ ~120 test cases ≈ ~45-60s after Phase 34). Playwright `mill-operator-smoke.spec.ts`: ~30s. |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=<task-specific>` (the task's `<verify><automated>` command — typically scoped to 1-3 test files; ≤ 10s).
- **After every plan wave:** Run `npm test` (full Jest suite).
- **Before `/gsd-verify-work`:** Full Jest suite green + `npm run test:e2e` green + `npm run build` green.
- **Max feedback latency:** ≤ 10s for the task-scoped command; ≤ 60s for the full Jest suite.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 34-01-01 | 01 | 1 | PROD-03, PROD-04 | T-34-01-02 | URL params drop unknown literals (parseAsStringLiteral); `?q=` substring-only — no SQL surface | unit (TDD red/green) | `npm test -- --testPathPattern=search-params.test.ts` | ❌ Wave 0 — new file `src/lib/__tests__/search-params.test.ts` | ⬜ pending |
| 34-01-02 | 01 | 1 | PROD-06 (status badges) | — | N/A — pure presentation | unit (RTL) | `npm test -- --testPathPattern="(StatusBadge\|Sidebar\|Header)\.test\.tsx$"` | ❌ Wave 0 — Sidebar.test.tsx + Header.test.tsx pre-exist; new cases added | ⬜ pending |
| 34-01-03 | 01 | 1 | (D-21 cross-phase patch) | T-34-01-03 | `revalidateTag('import-batches','max')` invariant + cache-tag contract (D-21) | unit | `npm test -- --testPathPattern="(actions/__tests__/import\|app/page)\.test\.(ts\|tsx)$"` | ✅ exists (`src/actions/__tests__/import.test.ts`, `src/app/page.test.tsx`); new cases added | ⬜ pending |
| 34-02-01 | 02 | 1 | PROD-09 | T-34-02-01 | setInterval cadence locked; cannot tamper from client | unit (TDD RED, fake timers) | `npm test -- --testPathPattern=useProductionPolling.test.ts` (exits non-zero RED) | ❌ Wave 0 — new file `src/hooks/__tests__/useProductionPolling.test.ts` | ⬜ pending |
| 34-02-02 | 02 | 1 | PROD-09 | — | N/A | unit (TDD GREEN) | `npm test -- --testPathPattern=useProductionPolling.test.ts` | ❌ Wave 0 — same file created in 34-02-01 | ⬜ pending |
| 34-03-01 | 03 | 2 | (D-21 consumer side) | T-34-03-01 | `'server-only'` import + Drizzle parameterised query | unit | `npm test -- --testPathPattern="queries/__tests__/imports\.test\.ts$"` | ❌ Wave 0 — new file `src/db/queries/__tests__/imports.test.ts` | ⬜ pending |
| 34-03-02 | 03 | 2 | PROD-10 | T-34-03-07 | N/A — purely presentational (no state, no events) | unit (RTL structure) | `npm test -- --testPathPattern="(ColumnSkeleton\|DrawerSkeleton)\.test\.tsx$"` | ❌ Wave 0 — new files | ⬜ pending |
| 34-03-03 | 03 | 2 | PROD-06, PROD-11 | T-34-03-02, T-34-03-06 | `?order=<id>` parameterised; refresh debounce | unit (RTL + fake timers) | `npm test -- --testPathPattern="(LastUpdatedChip\|BlockedAlertBand)\.test\.tsx$"` | ❌ Wave 0 — new files | ⬜ pending |
| 34-04-01 | 04 | 2 | PROD-02, PROD-04, PROD-07 | T-34-04-01 | Weight Pitfall 6 mitigated at helper level via parseFloat | unit (TDD pure) | `npm test -- --testPathPattern=production-derivations.test.ts` | ❌ Wave 0 — new file | ⬜ pending |
| 34-04-02 | 04 | 2 | PROD-02, PROD-07, PROD-08 | T-34-04-01 | parseFloat at render site; a11y (role=button + Enter/Space) | unit (RTL) | `npm test -- --testPathPattern="ProductionCard\.test\.tsx$"` | ❌ Wave 0 — new file | ⬜ pending |
| 34-04-03 | 04 | 2 | PROD-02, PROD-07, PROD-08 | T-34-04-04 | next-up pure derivation tested | unit (RTL) | `npm test -- --testPathPattern="MillColumn\.test\.tsx$"` | ❌ Wave 0 — new file | ⬜ pending |
| 34-05-01 | 05 | 3 | PROD-02, PROD-03, PROD-04, PROD-06, PROD-09, PROD-10, PROD-11 | T-34-05-01, T-34-05-02, T-34-05-04 | nuqs parsers drop unknown literals; React escapes search query; debounce 150ms | unit (RTL + NuqsTestingAdapter + fake timers) | `npm test -- --testPathPattern="ProductionDashboard\.test\.tsx$"` | ❌ Wave 0 — new file | ⬜ pending |
| 34-06-01 | 06 | 3 | PROD-05 | T-34-06-01, T-34-06-05, T-34-06-10 | useActionState pending-state prevents double-submit; locked conflict message verbatim | unit (RTL, mocked actions) | `npm test -- --testPathPattern="TransitionButtons\.test\.tsx$"` | ❌ Wave 0 — new file | ⬜ pending |
| 34-06-02 | 06 | 3 | PROD-05 | T-34-06-02, T-34-06-04 | Trim-guard + server-side Zod; React escapes reason | unit (RTL + Radix) | `npm test -- --testPathPattern="BlockReasonModal\.test\.tsx$"` | ❌ Wave 0 — new file | ⬜ pending |
| 34-06-03 | 06 | 3 | PROD-05 | T-34-06-06, T-34-06-07, T-34-06-08, T-34-06-IDOR, T-34-06-CSRF | D-25 conditional render (canEdit); ESC gated by modalOpen (Pitfall 4); null-order empty state (Pitfall 7); IDOR mitigated by version+state-machine; CSRF mitigated by Next.js 16 same-origin server-action check | unit (RTL) | `npm test -- --testPathPattern="(DrawerCloseHandlers\|ProductionDrawer\|ProductionDashboard)\.test\.tsx$"` | ❌ Wave 0 — new files (DrawerCloseHandlers, ProductionDrawer); ProductionDashboard exists from plan 05 | ⬜ pending |
| 34-07-01 | 07 | 4 | PROD-01, PROD-02 | T-34-07-01, T-34-07-03, T-34-07-AUTH | Auth bypass on `/` mitigated by `auth()` redirect; stale `?order=` returns null without throwing | unit (RSC) | `npm test -- --testPathPattern="app/page\.test\.(ts\|tsx)$"` | ✅ exists (will be rewritten in this task) | ⬜ pending |
| 34-07-02 | 07 | 4 | PROD-01, PROD-02, PROD-05, PROD-10 | T-34-07-07, T-34-07-08, T-34-07-CSRF | 3-layer 2MB guard; D-25 conditional drop-zone; CSRF mitigated by Next.js 16 server-action origin check | unit (RTL + RSC) | `npm test -- --testPathPattern="(ImportHistoryTable\|ImportFlow\|app/import/.*page)\.test\.(ts\|tsx)$"` | ❌ Wave 0 — new files (ImportHistoryTable, ImportFlow, `src/app/import/__tests__/page.test.tsx`) | ⬜ pending |
| 34-07-03 | 07 | 4 | PROD-01, PROD-02, PROD-05, PROD-10 (full phase exercise) | T-34-07-09 (cross-phase tag drift) | Inherited GAP-02 closure — end-to-end two-tab `revalidateTag` observation | manual UAT | recorded in `34-HUMAN-UAT.md` (Task 3 deliverable) | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note on `File Exists` column:** ❌ Wave 0 indicates the test file does not exist at phase start; it is created within the task itself (Phase 34 follows a one-test-file-per-task convention, with TDD plans starting with the RED commit). ✅ indicates the file pre-exists from a prior phase and the task amends it. No task has `MISSING — Wave 0 must create <file> first` because every Wave 1 task either creates its own test file or amends an existing one in the same commit; the Wave 0 install step (deps + scaffold) is separate.

---

## Wave 0 Requirements

Run BEFORE any Wave 1 task begins (one-time setup):

- [ ] `npm install nuqs@2.8.9 @radix-ui/react-dialog@1.1.15` — Plan 01 Task 1 ships this as part of the foundation commit; treat the install as a Wave 0 prerequisite. Lockfile must commit.
- [ ] `src/lib/__tests__/search-params.test.ts` — stub created in 34-01-01 (RED commit). Required before plan 01 Task 1 GREEN.
- [ ] `src/hooks/__tests__/useProductionPolling.test.ts` — stub created in 34-02-01 (RED commit). Required before plan 02 Task 2 GREEN.
- [ ] `src/db/queries/__tests__/imports.test.ts` — stub created at start of 34-03-01 (RED commit). Required before plan 03 Task 1 GREEN.
- [ ] Verify `MillReadOnlyStub` removability: `grep -rn MillReadOnlyStub src/` enumerated before the 34-01-03 deletion sweep (expected hits: `src/app/page.tsx`, `src/app/page.test.tsx`, `src/lib/auth.ts` JSDoc).
- [ ] Header strip page-title entries verified in `src/components/Header.tsx`: `getPageTitle('/') → 'Dashboard'`, `getPageTitle('/import') → 'Import'` (covered by Task 34-01-02 GREEN; ensure prior tests in `Header.test.tsx` remain green).
- [ ] Confirm test harness for `nuqs` works in jsdom: `NuqsTestingAdapter` from `nuqs/adapters/testing` available after the `npm install nuqs@2.8.9` step. Used by 34-05-01 and 34-06-03.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Three-column live dashboard renders against real DB | PROD-01, PROD-02 | Requires running dev server + signed-in mill_operator session against Neon | `npm run dev`, visit `/` while signed in as the mill_operator test user, confirm three columns (Premix / Excel / CGM) render with seed data |
| Manual URL-state survival across hard reload | PROD-03, PROD-04 | Browser back/forward + reload is browser-native; jsdom does not exercise the bfcache or URL persistence as faithfully as a real browser | Steps in `34-HUMAN-UAT.md` T3-T4 |
| Drawer open/close via real keyboard (ESC) + real backdrop click | PROD-05 | Radix Portal behavior + browser ESC focus management is best verified visually | Steps in `34-HUMAN-UAT.md` T5 |
| LastUpdatedChip 30s tick observed end-to-end (devtools Network) | PROD-09, PROD-11 | Requires running browser to observe the RSC payload reload at 30s cadence | Steps in `34-HUMAN-UAT.md` T7-T8 |
| Inherited GAP-02 — two-tab `revalidateTag` end-to-end observation | D-21 + D-26 | Cross-tab cache invalidation cannot be unit-tested at the RSC layer; requires two real browser tabs | Steps in `34-HUMAN-UAT.md` T12 (copied verbatim from `34-INHERITED-UAT.md`) |
| `npm run build` succeeds without Edge-bundle errors + `unstable_cache` deprecation warnings recorded | PROD-01 (build gate) | The deprecation surface is build-time, not Jest-time | Run `npm run build` once during 34-07 verification; record any warnings in `34-07-SUMMARY.md` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies declared above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (Task 34-07-03 is the only manual task in the phase; all others have `<automated>` commands)
- [ ] Wave 0 covers all MISSING references (new test files staged at task RED commit)
- [ ] No watch-mode flags (`--watch` excluded from `<verify><automated>` commands)
- [ ] Feedback latency < 60s (full suite); < 10s (per-task scoped)
- [ ] `nyquist_compliant: true` set in frontmatter (auditor flips this after verifying)

**Approval:** pending (awaiting auditor)
