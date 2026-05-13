# Phase 31 — Deferred Items

Items discovered during plan execution that are OUT OF SCOPE for the
plan in which they were found. Captured for triage by the orchestrator
or a follow-up plan.


## From Plan 31-02 (executor)

- **`src/app/settings/__tests__/page.test.tsx` — 14 tests fail with
  `throwMissingClerkProviderError`** (`@clerk/react` missing
  `ClerkProvider` in test render tree). Discovered while running the
  full jest suite as a post-Task-4 sanity check. NOT caused by Plan
  31-02 changes — I did not modify `src/app/settings/` or any Clerk
  provider wiring; my changes touch only `package.json`,
  `package-lock.json`, `drizzle.config.ts`, `src/db/{index,schema}.ts`,
  `src/db/__tests__/index.test.ts`, and `.env.example`. The failures
  reproduce on commit `073f89d` (the worktree base, pre-execution).
  Likely cause: a `@clerk/*` package upgrade (the install of
  `drizzle-orm` + transitive deps did not touch any `@clerk/*`
  versions — `git diff 073f89d -- package.json` shows only drizzle
  additions). Treat as a pre-existing flake to triage independently.
