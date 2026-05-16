---
phase: 37
slug: v2-0-1-hygiene-cleanup-close-audit-warnings-before-ship
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-15
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | shell assertions (grep / git-diff / wc) + `node -e` (js-yaml load) + `/gsd:audit-milestone` skill |
| **Config file** | none — no test framework runs for this hygiene phase |
| **Quick run command** | per-task `<verify><automated>` blocks (one shell-grep per task) |
| **Full suite command** | `/gsd:audit-milestone v2.0` (must return `status: passed`) — Plan 37-05 Task 1 |
| **Estimated runtime** | < 30s per per-task assertion; ~3 min for full audit re-run |

---

## Sampling Rate

- **After every task commit:** Run the per-task `<verify><automated>` shell-grep.
- **After every plan wave:** Re-run the full set of Wave-1 verify commands cumulatively (4 plans × 1-6 tasks = ~15 assertions, total runtime < 2 min).
- **Before phase verification:** Plan 37-05 Task 1 runs `/gsd:audit-milestone v2.0` and gates on `status: passed`.
- **Max feedback latency:** 30 seconds per task; 3 minutes for the audit re-run.

---

## Per-Task Verification Map

> Every Phase 37 task carries a deterministic shell-grep automated assertion in its `<verify><automated>` block. No test framework involved — this is documentation/traceability hygiene.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 37-01-01 | 01 | 1 | (hygiene W1 — Phase 31 RENAME) | T-37-01 | YAML frontmatter parses post-RENAME | shell-grep | `grep -c '^requirements-completed: \[AUTH-01, AUTH-02, AUTH-03\]$' .planning/phases/31-role-expansion-and-db-infrastructure/31-01-SUMMARY.md` returns `1` | ✅ existing SUMMARY | ⬜ pending |
| 37-01-02 | 01 | 1 | (hygiene W1 — Phase 32 RENAME/ADD ×6) | T-37-01 | All 6 SUMMARYs declare `requirements-completed:` exactly once | shell-grep loop | `D=.planning/phases/32-schema-migrations-and-seed-data; for f in 32-01 32-02 32-04 32-05 32-06 32-07; do echo "$f $(grep -c '^requirements-completed:' $D/$f-SUMMARY.md)"; done` returns `1` per file | ✅ existing SUMMARYs | ⬜ pending |
| 37-01-03 | 01 | 1 | (hygiene W1 — Phase 33 ADD/POPULATE ×7) | T-37-01 | All 7 SUMMARYs declare `requirements-completed:` exactly once | shell-grep loop | `D=.planning/phases/33-server-actions-queries-and-bulk-import; for f in 33-01 33-02 33-03 33-04 33-05 33-06 33-11; do echo "$f $(grep -c '^requirements-completed:' $D/$f-SUMMARY.md)"; done` returns `1` per file | ✅ existing SUMMARYs | ⬜ pending |
| 37-01-04 | 01 | 1 | (hygiene W1 — Phase 34 ADD ×7) | T-37-01 | All 7 SUMMARYs declare `requirements-completed:` exactly once | shell-grep loop | `D=.planning/phases/34-production-dashboard-ui-and-homepage-promotion; for f in 34-01 34-04 34-08 34-09 34-10 34-11 34-12; do echo "$f $(grep -c '^requirements-completed:' $D/$f-SUMMARY.md)"; done` returns `1` per file | ✅ existing SUMMARYs | ⬜ pending |
| 37-01-05 | 01 | 1 | (hygiene W1 — Phase 35 RENAME/ADD ×7) | T-37-01 | All 7 SUMMARYs declare `requirements-completed:` exactly once | shell-grep loop | `D=.planning/phases/35-kpi-sections-and-role-specific-metrics; for f in 35-01 35-02 35-03 35-04 35-05 35-06 35-07; do echo "$f $(grep -c '^requirements-completed:' $D/$f-SUMMARY.md)"; done` returns `1` per file | ✅ existing SUMMARYs | ⬜ pending |
| 37-01-06 | 01 | 1 | (hygiene W1 — atomic commit + D-11/D-13 invariants) | T-37-01 | Single commit touches exactly 22 files; audit records untouched | git-log + git-diff | `git log -1 --name-only --pretty=format:'' | grep -v '^$' | sort -u | wc -l | tr -d ' '` returns `22` | ✅ post-commit | ⬜ pending |
| 37-02-01 | 02 | 1 | (hygiene W2 — Zone 1 checkbox flips ×45) | T-37-02 | 45 `[x]` v2.0 requirements present, 0 `[ ]` remain | shell-grep | `grep -cE '^- \[x\] \*\*(DATA\|AUTH\|PROD\|TRANS\|IMPORT\|KPI)-[0-9][0-9]\*\*:' .planning/REQUIREMENTS.md` returns `45` | ✅ existing | ⬜ pending |
| 37-02-02 | 02 | 1 | (hygiene W2 — Zone 2 table cell flips ×45) | T-37-02 | 45 `\| Complete \|` cells; 0 `\| Pending \|` cells | shell-grep | `grep -c '\| Complete \|' .planning/REQUIREMENTS.md` returns `45` | ✅ existing | ⬜ pending |
| 37-02-03 | 02 | 1 | (hygiene W2 — atomic commit) | T-37-02 | Single commit touches `.planning/REQUIREMENTS.md` only | git-log | `git log -1 --name-only --pretty=format:'' | grep -v '^$'` returns `.planning/REQUIREMENTS.md` | ✅ post-commit | ⬜ pending |
| 37-03-01 | 03 | 1 | (hygiene W3 — 33-HUMAN-UAT.md amendment per closure protocol Steps 3+4) | T-37-03 | `status: gaps_closed` + `result: closed_in_phase_34 (...)` present; old values absent | shell-grep ×4 | `grep -c '^status: gaps_closed$' .planning/phases/33-server-actions-queries-and-bulk-import/33-HUMAN-UAT.md` returns `1`; `grep -c '^result: closed_in_phase_34' .planning/phases/33-server-actions-queries-and-bulk-import/33-HUMAN-UAT.md` returns `1` | ✅ existing | ⬜ pending |
| 37-04-01 | 04 | 1 | (hygiene W4 — clear missing_artifacts) | T-37-04 | `missing_artifacts: []` present once; no stale filename references in frontmatter | shell-grep | `grep -c '^missing_artifacts: \[\]$' .planning/phases/35-kpi-sections-and-role-specific-metrics/35-LEARNINGS.md` returns `1` | ✅ existing | ⬜ pending |
| 37-05-01 | 05 | 2 | (hygiene W5 — audit re-run; status: passed) | T-37-05 | New `v2.0-MILESTONE-AUDIT.md` has `status: passed`; 4 tech-debt items absent | grep + audit-skill | `grep -c '^status: passed$' .planning/v2.0-MILESTONE-AUDIT.md` returns `1` | ✅ skill-written | ⬜ pending |
| 37-05-02 | 05 | 2 | (hygiene W5 — ROADMAP/STATE ship indicator flip; D-13 invariant) | T-37-05, T-37-SC | ROADMAP shows ✅; STATE shows `completed_phases: 7`; audit records untouched by Phase 37 commits | grep + git-log | `grep -c '^- ✅ \*\*v2.0 Mill Production MVP\*\*' .planning/ROADMAP.md` returns `1`; `grep -c '^  completed_phases: 7$' .planning/STATE.md` returns `1`; `git log 37-01..HEAD --oneline -- .planning/v2.0-MILESTONE-AUDIT.md .planning/integration-check-v2.0-postphase37.md \| grep -v 'audit-milestone' \| wc -l \| tr -d ' '` returns `0` | ✅ post-flip | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

