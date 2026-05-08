---
phase: 19-documentation-accessibility
plan: 01
subsystem: testing
tags: [jest-axe, eslint-plugin-jsx-a11y, accessibility, a11y, WCAG]

# Dependency graph
requires:
  - phase: 17-component-library
    provides: UI components to test for accessibility
provides:
  - jest-axe matcher globally available for accessibility tests
  - jsx-a11y ESLint rules enforcing WCAG compliance
  - Accessibility testing infrastructure ready for Plan 02
affects: [19-02-accessibility-tests, all-component-development]

# Tech tracking
tech-stack:
  added: [jest-axe@10.0.0, eslint-plugin-jsx-a11y@6.10.2]
  patterns: [global-jest-matchers, eslint-rules-approach]

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - jest.setup.ts
    - eslint.config.mjs

key-decisions:
  - "Use rules approach for jsx-a11y to avoid plugin conflict with eslint-config-next"
  - "Configure all 31 jsx-a11y recommended rules at error severity"
  - "Extend jest globally with toHaveNoViolations for accessibility tests"

patterns-established:
  - "Global jest matcher extension: Add matchers in jest.setup.ts via expect.extend()"
  - "ESLint rules approach: When plugin already registered, add rules directly instead of re-registering"

requirements-completed: [DOC-03]

# Metrics
duration: 278s
completed: 2026-05-08
---

# Phase 19 Plan 01: Accessibility Testing Infrastructure Summary

**jest-axe@10.0.0 and eslint-plugin-jsx-a11y@6.10.2 configured for automated accessibility testing and linting**

## Performance

- **Duration:** 4min 38s (278s)
- **Started:** 2026-05-08T20:11:46Z
- **Completed:** 2026-05-08T20:16:24Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Installed jest-axe@10.0.0 for runtime accessibility testing with axe-core
- Extended Jest globally with toHaveNoViolations matcher
- Configured all 31 jsx-a11y recommended rules at error severity
- Verified all 212 existing tests pass with new configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Install accessibility testing dependencies** - `ce2f0cf` (chore)
2. **Task 2: Extend jest.setup.ts with jest-axe matcher** - `ac299b5` (feat)
3. **Task 3: Configure eslint-plugin-jsx-a11y in eslint.config.mjs** - `460332a` (feat) + `ad95679` (fix)
4. **Task 4: Verify all tests still pass** - No commit (verification only)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `package.json` - Added jest-axe and eslint-plugin-jsx-a11y to devDependencies
- `package-lock.json` - Updated lockfile with new dependencies
- `jest.setup.ts` - Extended expect with toHaveNoViolations matcher
- `eslint.config.mjs` - Added 31 jsx-a11y recommended rules

## Decisions Made

1. **Rules approach instead of flatConfigs.recommended:** eslint-config-next already registers jsx-a11y plugin. Using `jsxA11y.flatConfigs.recommended` caused "Cannot redefine plugin" error. Solution: Add jsx-a11y rules directly in a rules config block.

2. **Error severity for all rules:** Upgraded from Next.js default (warn on 6 rules) to error on all 31 recommended rules to catch accessibility issues at lint time.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed jsx-a11y plugin conflict with eslint-config-next**
- **Found during:** Task 3 (Configure jsx-a11y in eslint.config.mjs)
- **Issue:** `jsxA11y.flatConfigs.recommended` caused ConfigError because eslint-config-next already registers the jsx-a11y plugin
- **Fix:** Used rules approach - added jsx-a11y recommended rules directly without re-registering plugin
- **Files modified:** eslint.config.mjs
- **Verification:** `npm run lint` runs successfully, rules are active
- **Committed in:** ad95679 (fix commit)

---

**Total deviations:** 1 auto-fixed (blocking issue)
**Impact on plan:** Fix necessary for ESLint to run. No scope creep - same rules, different approach.

## Issues Encountered

None beyond the deviation above.

## Known Accessibility Issues (for Plan 02)

The jsx-a11y rules identified 14 pre-existing accessibility issues in the codebase:

| Rule | Count | Example Location |
|------|-------|------------------|
| click-events-have-key-events | 3 | Pagination.tsx, Tabs.tsx |
| no-static-element-interactions | 2 | Pagination.tsx, Tabs.tsx |
| label-has-associated-control | 1 | RawDataPanel.tsx |
| no-noninteractive-element-interactions | 1 | OrderDetailModal.tsx |
| no-redundant-roles | 1 | Timeline.tsx |

These are expected and will be addressed in Plan 02 (accessibility fixes).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- jest-axe toHaveNoViolations() available globally for accessibility tests
- jsx-a11y rules active and catching accessibility issues
- Ready for Plan 02: Write accessibility tests for key components

## Self-Check: PASSED

- [x] package.json contains jest-axe: FOUND
- [x] package.json contains eslint-plugin-jsx-a11y: FOUND
- [x] jest.setup.ts contains toHaveNoViolations: FOUND
- [x] eslint.config.mjs contains jsx-a11y rules: FOUND (31 rules)
- [x] All commits exist in git log: FOUND

---
*Phase: 19-documentation-accessibility*
*Completed: 2026-05-08*
