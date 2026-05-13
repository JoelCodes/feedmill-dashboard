---
phase: 32-schema-migrations-and-seed-data
plan: 07
subsystem: infra
tags: [tailwind, css, jest, build, enforcement-gate, regression-prevention]

# Dependency graph
requires: []
provides:
  - "Tailwind v4 source(none) + explicit @source — Oxide scanner cannot reach .planning/"
  - "Layer-3 Jest enforcement gate in src/__tests__/no-bad-tailwind-literals.test.ts"
  - "All known dangerous Tailwind literal occurrences defused in .planning/**/*.md"
affects:
  - future phases that write SUMMARY / REVIEW / debug markdown files
  - globals.css (any future Tailwind config changes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "source(none) + explicit positive @source: Tailwind v4's most explicit source-scoping — cannot silently no-op"
    - "Pattern-split string literals: prevent Tailwind scanner from detecting patterns via raw-byte scanning of test source code"

key-files:
  created:
    - src/__tests__/no-bad-tailwind-literals.test.ts
  modified:
    - src/app/globals.css
    - .planning/milestones/v1.5-phases/27-role-assignment-and-testing/deferred-items.md
    - .planning/milestones/v1.5-phases/27-role-assignment-and-testing/27-05-SUMMARY.md
    - .planning/milestones/v1.5-phases/27-role-assignment-and-testing/27-VERIFICATION.md
    - .planning/phases/31-role-expansion-and-db-infrastructure/31-05-SUMMARY.md
    - .planning/phases/32-schema-migrations-and-seed-data/32-UAT.md
    - .planning/debug/css-text-var-text-star-parse-fail.md
  deleted:
    - .claude/worktrees/agent-a3690773d1b688bc2/ (stale debugger worktree — 6 mirrored copies of the literal)

key-decisions:
  - "Layer 2 option (b): source(none) + explicit @source over directory form — empirically more reliable, cannot silently no-op"
  - "Layer 3 mechanism: Jest test over npm script or husky — aligns with existing npm test discipline, zero new tooling"
  - "Test file string splitting: PATTERN built from PREFIX_A + PREFIX_B + STAR to prevent Tailwind scanner from reading test source code as a class-name candidate"
  - "CSS comment safety: avoid any Tailwind class-candidate pattern (including defused &ast; entity form) in CSS files scanned by Oxide"

patterns-established:
  - "Pattern: split Tailwind class literals across variables when they must appear in scanned source files"
  - "Pattern: Layer-3 enforcement tests that grep the repo for dangerous patterns — runnable contract vs. passive prose"

requirements-completed:
  - UAT-32-05

# Metrics
duration: 35min
completed: 2026-05-13
---

# Phase 32 Plan 07: CSS Regression Gap-Closure Summary

**Three-layer fix for the Phase-27/31/32 recurring Tailwind v4 parse-error bug: source(none) + explicit @source (Layer 2), entity-defusal of 7 institutional-memory files (Layer 1), and a Jest enforcement gate that converts the next recurrence from a silent UAT-time landmine into a failing npm test (Layer 3)**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-13T16:30:00Z
- **Completed:** 2026-05-13T17:07:05Z
- **Tasks:** 5
- **Files modified:** 8 files + 1 directory deleted

## Accomplishments

- Layer 1: Defused the dangerous Tailwind literal token in all 7 institutional-memory files (5 canonical .planning/**/*.md + 1 debug session + 1 32-07-PLAN.md self-defused). All 7 files now use `&ast;` entity form; 0 parseable instances remain.
- Layer 2: `src/app/globals.css` now uses `@import "tailwindcss" source(none);` + `@source "../../src";` — the most explicit Tailwind v4 source-scoping construct. The old `@source not "../../.planning/**/*"` (unsupported glob, silently no-op) is removed.
- Layer 3: `src/__tests__/no-bad-tailwind-literals.test.ts` is live, wired into `npm test`, and passes. Future recurrence of the literal in any tracked `.planning/**/*.md` or `src/**/*` file will produce a failing test on the next `npm test` run, not a silent landmine surfacing at UAT-time.
- Stale debugger worktree `.claude/worktrees/agent-a3690773d1b688bc2/` (6 mirrored copies of the literal) removed.
- `npm run build` exits 0 with zero CSS warnings; dev server serves `/sign-in` with HTTP 200 and no Build Error overlay.

## Layer-1 Defusal Counts

| File | Substitutions |
|------|---------------|
| .planning/milestones/v1.5-phases/27-role-assignment-and-testing/deferred-items.md | 2 (lines 58, 61) |
| .planning/milestones/v1.5-phases/27-role-assignment-and-testing/27-05-SUMMARY.md | 1 (line 89) |
| .planning/milestones/v1.5-phases/27-role-assignment-and-testing/27-VERIFICATION.md | 1 (line 137) |
| .planning/phases/31-role-expansion-and-db-infrastructure/31-05-SUMMARY.md | 1 (line 77) |
| .planning/phases/32-schema-migrations-and-seed-data/32-UAT.md | 6 (root_cause + 5 artifact issue strings) |
| .planning/debug/css-text-var-text-star-parse-fail.md | 2 (lines 11, 82) |
| 32-07-PLAN.md | Self-defused at authoring time |

Total: 13 substitutions across 7 files. Diagnosis prose preserved verbatim.

## Task Commits

Each task was committed atomically:

1. **Task 1: Defuse literal in 5 canonical .planning/**/*.md files** — `4e44af8` (fix)
2. **Task 2: Defuse debug session file + remove stale worktree mirror** — `7e4f208` (fix)
3. **Task 3: Layer 2 — source(none) + explicit @source in globals.css** — `6795469` (fix)
4. **Task 4: Layer 3 — Jest enforcement gate** — `298c799` (feat)
5. **Task 5 auto-fix A: CSS comment + test file scanner safety** — `5c7f35c` (fix)
6. **Task 5 auto-fix B: Split PATTERN prefix to prevent scanner false-positives** — `98539c7` (fix)

## Files Created/Modified

- `src/__tests__/no-bad-tailwind-literals.test.ts` — NEW: Layer-3 enforcement gate; scans .planning/**/*.md and src/**/* for dangerous Tailwind literal; wired into `npm test`
- `src/app/globals.css` — Layer-2 fix: `source(none)` + `@source "../../src"` replacing broken glob directive
- `.planning/milestones/v1.5-phases/27-role-assignment-and-testing/deferred-items.md` — Defused 2 occurrences
- `.planning/milestones/v1.5-phases/27-role-assignment-and-testing/27-05-SUMMARY.md` — Defused 1 occurrence
- `.planning/milestones/v1.5-phases/27-role-assignment-and-testing/27-VERIFICATION.md` — Defused 1 occurrence
- `.planning/phases/31-role-expansion-and-db-infrastructure/31-05-SUMMARY.md` — Defused 1 occurrence
- `.planning/phases/32-schema-migrations-and-seed-data/32-UAT.md` — Defused 6 occurrences
- `.planning/debug/css-text-var-text-star-parse-fail.md` — Defused 2 occurrences
- `.claude/worktrees/agent-a3690773d1b688bc2/` — DELETED: stale gsd-debugger worktree

## Decisions Made

- **Layer 2 option (b) chosen** (`source(none)` + explicit positive `@source`) over option (a) directory form: Phase 27 empirically observed directory form did NOT recurse into subfolders for this codebase. Repeating that construct trusts an unverified assumption. Option (b) is explicit: if the syntax is wrong, zero utilities are generated and the build fails loudly immediately.
- **Layer 3 mechanism: Jest test** over npm script or husky pre-commit: Jest is already wired into `npm test` and CI; adding one test file is the cheapest, most idiomatic enforcement mechanism. Husky is not installed; standalone npm script requires developers to remember an extra command.
- **Test file string splitting**: The Tailwind Oxide scanner reads raw bytes from ALL files in `src/`. The test file must reference the dangerous pattern to test for it. Using `PREFIX_A + PREFIX_B + STAR` (split across variables) prevents the scanner from finding the contiguous byte sequence in the test source file, which would cause it to generate an invalid CSS class.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CSS comment in globals.css contained `**/` sequence**
- **Found during:** Task 5 (first build run)
- **Issue:** The comment `/* ... (which would scan .planning/**/*.md and trigger ... */` contained `**/ ` which terminated the CSS comment block prematurely. PostCSS then parsed `*.md` as unknown CSS and failed.
- **Fix:** Rewrote comment to avoid any glob-pattern characters inside CSS comment block.
- **Files modified:** `src/app/globals.css`
- **Verification:** `npm run build` exits 0 with no parse-error signatures.
- **Committed in:** `5c7f35c`

**2. [Rule 1 - Bug] Test file JSDoc comment contained defused entity form as contiguous pattern**
- **Found during:** Task 5 (second build run)
- **Issue:** After fixing the `**/` terminator, the test file's JSDoc comment contained `text-[var(--text-&ast;)]` as a contiguous byte sequence. The Tailwind Oxide scanner reads raw bytes from all files in `src/` and generated `.text-[var(--text-&ast;)]` as a CSS class candidate, causing `Unexpected token Delim('&')` CSS warning.
- **Fix:** Rewrote JSDoc to avoid any `text-[var(--text-` prefix pattern; updated `defusedString` constant to use concatenation rather than literal.
- **Files modified:** `src/__tests__/no-bad-tailwind-literals.test.ts`
- **Verification:** `npm run build` exits 0 with zero CSS warnings.
- **Committed in:** `5c7f35c`

**3. [Rule 1 - Bug] Test file PATTERN constant string literals contained contiguous dangerous prefix**
- **Found during:** Task 5 (dev server smoke test)
- **Issue:** Even after the JSDoc fix, the dev server still showed both `text-[var(--text-&ast;)]` and `text-[var(--text-*)]` CSS errors. The `const PATTERN = 'text-[var(--text-' + STAR + ')]'` line had `'text-[var(--text-'` as a literal string — raw bytes contain the contiguous prefix `text-[var(--text-`. The Tailwind scanner's raw-byte matching found the `[` bracket and the first `)` on the line as the class boundary, generating both the `&ast;` form (from the defusedString line) and attempted-`*` form from the PATTERN string.
- **Fix:** Split the prefix into `PREFIX_A = 'text-[var('` and `PREFIX_B = '--text-'` so no single source location contains the contiguous byte sequence `text-[var(--text-`.
- **Files modified:** `src/__tests__/no-bad-tailwind-literals.test.ts`
- **Verification:** `npm run build` exits 0 with zero CSS warnings; dev server smoke test shows `/sign-in` HTTP 200 with no Build Error overlay.
- **Committed in:** `98539c7`

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs)
**Impact on plan:** All auto-fixes required for correct operation. The Tailwind scanner reads raw bytes from ALL scanned source files — any `text-[var(--text-` prefix (even in comments or string literals) becomes a CSS class candidate. The final approach (prefix split into two variables) is the correct idiom for writing enforcement tests that themselves cannot trigger the pattern they enforce.