This phase has **no Wave 0** test infrastructure to install. Rationale:
- No business logic, API, or data transform to test.
- Each task's verify command is a one-shot shell grep, fully self-contained.
- Composite assertion (Plan 37-05 Task 1) is the `/gsd:audit-milestone` skill itself, already on PATH.

`wave_0_complete: false` in frontmatter is correct: no Wave 0 work is required for this hygiene phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/gsd:audit-milestone v2.0` produces a NEW `v2.0-MILESTONE-AUDIT.md` with `status: passed` and no warnings | Phase 37 success criterion #5 | Skill orchestration is interactive — cannot run inside an embedded shell assertion non-interactively | Plan 37-05 Task 1 (`checkpoint:human-action`): operator runs `/gsd:audit-milestone v2.0`, then sanity-checks the new audit per Task 1 `<how-to-verify>` block |
| ROADMAP.md ship indicator flipped to ✅ + `(shipped YYYY-MM-DD)` | Phase 37 success criterion #5 | Ship date is operator-determined (extracted from audit `audited:` timestamp OR supplied in resume-signal) | Plan 37-05 Task 2 (`auto`, after Task 1 approval): editor flips ROADMAP + STATE per Interfaces section |

---

## Validation Sign-Off

- [x] All tasks have `<verify><automated>` shell-grep verify (no test framework needed — see Per-Task Verification Map above)
- [x] Sampling continuity: no 3 consecutive tasks without an installed shell assertion (every task has one)
- [x] Wave 0 covers: N/A for this hygiene phase (rationale documented above; `wave_0_complete: false` is correct)
- [x] No watch-mode flags
- [x] Feedback latency < 30s per task; < 3 min for full audit re-run
- [x] `nyquist_compliant: true` set in frontmatter — per-task Nyquist Dimension 8 (shell-grep assertions) covers all 13 tasks across 5 plans
- [ ] Final task: `/gsd:audit-milestone v2.0` returns `status: passed` (no warnings) — phase-completion gate (Plan 37-05 Task 1)

**Approval:** validated by planner 2026-05-15
