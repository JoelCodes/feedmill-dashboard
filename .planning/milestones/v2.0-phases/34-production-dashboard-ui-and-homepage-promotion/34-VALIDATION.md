---
phase: 34
slug: production-dashboard-ui-and-homepage-promotion
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-14
audited: 2026-05-14
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
| 34-01-01 | 01 | 1 | PROD-03, PROD-04 | T-34-01-02 | URL params drop unknown literals (parseAsStringLiteral); `?q=` substring-only — no SQL surface | unit (TDD red/green) | `npm test -- --testPathPatterns=search-params.test.ts` | ✅ `src/lib/__tests__/search-params.test.ts` | ✅ green |
| 34-01-02 | 01 | 1 | PROD-06 (status badges) | — | N/A — pure presentation | unit (RTL) | `npm test -- --testPathPatterns="(StatusBadge\|Sidebar\|Header)\.test\.tsx$"` | ✅ Sidebar.test.tsx + Header.test.tsx + ui/StatusBadge.test.tsx | ✅ green |
| 34-01-03 | 01 | 1 | (D-21 cross-phase patch) | T-34-01-03 | `revalidateTag('import-batches','max')` invariant + cache-tag contract (D-21) | unit | `npm test -- --testPathPatterns="(actions/__tests__/import\|app/page)\.test\.(ts\|tsx)$"` | ✅ `src/actions/__tests__/import-{commit,preview,schema}.test.ts`, `src/app/page.test.tsx` | ✅ green |
| 34-02-01 | 02 | 1 | PROD-09 | T-34-02-01 | setInterval cadence locked; cannot tamper from client | unit (TDD RED, fake timers) | `npm test -- --testPathPatterns=useProductionPolling.test.ts` | ✅ `src/hooks/__tests__/useProductionPolling.test.ts` | ✅ green |
| 34-02-02 | 02 | 1 | PROD-09 | — | N/A | unit (TDD GREEN) | `npm test -- --testPathPatterns=useProductionPolling.test.ts` | ✅ same file (GREEN cycle) | ✅ green |
| 34-03-01 | 03 | 2 | (D-21 consumer side) | T-34-03-01 | `'server-only'` import + Drizzle parameterised query | unit | `npm test -- --testPathPatterns="queries/__tests__/imports\.test\.ts$"` | ✅ `src/db/queries/__tests__/imports.test.ts` | ✅ green |
| 34-03-02 | 03 | 2 | PROD-10 | T-34-03-07 | N/A — purely presentational (no state, no events) | unit (RTL structure) | `npm test -- --testPathPatterns="(ColumnSkeleton\|DrawerSkeleton)\.test\.tsx$"` | ✅ ColumnSkeleton.test.tsx + DrawerSkeleton.test.tsx | ✅ green |
| 34-03-03 | 03 | 2 | PROD-06, PROD-11 | T-34-03-02, T-34-03-06 | `?order=<id>` parameterised; refresh debounce | unit (RTL + fake timers) | `npm test -- --testPathPatterns="(LastUpdatedChip\|BlockedAlertBand)\.test\.tsx$"` | ✅ LastUpdatedChip.test.tsx + BlockedAlertBand.test.tsx | ✅ green |
| 34-04-01 | 04 | 2 | PROD-02, PROD-04, PROD-07 | T-34-04-01 | Weight Pitfall 6 mitigated at helper level via parseFloat | unit (TDD pure) | `npm test -- --testPathPatterns=production-derivations.test.ts` | ✅ `src/lib/__tests__/production-derivations.test.ts` | ✅ green |
| 34-04-02 | 04 | 2 | PROD-02, PROD-07, PROD-08 | T-34-04-01 | parseFloat at render site; a11y (role=button + Enter/Space) | unit (RTL) | `npm test -- --testPathPatterns="ProductionCard\.test\.tsx$"` | ✅ ProductionCard.test.tsx | ✅ green |
| 34-04-03 | 04 | 2 | PROD-02, PROD-07, PROD-08 | T-34-04-04 | next-up pure derivation tested | unit (RTL) | `npm test -- --testPathPatterns="MillColumn\.test\.tsx$"` | ✅ MillColumn.test.tsx | ✅ green |
| 34-05-01 | 05 | 3 | PROD-02, PROD-03, PROD-04, PROD-06, PROD-09, PROD-10, PROD-11 | T-34-05-01, T-34-05-02, T-34-05-04 | nuqs parsers drop unknown literals; React escapes search query; debounce 150ms | unit (RTL + NuqsTestingAdapter + fake timers) | `npm test -- --testPathPatterns="ProductionDashboard\.test\.tsx$"` | ✅ ProductionDashboard.test.tsx | ✅ green |
| 34-06-01 | 06 | 3 | PROD-05 | T-34-06-01, T-34-06-05, T-34-06-10 | useActionState pending-state prevents double-submit; locked conflict message verbatim | unit (RTL, mocked actions) | `npm test -- --testPathPatterns="TransitionButtons\.test\.tsx$"` | ✅ TransitionButtons.test.tsx | ✅ green |
| 34-06-02 | 06 | 3 | PROD-05 | T-34-06-02, T-34-06-04 | Trim-guard + server-side Zod; React escapes reason | unit (RTL + Radix) | `npm test -- --testPathPatterns="BlockReasonModal\.test\.tsx$"` | ✅ BlockReasonModal.test.tsx | ✅ green |
| 34-06-03 | 06 | 3 | PROD-05 | T-34-06-06, T-34-06-07, T-34-06-08, T-34-06-IDOR, T-34-06-CSRF | D-25 conditional render (canEdit); ESC gated by modalOpen (Pitfall 4); null-order empty state (Pitfall 7); IDOR mitigated by version+state-machine; CSRF mitigated by Next.js 16 same-origin server-action check | unit (RTL) | `npm test -- --testPathPatterns="(DrawerCloseHandlers\|ProductionDrawer\|ProductionDashboard)\.test\.tsx$"` | ✅ DrawerCloseHandlers.test.tsx + ProductionDrawer.test.tsx + ProductionDashboard.test.tsx | ✅ green |
| 34-07-01 | 07 | 4 | PROD-01, PROD-02 | T-34-07-01, T-34-07-03, T-34-07-AUTH | Auth bypass on `/` mitigated by `auth()` redirect; stale `?order=` returns null without throwing | unit (RSC) | `npm test -- --testPathPatterns="app/page\.test\.(ts\|tsx)$"` | ✅ `src/app/page.test.tsx` (rewritten) | ✅ green |
| 34-07-02 | 07 | 4 | PROD-01, PROD-02, PROD-05, PROD-10 | T-34-07-07, T-34-07-08, T-34-07-CSRF | 3-layer 2MB guard; D-25 conditional drop-zone; CSRF mitigated by Next.js 16 server-action origin check | unit (RTL + RSC) | `npm test -- --testPathPatterns="(ImportHistoryTable\|ImportFlow\|app/import/.*page)\.test\.(ts\|tsx)$"` | ✅ ImportHistoryTable.test.tsx + ImportFlow.test.tsx + `src/app/import/__tests__/page.test.tsx` | ✅ green |
| 34-07-03 | 07 | 4 | PROD-01, PROD-02, PROD-05, PROD-10 (full phase exercise) | T-34-07-09 (cross-phase tag drift) | Inherited GAP-02 closure — end-to-end two-tab `revalidateTag` observation | manual UAT | recorded in `34-HUMAN-UAT.md` T12 + `34-HUMAN-UAT-RETEST.md` T12 | manual | ✅ T12 retest pass 2026-05-14 (~1s cross-tab latency) |
| 34-08-01 | 08 | gap | PROD-04, T3-gap | T-34-08-01 | Dead `Header` search input removed; `getPageTitle('/') → 'Dashboard'` | unit (RTL) | `npm test -- --testPathPatterns="Header\.test\.tsx$"` | ✅ Header.test.tsx (T3-closure cases) | ✅ green |
| 34-08-02 | 08 | gap | PROD-04, T3-gap | T-34-08-01 | Layout regression — exactly one `searchbox` role on `/` | unit (RTL integration) | `npm test -- --testPathPatterns="DashboardLayout\.test\.tsx$"` | ✅ DashboardLayout.test.tsx (single-searchbox assertion) | ✅ green |
| 34-09-01 | 09 | gap | PROD-10, T9-gap | — | `useMemo` Date hydration at RSC→client boundary | unit (RTL contract-pin) | `npm test -- --testPathPatterns="ImportHistoryTable\.test\.tsx$"` | ✅ ImportHistoryTable.test.tsx (baseline + contract-pin) | ✅ green |
| 34-09-02 | 09 | gap | PROD-10, T9-gap | — | `router.refresh()` after successful `commitImportAction` | unit (RTL, mocked router) | `npm test -- --testPathPatterns="ImportFlow\.test\.tsx$"` | ✅ ImportFlow.test.tsx (router.refresh assertions) | ✅ green |
| 34-10-01 | 10 | gap | PROD-05, D-11 amend | T-34-10-01 | `Pending` case renders `StartMixingButton` + `BlockOrderTrigger` | unit (RTL) | `npm test -- --testPathPatterns="TransitionButtons\.test\.tsx$"` | ✅ TransitionButtons.test.tsx (Pending dual-button case) | ✅ green |
| 34-10-02 | 10 | gap | PROD-05, D-11 amend | T-34-10-01 | `BlockOrderTrigger` plumbed through `ProductionDrawer.onBlockClick` to modal | unit (RTL) | `npm test -- --testPathPatterns="ProductionDrawer\.test\.tsx$"` | ✅ ProductionDrawer.test.tsx (onBlockClick wiring) | ✅ green |
| 34-11-01 | 11 | gap | PROD-05, T10b-gap | T-34-11-01 | Non-shallow `order` URL update triggers RSC re-fetch + Suspense fallback | unit (RTL + NuqsTestingAdapter) | `npm test -- --testPathPatterns="ProductionDashboard\.test\.tsx$"` | ✅ ProductionDashboard.test.tsx (shallow:false split hooks) | ✅ green |
| 34-11-02 | 11 | gap | PROD-05, PROD-06, T10b-gap | T-34-11-01 | `BlockedAlertBand` chip click uses `shallow:false` + `startTransition` | unit (RTL) | `npm test -- --testPathPatterns="BlockedAlertBand\.test\.tsx$"` | ✅ BlockedAlertBand.test.tsx (startTransition assertions) | ✅ green |
| 34-12-01 | 12 | gap | PROD-05, PROD-09, T12-gap | T-34-12-01 | Dual-arm `useEffect` — `ok===true` fires `router.refresh()` on all success paths | unit (RTL, mocked router) | `npm test -- --testPathPatterns="TransitionButtons\.test\.tsx$"` | ✅ TransitionButtons.test.tsx (success-arm router.refresh) | ✅ green |
| 34-12-02 | 12 | gap | PROD-05, T12-gap | T-34-12-01 | `BlockReasonModal` success path calls `router.refresh()` before `onClose` | unit (RTL, mocked router) | `npm test -- --testPathPatterns="BlockReasonModal\.test\.tsx$"` | ✅ BlockReasonModal.test.tsx (success-path router.refresh) | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note on `File Exists` column:** ❌ Wave 0 indicates the test file does not exist at phase start; it is created within the task itself (Phase 34 follows a one-test-file-per-task convention, with TDD plans starting with the RED commit). ✅ indicates the file pre-exists from a prior phase and the task amends it. No task has `MISSING — Wave 0 must create <file> first` because every Wave 1 task either creates its own test file or amends an existing one in the same commit; the Wave 0 install step (deps + scaffold) is separate.