## Issues Encountered

- **CSS comment `**/` terminator (deviation 1):** PostCSS treats `*/` inside `/* */` as comment-close. The glob pattern `**/*.md` inside a CSS comment terminates the comment prematurely. Fix: avoid all `*` characters in CSS comments.
- **Tailwind scanner reads test source files (deviations 2-3):** With `@source "../../src"`, Tailwind scans ALL files in src/ including TypeScript test files. String literals, variable values, and even JSDoc comments are scanned as raw bytes for class-name candidates. This is documented in the test file's header comment.

## Build / Dev-Smoke Evidence

**TypeScript check:**
```
npx tsc --noEmit → exit 0
```

**Full test suite:**
```
npm test -- --watchAll=false
Test Suites: 1 failed, 47 passed, 48 total
Tests:       14 failed, 437 passed, 451 total
```
(The 1 failing suite / 14 failing tests are the pre-existing Phase 27 deferred D-04 ClerkProvider failures in `src/app/settings/__tests__/page.test.tsx`. No new failures introduced.)

**Layer-3 enforcement gate:**
```
npx jest --testPathPatterns='no-bad-tailwind-literals' --watchAll=false
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

**Build:**
```
npm run build → exit 0
✓ Compiled successfully in 1724ms
Zero CSS warnings or parse-error signatures.
```

**Dev server smoke:**
```
npm run dev → /sign-in → HTTP 200, no Build Error overlay
```

**Final chained verification:**
```
npx tsc --noEmit
  && npm run build (exit 0, no CSS errors)
  && grep -rln dangerous-literal .planning/ | grep -v 32-07-PLAN.md → 0 files
  && grep source(none) src/app/globals.css → found
  && ! grep @source not src/app/globals.css → not found
  && test ! -d .claude/worktrees/agent-a3690773d1b688bc2 → not present
