---
phase: 33-server-actions-queries-and-bulk-import
plan: "01"
subsystem: infra
tags: [npm, dependencies, read-excel-file, zod, next-config, server-actions, xlsx]

# Dependency graph
requires:
  - phase: 32-schema-migrations-and-seed-data
    provides: Drizzle schema, DB driver, seed data; no package.json deps needed from Phase 32

provides:
  - "read-excel-file@9.0.9 pinned in dependencies (no caret — CVE-conscious lock)"
  - "zod@^4.3.6 pinned in dependencies (was transitive-only before)"
  - "next.config.ts experimental.serverActions.bodySizeLimit: '2mb' (IMPORT-07 defense layer 3)"

affects:
  - 33-05-import-actions
  - 33-06-import-commit
  - 33-02-query-functions
  - 33-03-transition-actions

# Tech tracking
tech-stack:
  added:
    - "read-excel-file@9.0.9 (XLSX server-side parser; installed from node_modules/read-excel-file)"
    - "zod@^4.3.6 (installed 4.4.3; runtime validation library; previously transitive-only)"
  patterns:
    - "Exact version pin (no caret) for security-sensitive parsing library (read-excel-file@9.0.9)"
    - "next.config.ts experimental.serverActions.bodySizeLimit as framework-layer body-size guard"

key-files:
  created: []
  modified:
    - "package.json — added read-excel-file and zod to dependencies block"
    - "package-lock.json — regenerated lockfile with new dependency tree"
    - "next.config.ts — added experimental.serverActions.bodySizeLimit: '2mb'"

key-decisions:
  - "Pin read-excel-file exactly at 9.0.9 (no caret) — CVE-conscious; prevents silent transitive upgrade to vulnerable version"
  - "Use experimental.serverActions.bodySizeLimit (not top-level serverActions) — verified from Next.js 16.1.6 type definitions"
  - "zod specifier ^4.3.6 (installed 4.4.3 from registry) — minor patch acceptable since classic API surface is identical"

patterns-established:
  - "IMPORT-07 defense layer 3: HTTP 413 returned by Next.js before action body executes for >2MB uploads"
  - "read-excel-file/node is the correct server-side subpath import (not root or /universal)"

requirements-completed:
  - IMPORT-07

# Metrics
duration: 3min
completed: 2026-05-14
---

# Phase 33 Plan 01: Dependencies and Config Summary

**read-excel-file@9.0.9 pinned in dependencies and Next.js 16 server-actions body-size limit enforced at 2MB via experimental.serverActions.bodySizeLimit**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-14T00:32:30Z
- **Completed:** 2026-05-14T00:35:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Pinned `read-excel-file@9.0.9` (exact, no caret) in `dependencies` — resolves via `read-excel-file/node` subpath in server action context
- Added `zod@^4.3.6` to explicit `dependencies` (installed `4.4.3` from registry; was transitive-only before)
- Added `experimental.serverActions.bodySizeLimit: '2mb'` to `next.config.ts` — IMPORT-07 defense layer 3 (HTTP 413 before action code runs)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add read-excel-file@9.0.9 and zod to package.json dependencies** - `38d33bd` (chore)
2. **Task 2: Add experimental.serverActions.bodySizeLimit to next.config.ts** - `25fd2ee` (feat)

**Plan metadata:** (created in this commit) (docs)

## Files Created/Modified
- `package.json` - Added `"read-excel-file": "9.0.9"` and `"zod": "^4.3.6"` to dependencies
- `package-lock.json` - Regenerated lockfile with read-excel-file and zod dependency trees
- `next.config.ts` - Added `experimental.serverActions.bodySizeLimit: '2mb'` config

## Decisions Made
- **read-excel-file version pin:** npm installs with `^9.0.9` by default; manually corrected to exact `9.0.9` (no caret) per plan requirement for CVE-conscious dependency management
- **zod version:** npm resolved `^4.3.6` to `4.4.3` (registry current); accepted since v4.3.6 and v4.4.3 share the same classic API surface
- **next.config.ts config key:** Used `experimental.serverActions.bodySizeLimit` — confirmed from installed Next.js 16.1.6 type definitions (`ExperimentalConfig.serverActions.bodySizeLimit`), NOT top-level `serverActions` (which is a TypeScript-silent pitfall with no runtime effect)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] npm added caret (^) to read-excel-file version**
- **Found during:** Task 1 (after running npm install)
- **Issue:** `npm install read-excel-file@9.0.9` added `"^9.0.9"` to package.json instead of the pinned `"9.0.9"` required by acceptance criteria
- **Fix:** Manually corrected package.json to `"read-excel-file": "9.0.9"` (no caret), then re-ran `npm install` to update lockfile
- **Files modified:** package.json, package-lock.json
- **Verification:** `node -e "const p=require('./package.json'); if(p.dependencies['read-excel-file']!=='9.0.9') process.exit(1);"` exits 0
- **Committed in:** 38d33bd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 version-pin correction)
**Impact on plan:** Required to meet the security acceptance criterion. No scope creep.

## Issues Encountered
- npm defaulted to caret-version for exact-version install; fixed inline per deviation Rule 1

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wave 1 query and transition-action plans (33-02, 33-03, 33-04) can now run — `zod` is explicitly available
- Wave 2 import plans (33-05, 33-06) can import `read-excel-file/node` without install step
- All Phase 33 plans inherit the 2MB body-size limit from `next.config.ts`

---
*Phase: 33-server-actions-queries-and-bulk-import*
*Completed: 2026-05-14*