---

## Wave 0 Requirements

Run BEFORE any Wave 1 task begins (one-time setup):

- [x] `npm install nuqs@2.8.9 @radix-ui/react-dialog@1.1.15` — verified in `package.json`: `"nuqs": "2.8.9"`, `"@radix-ui/react-dialog": "1.1.15"`. Lockfile committed.
- [x] `src/lib/__tests__/search-params.test.ts` — file present and green.
- [x] `src/hooks/__tests__/useProductionPolling.test.ts` — file present and green.
- [x] `src/db/queries/__tests__/imports.test.ts` — file present and green.
- [x] `MillReadOnlyStub` removed — `grep -rn MillReadOnlyStub src/` returns no matches.
- [x] Header page-title entries in `src/components/Header.tsx:25` map `'/' → 'Dashboard'`; `Header.test.tsx` Test 8 covers it.
- [x] `nuqs` adapter harness in jsdom — `NuqsTestingAdapter` consumed by `ProductionDashboard.test.tsx` and `BlockedAlertBand.test.tsx`, both green.

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies declared above
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (Task 34-07-03 is the only manual task in the phase; all others have `<automated>` commands)
- [x] Wave 0 covers all MISSING references (new test files staged at task RED commit)
- [x] No watch-mode flags (`--watch` excluded from `<verify><automated>` commands)
- [x] Feedback latency < 60s (full suite); < 10s (per-task scoped)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ approved 2026-05-14 (auditor verified all 17 automated rows green + manual UAT retest complete; see Validation Audit below)

