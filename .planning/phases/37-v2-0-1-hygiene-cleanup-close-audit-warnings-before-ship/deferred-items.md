# Phase 37 Plan 01 — Deferred Items

Items discovered during execution that are **out of scope** for this plan (pure documentation
hygiene; D-11 additive-only invariant). Recorded here per executor scope-boundary rule.

## 1. Pre-existing YAML parse failures (strict js-yaml) in legacy SUMMARY frontmatter

Two SUMMARY files have **pre-existing** YAML frontmatter that fails to parse under
**strict** js-yaml. Both failures are in `decisions:` array items containing unquoted
strings with special punctuation. Verified pre-existing by parsing the un-edited git-HEAD
version — same failure both times.

| File | Failure line | Pre-existing? |
|------|--------------|---------------|
| `.planning/phases/32-schema-migrations-and-seed-data/32-01-SUMMARY.md` | line 49 (decisions[]: ".. with onDelete: cascade") | YES |
| `.planning/phases/33-server-actions-queries-and-bulk-import/33-02-SUMMARY.md` | line 28 (decisions[]: ".. revalidateTag('production-orders') from mutating actions") | YES |
| `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-01-SUMMARY.md` | line 21 (sequence entry indentation) | YES |

**Scope:** Plan 37-01 is additive-only (D-11). Fixing pre-existing YAML in unrelated
frontmatter keys (`decisions:`) would violate D-11.

**Impact on this plan:** None on the success criteria. The `requirements-completed:` key
was correctly added/renamed in both files (32-01 renamed from singular; 33-02 added
empty-list form). Audit tooling that uses `gsd-sdk query summary-extract` (a forgiving
extractor — see RESEARCH.md §"Convention Note") reads the keys correctly. The strict
js-yaml check is a defensive hook, not the production parser.

**Recommended owner:** Future cleanup plan (out of v2.0.1 hygiene scope) — single-quote the
unquoted decision strings.

## 2. Two files already-populated at execution time (Rule 1 deviation)

The PLAN's `<files_modified>` list includes **32-07-SUMMARY.md** and **33-01-SUMMARY.md**,
but inspection at execution start found both files **already populated** with the exact
target state described in the PLAN's `<action>` block:

| File | Expected after PLAN | Actual at start | Action taken |
|------|--------------------|-----------------|--------------|
| `32-07-SUMMARY.md` | `requirements-completed:` + `  - UAT-32-05` | already present (lines 48-49) | NONE — D-11 additive-only |
| `33-01-SUMMARY.md` | `requirements-completed:` + `  - IMPORT-07` | already present (lines 48-49) | NONE — D-11 additive-only |

**Rationale (Rule 1):** No-op editing these files to "satisfy" the file-count check would
violate D-11 (additive-only) and produce a misleading commit. The plan's *goal* (each PLAN
REQ-ID appears under `requirements-completed:` in matching SUMMARY) is satisfied by these
files in their current state. They are excluded from this commit; final commit will touch
26 files (28 - 2 already-correct).

**Impact on plan success criteria:**
- "All 28 files in `files_modified` actually touched by this plan's commits": deviated to
  26 files touched. The 2 untouched files are already in the target state — verified by
  acceptance-criteria greps at Task 2/Task 3 verification (both return `1` matches).
- The audit closure goal ("`SUMMARY-FM Traced` flips from 13/45 to 45/45") is unaffected:
  these two files already counted as traced (the key was present before this plan ran).
