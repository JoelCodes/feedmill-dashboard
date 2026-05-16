---
phase: 36
slug: close-gap-build-01-void-cast-phase-35-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-15
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: 36-RESEARCH.md §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 + `@testing-library/react` 16 |
| **Config file** | `jest.config.ts` (root) |
| **Quick run command** | `npm test -- --testPathPattern='BlockedAlertBand'` |
| **Full suite command** | `npm test` |
| **Build gate** | `npm run build` (PROD-06 / BUILD-01 integration check) |
| **Estimated runtime** | ~3s quick · ~60s full · ~10s build |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern='BlockedAlertBand'` (~3s)
- **After every plan wave:** Run `npm test` (~60s) + `npm run build` (~10s, post BUILD-01)
- **Before `/gsd:verify-work`:** Full suite green AND `npm run build` exits 0 AND `35-UAT.md status: complete` AND `35-VERIFICATION.md status: verified` AND `35-VALIDATION.md status: complete`.
- **Max feedback latency:** 3s (quick) / 70s (full + build)

---

## Per-Task Verification Map

> Plan IDs are placeholders pending planner output; verification cells will be filled
> when PLAN.md files are emitted. Each row anchors a phase requirement to a concrete
> automated or manual gate already cited in 36-RESEARCH.md §Phase Requirements → Test Map.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 36-01-01 | 01 | 0 | PROD-06 | — | Regression test asserts `void setQuery` is present inside `startTransition` callback in `BlockedAlertBand.tsx:44` | unit (source-grep) | `npm test -- --testPathPattern='BlockedAlertBand'` | ✅ existing test file extended | ⬜ pending |
| 36-01-02 | 01 | 0 | PROD-06 | — | `BlockedAlertBand.tsx:44` matches the canonical `void`-cast pattern; `npm run build` exits 0 | integration (build) | `npm run build` | n/a — build IS the test | ⬜ pending |
| 36-02-01 | 02 | 1 | KPI-01..08 | — | `35-VERIFICATION.md` exists with `status: verified` and 8/8 KPI rows SATISFIED | document | `test -f .planning/phases/35-kpi-sections-and-role-specific-metrics/35-VERIFICATION.md` | ❌ — created by this task | ⬜ pending |
| 36-03-01 | 03 | 2 | KPI-01..08 | — | `35-UAT.md` skeleton exists with all 5 UAT scenarios specified | document | `test -f .planning/phases/35-kpi-sections-and-role-specific-metrics/35-UAT.md` | ❌ — created by this task | ⬜ pending |
| 36-03-02 | 03 | 2 | KPI-01..08, KPI-06 (post-SQL-fix) | — | Operator UAT pass recorded; UAT-3 confirms `getSevenDayTrend` clean under multiple tz, no `42803` errors | manual UAT | `checkpoint:human-verify` | n/a — checkpoint | ⬜ pending |
| 36-04-01 | 04 | 3 | KPI-01..08 | — | `35-VALIDATION.md` frontmatter mutated: `status: complete`, `nyquist_compliant: true`, `wave_0_complete: true` | document | `grep -E 'status:\|nyquist_compliant:\|wave_0_complete:' .planning/phases/35-.../35-VALIDATION.md` | ✅ existing file edited | ⬜ pending |
| 36-05-01 | 05 | 4 | (housekeeping) | — | STATE.md + ROADMAP.md reflect Phase 36 complete, v2.0 shippable | document | `gsd-sdk query roadmap.get-phase 36 --pick goal` returns canonical goal text (not `[To be planned]`) | ✅ existing files edited | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/BlockedAlertBand.test.tsx` — **EXTEND** with one source-grep regression test asserting `void setQuery` inside `startTransition` callback (file exists; no new infra required).
- [ ] `npm run build` — used as the integration-level gate after the void-cast fix lands; no new tooling required.
- [ ] `35-VERIFICATION.md` — new artifact at the Phase 35 directory; structural analog is `34-VERIFICATION.md`.
- [ ] `35-UAT.md` — new artifact at the Phase 35 directory; structural analog is `34-HUMAN-UAT.md`.

*No new test framework install. No new dependencies. Phase 35's existing Jest/RTL infrastructure covers all of Phase 36's automated needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| KPI strip visual rendering | KPI-01, KPI-02, KPI-04, KPI-05 | Visual composition / spacing | Load `/` as authenticated `mill_operator`; screenshot; compare to `35-UI-SPEC.md` |
| Tz cookie flow + fallback | KPI-01, KPI-06 | Browser-API behavior | DevTools cookie inspection + reload before TzBootstrap mounts; confirm fallback to `America/Chicago` |
| 7-day trend chart post-SQL-fix retest | KPI-06 | Real Postgres semantics; mocked DB cannot exercise GROUP BY/AT TIME ZONE | Switch browser tz; observe chart renders 7 bars; check server logs for `42803` (must be absent) |
| Overdue badge rendering | KPI-08 | Data correlation visual check | Confirm seeded rows with `earlyDeliveryDate < today` render the "Overdue" badge in BlockedExceptionList |
| Formula-mix breakdown null-state | KPI-05 | Em-dash render path is a UI judgment call (35-LEARNINGS.md decision) | Force a Completed-today set where all rows have NULL textureType; confirm em-dash, not 0% |

---

## Nyquist Sampling Justification

Nyquist (sample at >2× the highest-frequency change) applies as: **every task commit MUST run `npm test -- BlockedAlertBand`** for the only behaviorally-changing task (Plan 01). All other tasks are documentation-only; they're verified by plan-checker pattern matching against the analog structure (34-VERIFICATION.md / 34-HUMAN-UAT.md).

The 5 post-phase SQL fix commits on `getSevenDayTrend` (`ba54b4a..24b34bf`) are exactly the kind of regression Nyquist sampling exists to catch — they landed *outside* the per-task verify cadence and were never validated by Phase 35's closing UAT cycle. Phase 36's UAT-3 retroactively closes that sampling gap.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify OR a `checkpoint:human-verify` step
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (Task 4 manual UAT is the single allowed pause)
- [ ] Wave 0 covers all MISSING references (regression test + build gate)
- [ ] No watch-mode flags (`--watch` / `--watchAll` forbidden in plans)
- [ ] Feedback latency < 70s for full + build cycle
- [ ] `nyquist_compliant: true` set in frontmatter after Wave-0 green

**Approval:** pending
