# Phase 31: Role Expansion and DB Infrastructure - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Add the `mill_operator` role to the type system and Clerk dashboard fixtures, stand up a server-only Drizzle + Neon HTTP client at `src/db/`, and verify a clean `next build` with no Edge-runtime contamination. **No table definitions, no migrations, no queries** — those land in Phase 32.

**In scope:**
- `'mill_operator'` added to the `Role` union in `src/types/clerk.d.ts`
- `src/app/page.tsx` switches from "Coming Soon" placeholder to a minimal authenticated landing that derives `canEdit = await checkRole('mill_operator')` (the read-only-vs-edit split locked below)
- Middleware updated: `/` requires authentication only (no `mill_operator` coarse-gate); the existing `/demo/*` block is preserved
- `src/db/index.ts` Drizzle singleton with `import 'server-only'` as line 1
- `src/db/schema.ts` placeholder (single file; Phase 32 may split into a directory later)
- `drizzle.config.ts` at repo root, pointing at `./src/db/schema.ts`, reading `DATABASE_URL_UNPOOLED`
- `@neondatabase/serverless` + `drizzle-orm` + `drizzle-kit` installed
- `.env.local` populated with pooled + unpooled Neon URLs from a freshly-provisioned project
- `.env.example` updated with placeholder keys for both URLs
- Clerk dashboard fixtures extended: new `e2e-mill-operator+clerk_test` user, existing `e2e-demo` user updated to `roles: ['demo','mill_operator']` (covers the multi-role path)
- `docs/clerk-setup.md` runbook updated with the new user and the multi-role assignment
- `next build` passes with no Edge-bundle errors

**Out of scope (Phase 31):**
- Table definitions for `production_orders`, `order_events`, `import_batches`, `users` → Phase 32
- Any Drizzle queries, server actions, or RSC data fetches → Phase 33+
- Vercel env-var provisioning (Production / Preview) → deferred to Phase 34 (first deploy)
- The actual production-dashboard UI → Phase 34
- The Coming Soon JSX rewrite into a real three-column board → Phase 34

</domain>

<decisions>
## Implementation Decisions

### Enforcement model (rewrites AUTH-02 + AUTH-03)
- **D-01:** `mill_operator` is an **edit role**, not a page-gate role. Any authenticated user can view `/` in read-only mode; `mill_operator` is required for mutating server actions and gates the visibility of edit affordances in the UI.
- **D-02:** `src/app/page.tsx` uses `await auth()` + `redirect('/sign-in')` (or `await auth.protect()`) for the authentication gate only. It does NOT call `requireRole('mill_operator')`.
- **D-03:** A server-side `canEdit = await checkRole('mill_operator')` is computed in the RSC and passed as a prop to the client UI. The client UI hides edit buttons when `!canEdit`. `<Protect>` is NOT used (it is presentational only — see `docs/security-patterns.md` §4).
- **D-04:** Mutating server actions (Phase 33: transitions, bulk import) call `await requireRole('mill_operator')` as the real enforcement gate. This is the **canonical** server-side guard for v2.0 write operations — replaces AUTH-02's page-level enforcement claim.
- **D-05:** Middleware update for `/`: add `/` to the protected-routes block only for authentication (`auth.protect()`). Do NOT add a `mill_operator` coarse-gate matcher mirroring `/demo/*`. This rewrites AUTH-03.

### Neon provisioning
- **D-06:** Provision a fresh Neon project at `neon.tech` (named `cgm-dashboard`). Local development only for Phase 31 — pooled and unpooled URLs go into `.env.local`. Vercel env vars deferred to Phase 34 (first deploy).
- **D-07:** `DATABASE_URL` = pooled endpoint (`-pooler.neon.tech`). `DATABASE_URL_UNPOOLED` = direct endpoint. Both committed to `.env.example` as empty placeholders.
- **D-08:** `drizzle.config.ts` reads `DATABASE_URL_UNPOOLED` (NOT `DATABASE_URL`) — PgBouncer transaction mode is incompatible with migration `SET` commands.

