# Phase 31: Role Expansion and DB Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 31-role-expansion-and-db-infrastructure
**Areas discussed:** Enforcement model (non-mill_operator landing reformulated), Neon project setup, Drizzle schema layout, Test user & multi-role fixture

---

## Non-mill_operator landing → reformulated as Enforcement model

Initially proposed as a redirect-target decision (where to send authenticated users without `mill_operator` when they hit `/`). User clarified that `mill_operator` is intended as an **edit role** — all authenticated users should see `/` in read-only form. This invalidated the original question and surfaced a more fundamental enforcement-architecture choice.

| Option | Description | Selected |
|--------|-------------|----------|
| auth.protect at / + checkRole gates UI + server actions reject | Page uses `await auth()` only; server-side `canEdit = await checkRole('mill_operator')` passed as prop to client UI; mutating server actions call `requireRole('mill_operator')` as the real gate. | ✓ |
| Page-level requireRole + separate read-only / route | Keep AUTH-02 as written; add a parallel `/readonly` route for non-mill_operator users. | |
| Middleware splits read vs edit | Middleware checks role on POST/PATCH only; GET open to any auth user. | |

**User's choice:** auth.protect at / + checkRole gates UI + server actions reject

**Notes:** This rewrites two REQUIREMENTS.md entries (AUTH-02 page-level guard claim, AUTH-03 middleware coarse-gate claim) and two Phase 31 success criteria (SC#2 redirect behavior, SC#4 partial Vercel-env deferral). Planner must update both files in the same PR as Phase 31's implementation. The new pattern (checkRole boolean prop + server-action requireRole) becomes the canonical v2.0 enforcement model — it pairs cleanly with the existing `docs/security-patterns.md` §3 helper taxonomy.

---

## Neon project setup path

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel Marketplace Neon integration | Add Neon via Vercel Marketplace; auto-injects DATABASE_URL on Preview/Prod; auto-branches per Preview deployment. | |
| Direct Neon project + manual env vars | Create Neon at neon.tech; copy pooled + unpooled URLs; set both in Vercel env manually for Prod and Preview. | |
| Local dev only for Phase 31 (defer Vercel) | Provision Neon, populate .env.local only. Vercel env vars deferred until first deploy in Phase 34. | ✓ |

**User's choice:** Local dev only for Phase 31 (defer Vercel)

**Notes:** Phase 31's success criterion #4 ("DATABASE_URL set in Vercel env") becomes partially deferred. The planner must amend ROADMAP.md and call out this deferral explicitly so the next phase boundary doesn't audit a missing artifact. Vercel-side provisioning belongs to Phase 34 when there is something to deploy.

---

## Drizzle schema layout

| Option | Description | Selected |
|--------|-------------|----------|
| src/db/schema/ directory, empty stubs | Phase 31 creates a directory with placeholder files for the four Phase 32 tables + an index.ts re-exporter. | |
| src/db/schema.ts single file, grow into dir later | Single empty schema.ts in Phase 31; Phase 32 decides whether to split. | ✓ |
| Defer schema file entirely to Phase 32 | Only src/db/index.ts in Phase 31; no schema file, drizzle.config.ts points to nonexistent path. | |

**User's choice:** src/db/schema.ts single file, grow into dir later

**Notes:** Lower ceremony in Phase 31, no premature directory layout. Phase 32 has full latitude to split per-table if it adds maintenance value. `drizzle-kit generate` will produce zero migrations in Phase 31 since the schema is empty — that is correct and expected, not a failure.

---

## Test user & multi-role fixture

| Option | Description | Selected |
|--------|-------------|----------|
| Add new e2e-mill-operator + extend demo user to multi-role | New e2e-mill-operator+clerk_test user with mill_operator role; existing e2e-demo updated to ['demo','mill_operator']; new Playwright auth project. | ✓ |
| Single new e2e-mill-operator user, leave demo user single-role | New user only; multi-role path covered by unit test, not E2E. | |
| Reuse e2e-admin user, no new user | Update e2e-admin to ['admin','mill_operator']; no new dashboard user; couples admin and mill_operator in tests. | |

**User's choice:** Add new e2e-mill-operator + extend demo user to multi-role

**Notes:** The dual-role demo user is the canonical multi-role coverage path. New env vars: `E2E_MILL_OPERATOR_USER_EMAIL`, `E2E_MILL_OPERATOR_USER_PASSWORD`. The new Playwright auth project is `auth-mill-operator`, paralleling `auth-demo` / `auth-admin`. Existing e2e-demo tests should keep passing unchanged since `['demo','mill_operator']` still includes `'demo'`.

---

## Claude's Discretion

- Whether the `'mill_operator'` Role union membership is verified by a dedicated test file or folded into the existing `src/lib/__tests__/auth.test.ts` suite.
- Build-verification approach for "no Edge-runtime contamination" — `next build` smoke run is sufficient; no need for a custom Webpack import-graph audit.
- Whether to broaden the existing `auth-demo` E2E project to assert the new dual-role behavior in Phase 31, or wait until Phase 33 transitions land.
- `import 'server-only'` is locked to **line 1** of `src/db/index.ts` (clearer signal); planner has discretion over comment style and surrounding boilerplate.

## Deferred Ideas

- **Vercel Marketplace Neon integration with auto-branching per Preview** — deferred to Phase 34 (first deploy).
- **`src/db/schema/` directory split** — deferred to Phase 32 if tables make a single file unwieldy.
- **A `/no-access` route** — not needed for v2.0 since all authenticated users can view `/`. Revisit if a future role has zero-view privileges.
- **Generalizing `requireRole` to accept a per-call-site fallback** — not needed since page-level gating at `/` is removed.
- **Production-instance test user for `mill_operator`** — same blocker as v1.4 (Clerk 2FA + custom domain).
- **`src/middleware.ts` → `src/proxy.ts` rename** (Next.js 16 deprecation) — housekeeping, schedule when breaking.