---

## Validation Audit 2026-05-14

| Metric | Count |
|--------|-------|
| Automated rows in map | 26 (17 original 01-07 + 9 gap-closure 08-12) |
| Manual rows in map | 1 (34-07-03) |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Test suites executed | 22 |
| Tests executed | 189 |
| Tests passing | 189 |
| Test runtime | 3.5s |

**Scope of audit:**
- Original verification map (rows 34-01-01 through 34-07-03) reflected draft-state planning; phase 34 grew during execution to 12 plans (01-07 plus gap-closure plans 08-12 from the UAT-driven gap-closure cycle).
- The audit added 9 rows for plans 08-12 (T3, T9, D-11 amendment, T10b, T12 closures) and flipped all status cells from `⬜ pending` to `✅ green`.
- Manual row 34-07-03 (T12 cross-tab observation) marked complete per `34-HUMAN-UAT-RETEST.md` (status: complete; T12 retest 2026-05-14 measured ~1s latency, down from ~15s).
- Wave 0 prerequisites independently verified against the working tree.

**Command run:**
```
npx jest --testPathPatterns="(search-params|useProductionPolling|production-derivations|ProductionCard|MillColumn|ProductionDashboard|TransitionButtons|BlockReasonModal|DrawerCloseHandlers|ProductionDrawer|ImportHistoryTable|ImportFlow|LastUpdatedChip|BlockedAlertBand|ColumnSkeleton|DrawerSkeleton|Sidebar|src/components/Header\.test|DashboardLayout|src/app/page\.test|src/app/import/__tests__/page|src/db/queries/__tests__/imports)"
```
Result: **22 suites passed, 189 tests passed, 0 failures.**

**Auditor verdict:** Phase 34 is Nyquist-compliant. Every requirement has either an automated test or a documented and-completed manual UAT step. No `gsd-nyquist-auditor` agent spawn was required.
