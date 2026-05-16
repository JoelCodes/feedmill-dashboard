---
phase: 37
artifact: PATTERNS
mapped: 2026-05-15
universal_analog: .planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md
sub_analogs:
  - .planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md  # closure-protocol exemplar (W3)
  - .planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-02-SUMMARY.md  # canonical YAML shape for requirements-completed (W1)
  - .planning/milestones/v1.5-REQUIREMENTS.md  # `[x]` + `Complete` cell format (W2)
files_to_be_modified: 26  # 22 SUMMARYs (W1) + 1 REQUIREMENTS.md (W2) + 1 HUMAN-UAT (W3) + 1 LEARNINGS (W4) + ROADMAP.md + STATE.md (W5)
---

# Phase 37: v2.0.1 hygiene cleanup — Pattern Map

**Mapped:** 2026-05-15
**Files to be modified:** 26 (all under `.planning/**`; zero `src/`)
**Universal analog:** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md` (the v1.5 INT-07 SUMMARY-frontmatter backfill plan — the closest existing precedent for hygiene-only YAML/markdown traceability edits with shell-grep acceptance criteria)
**Analogs found:** 6 / 6 (every warning has an exact-shape precedent in `.planning/milestones/v1.5-phases/` or in the v1.5 REQUIREMENTS.md / 33-INHERITED-UAT.md closure protocol)

## Scope Constraint (read before consuming)

This phase is **documentation/traceability hygiene only**. RESEARCH.md §"Anti-Scope-Creep Guidance" enumerates 10 prohibited categories — chief among them:
- **Zero `src/` edits.** Verifiable by `git diff --stat` showing only `.planning/**` paths.
- **Zero new components, APIs, schemas, ADRs, or PATTERNS.**
- **No TDD plans.** All plans MUST be `type: execute` (matches v1.5 Plan 30-02 `type: execute`).
- **No Wave 0 test scaffolding.** Acceptance criteria use shell-grep + `node -e "...js-yaml..."` only (Nyquist Dimension 8).

The planner MUST mirror v1.5 Plan 30-02 line-for-line. Do NOT invent new helper scripts, new validation surfaces, or new abstractions.

---

## File Classification

Five warning classes plus the audit re-run produce one row each. Every row points to the **same universal analog** (30-02-PLAN.md) for plan structure, `<task>` shape, and acceptance-criteria style; the per-warning **target-state excerpt analog** is whichever exemplar shows the verbatim before→after for that warning class.

| Warning | New/Modified Files | Role | Data Flow | Closest Analog (plan-shape) | Closest Analog (target-state excerpt) | Match Quality |
|---------|-------------------|------|-----------|------------------------------|---------------------------------------|---------------|
| **W1** SUMMARY frontmatter backfill | 22 `*-SUMMARY.md` under `.planning/phases/3{1,2,3,4,5}-*/` | YAML frontmatter (planning metadata) | docs metadata (static cross-reference for `/gsd:audit-milestone`) | `30-02-PLAN.md` Tasks 1+2+3+4 (4 SUMMARY edits across 3 files in one atomic commit) | `29-02-SUMMARY.md:36-37` (verbatim `requirements-completed:\n  - <REQ-ID>` shape) | **exact** — same field, same hyphen convention, same 2-space indent, same insertion point between `dependency_graph:` / `dependencies:` and `tech_stack:` |
| **W2** REQUIREMENTS.md status cells | `.planning/REQUIREMENTS.md` (one file, two edit zones: lines 14-73 and lines 125-171) | markdown body (milestone-level traceability table) | docs metadata (audit `Traceability [x]` count) | `30-02-PLAN.md` Task 4 (cross-cut grep + single atomic commit) — but bulk-edit shape is novel to W2 | `.planning/milestones/v1.5-REQUIREMENTS.md:21-37` (`[x]` checkbox list) + `.planning/milestones/v1.5-REQUIREMENTS.md:73-81` (`\| Complete \|` cell shape) | **exact** — v1.5 closed out with `[x]` and `Complete`; W2 replicates uniformly across 45 cells × 2 zones |
| **W3** `33-HUMAN-UAT.md` Test #2 closure | `.planning/phases/33-server-actions-queries-and-bulk-import/33-HUMAN-UAT.md` (one file, 2 lines edited) | YAML frontmatter + markdown body (UAT closure) | docs metadata (closure of inherited-gap GAP-02) | `30-02-PLAN.md` Tasks 1/2/3 (single-file single-line edit with `<read_first>` + acceptance grep) | `34-INHERITED-UAT.md:60-66` (Closure protocol — verbatim "AMEND" + "flip" instructions) | **exact** — protocol explicitly names the two edits W3 must make |
| **W4** `35-LEARNINGS.md` `missing_artifacts` clear | `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-LEARNINGS.md` (one file, 3 lines → 1 line) | YAML frontmatter | docs metadata (clears phase-35 tech-debt item) | `30-02-PLAN.md` Task 1 (single-file YAML frontmatter edit with js-yaml validation hook) | (no external precedent needed — verbatim diff in RESEARCH.md §"Warning 4") | **exact** — same edit class as W1 (YAML frontmatter mutation) but list-clear instead of list-add |
| **W5** Audit re-run + ROADMAP/STATE ship-indicator flip | `.planning/ROADMAP.md` (lines 11, 65), `.planning/STATE.md` (progress block); skill also writes `.planning/v2.0-MILESTONE-AUDIT.md` + `.planning/integration-check-v2.0-postphase37.md` | skill invocation + markdown body edit | docs metadata (final phase gate) | `30-02-PLAN.md` Task 4 §"Step 4 (commit)" + `30-02-PLAN.md` D-13 ("do NOT edit audit records") | RESEARCH.md §"Audit Re-Run Mechanics" + `/Users/joel/.claude/skills/gsd-audit-milestone/SKILL.md` (skill orchestration) | **role-match** — no prior repo phase has done a v2.x ship-indicator flip; closest precedent is v1.5 Phase 30 closure flow which ended with `git diff --stat` audit-immutability verification (D-13). |

## Pattern Assignments

### W1 — SUMMARY frontmatter `requirements-completed` backfill (22 files)

**Analog (plan-shape):** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md` (the entire file — same exact problem shape: PLAN frontmatter declares REQ-IDs that the matching SUMMARY frontmatter does not declare; audit's 3-source cross-reference reports the gap; precedent closes it by atomic-commit ADD or RENAME of `requirements-completed:`).

**Analog (target-state excerpt):** `.planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-02-SUMMARY.md:36-37`

**Per-plan inventory** is RESEARCH.md §"Warning 1 — File-Level Work Breakdown" — 22 files in total split across:
- **5 phases:** 31 (1 file), 32 (5 files), 33 (5 files), 34 (7 files), 35 (4 files)
- **Two operation kinds:** (a) ADD a missing `requirements-completed:` block, (b) RENAME a singular `requirements:` key to hyphenated `requirements-completed:` (~7 files per RESEARCH.md "Convention Note")

**Plan-shape pattern to mirror (30-02-PLAN.md frontmatter — copy structure verbatim, swap content):**
```yaml
---
phase: 37
plan: "01"  # planner picks 01..05
type: execute            # NOT tdd — RESEARCH Pitfall 5
wave: 1                  # W1..W4 in Wave 1; W5 in Wave 2
depends_on: []
files_modified:
  - .planning/phases/<...>/<...>-SUMMARY.md  # list ALL 22 explicitly
autonomous: true
requirements: []         # this hygiene plan closes traceability for OTHER plans' requirements; itself declares none
tags:
  - docs-hygiene
  - frontmatter-backfill
  - milestone-audit-closure
must_haves:
  decisions_covered:
    - "scope-lock: backfill requirements-completed in 22 SUMMARYs across phases 31-35; no other frontmatter fields edited"
    - "rename-vs-add: rename singular `requirements:` to hyphenated `requirements-completed:` for the 7 singular-form plans (31-01, 32-01, 35-01/02/04/05/06); ADD new block for the other 15"
    - "atomic commit: all 22 files in one docs commit; commit message follows `docs(37-NN): ...` convention"
    - "do NOT edit .planning/v2.0-MILESTONE-AUDIT.md or .planning/integration-check-v2.0-postphase36.md (immutable audit records — mirrors v1.5 D-13)"
  truths:
    - "Every PLAN.md `requirements:` REQ-ID appears in matching SUMMARY.md `requirements-completed:` after this plan completes"
    - "Every edited SUMMARY frontmatter parses as valid YAML (js-yaml load passes per file)"
    - "Only `requirements-completed:` key is added/renamed; no other key, no body content, no re-dating, no metric changes (D-11 from v1.5 30-02-PLAN)"
---
```

**Task shape to mirror (30-02-PLAN.md Task 1 — copy `<read_first>` + `<action>` + `<verify>` + `<acceptance_criteria>` + `<done>` skeleton verbatim, vary per-file content):**

The v1.5 precedent used **one task per SUMMARY file edited** (3 single-file tasks + 1 cross-cut commit task). For 22 files, the planner can EITHER:
- **(a) Mirror 30-02 literally:** 22 single-file tasks + 1 cross-cut commit task — verbose but maximally reviewable.
- **(b) Group by phase:** 5 per-phase tasks (one per Phases 31..35) + 1 cross-cut commit task — recommended for token economy.

Either decomposition uses the same per-task internals. The 30-02-PLAN.md Task 1 `<action>` block (lines 163-181) is the canonical template:

> "Open `<PATH>`. Locate the `dependency_graph:` top-level block in the YAML frontmatter (between the opening `---` delimiter and the closing `---` delimiter). The block ends at the line `<EXISTING LAST LINE>`. The next non-blank top-level key is `tech_stack:` and there is exactly one blank line between them. Insert a new top-level block immediately after the existing blank line that follows `dependency_graph:` ..."
>
> "Do NOT touch any other frontmatter field (D-11): do not modify `completed:`, `dependencies:`, `tech_stack:`, `key_files:`, `decisions:`, `metrics:`, `tasks_completed:`, or any prose below the closing `---`. Do not re-date."

**Per-file insertion-point convention (mirror 30-02-PLAN.md `<interfaces>` block lines 86-145):**

The 30-02-PLAN `<interfaces>` block does the work of declaring **per-file blank-line conventions** so the executor never has to discover them. For W1 the planner should do the same — for each of the 22 files, declare in `<interfaces>`:
1. Whether the file uses BLANK LINES between top-level keys (most do) or COMPACT (no blank lines).
2. The insertion-point predecessor line (last line of `dependency_graph:` / `dependencies:` block — varies per file).
3. The exact 2-space indent for `- REQ-ID` items.

A representative sample shape (mirrors 30-02-PLAN.md lines 92-109):
```
From .planning/phases/33-server-actions-queries-and-bulk-import/33-04-SUMMARY.md (current state — the file being modified; field is ABSENT):
Existing top-level keys around the insertion point:
  dependency_graph:
    requires:
      - 33-02
    provides:
      - transitionToMixing (TRANS-01)
      - ...
    affects:
      - 33-05
      - 34
  tech_stack:
File uses NO blank line between `affects:` block and `tech_stack:`. Insertion point: after the last `- 34` line and before `tech_stack:`. Insert with NO surrounding blank lines:
  ...
      - 34
  requirements-completed:
    - TRANS-01
    - TRANS-02
    - TRANS-03
    - TRANS-04
    - TRANS-05
    - TRANS-06
    - TRANS-07
  tech_stack:
```

**Acceptance criteria pattern (mirror 30-02-PLAN.md Task 1 lines 185-191 — per-file grep contracts):**
```bash
# Field added exactly once as a top-level key:
grep -c "^requirements-completed:" .planning/phases/<...>/<...>-SUMMARY.md
# Expected: 1

# Each declared REQ-ID appears as 2-space-indented list item:
grep -A N "^requirements-completed:" .planning/phases/<...>/<...>-SUMMARY.md | grep -c "  - <REQ-ID>"
# Expected: 1 per REQ-ID (N = count of REQ-IDs in the new block)

# YAML still parses:
node -e "const fs=require('fs'); const yaml=require('js-yaml'); const m=fs.readFileSync('<PATH>','utf8').match(/^---\n([\s\S]+?)\n---/); yaml.load(m[1]); console.log('OK');"
# Expected: 'OK' + exit 0

# Diff is additive-only (D-11):
git diff <PATH> | grep -E "^-" | grep -v "^---" | wc -l
# Expected: 0  (zero deleted lines — only for ADD files; RENAME files will show 1 -1 line per rename)
```

**Cross-cut commit task pattern (mirror 30-02-PLAN.md Task 4 lines 278-316 verbatim, swap paths + commit subject):**

```bash
git add .planning/phases/31-role-expansion-and-db-infrastructure/31-01-SUMMARY.md \
        .planning/phases/32-schema-migrations-and-seed-data/32-01-SUMMARY.md \
        .planning/phases/32-schema-migrations-and-seed-data/32-02-SUMMARY.md \
        .planning/phases/32-schema-migrations-and-seed-data/32-04-SUMMARY.md \
        .planning/phases/32-schema-migrations-and-seed-data/32-05-SUMMARY.md \
        .planning/phases/32-schema-migrations-and-seed-data/32-06-SUMMARY.md \
        .planning/phases/32-schema-migrations-and-seed-data/32-07-SUMMARY.md \
        .planning/phases/33-server-actions-queries-and-bulk-import/33-01-SUMMARY.md \
        .planning/phases/33-server-actions-queries-and-bulk-import/33-02-SUMMARY.md \
        .planning/phases/33-server-actions-queries-and-bulk-import/33-03-SUMMARY.md \
        .planning/phases/33-server-actions-queries-and-bulk-import/33-04-SUMMARY.md \
        .planning/phases/33-server-actions-queries-and-bulk-import/33-05-SUMMARY.md \
        .planning/phases/33-server-actions-queries-and-bulk-import/33-06-SUMMARY.md \
        .planning/phases/33-server-actions-queries-and-bulk-import/33-11-SUMMARY.md \
        .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-01-SUMMARY.md \
        .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-04-SUMMARY.md \
        .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-08-SUMMARY.md \
        .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-09-SUMMARY.md \
        .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-10-SUMMARY.md \
        .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-11-SUMMARY.md \
        .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-12-SUMMARY.md \
        .planning/phases/35-kpi-sections-and-role-specific-metrics/35-01-SUMMARY.md \
        .planning/phases/35-kpi-sections-and-role-specific-metrics/35-02-SUMMARY.md \
        .planning/phases/35-kpi-sections-and-role-specific-metrics/35-03-SUMMARY.md \
        .planning/phases/35-kpi-sections-and-role-specific-metrics/35-04-SUMMARY.md \
        .planning/phases/35-kpi-sections-and-role-specific-metrics/35-05-SUMMARY.md \
        .planning/phases/35-kpi-sections-and-role-specific-metrics/35-06-SUMMARY.md \
        .planning/phases/35-kpi-sections-and-role-specific-metrics/35-07-SUMMARY.md

git commit -m "$(cat <<'EOF'
docs(37-01): backfill requirements-completed in Phases 31-35 SUMMARY frontmatter

Closes v2.0 milestone-audit cross-phase tech-debt item 1: SUMMARY frontmatter
requirements-completed mostly empty across Phases 31-35. Every PLAN-declared
REQ-ID now appears in matching SUMMARY frontmatter; mirrors v1.5 Phase 30 INT-07
backfill pattern (.planning/milestones/v1.5-phases/30-.../30-02-PLAN.md).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(File list above is illustrative — the planner uses the per-plan inventory in RESEARCH.md §"Warning 1" to pick the EXACT 22 files. Spot-check during execution: `git diff --cached --name-only | wc -l` should equal `22`.)

---

### W2 — REQUIREMENTS.md status updates (1 file, 2 edit zones)

**Analog (plan-shape):** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md` Task 4 §"Step 3 (diff hygiene)" + §"Step 4 (commit)" — the cross-cut-commit shape applied to a single file with two edit zones.

**Analog (target-state excerpt):** `.planning/milestones/v1.5-REQUIREMENTS.md`:
- Lines 21-37 (the v1.5 requirement checkbox list — every line uses `- [x] **<REQ-ID>**:`)
- Lines 73-81 (the v1.5 traceability table — column reads `| Complete |`)

**Edit zone 1 — Requirement definition list (`.planning/REQUIREMENTS.md` lines 14-73, 45 lines):**

Current shape (RESEARCH.md §"Warning 2" verified):
```markdown
- [ ] **DATA-01**: Neon Postgres project provisioned...
- [ ] **DATA-02**: Drizzle schema for `production_orders` table...
```

Target shape (matches v1.5-REQUIREMENTS.md:21-37 verbatim except for the REQ-ID literals):
```markdown
- [x] **DATA-01**: Neon Postgres project provisioned...
- [x] **DATA-02**: Drizzle schema for `production_orders` table...
```

**Edit zone 2 — Traceability table (`.planning/REQUIREMENTS.md` lines 125-171, 45 rows):**

Current shape:
```markdown
| AUTH-01 | Phase 31 | Pending |
| AUTH-02 | Phase 31 | Pending |
```

Target shape (matches v1.5-REQUIREMENTS.md:73-81 verbatim except for REQ-ID + phase number literals — use `Complete`, NOT `Done`, per RESEARCH.md §"Pattern References §v1.5 INT-07 traceability format §Pattern 2"):
```markdown
| AUTH-01 | Phase 31 | Complete |
| AUTH-02 | Phase 31 | Complete |
```

**Edit-tool guidance (matches RESEARCH.md §"Don't Hand-Roll" — 45 cells is small; sed-style bulk edits risk over-matching; the Edit tool's exact-string match is safer):**

The planner SHOULD NOT use `sed` for either zone. Each Edit call replaces ONE exact-match line (preserves any incidental whitespace differences between rows). With 45 + 45 = 90 Edit invocations the work is mechanical but auditable. Alternatively, multi-line `Edit` of the entire block at once is acceptable if the executor reads the current file in full first.

**Plan-shape pattern (mirror 30-02-PLAN.md frontmatter):**
```yaml
---
phase: 37
plan: "02"
type: execute
wave: 1
depends_on: []   # independent of 37-01 (different file); 37-02..37-04 can run in parallel
files_modified:
  - .planning/REQUIREMENTS.md
autonomous: true
requirements: []
tags:
  - docs-hygiene
  - traceability-table
  - milestone-audit-closure
must_haves:
  decisions_covered:
    - "scope-lock: flip 45 checkboxes in lines 14-73 AND 45 cells in lines 125-171; use `[x]` + `Complete` (matches v1.5 verbatim)"
    - "atomic commit: both edit zones land in ONE docs commit (Pitfall 6 — avoid checkbox/cell desync)"
    - "do NOT edit .planning/v2.0-MILESTONE-AUDIT.md (D-13 — immutable audit records)"
---
```

**Tasks (mirror 30-02-PLAN.md Task 1 + Task 4):**
- **Task 1:** flip 45 checkboxes (lines 14-73). One `<action>` block with explicit before→after for each of the 6 REQ-ID groups (DATA, AUTH, PROD, TRANS, IMPORT, KPI). `<read_first>` reads `.planning/REQUIREMENTS.md` (full file) + `.planning/milestones/v1.5-REQUIREMENTS.md:21-37` (analog).
- **Task 2:** flip 45 traceability-table cells (lines 125-171). One `<action>` block listing the 45 row identifiers. `<read_first>` reads `.planning/REQUIREMENTS.md` (the table) + `.planning/milestones/v1.5-REQUIREMENTS.md:73-81` (analog).
- **Task 3:** cross-cut verify + atomic commit (mirror 30-02-PLAN.md Task 4 lines 288-316 — `git add .planning/REQUIREMENTS.md && git commit -m "docs(37-02): ..."`).

**Acceptance criteria (RESEARCH.md §"Warning 2 — Verification command" verbatim):**
```bash
# Zone 1: 45 checked
grep -cE "^- \[x\] \*\*(DATA|AUTH|PROD|TRANS|IMPORT|KPI)-[0-9][0-9]\*\*:" .planning/REQUIREMENTS.md
# Expected: 45

# Zone 1: 0 unchecked
grep -cE "^- \[ \] \*\*(DATA|AUTH|PROD|TRANS|IMPORT|KPI)-[0-9][0-9]\*\*:" .planning/REQUIREMENTS.md
# Expected: 0

# Zone 2: 0 Pending cells remain
grep -c "| Pending |" .planning/REQUIREMENTS.md
# Expected: 0

# Zone 2: 45 Complete cells exist
grep -c "| Complete |" .planning/REQUIREMENTS.md
# Expected: 45
```

---

### W3 — `33-HUMAN-UAT.md` Test #2 amendment (1 file, 2 lines)

**Analog (plan-shape):** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md` Task 1 (single-file, narrow-scope edit with `<read_first>` referencing the closure-protocol document + acceptance grep on the post-state).

**Analog (target-state excerpt — the closure-protocol authority):** `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md:60-66` (the entire `## Closure protocol` section, verbatim).

Exact protocol text (lines 62-66, copied verbatim from the source):
```
When Phase 34's UAT runs (post-implementation):
1. Execute the steps above against the running Phase 34 dashboard.
2. Record the result in Phase 34's `34-HUMAN-UAT.md` under a dedicated test entry titled
   `Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)`.
3. After Phase 34 ships its verification report, AMEND `33-HUMAN-UAT.md` Test #2: change
   `result: deferred_to_phase_34` to `result: closed_in_phase_34 (pass/fail, <date>,
   <Phase 34 verification commit>)`.
4. After amendment, flip `33-HUMAN-UAT.md` frontmatter `status: gaps_flagged` →
   `status: gaps_closed` (assuming GAP-01 and GAP-03 are also closed by then via plans
   33-08 and 33-07).
```

Phase 37 W3 implements **steps 3 + 4 of this protocol verbatim** (steps 1 + 2 were already done by Phase 34 T12).

**Concrete edits (RESEARCH.md §"Warning 3 — Concrete edit" verbatim diff):**

| Line | Before | After |
|------|--------|-------|
| 2 | `status: resolved` | `status: gaps_closed` |
| 22 | `result: deferred_to_phase_34` | `result: closed_in_phase_34 (pass, 2026-05-14, Phase 34 T12)` |

**Do NOT touch** (RESEARCH.md §"Warning 3 — Do NOT touch"):
- Lines 23-41 (`deferral_rationale:` and `deferred_test_step:` blocks — historical context).
- Summary block at lines 47-54 (`deferred: 1` is now factually wrong but protocol does not require update; planner MAY optionally update — see Assumption A4 — but the audit greps only on `status:` and Test #2 `result:`).

**Note on `status` value mismatch (RESEARCH.md §"Warning 3 — Step 3 vs Step 4"):**
Closure protocol step 4 anticipates `status: gaps_flagged`. Current value is `status: resolved`. The planner MUST flip whatever the current value is to `gaps_closed`, since `gaps_closed` is the canonical post-closure state per the protocol.

**Plan-shape pattern (mirror 30-02-PLAN.md Task 1 — single-file, atomic):**
```yaml
---
phase: 37
plan: "03"
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/33-server-actions-queries-and-bulk-import/33-HUMAN-UAT.md
autonomous: true
requirements: []
tags:
  - docs-hygiene
  - uat-closure
  - inherited-gap-closure
must_haves:
  decisions_covered:
    - "scope-lock: 2 line edits ONLY — line 2 status: + line 22 result:"
    - "do NOT delete deferral_rationale: or deferred_test_step: blocks (historical context per 34-INHERITED-UAT.md precedent: '34-HUMAN-UAT.md:7 preserves inherited_from:')"
    - "do NOT edit Summary block at lines 47-54 (optional per A4; audit greps only on status: + Test #2 result:)"
---
```

**Acceptance criteria (RESEARCH.md §"Warning 3 — Verification command" verbatim):**
```bash
F=.planning/phases/33-server-actions-queries-and-bulk-import/33-HUMAN-UAT.md
grep -c "^status: gaps_closed$" "$F"            # Expected: 1
grep -c "^result: closed_in_phase_34" "$F"      # Expected: 1
grep -c "^status: resolved$" "$F"               # Expected: 0
grep -c "^result: deferred_to_phase_34$" "$F"   # Expected: 0
```

---

### W4 — `35-LEARNINGS.md` `missing_artifacts` clear (1 file, 3 lines → 1 line)

**Analog (plan-shape):** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md` Task 1 (single-file YAML-frontmatter edit with js-yaml validation hook and `git diff` additive-only check).

**Analog (target-state excerpt):** RESEARCH.md §"Warning 4" verbatim diff (no external precedent needed — the edit is a self-contained YAML list-clear, structurally simpler than W1 add/rename operations).

**Edit (3 lines → 1 line):**
```diff
--- a/.planning/phases/35-kpi-sections-and-role-specific-metrics/35-LEARNINGS.md
+++ b/.planning/phases/35-kpi-sections-and-role-specific-metrics/35-LEARNINGS.md
@@ -8,9 +8,7 @@ counts:
   lessons: 9
   patterns: 11
   surprises: 9
-missing_artifacts:
-  - "35-VERIFICATION.md"
-  - "35-UAT.md"
+missing_artifacts: []
 ---
```

**Plan-shape pattern (mirror 30-02-PLAN.md Task 1, narrowed to one file):**
```yaml
---
phase: 37
plan: "04"
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/35-kpi-sections-and-role-specific-metrics/35-LEARNINGS.md
autonomous: true
requirements: []
tags:
  - docs-hygiene
  - tech-debt-closure
  - frontmatter-edit
must_haves:
  decisions_covered:
    - "scope-lock: 3 lines deleted, 1 line added (missing_artifacts: [] replaces the 2-item list)"
    - "rationale-preservation: use `[]` (empty list, not key-deletion) to preserve evidence that the gap was actively closed"
    - "YAML validity: js-yaml load hook MUST pass post-edit"
---
```

**Acceptance criteria (RESEARCH.md §"Warning 4 — Verification command" verbatim):**
```bash
F=.planning/phases/35-kpi-sections-and-role-specific-metrics/35-LEARNINGS.md
grep -c "^missing_artifacts: \[\]$" "$F"        # Expected: 1
grep -c "35-VERIFICATION.md" "$F"               # Expected: 0
grep -c "35-UAT.md" "$F"                        # Expected: 0
node -e "const fs=require('fs'),yaml=require('js-yaml');const m=fs.readFileSync('$F','utf8').match(/^---\n([\s\S]+?)\n---/);yaml.load(m[1]);console.log('OK')"
# Expected: 'OK' + exit 0
```

---

### W5 — Audit re-run + ROADMAP/STATE ship-indicator flip (Wave 2 — depends on W1-W4)

**Analog (plan-shape):** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md` D-13 verification pattern (lines 27-28, 316, 328) — confirming the immutable audit records were NOT touched by Phase 37's docs commits, then accepting whatever the audit skill produces as the new audit record.

**Analog (target-state excerpt — skill invocation):** `/Users/joel/.claude/skills/gsd-audit-milestone/SKILL.md` + RESEARCH.md §"Audit Re-Run Mechanics" (workflow §1-7).

**Two-step structure (RESEARCH.md §"Suggested Plan Decomposition — Plan 37-05"):**

**Step 1 — Audit re-run (operator action; non-autonomous):**
```
/gsd:audit-milestone v2.0
```

The skill orchestrates `gsd-integration-checker`, parses Phases 31-37 VERIFICATION.md / SUMMARY.md / REQUIREMENTS.md, and writes:
- `.planning/v2.0-MILESTONE-AUDIT.md` (overwritten — previous content moves to git history)
- `.planning/integration-check-v2.0-postphase37.md` (created by `gsd-integration-checker`; matches the `-postphase36` convention from the previous audit)

Per RESEARCH.md Pitfall 4 + v1.5 30-02-PLAN.md D-13: the executor does NOT manually edit `.planning/v2.0-MILESTONE-AUDIT.md` or `.planning/integration-check-v2.0-postphase36.md`. The audit re-run produces NEW files; the old ones stay in git history.

**Step 2 — ROADMAP/STATE ship-indicator flip (executor action; gated on `status: passed`):**

After confirming the new audit file has `status: passed` (and tech-debt items 1-3 + Phase 35 missing_artifacts are absent), edit:

| File | Line | Before | After |
|------|------|--------|-------|
| `.planning/ROADMAP.md` | 11 | `🔄 **v2.0 Mill Production MVP** — Phases 31-37 (audit re-run passed_with_warnings 2026-05-16; ship gated on Phase 37 hygiene cleanup)` | `✅ **v2.0 Mill Production MVP** — Phases 31-37 (shipped YYYY-MM-DD)` |
| `.planning/ROADMAP.md` | 65 (`<details open>` summary) | `<summary>🔄 v2.0 Mill Production MVP (Phases 31-37) — AUDIT RE-RUN PASSED_WITH_WARNINGS; SHIP GATED ON PHASE 37</summary>` | `<summary>✅ v2.0 Mill Production MVP (Phases 31-37) — SHIPPED YYYY-MM-DD</summary>` + change `<details open>` to `<details>` (collapsed, matching v1.5 convention) |
| `.planning/STATE.md` | progress block | `completed_phases: 6` | `completed_phases: 7` + `last_shipped:` add v2.0 entry |

**Plan-shape pattern (mirror 30-02-PLAN.md Task 4 — single-file edit with explicit `git add`):**
```yaml
---
phase: 37
plan: "05"
type: execute
wave: 2                  # SEQUENTIAL — depends on W1-W4 atomic commits landing first
depends_on:
  - 37-01
  - 37-02
  - 37-03
  - 37-04
files_modified:
  - .planning/ROADMAP.md
  - .planning/STATE.md
  # NOT files_modified (skill writes these): .planning/v2.0-MILESTONE-AUDIT.md, .planning/integration-check-v2.0-postphase37.md
autonomous: false        # operator runs the skill (checkpoint:human-action)
requirements: []
tags:
  - docs-hygiene
  - audit-rerun
  - ship-indicator
must_haves:
  decisions_covered:
    - "scope-lock: edit ROADMAP.md lines 11 + 65, STATE.md progress block; do NOT manually edit v2.0-MILESTONE-AUDIT.md (skill writes it) or integration-check-v2.0-postphase36.md (immutable per D-13)"
    - "audit-gate: ROADMAP/STATE flips happen AFTER `/gsd:audit-milestone v2.0` returns `status: passed`; if audit returns `passed_with_warnings` or `gaps_found`, halt and escalate per RESEARCH Open Question 2"
---
```

**Tasks (mirror 30-02-PLAN.md Task 4 — two sequential steps in one plan):**
- **Task 1 (`checkpoint:human-action`):** Operator runs `/gsd:audit-milestone v2.0`. Verify: `grep "^status: passed$" .planning/v2.0-MILESTONE-AUDIT.md` returns 1. If not, halt.
- **Task 2 (`auto`):** Executor edits ROADMAP.md (lines 11, 65) + STATE.md (progress block) + commits with `docs(37-05): flip v2.0 ship indicator to ✅ (shipped YYYY-MM-DD)`.

**Acceptance criteria (RESEARCH.md §"Warning 5"):**
```bash
# Audit returned passed:
grep "^status: passed$" .planning/v2.0-MILESTONE-AUDIT.md
# Expected: 1 match

# v2.0 cross-phase tech-debt items 1-3 are GONE:
grep -E "(SUMMARY frontmatter requirements-completed|REQUIREMENTS.md traceability|INT-02|33-HUMAN-UAT amendment)" .planning/v2.0-MILESTONE-AUDIT.md
# Expected: 0 matches (or only matches in historical/closed contexts)

# Phase 35 missing_artifacts item is GONE:
grep -E "35-LEARNINGS.*missing_artifacts" .planning/v2.0-MILESTONE-AUDIT.md
# Expected: 0 matches

# ROADMAP ship indicator flipped:
grep -c "^✅ \*\*v2.0 Mill Production MVP\*\*" .planning/ROADMAP.md
# Expected: 1
grep -c "^🔄 \*\*v2.0 Mill Production MVP\*\*" .planning/ROADMAP.md
# Expected: 0

# STATE.md updated:
grep -E "completed_phases: 7" .planning/STATE.md
# Expected: 1 match

# Audit records were NOT manually edited (D-13 — the only writes to v2.0-MILESTONE-AUDIT.md must come from the audit skill, not from Phase 37 commits):
git log --oneline 37-01..HEAD -- .planning/v2.0-MILESTONE-AUDIT.md | grep -v "audit-milestone" | wc -l
# Expected: 0 (any commit touching this file in Phase 37 range must come from the audit-milestone skill, identifiable in commit message)
```

---

## Shared Patterns (apply to ALL Phase 37 plans)

### Shared Pattern 1 — `type: execute`, NOT `type: tdd`

**Source:** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md:4`
**Apply to:** All 5 plans (37-01 through 37-05)

```yaml
type: execute    # NOT tdd — RESEARCH §"Common Pitfalls Pitfall 5"
wave: 1          # W1-W4 = Wave 1 (parallel); W5 = Wave 2 (sequential)
```

**Rationale:** No business logic, API, or transform. `tdd_mode: true` in `.planning/config.json` does NOT apply to docs hygiene. v1.5 Plan 30-02 is `type: execute` for the same reason.

### Shared Pattern 2 — Explicit `git add` paths (NEVER `git add .` or `git add -A`)

**Source:** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md:302-304` + RESEARCH.md §"Pitfall 3 — `git add .` vs explicit file staging"
**Apply to:** All 5 plans

```bash
git add .planning/phases/<...>/<...>.md \
        .planning/phases/<...>/<...>.md \
        ...
# NEVER: git add . OR git add -A OR git add .planning/
```

**Rationale:** Worktree may have unrelated stale state (`.gsd/`, `.planning/WAITING.json` per `git status`). Explicit paths prevent contamination.

### Shared Pattern 3 — Commit message via heredoc with `Co-Authored-By`

**Source:** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md:305-314` + CLAUDE Code tool guidance ("ALWAYS pass the commit message via a HEREDOC")
**Apply to:** All 5 plans

```bash
git commit -m "$(cat <<'EOF'
docs(37-NN): <one-line summary>

<2-3 line rationale referencing the closed audit warning + the v1.5 INT-07 precedent>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Shared Pattern 4 — js-yaml validation hook for every YAML frontmatter edit

**Source:** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md:147-149` (verbatim hook)
**Apply to:** W1 (22 SUMMARYs), W4 (35-LEARNINGS.md)
**NOT applicable to:** W2 (REQUIREMENTS.md body — no frontmatter), W3 (the `status:` edit is in YAML but the existing hook covers it), W5 (skill output)

```bash
node -e "const fs=require('fs'); const yaml=require('js-yaml'); const m=fs.readFileSync('FILE','utf8').match(/^---\n([\s\S]+?)\n---/); yaml.load(m[1]); console.log('OK');"
# Exit 0 + 'OK' stdout = valid YAML frontmatter
```

**Rationale:** RESEARCH.md §"Pitfall 2 — Indentation drift in YAML list items" — silent malformed YAML breaks the audit parser without obvious symptoms.

### Shared Pattern 5 — D-11 "no other frontmatter fields edited"

**Source:** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md:25` (D-11 verbatim) + acceptance criterion line 191 ("`git diff` shows only added lines for the new block, no `-` lines anywhere")
**Apply to:** ALL plans

```bash
# Verify diff is additive-only (or for RENAME plans: exactly N renamed-line pairs):
git diff <FILES> | grep -E "^-" | grep -v "^---" | wc -l
# Expected: 0 (for pure-ADD plans) OR 7 (for W1 rename plans: 31-01, 32-01, 35-01/02/04/05/06)
```

**Rationale:** Pure docs-hygiene = no other field touched. Re-dating, dependency_graph updates, or metric changes are scope creep.

### Shared Pattern 6 — D-13 "do NOT edit immutable audit records"

**Source:** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md:27` (D-13 verbatim) + RESEARCH.md §"Pitfall 4 — Editing immutable audit records"
**Apply to:** ALL plans

The following files MUST NOT appear in any Phase 37 commit's `git diff` (except via the audit-milestone skill's own writes during W5):
- `.planning/v2.0-MILESTONE-AUDIT.md` (skill overwrites in W5; otherwise immutable)
- `.planning/integration-check-v2.0-postphase36.md` (immutable — historical record)

Verification:
```bash
git diff HEAD~N..HEAD -- .planning/v2.0-MILESTONE-AUDIT.md .planning/integration-check-v2.0-postphase36.md
# Expected: empty (unless N covers the W5 audit-skill commit, in which case only v2.0-MILESTONE-AUDIT.md shows changes from the skill)
```

### Shared Pattern 7 — Per-task `<read_first>` declares the analog

**Source:** `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md:158-162, 198-202, 241-245` (every task has 3 `<read_first>` entries: target file + analog file + PATTERNS.md section)
**Apply to:** All `<task>` blocks in all 5 plans

```xml
<read_first>
  - <THE TARGET FILE>  (the file being edited — read in full to confirm current state)
  - <THE ANALOG FILE>  (the verbatim shape to mirror — e.g., 29-02-SUMMARY.md:36-37 for W1; 34-INHERITED-UAT.md:60-66 for W3; v1.5-REQUIREMENTS.md:21-37 + :73-81 for W2)
  - .planning/phases/37-v2-0-1-hygiene-cleanup-close-audit-warnings-before-ship/37-PATTERNS.md §<warning>  (this file — for per-warning context)
</read_first>
```

**Rationale:** Executor never has to discover patterns mid-task. The v1.5 30-02 precedent is the gold standard: every `<read_first>` explicitly names the analog with line numbers.

---

## Wave Structure

| Wave | Plans | Parallelism | Rationale |
|------|-------|-------------|-----------|
| Wave 1 | 37-01, 37-02, 37-03, 37-04 | parallel (4 worktrees) | Each closes a different warning on different files; no cross-plan file conflicts. Mirrors RESEARCH §"Suggested Plan Decomposition — Wave structure". |
| Wave 2 | 37-05 | sequential (after W1 merges) | Audit re-run requires W1-W4 commits to be on `main`; ROADMAP/STATE flip requires audit `status: passed`. |

## Files With No Analog

None. All 6 warning rows (W1-W5 + the cross-cut Shared Patterns) have direct precedent in either:
- `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md` (universal plan-shape analog), OR
- `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md:60-66` (closure protocol authority for W3), OR
- `.planning/milestones/v1.5-REQUIREMENTS.md:21-37,73-81` (verbatim `[x]` + `Complete` formats for W2)

## Anti-Pattern Catalog (what the planner MUST NOT produce)

Per RESEARCH.md §"Anti-Scope-Creep Guidance" + this phase's `<execution_flow>` constraint to forbid new abstractions:

| Anti-Pattern | Why Forbidden | Citation |
|--------------|--------------|----------|
| Any `src/`, `drizzle/`, `scripts/`, or `tests/` edit | ROADMAP Phase 37 goal: "no functional code changes expected" | RESEARCH §"Anti-Scope-Creep #1" |
| `type: tdd` plans with Wave 0 RED/GREEN/REFACTOR tasks | No business logic to test; Nyquist Dimension 8 (shell-grep) covers everything | RESEARCH §"Pitfall 5" + v1.5 30-02 Pattern 1 |
| New ADRs, new PATTERNS.md, new research artifacts | RESEARCH is the only research deliverable; this PATTERNS.md is the only pattern artifact | RESEARCH §"Anti-Scope-Creep #3" |
| New helper scripts beyond shell-grep + js-yaml hook | RESEARCH §"Don't Hand-Roll" — use existing tools (Edit, grep, node -e, gsd-sdk) | RESEARCH §"Don't Hand-Roll" table |
| Manual edits to `.planning/v2.0-MILESTONE-AUDIT.md` or `.planning/integration-check-v2.0-postphase36.md` | Immutable audit records; W5 audit skill is the only legitimate writer | RESEARCH §"Pitfall 4" + v1.5 30-02 D-13 |
| Bulk `sed -i` edits to REQUIREMENTS.md | RESEARCH §"Don't Hand-Roll" — sed risks over-matching the 90 lines; use Edit tool exact-match | RESEARCH §"Don't Hand-Roll" row 4 |
| Refactoring SUMMARY frontmatter beyond the named field | D-11: no re-dating, no dependency_graph updates, no metric changes | v1.5 30-02-PLAN.md D-11 |
| Fixing pre-existing test failures (ClerkProvider, Drizzle IndexedColumn) | Classified `pre-existing` + `unrelated` in v2.0 audit; out of scope | RESEARCH §"Anti-Scope-Creep #7" |
| Closing Phase 31 `wave_0_complete: false` | Classified `tech_debt` (not `warning`); not one of the 5 SC items | RESEARCH §"Anti-Scope-Creep #9" |
| Editing MILESTONES.md, RETROSPECTIVE.md, or any planning file not named in SC#1-5 | Out of scope; ROADMAP Phase 37 SC list is exhaustive | RESEARCH §"Anti-Scope-Creep #10" |

## Metadata

**Analog search scope:** `.planning/milestones/v1.5-phases/30-*` (universal analog), `.planning/phases/33-*/34-INHERITED-UAT.md` (closure protocol), `.planning/milestones/v1.5-REQUIREMENTS.md` (`[x]` + `Complete` format), `.planning/phases/29-*/29-02-SUMMARY.md` (verbatim YAML shape for `requirements-completed:`)

**Files read this session:**
- `.planning/phases/37-v2-0-1-hygiene-cleanup-close-audit-warnings-before-ship/37-RESEARCH.md` (lines 1-1152, full — though split into 3 reads due to size)
- `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-02-PLAN.md` (lines 1-379, full)
- `.planning/milestones/v1.5-phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-PATTERNS.md` (lines 1-100, partial — shape reference only)
- `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md` (lines 1-75, full)
- `.planning/phases/33-server-actions-queries-and-bulk-import/33-04-SUMMARY.md` (lines 1-40, partial — sample current SUMMARY frontmatter)

**Pattern extraction date:** 2026-05-15
**Confidence:** HIGH — every analog cited was read verbatim this session; every per-warning target-state was cross-checked against the RESEARCH.md inventory (which itself verified each claim against the live repo files).
