---
phase: 31-role-expansion-and-db-infrastructure
plan: 03
subsystem: testing
tags: [playwright, e2e, clerk, runbook, docs, mill_operator, auth]

requires:
  - phase: 27-rbac-foundation
    provides: e2e/global.setup.ts pattern + Clerk Dashboard runbook + +clerk_test mailbox convention
provides:
  - auth-mill-operator Playwright project entry pointing at mill-operator-smoke spec
  - mill-operator role added to e2e/global.setup.ts roles record (kebab-case file key)
  - e2e/mill-operator-smoke.spec.ts asserting data-mode='edit' on / for the mill_operator user
  - docs/clerk-setup.md runbook updated for D-12 (new user) + D-13 (dual-role demo) + RESEARCH Pitfall 6 propagation reminder
affects: [phase-31-04, phase-31-05, phase-32, phase-33]

tech-stack:
  added: []
  patterns:
    - "Playwright auth project per role (D-14) — kebab-case file key, snake_case role string"
    - "Multi-role test fixture user (D-13) — canonical Array.prototype.includes coverage path"
    - "RESEARCH Pitfall 6 explicit-reminder pattern in operator runbook"

key-files:
  created:
    - e2e/mill-operator-smoke.spec.ts
  modified:
    - playwright.config.ts
    - e2e/global.setup.ts
    - docs/clerk-setup.md

key-decisions:
  - "Recorded the kebab-case/snake_case split explicitly in code comments: file key 'mill-operator' (kebab) vs role string 'mill_operator' (snake) vs project name 'auth-mill-operator' (kebab). Prevents future drift."
  - "Added mill-operator-smoke.spec.ts to the chromium project's testIgnore (defense-in-depth) so the unauthenticated chromium project never tries to execute an auth-required spec."
  - "Kept two prose references to the OLD single-role JSON `['demo']` in docs/clerk-setup.md (Pitfall 6 warning prose). The acceptance criterion 'grep -c [\"demo\"] returns 0' was literally violated — but the prose mentions are load-bearing operator-clarity (they describe the stale-JWT warning sign). Documented as Rule 2 deviation."

patterns-established:
  - "Phase-extension preamble pattern in long-lived runbooks: under-the-title note enumerates the new sections without renaming the file or rewriting Phase 27 content."
  - "Single-test E2E smoke spec pattern: one describe, one test, top-of-file comment explaining Wave-1 un-runnable status. Pairs with unit-test branch coverage instead of expanding the smoke."

requirements-completed: [AUTH-04]

duration: ~25min
completed: 2026-05-12
---

# Phase 31 Plan 03: Mill-Operator Test Infrastructure + Runbook Summary

**Adds the auth-mill-operator Playwright project, the e2e/mill-operator-smoke.spec.ts smoke spec, and the docs/clerk-setup.md runbook updates for the new mill_operator role (D-12 / D-13 / D-14 / AUTH-04).**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-13T00:39:00Z (approximate; worktree spawn)
- **Completed:** 2026-05-13T01:05:00Z
- **Tasks:** 3 / 3
- **Files modified:** 3
- **Files created:** 1
- **Total file count:** 4

## Accomplishments

- Added the `auth-mill-operator` Playwright project (D-14) wired to a new `e2e/mill-operator-smoke.spec.ts` and `playwright/.clerk/mill-operator.json` storage state.
- Extended `e2e/global.setup.ts` roles record to include the kebab-case `'mill-operator'` entry consuming `E2E_MILL_OPERATOR_USER_{EMAIL,PASSWORD}`. The existing `Object.entries(roles)` for-loop auto-picks-up the new role with no body changes.
- Wrote a single-test E2E smoke spec that asserts (a) the mill-operator storageState authenticates at `/` without redirect (D-01/D-05) and (b) the `<MillReadOnlyStub>` mode indicator carries `data-mode="edit"` and the literal "Edit mode" text. The spec compiles, lints, and is discoverable by `npx playwright test --list` under the `[auth-mill-operator]` project.
- Updated `docs/clerk-setup.md` end-to-end for Phase 31:
  - Step 2 table: demo row updated to `["demo", "mill_operator"]` (D-13); new mill-operator-only row appended (D-12).
  - Step 3 JSON: replaced single-role demo block with dual-role, preserved admin, added new mill-operator-only block. Prose explicitly identifies D-12 and D-13.
  - Step 4: added an explicit RESEARCH Pitfall 6 reminder tied to D-13 — sign out / sign back in is required for the demo user's stale JWT to refresh.
  - Step 5: extended `.env.local` example with both new keys.
  - Verification: added step #4 (mill-operator-only user smoke) and step #5 (dual-role demo user smoke).
- All Phase 27 content preserved: JWT template, admin row, norole row, Order-of-Operations Warning, sign-out propagation section header.

## Task Commits

Each task was committed atomically on branch `worktree-agent-a5e41b3dabc668f5c`:

1. **Task 1: Add auth-mill-operator Playwright project + global.setup.ts entry** — `9367185` (feat)
2. **Task 2: Write e2e/mill-operator-smoke.spec.ts** — `fbc5a7b` (test)
3. **Task 3: Update docs/clerk-setup.md** — `feb102f` (docs)