ALL FINAL VERIFICATION CHECKS PASSED
```

## Recurrence-Prevention Posture

This is the THIRD fix for the same class of bug (Phase 27 → Phase 31-05 → Phase 32). Layers 1 and 2 are passive defenses. Layer 3 is the first **active enforcement gate** in the project's history for this bug class.

Going forward:
- Any engineer who writes the dangerous Tailwind literal in a new SUMMARY, REVIEW, or debug session markdown file will see `npm test` fail on the next run — the recurrence is caught at development time, not at UAT time.
- The test runs automatically as part of `npm test` (no new tooling, no opt-in required).
- The test is self-documenting: its header comment explains the bug history and why the test must not be deleted.

**If this test ever needs to be disabled:** Record the decision and rationale in a `deferred-items.md` entry, coordinate with whoever owns Tailwind config, and ensure an equivalent enforcement mechanism replaces it.

## User Setup Required

None — this plan makes no external service changes. All fixes are code-only.

## Next Phase Readiness

- UAT test #5 (Demo UI Regression — /demo/mill-production) technical fix verified; ready for operator re-UAT.
- All pre-existing gates remain green (modulo the 14 pre-existing D-04 ClerkProvider deferred failures).
- Phase 32 gap-closure complete; Phase 33 (server actions / import) can proceed.

## Self-Check: PASSED

- src/__tests__/no-bad-tailwind-literals.test.ts: FOUND
- src/app/globals.css: FOUND
- .planning/phases/32-schema-migrations-and-seed-data/32-07-SUMMARY.md: FOUND
- .claude/worktrees/agent-a3690773d1b688bc2: CONFIRMED REMOVED
- Commits 4e44af8, 7e4f208, 6795469, 298c799, 5c7f35c, 98539c7, 3dd055c: ALL FOUND

---
*Phase: 32-schema-migrations-and-seed-data*
*Completed: 2026-05-13*