### Drizzle file layout
- **D-09:** Single `src/db/schema.ts` file in Phase 31 (matches research's quickstart). Trivial placeholder content allowed (re-export an empty object) to keep `drizzle-kit` happy. Phase 32 decides whether to split into `src/db/schema/` directory when tables actually exist.
- **D-10:** `src/db/index.ts` exports the Drizzle client and has `import 'server-only'` as **line 1** (not after the imports — Webpack/Turbopack inline this and an early position is a clearer signal for both readers and future static analysis).
- **D-11:** `drizzle.config.ts` lives at repo root (Drizzle/Neon official tutorial pattern, matches existing config files like `next.config.ts`, `eslint.config.mjs`).

### Test fixtures and role coverage
- **D-12:** Create a new Clerk test user `e2e-mill-operator+clerk_test@example.com` with `publicMetadata.roles: ['mill_operator']`.
- **D-13:** Update existing `e2e-demo+clerk_test@example.com` to `publicMetadata.roles: ['demo','mill_operator']`. This is the canonical multi-role coverage path — verifies that `Array.prototype.includes` membership semantics work for users with more than one role.
- **D-14:** Add a new Playwright auth project `auth-mill-operator` paralleling `auth-demo` / `auth-admin`. New env vars: `E2E_MILL_OPERATOR_USER_EMAIL`, `E2E_MILL_OPERATOR_USER_PASSWORD`. Updated env vars on the demo user are silent (same login, broader role set).

### Success-criteria amendments (must reach planner)
- **D-15:** ROADMAP.md Phase 31 success criterion #2 ("non-mill_operator redirected away from `/`") is now **wrong** per D-01. Rewrite to: "An authenticated user without `mill_operator` sees `/` in read-only mode (edit affordances hidden); mutating server actions (Phase 33) reject without `mill_operator`."
- **D-16:** ROADMAP.md Phase 31 success criterion #4 ("`DATABASE_URL` and `DATABASE_URL_UNPOOLED` set in Vercel env") is **partially deferred** per D-06. Rewrite to: "`DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) set in `.env.local`; Vercel env-var provisioning deferred to Phase 34 first deploy."
- **D-17:** REQUIREMENTS.md AUTH-02 and AUTH-03 are rewritten by D-04 and D-05 respectively. Planner must update REQUIREMENTS.md in the same PR as Phase 31's implementation. AUTH-01 (role string added to union) and AUTH-04 (clerk-setup.md runbook update) are unchanged.

### Claude's Discretion
- Test approach: TDD a small unit test that asserts `'mill_operator'` is in the `Role` union (compile-time check via `satisfies`) — planner decides whether this is worth a dedicated test file or folds into the existing `src/lib/__tests__/auth.test.ts` suite.
- Build-verification approach for "no Edge-runtime contamination": a `next build` smoke run inside `next-build` CI step is sufficient. No need for a custom Webpack rule or separate import-graph audit in Phase 31.
- Whether to update the existing E2E test matrix (`auth-demo` project) to cover the new dual-role behavior, or only add `auth-mill-operator` tests in Phase 31 and broaden the demo coverage when transitions land in Phase 33.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning (LOCKED requirements + roadmap)
- `.planning/REQUIREMENTS.md` — v2.0 requirements; AUTH-01 through AUTH-04 + DATA-01 + DATA-08 in scope for Phase 31. **Note:** AUTH-02 and AUTH-03 are rewritten by D-04 and D-05 in this CONTEXT — planner must update REQUIREMENTS.md to match.
- `.planning/ROADMAP.md` — Phase 31 success criteria (SC#2 and SC#4 amended per D-15 and D-16).
- `.planning/PROJECT.md` — v2.0 milestone context, current `roles[]` shape, deferred items.
- `.planning/STATE.md` — pre-loaded v2.0 implementation notes (DB driver, polling, mutation invariants).

### Research (HIGH confidence, used to drive decisions)
- `.planning/research/v2.0/SUMMARY.md` — executive summary, dependency layers, top 5 pitfalls, Phase A == this phase.
- `.planning/research/v2.0/STACK.md` — Neon + Drizzle + `read-excel-file` rationale and install command.
- `.planning/research/v2.0/PITFALLS.md` — Edge driver leak, connection exhaustion, `import 'server-only'` discipline.
- `.planning/research/v2.0/ARCHITECTURE.md` — `src/db/` layout, role string decision, RSC + server-action boundaries.

### Security and auth patterns (LOCKED, do not relitigate)
- `docs/security-patterns.md` — canonical client/server boundary rules; §3 distinguishes `requireRole` vs `checkRole` vs `<Protect>`. Phase 31 introduces a new pattern: `checkRole` boolean prop for edit affordances + `requireRole` inside server actions.
- `docs/security-patterns.md` §4 — `<Protect>` is presentational only, NOT a security boundary.
- `docs/clerk-setup.md` — runbook for JWT template + test users; Phase 31 extends it for `mill_operator` (AUTH-04).

### Code (existing patterns Phase 31 must align with)
- `src/types/clerk.d.ts` — `Role` union + `CustomJwtSessionClaims.metadata.roles: Role[]` shape (post-quick-task-260512-kfy). Add `'mill_operator'` to the union.
- `src/lib/auth.ts` — `requireRole` + `checkRole` reference implementation, including JSDoc that constrains behavior. Phase 31 does NOT modify the signatures; it only adds `'mill_operator'` to call sites.
- `src/middleware.ts` — Clerk middleware shape; add `/` to the `auth.protect()` flow without a role check.
- `src/app/page.tsx` — current Coming Soon placeholder; Phase 31 replaces it with a minimal auth+canEdit RSC stub. Phase 34 fills in the real UI.
- `src/test/fixtures/clerkAuth.ts` — Clerk auth mock factory; Phase 31 adds `'mill_operator'` role coverage.
- `.env.example` — placeholder env var template; Phase 31 adds `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `E2E_MILL_OPERATOR_USER_EMAIL`, `E2E_MILL_OPERATOR_USER_PASSWORD`.

### External docs (referenced during discussion)
- Neon Next.js integration: https://neon.com/docs/guides/nextjs
- Drizzle Neon HTTP tutorial: https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon
- Next.js 16 release notes: https://nextjs.org/blog/next-16

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `requireRole` / `checkRole` in `src/lib/auth.ts` — server-only role helpers reading `sessionClaims.metadata.roles`. Phase 31 adds `'mill_operator'` as a new call-site target; no helper changes.
- `src/test/fixtures/clerkAuth.ts` Clerk auth mock factory — established TDD pattern from Phase 27 (8-case Jest suite). Extend it for the multi-role demo user and the new mill-operator-only user.
- `src/middleware.ts` `isPublicRoute` / `isDemoRoute` `createRouteMatcher` pattern — the canonical middleware shape. `/` falls under the implicit "protected" bucket (not public, not demo); the existing `auth.protect()` already covers it.
- `DashboardLayout` (`src/components/DashboardLayout.tsx`) — already wraps `/` via the Coming Soon page; Phase 31's stub keeps it.
- `.env.example` schema — established pattern (Clerk keys + E2E users); extend with two DB URLs + the new test-user pair.

### Established Patterns
- **RSC + client wrapper (Phase 28 pattern):** `page.tsx` is an async RSC; sensitive logic runs server-side; data and capability flags flow to a client wrapper via props. Phase 31's `src/app/page.tsx` follows this: `await auth()` + `await checkRole('mill_operator')` → `<MillReadOnlyStub canEdit={canEdit} />` (placeholder client; Phase 34 replaces).
- **Roles as `Role[]` arrays with `.includes(...)` membership (post-260512-kfy):** All role checks use `metadata.roles.includes('X')`. No singular `role` field anywhere. Multi-role users supported by design.
- **Test-user creation via Clerk Dashboard + `+clerk_test` email suffix (Phase 27 pattern):** Documented in `docs/clerk-setup.md` Step 2. Phase 31 adds one row to the table.
- **`import 'server-only'` discipline:** Already enforced in `src/lib/auth.ts` and the JSDoc forbidding client import. Phase 31 extends to `src/db/index.ts` per DATA-08.
- **Drizzle Neon HTTP driver default:** `drizzle-orm/neon-http` (not `neon-serverless`); Edge-compatible and HTTP-based. Pattern confirmed by STACK.md and SUMMARY.md.

### Integration Points
- `src/types/clerk.d.ts` line 16: extend the `Role` union from `'demo' | 'admin' | 'user'` to `'demo' | 'admin' | 'user' | 'mill_operator'`.
- `src/middleware.ts`: no structural change. Existing `auth.protect()` already covers `/` (it's not a public route). Confirm `/` reaches `auth.protect()` via the matcher; no role check added.
- `src/app/page.tsx`: full rewrite of the body (Coming Soon → auth-checked stub). `DashboardLayout` wrapper preserved.
- `src/app/layout.tsx`: no change in Phase 31 (NuqsAdapter wiring belongs to Phase 34).
- `docs/clerk-setup.md`: add Step 3 row for mill-operator user; update existing demo user entry to dual-role.
- `package.json`: add `drizzle-orm`, `@neondatabase/serverless` as deps; `drizzle-kit` as devDep. No other v2.0 packages (`nuqs`, `zod`, `read-excel-file`) added in Phase 31 — they belong to the phases that consume them.
- `.gitignore`: confirm `.env.local` already ignored (it is — Phase 27 work).

### Build-time risks Phase 31 must surface
- If `src/db/index.ts` is imported (even transitively) by `src/middleware.ts` or any `'use client'` file, `next build` fails with `Module not found: Can't resolve 'fs'` or similar Edge-runtime errors. The `import 'server-only'` line is the prevention; a `next build` smoke run is the verification.
- If `drizzle.config.ts` uses `DATABASE_URL` instead of `DATABASE_URL_UNPOOLED`, `drizzle-kit generate` and `migrate` will fail later under PgBouncer transaction mode. Lock the unpooled URL in `drizzle.config.ts` at file creation.

</code_context>

<specifics>
## Specific Ideas

- **The `e2e-demo` user becomes the canonical multi-role test fixture.** Updating it to `roles: ['demo', 'mill_operator']` covers two paths simultaneously: (a) a demo user retains access to `/demo/*`; (b) the same user passes `mill_operator` checks. This proves `Array.prototype.includes` semantics end-to-end without inventing a separate "dual-role" user.
- **`/sign-in` is the post-sign-out destination, not `/no-access`.** Since `/` is open to any authenticated user (read-only for non-mill-operator), there is no "no-access" wall in v2.0. The existing `/sign-in` and `afterSignOutUrl` setup on `ClerkProvider` is sufficient.
- **`drizzle-kit generate` will produce zero migrations in Phase 31** (no tables defined). This is correct and expected. The first real migration ships in Phase 32. Phase 31's plan should NOT include a `drizzle/0000_*.sql` artifact.
- **Phase 31's "next build passes" success criterion is the proof point.** Treat it as the canonical end-of-phase smoke check: `npm run build` runs in CI; no Edge-bundle errors; `src/db/index.ts` compiles into the server bundle only.

</specifics>

<deferred>
## Deferred Ideas

- **Vercel Marketplace Neon integration** with auto-branching per Preview deployment — deferred to Phase 34 (first real deploy). Until then, Vercel env vars are unset.
- **Schema file split** (`src/db/schema/` directory with one file per table) — deferred to Phase 32 when actual tables exist. Phase 31 keeps it a single `src/db/schema.ts`.
- **A `/no-access` route** — not needed in v2.0 since read-only access to `/` is granted to any authenticated user. Capture as a future v3+ idea if a role gains zero-view privileges.
- **Generalizing `requireRole` to take a fallback option** — not needed since the page-level gate is being removed entirely. Revisit only if a future role needs a per-call-site fallback destination.
- **Production-instance test user for `mill_operator`** — same constraint as v1.4: production E2E blocked by Clerk 2FA, custom domain needed. Carried-forward limitation.
- **Migrating `src/middleware.ts` → `src/proxy.ts`** (Next.js 16 deprecation) — not blocking; deprecation warning only. Schedule as housekeeping when it becomes a breaking change.

</deferred>

---

*Phase: 31-role-expansion-and-db-infrastructure*
*Context gathered: 2026-05-12*