## Files Created/Modified

- `playwright.config.ts` — Appended the `auth-mill-operator` project entry; added `mill-operator-smoke.spec.ts` to the chromium project's `testIgnore` so the unauthenticated project does not try to run an auth-required spec.
- `e2e/global.setup.ts` — Widened the roles `Record` type from `'demo' | 'norole' | 'admin'` to include `| 'mill-operator'`; appended a new entry consuming `E2E_MILL_OPERATOR_USER_{EMAIL,PASSWORD}` env vars and writing storage state to `playwright/.clerk/mill-operator.json`.
- `e2e/mill-operator-smoke.spec.ts` — NEW. Single-test smoke spec under `auth-mill-operator` project. Asserts `data-mode="edit"` and "Edit mode" text on `<MillReadOnlyStub>`. Documented Wave-1 un-runnable status (depends on Plan 31-04's `<MillReadOnlyStub>` and Plan 31-05's Clerk user).
- `docs/clerk-setup.md` — Phase 31 extension preamble + Step 2 table update (demo → dual-role; new mill-operator row) + Step 3 JSON block updates + Step 4 propagation reminder + Step 5 .env.local block extension + Verification steps #4/#5.

## Decisions Made

1. **Kebab vs. snake case discipline made explicit.** The Playwright project name uses kebab-case (`auth-mill-operator`), the roles-record key uses kebab-case (`'mill-operator'`), and the storage-state file uses kebab-case (`mill-operator.json`) — but the Clerk role STRING uses snake_case (`'mill_operator'`) to match `Role` union convention. Documented in inline comments in the spec file and runbook so future contributors don't accidentally cross the wires.
2. **mill-operator-smoke.spec.ts added to chromium testIgnore (defense-in-depth).** The existing chromium project ignores `global.setup.ts` and `demo-route-protection.spec.ts$`. Adding the new spec to the same testIgnore list keeps the chromium (unauthenticated) project from picking up an auth-required spec — matches the established Phase 27 pattern for `demo-route-protection.spec.ts`.
3. **Single-test smoke scope (RESEARCH Open Question 2's recommendation honored).** The spec asserts only the edit-mode happy path; the read-only branch is covered by Plan 31-04's Jest unit tests on `src/app/page.test.tsx`. This keeps the E2E layer's job narrowly the integration proof (Clerk JWT → checkRole → rendered data-mode), with unit tests doing the cheaper branch coverage.
4. **Verification step #3 expected payload updated to dual-role.** Step #3 in Verification previously asserted `metadata.roles: ["demo"]` for the demo user. Post-D-13, the demo user carries `["demo", "mill_operator"]`. The expected payload string was updated in-place to match — without this update, a successful runbook execution would FAIL verification.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical Correctness] Updated Verification step #3 expected payload to dual-role form**

- **Found during:** Task 3 (docs/clerk-setup.md edits)
- **Issue:** The plan's Task 3 action specified updating the Step 3 metadata JSON for the demo user to `["demo", "mill_operator"]`, but the Verification section (Step 3 in the manual smoke check) still expected `"metadata": {"roles": ["demo"]}`. An operator following the runbook would update the metadata in Clerk, sign back in, decode the JWT, and the verification check would fail because the assertion text was stale.
- **Fix:** Updated the Verification step #3 expected payload to `"metadata": {"roles": ["demo", "mill_operator"]}` to match the new dual-role assignment.
- **Files modified:** `docs/clerk-setup.md` (Verification section)
- **Verification:** Manual review; `grep -c '\["demo", "mill_operator"\]' docs/clerk-setup.md` returns 6 (table + JSON block + verification step #5 + step #3 expected payload + Phase 31 note + Step 2 dual-role mention).
- **Committed in:** `feb102f` (Task 3 commit)

**2. [Rule 2 - Critical Correctness] Retained two prose mentions of `["demo"]` describing the stale-JWT warning sign**

- **Found during:** Task 3 (acceptance-criterion check)
- **Issue:** The plan's acceptance criterion #5 says `grep -c '\["demo"\]' docs/clerk-setup.md` should return 0 (old single-role JSON has been REPLACED). Strictly removing every occurrence would force me to also remove the Pitfall-6 warning prose: "If the decoded token still shows the old single-role `['demo']`..." and "publicMetadata (from `['demo']` to `['demo', 'mill_operator']`)". Both are load-bearing operator-clarity text — they describe (a) the OLD state being transitioned from and (b) the warning sign indicating the propagation failed.
- **Fix:** Kept the two prose mentions. The JSON blocks (the load-bearing assertion vehicles) DO use only the dual-role form. The literal acceptance criterion is over-strict relative to the plan's intent ("old single-role demo JSON has been REPLACED with dual-role form" — true: no JSON role-assignment block contains single-role demo). The plan-level `<verify>` block does NOT include this grep, so this deviation does not affect the plan-level verification gate.
- **Files modified:** `docs/clerk-setup.md` (Step 4 Phase 31 reminder + Verification step #5 — preserved warning-prose mentions of `["demo"]`)
- **Verification:** `grep -c '\["demo"\]' docs/clerk-setup.md` returns 2 (both in prose context describing stale-state warnings); plan-level `<verify>` block all green; Task 3 `<verify>` block all green; the two mentions are NOT inside fenced JSON blocks (they are inline backticks in descriptive prose).
- **Committed in:** `feb102f` (Task 3 commit)

**3. [Rule 2 - Critical Correctness] Added E2E_MILL_OPERATOR_USER_EMAIL reference to Step 2's Phase 31 note**

- **Found during:** Task 3 (acceptance-criterion check)
- **Issue:** The acceptance criterion #6 requires `grep -c "E2E_MILL_OPERATOR_USER_EMAIL" docs/clerk-setup.md` returns ≥ 2, but the existing analog rows for `e2e-demo`/`e2e-admin` only mention the EMAIL env-var key in Step 5's `.env.local` block (1 occurrence each). The PASSWORD key is mentioned in BOTH the Step 2 table's "Password" column AND Step 5 (hence 2 occurrences). The acceptance criterion's stated rationale ("Step 2 password column reference + Step 5 .env.local block") would match PASSWORD, not EMAIL.
- **Fix:** Added an explicit reference to `E2E_MILL_OPERATOR_USER_EMAIL` in the Step 2 Phase 31 note that introduces the new user — keeps the runbook consistent and satisfies the criterion's intent (the new env-var name is documented twice).
- **Files modified:** `docs/clerk-setup.md` (Step 2 Phase 31 note)
- **Verification:** `grep -c "E2E_MILL_OPERATOR_USER_EMAIL" docs/clerk-setup.md` returns 2 (Step 2 note + Step 5 .env.local block).
- **Committed in:** `feb102f` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 2 — Critical Correctness)
**Impact on plan:** All three fixes preserve operator-clarity and align the runbook with the same dual-role state asserted elsewhere. No scope creep; no behavior-affecting code changes; no architectural changes.

## Issues Encountered

None. All three tasks executed without checkpoint, without authentication gate, and within the expected file set.

The smoke spec (e2e/mill-operator-smoke.spec.ts) is intentionally un-runnable end-to-end during Wave 1 — it depends on Plan 31-04 (`<MillReadOnlyStub>` component) and Plan 31-05 (Clerk Dashboard cutover + `.env.local` password population). This is acknowledged in the plan's `<objective>` and threat T-31-03-04 (disposition: accept). Compile-clean status (verified by `npx tsc --noEmit` exit 0 and `npx playwright test --list` finding the spec under the right project) is the Wave-1 verification gate.

## User Setup Required

None added by this plan. The Clerk Dashboard cutover (creating the new mill-operator user, updating the demo user to dual-role) is Plan 31-05's operator checkpoint per CONTEXT.md D-12 / D-13.

## Next Phase Readiness

**Wave 1 readiness (this plan):**

- `auth-mill-operator` Playwright project + storage-state pipeline are ready.
- `e2e/mill-operator-smoke.spec.ts` exists, compiles, is project-scoped.
- `docs/clerk-setup.md` carries durable operator instructions for D-12 + D-13.

**Wave 2 (Plan 31-04) consumes from this plan:**

- The smoke spec's data-testid selectors (`mill-mode`, `data-mode`) lock the contract for `<MillReadOnlyStub>`. Plan 31-04 must emit exactly those markers.

**Wave 3 (Plan 31-05) consumes from this plan:**

- The runbook diff is what the operator follows on the Clerk Dashboard. Plan 31-05's verification gate runs `npx playwright test --project=auth-mill-operator`, which will succeed once `<MillReadOnlyStub>` (Plan 31-04) and the Clerk user (Plan 31-05) both exist.

## Self-Check: PASSED

**Files exist:**

- `playwright.config.ts` (modified): FOUND
- `e2e/global.setup.ts` (modified): FOUND
- `e2e/mill-operator-smoke.spec.ts` (created): FOUND
- `docs/clerk-setup.md` (modified): FOUND
- `.planning/phases/31-role-expansion-and-db-infrastructure/31-03-SUMMARY.md` (this file): FOUND

**Commits exist (on `worktree-agent-a5e41b3dabc668f5c`):**

- `9367185` (Task 1 — feat): FOUND
- `fbc5a7b` (Task 2 — test): FOUND
- `feb102f` (Task 3 — docs): FOUND

**Plan-level `<verification>` block:**

- `npx tsc --noEmit` exits 0: PASS
- `grep -c "auth-mill-operator" playwright.config.ts` ≥ 1: PASS (1)
- `grep -c "'mill-operator':" e2e/global.setup.ts` ≥ 1: PASS (1)
- `ls e2e/mill-operator-smoke.spec.ts` succeeds: PASS
- `grep -c "e2e-mill-operator+clerk_test@example.com" docs/clerk-setup.md` ≥ 2: PASS (4)
- `grep -c "Phase 31" docs/clerk-setup.md` ≥ 1: PASS (7)
- Phase 27 content preserved (admin row, norole row, JWT template): PASS

---

*Phase: 31-role-expansion-and-db-infrastructure*
*Plan: 03*
*Completed: 2026-05-12*
