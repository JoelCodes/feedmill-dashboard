# Phase 31: Role Expansion and DB Infrastructure - Research

**Researched:** 2026-05-12
**Domain:** TypeScript role-union extension + Drizzle/Neon HTTP-driver bootstrap inside an existing Next.js 16 / React 19 / Clerk v7 RSC app
**Confidence:** HIGH

## Summary

Phase 31 is two narrowly-scoped infrastructure additions that share a single PR: (1) extend the `Role` union with `'mill_operator'` and propagate it through fixtures, runbook, and E2E auth projects without touching the existing `requireRole`/`checkRole` signatures, and (2) install Drizzle + Neon HTTP driver + drizzle-kit, write a server-only `src/db/index.ts` singleton, a placeholder `src/db/schema.ts`, and a `drizzle.config.ts` at the repo root pointing at the **unpooled** Neon URL. The boundary explicitly excludes table definitions, migrations, and queries — those land in Phase 32.

The verification artifact for "no Edge-runtime contamination" is a clean `npm run build` (with Turbopack in Next.js 16): if `src/db/index.ts` is transitively imported by any `'use client'` file or by `src/middleware.ts`, the `import 'server-only'` line 1 of the singleton produces a build-time error referencing `node_modules/server-only/empty.js` throwing "This module cannot be imported from a Client Component module" [VERIFIED: `node_modules/server-only/index.js` contents, Next.js official docs]. Phase 31 must NOT import `src/db/index.ts` from anywhere yet — that's a Phase 33 concern — but the singleton compiling cleanly into the server bundle is the proof point.

The role-expansion side is largely "additive only" — the existing `requireRole(role: Role)` signature is generic over `Role`, the existing `mockNonDemoSession(role: Exclude<Role, 'demo'>)` fixture signature widens automatically when `'mill_operator'` joins the union, and the only behavioral change is in `src/app/page.tsx` (Coming Soon → auth-checked stub passing `canEdit` to a client wrapper). Per D-01 through D-05, `/` is open to ANY authenticated user; `mill_operator` is the *edit* role, gated downstream in Phase 33 server actions via `requireRole`, with the page-level `<MillReadOnlyStub canEdit={canEdit} />` indicator covering the boolean-prop path.

**Primary recommendation:** Treat Phase 31 as a four-track plan: (1) Role union + fixture + Clerk Dashboard + Playwright auth project; (2) DB-client install + `drizzle.config.ts` + `src/db/{index,schema}.ts` files; (3) `src/app/page.tsx` stub + middleware no-op verification + `<MillReadOnlyStub>` component; (4) REQUIREMENTS.md / ROADMAP.md amendments + clerk-setup.md runbook update. Build verification (`npm run build`) is the single end-of-phase smoke check.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Enforcement model (rewrites AUTH-02 + AUTH-03)**
- **D-01:** `mill_operator` is an **edit role**, not a page-gate role. Any authenticated user can view `/` in read-only mode; `mill_operator` is required for mutating server actions and gates the visibility of edit affordances in the UI.
- **D-02:** `src/app/page.tsx` uses `await auth()` + `redirect('/sign-in')` (or `await auth.protect()`) for the authentication gate only. It does NOT call `requireRole('mill_operator')`.
- **D-03:** A server-side `canEdit = await checkRole('mill_operator')` is computed in the RSC and passed as a prop to the client UI. The client UI hides edit buttons when `!canEdit`. `<Protect>` is NOT used (it is presentational only — see `docs/security-patterns.md` §4).
- **D-04:** Mutating server actions (Phase 33: transitions, bulk import) call `await requireRole('mill_operator')` as the real enforcement gate. This is the **canonical** server-side guard for v2.0 write operations — replaces AUTH-02's page-level enforcement claim.
- **D-05:** Middleware update for `/`: add `/` to the protected-routes block only for authentication (`auth.protect()`). Do NOT add a `mill_operator` coarse-gate matcher mirroring `/demo/*`. This rewrites AUTH-03.

**Neon provisioning**
- **D-06:** Provision a fresh Neon project at `neon.tech` (named `cgm-dashboard`). Local development only for Phase 31 — pooled and unpooled URLs go into `.env.local`. Vercel env vars deferred to Phase 34 (first deploy).
- **D-07:** `DATABASE_URL` = pooled endpoint (`-pooler.neon.tech`). `DATABASE_URL_UNPOOLED` = direct endpoint. Both committed to `.env.example` as empty placeholders.
- **D-08:** `drizzle.config.ts` reads `DATABASE_URL_UNPOOLED` (NOT `DATABASE_URL`) — PgBouncer transaction mode is incompatible with migration `SET` commands.

**Drizzle file layout**
- **D-09:** Single `src/db/schema.ts` file in Phase 31 (matches research's quickstart). Trivial placeholder content allowed (re-export an empty object) to keep `drizzle-kit` happy. Phase 32 decides whether to split into `src/db/schema/` directory when tables actually exist.
- **D-10:** `src/db/index.ts` exports the Drizzle client and has `import 'server-only'` as **line 1** (not after the imports — Webpack/Turbopack inline this and an early position is a clearer signal for both readers and future static analysis).
- **D-11:** `drizzle.config.ts` lives at repo root (Drizzle/Neon official tutorial pattern, matches existing config files like `next.config.ts`, `eslint.config.mjs`).

**Test fixtures and role coverage**
- **D-12:** Create a new Clerk test user `e2e-mill-operator+clerk_test@example.com` with `publicMetadata.roles: ['mill_operator']`.
- **D-13:** Update existing `e2e-demo+clerk_test@example.com` to `publicMetadata.roles: ['demo','mill_operator']`. This is the canonical multi-role coverage path — verifies that `Array.prototype.includes` membership semantics work for users with more than one role.
- **D-14:** Add a new Playwright auth project `auth-mill-operator` paralleling `auth-demo` / `auth-admin`. New env vars: `E2E_MILL_OPERATOR_USER_EMAIL`, `E2E_MILL_OPERATOR_USER_PASSWORD`. Updated env vars on the demo user are silent (same login, broader role set).

**Success-criteria amendments (must reach planner)**
- **D-15:** ROADMAP.md Phase 31 success criterion #2 ("non-mill_operator redirected away from `/`") is now **wrong** per D-01. Rewrite to: "An authenticated user without `mill_operator` sees `/` in read-only mode (edit affordances hidden); mutating server actions (Phase 33) reject without `mill_operator`."
- **D-16:** ROADMAP.md Phase 31 success criterion #4 ("`DATABASE_URL` and `DATABASE_URL_UNPOOLED` set in Vercel env") is **partially deferred** per D-06. Rewrite to: "`DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) set in `.env.local`; Vercel env-var provisioning deferred to Phase 34 first deploy."
- **D-17:** REQUIREMENTS.md AUTH-02 and AUTH-03 are rewritten by D-04 and D-05 respectively. Planner must update REQUIREMENTS.md in the same PR as Phase 31's implementation. AUTH-01 (role string added to union) and AUTH-04 (clerk-setup.md runbook update) are unchanged.

### Claude's Discretion
- Test approach: TDD a small unit test that asserts `'mill_operator'` is in the `Role` union (compile-time check via `satisfies`) — planner decides whether this is worth a dedicated test file or folds into the existing `src/lib/auth.test.ts` suite.
- Build-verification approach for "no Edge-runtime contamination": a `next build` smoke run inside `next-build` CI step is sufficient. No need for a custom Webpack rule or separate import-graph audit in Phase 31.
- Whether to update the existing E2E test matrix (`auth-demo` project) to cover the new dual-role behavior, or only add `auth-mill-operator` tests in Phase 31 and broaden the demo coverage when transitions land in Phase 33.

### Deferred Ideas (OUT OF SCOPE)
- **Vercel Marketplace Neon integration** with auto-branching per Preview deployment — deferred to Phase 34 (first real deploy). Until then, Vercel env vars are unset.
- **Schema file split** (`src/db/schema/` directory with one file per table) — deferred to Phase 32 when actual tables exist. Phase 31 keeps it a single `src/db/schema.ts`.
- **A `/no-access` route** — not needed in v2.0 since read-only access to `/` is granted to any authenticated user. Capture as a future v3+ idea if a role gains zero-view privileges.
- **Generalizing `requireRole` to take a fallback option** — not needed since the page-level gate is being removed entirely. Revisit only if a future role needs a per-call-site fallback destination.
- **Production-instance test user for `mill_operator`** — same constraint as v1.4: production E2E blocked by Clerk 2FA, custom domain needed. Carried-forward limitation.
- **Migrating `src/middleware.ts` → `src/proxy.ts`** (Next.js 16 deprecation) — not blocking; deprecation warning only. Schedule as housekeeping when it becomes a breaking change.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | `mill_operator` role string added to the `Role` union in `src/types/clerk.d.ts` | §"Role expansion — call-site audit" — single-line edit; no consumer signature changes (`requireRole`, `checkRole`, `mockNonDemoSession` are all `Role`-generic). [VERIFIED: `src/lib/auth.ts:41`, `src/test/fixtures/clerkAuth.ts:181`] |
| AUTH-02 (rewritten by D-04) | Mutating server actions enforce `await requireRole('mill_operator')`; **NOT** a page-level guard on `/` | §"Enforcement model" + §"`src/app/page.tsx` stub shape" — Phase 31 only stages the enforcement pattern (RSC computes `canEdit` via `checkRole`), real `requireRole` calls land in Phase 33. Planner edits REQUIREMENTS.md AUTH-02 line per D-17. |
| AUTH-03 (rewritten by D-05) | Middleware adds `/` to `auth.protect()` flow only — no `mill_operator` coarse-gate | §"Middleware audit" — existing matcher already protects `/` via `!isPublicRoute(request)` branch; no structural edit required. Planner edits REQUIREMENTS.md AUTH-03 line per D-17. |
| AUTH-04 | `docs/clerk-setup.md` runbook updated with `mill_operator` user + JWT verification step | §"Clerk dashboard test user creation" — append row to Step 2 table; dual-role JSON shape in Step 3; new verification line in §"Verification". |
| DATA-01 | Neon project provisioned; pooled + unpooled URLs in `.env.local` | §"Neon provisioning" — D-06 scopes Vercel env-var work to Phase 34; Phase 31 only sets `.env.local` + `.env.example` placeholders. |
| DATA-08 | `src/db/index.ts` enforces `import 'server-only'` to prevent Edge-runtime driver leak | §"Drizzle + Neon HTTP driver" + §"`import 'server-only'` placement" — line 1 placement per D-10; build-time enforcement is the verification. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` present in the working directory at research time [VERIFIED: `ls CLAUDE.md` returned no such file].

The project's effective constraints come from `docs/security-patterns.md`, `docs/clerk-setup.md`, `.planning/STATE.md`, and project skills/rules. Most-load-bearing:
- `'use client'` files MUST NOT import server-only modules (auth, services, future `src/db/*`) [`docs/security-patterns.md` §2 + JSDoc on `src/lib/auth.ts:5-12`].
- `<Protect>` is **never** a security boundary [`docs/security-patterns.md` §4].
- Roles are stored as `Role[]` arrays with `Array.prototype.includes` membership; no singular role field [STATE.md "Role shape" note].
- `DATABASE_URL` = pooled; `DATABASE_URL_UNPOOLED` = direct; mandatory `import 'server-only'` in `src/db/index.ts` [STATE.md "DB driver" note].
- `drizzle-kit push` is banned after initial schema; `generate` + `migrate` workflow only [STATE.md "Migration discipline" note] — not exercised in Phase 31 (no schema yet) but the planner must avoid scaffolding any `push` command.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Role union TypeScript declaration | Shared types (`src/types/`) | — | Compile-time only; consumed by both server (`src/lib/auth.ts`) and test fixture |
| Middleware `auth.protect()` for `/` | Edge middleware (`src/middleware.ts`) | — | Already-covered via `!isPublicRoute` branch; no logic change in Phase 31 |
| Authentication gate on `/` | Frontend RSC (`src/app/page.tsx`) | Middleware (defense-in-depth) | D-02: `await auth()` + `redirect('/sign-in')` at the page top; middleware is the outer guard |
| `canEdit` boolean computation | Frontend RSC (`src/app/page.tsx`) | — | D-03: server-side `await checkRole('mill_operator')`; never recomputed in the browser |
| Edit-affordance visibility | Browser client component (`<MillReadOnlyStub>`) | — | Renders the boolean prop; **presentational only** — real enforcement is Phase 33 server actions |
| Drizzle client singleton | Server-only module (`src/db/index.ts`) | — | `import 'server-only'` line 1; Node.js runtime only; never reaches Edge |
| Schema placeholder | Server-only module (`src/db/schema.ts`) | — | Consumed by `drizzle-kit` CLI at build/dev time; no runtime presence in Phase 31 |
| Drizzle CLI configuration | Repo-root config file (`drizzle.config.ts`) | — | Node.js CLI process; runs against `DATABASE_URL_UNPOOLED` direct endpoint |
| Clerk test-user fixtures | External service config (Clerk Dashboard) | Documentation (`docs/clerk-setup.md`) | Manual operator step; runbook is the durable artifact |
| E2E auth projects | Test runner config (`playwright.config.ts`) | — | New `auth-mill-operator` project mirrors existing `demo-user` / `norole-user` |

**Tier-misassignment risk to watch:** The planner must NOT put the `canEdit` check inside `<MillReadOnlyStub>` (client) — it MUST be computed in `page.tsx` (RSC) and passed as a prop. The `import 'server-only'` discipline + `checkRole`'s reliance on server-only `auth()` from `@clerk/nextjs/server` enforces this naturally, but the explicit map prevents accidental drift.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | `0.45.2` | ORM runtime + query builder | Edge-compatible (neon-http subpath), thin SQL layer, TypeScript-native; official Drizzle+Neon tutorial uses it [VERIFIED: `npm view drizzle-orm version` → 0.45.2 (latest), `npm view drizzle-orm dist-tags.latest` → `0.45.2`] |
| `@neondatabase/serverless` | `1.1.0` | Neon HTTP driver — `neon()` function | The driver Drizzle's `neon-http` subpath consumes; works in Node.js + Edge runtimes [VERIFIED: `npm view @neondatabase/serverless version` → 1.1.0 (latest)] |
| `drizzle-kit` | `0.31.10` | Schema migration CLI (dev dep) | Generates inspectable SQL diffs; mandatory for migration discipline [VERIFIED: `npm view drizzle-kit version` → 0.31.10 (latest)] |

**Versions verified 2026-05-12 via `npm view`. All three are at `latest` dist-tag. `drizzle-orm` and `drizzle-kit` were last updated 2026-05-09; `@neondatabase/serverless` last updated 2026-04-17. No need for `^` ranges in this phase — pin to exact versions matching the research baseline.**

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | `^17.4.2` (already installed) | Load `.env.local` in `drizzle.config.ts` Node.js CLI process | Drizzle official tutorial uses `import 'dotenv/config';` at the top of `drizzle.config.ts` — Next.js auto-loads `.env.local` for `next dev`/`next build`, but `drizzle-kit` is a separate Node process and must load env vars explicitly [CITED: orm.drizzle.team/docs/connect-neon, orm.drizzle.team/docs/tutorials/drizzle-with-db/drizzle-with-neon] |
| `server-only` | `0.0.1` (transitive via Next.js) | Build-time enforcement that `src/db/index.ts` never leaks into client bundle | `import 'server-only';` as line 1 of `src/db/index.ts`. The package is already present in `node_modules/server-only/` (transitive); Next.js officially documents it as "optional" — explicit install only needed if ESLint flags extraneous deps [VERIFIED: `node_modules/server-only/package.json` exists with version 0.0.1; CITED: nextjs.org/docs/app/getting-started/server-and-client-components "Preventing environment poisoning"] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `drizzle-orm/neon-http` | `drizzle-orm/neon-serverless` (WebSocket) | `neon-http` is the recommended default for serverless single-transaction queries (each query opens an HTTP connection, no pool needed). `neon-serverless` uses WebSockets for session/interactive transactions — required for `BEGIN ... COMMIT` blocks. v2.0 mutations (Phase 33 transitions, import batches) fit cleanly in single transactions; if a future feature needs multi-statement isolation, swap subpath. Pin **`neon-http`** for Phase 31 to match STACK.md + ARCHITECTURE.md. [CITED: orm.drizzle.team/docs/get-started/neon-new, orm.drizzle.team/docs/connect-neon] |
| `drizzle-orm/neon-http` | `drizzle-orm/postgres-js` (TCP driver) | TCP driver requires Node.js runtime + connection pooling configuration; HTTP driver is simpler and avoids the Edge-leak risk for the singleton. Phase 31 PITFALLS.md briefly mentions `postgres.js` as a "modern default" but the v2.0 STACK + ARCHITECTURE both lock `neon-http` as canonical. Do NOT reconsider in Phase 31. |
| `@neondatabase/serverless` | `@vercel/postgres` (deprecated wrapper) | `@vercel/postgres` is now a thin wrapper around `@neondatabase/serverless` (Vercel Postgres was migrated to Neon Q1 2025). Use the upstream directly for control + Neon's update cadence. [CITED: STACK.md §1 "What NOT to Add"] |

**Installation:**
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

**Do NOT install in Phase 31 (defer to phases that consume them):** `nuqs` (Phase 34), `zod` (Phase 33), `read-excel-file` (Phase 33). Adding them now bloats `package.json` without consumers; the planner's "files modified" must NOT include `package.json` line additions for these.

**Version verification:** Run before install to confirm versions are still current:
```bash
npm view drizzle-orm version            # expect 0.45.2 or compatible
npm view @neondatabase/serverless version  # expect 1.1.0
npm view drizzle-kit version            # expect 0.31.10
```

## Architecture Patterns

### System Architecture Diagram

```
                          ┌─────────────────────────────────────┐
                          │  Clerk Dev Instance (external)      │
                          │   JWT template → metadata.roles[]   │
                          └────────────────┬────────────────────┘
                                           │ session cookie
                                           ▼
        ┌─────────────────────────────────────────────────────────┐
        │  Edge Middleware  (src/middleware.ts — UNCHANGED)       │
        │  • isPublicRoute("/sign-in", "/sign-up")               │
        │  • auth.protect() for everything else (incl. "/")       │
        │  • isDemoRoute → demo-role check on /demo/*             │
        └────────────────┬────────────────────────────────────────┘
                         │ authenticated request → "/"
                         ▼
        ┌─────────────────────────────────────────────────────────┐
        │  src/app/page.tsx  (async RSC — PHASE 31 REWRITE)       │
        │  1. const { userId } = await auth()                     │
        │  2. if (!userId) redirect('/sign-in')                   │
        │  3. const canEdit = await checkRole('mill_operator')    │
        │  4. <DashboardLayout>                                   │
        │       <MillReadOnlyStub canEdit={canEdit} />            │
        │     </DashboardLayout>                                  │
        └────────────────┬────────────────────────────────────────┘
                         │ canEdit prop (boolean, serializable)
                         ▼
        ┌─────────────────────────────────────────────────────────┐
        │  <MillReadOnlyStub>   ('use client' — PHASE 31 NEW)     │
        │  Renders a placeholder banner:                          │
        │  • canEdit  → "Edit mode (mill_operator)"               │
        │  • !canEdit → "Read-only mode"                          │
        │  Replaced by real three-column board in Phase 34.       │
        └─────────────────────────────────────────────────────────┘


  ─── Drizzle infrastructure (compiled but unused at runtime in Phase 31) ───

        ┌─────────────────────────────────────────────────────────┐
        │  src/db/index.ts  (PHASE 31 NEW)                        │
        │  line 1: import 'server-only';                          │
        │  line 2: import { drizzle } from 'drizzle-orm/neon-http'│
        │  line 3: import { neon } from '@neondatabase/serverless'│
        │           const sql = neon(process.env.DATABASE_URL!)   │
        │           export const db = drizzle({ client: sql })    │
        └────────────────┬────────────────────────────────────────┘
                         │ schema reference
                         ▼
        ┌─────────────────────────────────────────────────────────┐
        │  src/db/schema.ts  (PHASE 31 NEW — PLACEHOLDER)         │
        │  // Tables defined in Phase 32                          │
        │  export {};                                             │
        └─────────────────────────────────────────────────────────┘

        ┌─────────────────────────────────────────────────────────┐
        │  drizzle.config.ts  (repo root, PHASE 31 NEW)           │
        │  reads process.env.DATABASE_URL_UNPOOLED (direct)       │
        │  schema: './src/db/schema.ts'                           │
        │  out: './drizzle'  (no migrations generated in Phase 31)│
        │  dialect: 'postgresql'                                  │
        └─────────────────────────────────────────────────────────┘


  ─── Test infrastructure ───

        ┌──────────────────────────┐    ┌─────────────────────────┐
        │  src/test/fixtures/      │    │  playwright.config.ts   │
        │  clerkAuth.ts            │    │  + project              │
        │  + mockMillOperatorSession│   │  'auth-mill-operator'   │
        │  + mockDualRoleSession    │   │  storageState =         │
        │                          │    │  playwright/.clerk/     │
        │                          │    │  mill-operator.json     │
        └──────────────────────────┘    └─────────────────────────┘
```

### Recommended Project Structure (additions only)

```
.env.example                    # UPDATED: add DATABASE_URL, DATABASE_URL_UNPOOLED,
                                #          E2E_MILL_OPERATOR_USER_{EMAIL,PASSWORD}
drizzle.config.ts               # NEW: drizzle-kit config at repo root
src/
├── app/
│   └── page.tsx                # REWRITTEN: Coming Soon → auth-checked stub
├── components/
│   └── MillReadOnlyStub.tsx    # NEW: 'use client' placeholder, canEdit prop
├── db/                         # NEW directory
│   ├── index.ts                # NEW: Drizzle singleton with `import 'server-only'`
│   └── schema.ts               # NEW: placeholder, single file (D-09)
├── middleware.ts               # UNCHANGED (existing auth.protect() already covers /)
├── types/
│   └── clerk.d.ts              # UPDATED: Role union += 'mill_operator'
└── test/
    └── fixtures/
        └── clerkAuth.ts        # UPDATED: add mill-operator + dual-role helpers
docs/
└── clerk-setup.md              # UPDATED: Step 2 + Step 3 + Verification rows
e2e/
└── (no new spec required for D-14 minimum, but storageState file
    `playwright/.clerk/mill-operator.json` is generated by global.setup.ts)
.planning/
├── REQUIREMENTS.md             # UPDATED per D-17 (AUTH-02 + AUTH-03 text)
└── ROADMAP.md                  # UPDATED per D-15 + D-16 (SC#2 + SC#4 text)
```

### Pattern 1: Server-only DB Singleton with line-1 `import 'server-only'`

**What:** A module that throws at build time if it's transitively imported into a client component or Edge bundle. The `import 'server-only';` line must precede all other imports.

**When to use:** Phase 31's `src/db/index.ts`. The pattern is also already in use in `src/lib/auth.ts` (note: that file uses a JSDoc-only disclaimer, NOT `import 'server-only'` — Phase 31 introduces the runtime-enforced version for the DB module).

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/connect-neon (verified 2026-05-12)
// File: src/db/index.ts

import 'server-only';                              // LINE 1 per D-10
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
```

**Why line 1 (D-10):** Functionally `import 'server-only';` works anywhere in the import block — Next.js's bundler resolves it before code executes [CITED: nextjs.org/docs/app/getting-started/server-and-client-components, "Now, if you try to import the module into a Client Component, there will be a build-time error"]. The line-1 convention is a **readability discipline**, not a correctness requirement: a reviewer scanning the top of the file sees the server-only declaration before any executable code, and future static-analysis tooling (e.g., a custom ESLint rule) can match a stricter pattern. Confidence: HIGH on functional equivalence; HIGH on readability rationale (matches the existing project pattern of placing security disclaimers at the top of `src/lib/auth.ts`).

### Pattern 2: drizzle.config.ts at Repo Root, Reading UNPOOLED URL

**What:** A single TypeScript config file that `drizzle-kit` reads to know where the schema lives, where to emit migrations, and how to connect to the DB. Lives at repo root (alongside `next.config.ts`, `eslint.config.mjs`).

**When to use:** Phase 31's `drizzle.config.ts`. Only `drizzle-kit` (the CLI) reads it; the Next.js bundler does not. The CLI runs as a separate Node process, so it must explicitly load `.env.local` via `dotenv` (Next.js auto-loading does NOT apply).

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/connect-neon (verified 2026-05-12)
// File: drizzle.config.ts (repo root)

import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    'DATABASE_URL_UNPOOLED is not set. Use the DIRECT (non-pooler) Neon URL — ' +
    'PgBouncer transaction mode is incompatible with migration SET commands.'
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',                  // D-09: single file in Phase 31
  out: './drizzle',                               // migration output dir
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED,      // D-08: direct, NOT pooled
  },
});
```

**Why `dotenv/config`:** `drizzle-kit` is a CLI invoked as `npx drizzle-kit generate`; it does NOT inherit Next.js's automatic `.env.local` loading [CITED: orm.drizzle.team/docs/tutorials/drizzle-with-db/drizzle-with-neon — every official sample begins with `config({ path: '.env' });` or `import 'dotenv/config';`]. Phase 31 confirms `dotenv` is already in `devDependencies` (used by `playwright.config.ts`) so no install needed [VERIFIED: `package.json` line 40 shows `"dotenv": "^17.4.2"`].

**Note on `'dotenv/config'` vs explicit `config({ path: '.env.local' })`:** `'dotenv/config'` loads `.env` by default — for Next.js convention we use `.env.local`. The cleanest form is:
```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });
```
Or rely on the fact that Next.js convention has `.env.local` (gitignored) shadowing `.env` (not present), and use `import 'dotenv/config'`. The project's `playwright.config.ts` uses `dotenv.config({ path: path.resolve(__dirname, '.env.local') })` [VERIFIED: `playwright.config.ts:5-6`] — mirror that for consistency.

### Pattern 3: Placeholder schema.ts that drizzle-kit Accepts

**What:** An empty schema file that `drizzle-kit generate` reads without error. Required because the planner wants a working install + config in Phase 31 even though zero tables exist.

**When to use:** Phase 31's `src/db/schema.ts`. The trick: drizzle-kit's `generate` walks the schema file and emits SQL for any `pgTable(...)` exports it finds. Zero exports = zero migrations = zero artifacts in `./drizzle/`.

**Example:**
```typescript
// File: src/db/schema.ts
// Phase 31 placeholder. Tables land in Phase 32 (DATA-02..05).
// Drizzle-kit reads this file via drizzle.config.ts; an empty export
// keeps the module a valid TypeScript module without defining any tables.

export {};
```

`export {};` is sufficient to make the file a module (per `tsconfig.json` `isolatedModules: true` requirement) without forcing any exports [VERIFIED: pattern already in use at `src/types/clerk.d.ts:8`]. Drizzle-kit's `generate` will produce no SQL files, which matches CONTEXT.md §"Specifics" — "drizzle-kit generate will produce zero migrations in Phase 31 (no tables defined). This is correct and expected."

[ASSUMED] `drizzle-kit generate` does not error on an empty schema file. The official docs do not explicitly state this, but the schema-walk-and-emit semantics imply it. WebSearch found Drizzle docs on "Custom Migrations with Empty Schemas" stating "you still need to properly export the schema file even if it doesn't contain any tables yet" — `export {}` satisfies this. Verification path: Phase 31 acceptance criterion includes running `npx drizzle-kit generate` once to confirm zero migrations are produced without error; if it errors, the planner falls back to a no-op `pgTable` export (e.g., a `_phase31_placeholder` table that gets dropped in Phase 32) and revises this assumption.

### Pattern 4: RSC + Client Wrapper with `canEdit` Boolean Prop

**What:** The Phase 28 pattern (RSC computes sensitive data, client wrapper renders it) applied to a *capability flag* instead of *fetched data*. The boolean is computed server-side via `await checkRole('mill_operator')` and passed as a prop. The client UI hides edit affordances when the boolean is false. **No protection of data** — Phase 31 has no data to protect — only **presentational suppression of edit buttons**.

**When to use:** Phase 31's `src/app/page.tsx` + `<MillReadOnlyStub canEdit={canEdit} />`. The full enforcement (rejecting writes from non-operators) happens in Phase 33 server actions calling `requireRole('mill_operator')`.

**Example:**
```typescript
// File: src/app/page.tsx (Phase 31)
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import MillReadOnlyStub from '@/components/MillReadOnlyStub';

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');  // D-02: auth gate ONLY
  }
  const canEdit = await checkRole('mill_operator');  // D-03

  return (
    <DashboardLayout>
      <MillReadOnlyStub canEdit={canEdit} />
    </DashboardLayout>
  );
}
```

```typescript
// File: src/components/MillReadOnlyStub.tsx (Phase 31)
'use client';

export default function MillReadOnlyStub({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center" data-testid="mill-stub">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Mill Production Dashboard
        </h1>
        <p
          className="mt-2 text-sm text-text-secondary"
          data-testid="mill-mode"
          data-mode={canEdit ? 'edit' : 'read-only'}
        >
          {canEdit ? 'Edit mode (mill_operator)' : 'Read-only mode'}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          Production UI launching in Phase 34.
        </p>
      </div>
    </div>
  );
}
```

**Critical note on `checkRole`:** The existing `src/lib/auth.ts` exports `requireRole` only. Phase 31 must **add a `checkRole(role: Role): Promise<boolean>`** export — this is what `docs/security-patterns.md` §3 calls "the third member of the family" but acknowledges has no current implementation. The shape mirrors `requireRole` minus the redirect:

```typescript
// Addition to src/lib/auth.ts
/**
 * Returns whether the current session has `role`. Server-only.
 *
 * Use when a page needs to branch on role membership without a redirect
 * — e.g., to compute a `canEdit` prop for a client component.
 */
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.roles?.includes(role) ?? false;
}
```

CONTEXT.md §"Reusable Assets" line 112 implies `checkRole` already exists ("`requireRole` / `checkRole` in `src/lib/auth.ts`"). [VERIFIED: only `requireRole` is exported from `src/lib/auth.ts` — `checkRole` is NOT present; `docs/security-patterns.md` §3 says it "is not used in the Phase 28 codebase but documented as the third member of the family"]. **The planner MUST include adding `checkRole` to `src/lib/auth.ts` as a Phase 31 task** — it's the load-bearing primitive for D-03.

### Anti-Patterns to Avoid

- **`<Protect role="mill_operator">` wrapping edit buttons:** Violates `docs/security-patterns.md` §4 — `<Protect>` is presentational and the underlying button props (including action handlers) remain in the browser bundle. Use the `canEdit` prop pattern instead.
- **Page-level `await requireRole('mill_operator')` on `/`:** Explicitly forbidden by D-01 and D-02. The page must serve read-only content to demo / admin / norole users; only edit affordances are gated.
- **Middleware coarse-gate matcher `isMillOperatorRoute` on `/`:** Forbidden by D-05. The existing `!isPublicRoute(request)` branch already calls `auth.protect()` for `/`.
- **`src/db/schema/` directory in Phase 31:** Forbidden by D-09. Single file only. Phase 32 decides the split.
- **`drizzle-kit push`:** Banned per STATE.md "Migration discipline." Phase 31 doesn't run any drizzle-kit commands beyond a *validation* `generate` (which produces zero output) — the planner must NOT include a `push` step.
- **Reading `DATABASE_URL` (pooled) from `drizzle.config.ts`:** Will produce a confusing "no SET allowed" failure the first time Phase 32 attempts a migration. Lock UNPOOLED at config-write time.
- **Adding `nuqs` / `zod` / `read-excel-file` to `package.json` in Phase 31:** All three are scoped to later phases. Phase 31's `package.json` diff is exactly three new entries: `drizzle-orm`, `@neondatabase/serverless` (deps), and `drizzle-kit` (devDep).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Edge-vs-Node bundle enforcement | A custom Webpack `IgnorePlugin` or ESLint rule that bans DB imports in `'use client'` files | `import 'server-only';` at line 1 of `src/db/index.ts` | The `server-only` package's `react-server` export condition resolves to `empty.js`; everywhere else it throws synchronously at import time. Build-time error in any wrong-bundle inclusion. Zero project-specific code. [VERIFIED: `node_modules/server-only/index.js` + `package.json` export map] |
| Postgres driver compatibility (Edge runtime safety) | A custom HTTP wrapper around `pg` or a hand-rolled fetch-based query API | `drizzle-orm/neon-http` + `@neondatabase/serverless` `neon()` HTTP client | The Neon HTTP driver speaks SQL-over-HTTP and works in both Edge and Node runtimes without TCP socket allocation. Hand-rolling means re-inventing protocol-level connection management. [CITED: STACK.md §1, neon.com/docs/serverless/serverless-driver] |
| Migration generation | A custom SQL-diff tool or hand-written migration files | `drizzle-kit generate` + `drizzle-kit migrate` | Drizzle Kit walks the schema, computes diffs, emits SQL. Phase 31 doesn't exercise it yet, but installing it now means Phase 32 can `generate` immediately. |
| Per-role test session setup | A custom Playwright fixture that re-runs sign-in per spec | Existing `e2e/global.setup.ts` pattern: sign in once per role, persist `storageState` to `playwright/.clerk/{role}.json`, project consumes it | Phase 27 established this pattern with `demo` / `norole` / `admin`. Adding `mill-operator` is a +1 entry in the `roles` record — no new infrastructure. [VERIFIED: `e2e/global.setup.ts:36-78`] |
| TypeScript role-union compile-time check | A runtime `assert(role === 'mill_operator')` in a test file | Use TypeScript's `satisfies` / typed array literal: `const _all: Role[] = ['demo','admin','user','mill_operator']` — `tsc --noEmit` is the verification | The TypeScript compiler is the test. Runtime assertion adds noise without coverage. |

**Key insight:** Phase 31 is almost entirely *configuration* and *type extension* — there's very little "logic" to hand-roll because the underlying primitives (Drizzle, Neon driver, server-only, Clerk auth) all provide the patterns. The planner's biggest risk is *inventing* work that doesn't exist (e.g., a custom canEdit context provider, a custom DB-fixture mock for tests that don't query the DB yet).

## Runtime State Inventory

This phase is **not** a rename/refactor/migration. It's additive (new role, new files, new packages, new env vars). The standard rename checklist (stored data, live service config, OS-registered state, build artifacts) does not apply.

However, the phase touches *external* state in two places that warrant inventory:

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Live service config | **Clerk Dashboard** — manual addition of 1 new user (`e2e-mill-operator+clerk_test`) + manual update of 1 existing user's `publicMetadata.roles` (`e2e-demo` → `['demo','mill_operator']`). The Clerk JWT template is **unchanged** — it already forwards `metadata.roles` array verbatim. | Runbook step in `docs/clerk-setup.md` Step 2/3 (operator action, not code). |
| Live service config | **Neon Dashboard** — provision new project `cgm-dashboard`. Pooled + unpooled URLs go into `.env.local` (NOT committed). | Runbook step in the plan (operator action); env-var keys committed as empty in `.env.example`. |
| Stored data | **None** — no DB tables exist yet (DATA-02..05 are Phase 32). | None. |
| OS-registered state | **None** — Phase 31 does not register any scheduled tasks, daemons, or system services. | None. |
| Secrets/env vars | **New env vars added**: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `E2E_MILL_OPERATOR_USER_EMAIL`, `E2E_MILL_OPERATOR_USER_PASSWORD`. These are NEW keys, not renames — no code edits required to read old names. | Add to `.env.example` with empty values; document in plan runbook so the operator populates `.env.local`. |
| Build artifacts | **None added**; `.next/` rebuilds normally on `npm run build`. `drizzle-kit generate` would produce `./drizzle/<timestamp>_<name>.sql` artifacts but in Phase 31 with zero schema tables it emits no migration files. | None. |

## Common Pitfalls

### Pitfall 1: `src/db/index.ts` accidentally imported from middleware or a client component
**What goes wrong:** `next build` fails with `Module not found: Can't resolve 'fs'` (or `'net'`, `'stream'`) — or, if `import 'server-only'` is in place, with a clearer "This module cannot be imported from a Client Component module" error during the build phase.
**Why it happens:** A future contributor adds a shared utility under `src/lib/` that re-exports something from `src/db/`, then imports that utility from `'use client'` code. The transitive chain leaks DB imports into the client bundle.
**How to avoid:** (1) Line-1 `import 'server-only';` per D-10. (2) Never have Phase 31 import `src/db/index.ts` from anywhere — the file exists but is unused at runtime until Phase 33. (3) `npm run build` smoke test as the canonical end-of-phase verification. The build either succeeds (file compiles into the server bundle only) or fails with a specific error message.
**Warning signs:** Build output mentions `server-only`, `Module not found: Can't resolve 'fs'`, or `Edge runtime does not support Node.js`. [CITED: Next.js Module Not Found docs, sentry.io/answers/next-js-middleware-module-not-found-can-t-resolve-fs]

### Pitfall 2: Pooled URL used in `drizzle.config.ts`
**What goes wrong:** Phase 32's `drizzle-kit generate` succeeds, but `drizzle-kit migrate` fails with `prepared statement does not exist` or `SET command not supported in transaction pooling mode`. Phase 31 itself does NOT exercise migrations (no tables yet), so the bug is silent until Phase 32.
**Why it happens:** Neon's pooled hostname (`-pooler.neon.tech`) routes through PgBouncer in transaction mode. PgBouncer transaction mode does not support `SET` / `PREPARE` — both of which `drizzle-kit migrate` uses.
**How to avoid:** Bake the env-var split into `drizzle.config.ts` at file-creation time (D-08). The config reads `DATABASE_URL_UNPOOLED` only. Add a runtime check: `if (!process.env.DATABASE_URL_UNPOOLED) throw new Error(...)` with explicit "use direct URL, not pooler" guidance.
**Warning signs:** `prepared statement does not exist`, `SET / RESET (session variables) ... not supported with pooled connections` [CITED: neon.com/docs/connect/connection-pooling, verified 2026-05-12].

### Pitfall 3: `import 'server-only'` placed below other imports
**What goes wrong:** Functionally fine — Next.js still throws the build-time error if a client component imports the module. But the file is harder to scan, and a future static-analysis rule looking for line-1 disclaimers would miss it.
**Why it happens:** Auto-import formatters (Prettier with `organize-imports`) sort imports alphabetically; `'server-only'` (literal string) is usually placed by hand and gets reordered.
**How to avoid:** Place the directive at line 1 per D-10. If Prettier/ESLint reorders it, add an explicit `// eslint-disable-next-line ...` or simply rely on the fact that ESLint's `simple-import-sort` keeps side-effect-only imports (those with no binding) at the top.
**Warning signs:** A reviewer scans the top of `src/db/index.ts` and sees a Drizzle import before the server-only disclaimer.

### Pitfall 4: `next.config.ts` env-var loading vs `drizzle.config.ts` env-var loading
**What goes wrong:** `next dev` and `next build` work fine (Next.js auto-loads `.env.local`). `npx drizzle-kit generate` errors with "DATABASE_URL_UNPOOLED is not set" — because `drizzle-kit` runs as a separate Node process that does NOT inherit Next.js's env loading.
**Why it happens:** Two independent processes with two independent env-loading mechanisms.
**How to avoid:** `drizzle.config.ts` MUST start with `import 'dotenv/config';` (or `import { config } from 'dotenv'; config({ path: '.env.local' });`). The project already has `dotenv` in devDependencies (used by `playwright.config.ts`).
**Warning signs:** "DATABASE_URL_UNPOOLED is not set" or "Cannot read property of undefined" when running drizzle-kit CLI commands.

### Pitfall 5: Forgetting `+clerk_test` suffix on the new test user email
**What goes wrong:** Clerk sends a real verification email to `e2e-mill-operator@example.com` (or worse, fails because example.com bounces). Test signup is blocked.
**Why it happens:** The `+clerk_test` convention is Clerk's "safe mailbox" marker that suppresses verification email delivery. It's easy to forget — the canonical example.com TLD has nothing to do with it.
**How to avoid:** The exact email per D-12 is `e2e-mill-operator+clerk_test@example.com`. The runbook update in `docs/clerk-setup.md` Step 2 makes the rule explicit ("The `+clerk_test` mailbox suffix is Clerk's documented safe-mailbox marker — verification emails are not delivered to real inboxes when this suffix is present").
**Warning signs:** Clerk Dashboard rejects user creation, or the test user's `verified_at_email` field never populates.

### Pitfall 6: Existing `e2e-demo` user's `publicMetadata` updated AFTER an active dev session
**What goes wrong:** The session cookie in the browser still has the old `roles: ['demo']` claim. The user sees the "Read-only mode" indicator on `/` instead of "Edit mode" because `checkRole('mill_operator')` returns false against the stale token.
**Why it happens:** Clerk JWT changes do not propagate to live sessions until the user signs out and back in. The runbook already documents this for Phase 27; Phase 31 must reiterate it for the `e2e-demo` user update per D-13.
**How to avoid:** `docs/clerk-setup.md` Step 4 ("Sign-Out/Sign-In Propagation") already covers this; add a line to the Phase 31 runbook update reminding the operator to sign out + sign back in after editing the demo user's metadata.
**Warning signs:** Decoded JWT at jwt.io still shows `metadata.roles: ['demo']` after editing publicMetadata to `['demo','mill_operator']`.

### Pitfall 7: Forgetting to add `checkRole` to `src/lib/auth.ts`
**What goes wrong:** `src/app/page.tsx` cannot compile — `checkRole` is not exported.
**Why it happens:** CONTEXT.md mentions `checkRole` in §"Reusable Assets" as if it already exists, but the actual `src/lib/auth.ts` file exports only `requireRole`. The downstream `docs/security-patterns.md` §3 acknowledges this gap ("Not used in the Phase 28 codebase but documented as the third member of the family").
**How to avoid:** The plan MUST include adding `checkRole(role: Role): Promise<boolean>` to `src/lib/auth.ts`. The implementation is 5 lines (auth() + sessionClaims.metadata.roles.includes(role)).
**Warning signs:** Build error: "Module '@/lib/auth' has no exported member 'checkRole'."

### Pitfall 8: Schema file with `export {}` rejected by drizzle-kit
**What goes wrong:** `npx drizzle-kit generate` errors with "No tables found in schema." or a similar message and refuses to proceed.
**Why it happens:** Drizzle-kit's walker may complain when there are zero `pgTable` exports.
**How to avoid:** Run `npx drizzle-kit generate` as part of Phase 31's verification. If it errors, fall back to a no-op `pgTable` stub (D-09 explicitly allows "re-export an empty object" — this is the wider safety net). The verification step is *running the command and seeing what happens*; the planner should encode this as a soft requirement: "drizzle-kit generate completes without error (zero migrations is the expected outcome)."
**Warning signs:** Phase 32 plan is blocked because drizzle-kit refuses to read the schema file.

[ASSUMED] drizzle-kit accepts `export {}` without error. If empirically wrong, the schema fallback is:
```typescript
// src/db/schema.ts (fallback if export {} rejected)
import { pgTable, serial } from 'drizzle-orm/pg-core';
// Phase 31 placeholder — replaced in Phase 32 (DATA-02..05).
export const _phase31_placeholder = pgTable('_phase31_placeholder', {
  id: serial('id').primaryKey(),
});
```
Phase 32 drops this table in its first migration.

## Code Examples

### `src/types/clerk.d.ts` — extended Role union (AUTH-01)

```typescript
// File: src/types/clerk.d.ts (Phase 31 edit)
export {};

/**
 * User roles in the CGM Dashboard.
 * - 'demo': Access to demo routes (/demo/*)
 * - 'admin': Full administrative access
 * - 'user': Standard authenticated user
 * - 'mill_operator': Edit role for mill production dashboard (v2.0)
 *   Gates mutating server actions and edit affordances; does NOT gate page access.
 */
export type Role = 'demo' | 'admin' | 'user' | 'mill_operator';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      roles?: Role[];
    };
  }
}
```

### `src/lib/auth.ts` — addition of `checkRole`

```typescript
// File: src/lib/auth.ts (Phase 31 ADDITION — existing requireRole unchanged)

/**
 * Returns whether the current session has `role`. Server-only.
 *
 * Use when a page needs to branch on role membership without a redirect
 * — e.g., to compute a `canEdit` prop for a client component.
 *
 * @example
 *   // src/app/page.tsx
 *   const canEdit = await checkRole('mill_operator');
 *   return <MillReadOnlyStub canEdit={canEdit} />;
 */
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.roles?.includes(role) ?? false;
}
```

### `drizzle.config.ts` — repo root config (D-11, D-08)

```typescript
// File: drizzle.config.ts (repo root)
import { config } from 'dotenv';
import path from 'path';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit is a separate Node process — must explicitly load .env.local
config({ path: path.resolve(__dirname, '.env.local') });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    'DATABASE_URL_UNPOOLED is not set. Use the Neon DIRECT (non-pooler) URL — ' +
    'PgBouncer transaction mode is incompatible with migration SET commands. ' +
    'See docs/clerk-setup.md or .env.example for the expected shape.'
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',     // D-09: single file in Phase 31
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED,  // D-08
  },
});
```

### `src/db/index.ts` — server-only Drizzle singleton (D-10, DATA-08)

```typescript
// File: src/db/index.ts
import 'server-only';                              // LINE 1 — D-10
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Use the Neon POOLED endpoint (-pooler.neon.tech) ' +
    'for application queries. drizzle.config.ts uses DATABASE_URL_UNPOOLED for migrations.'
  );
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
```

### `src/db/schema.ts` — Phase 31 placeholder (D-09)

```typescript
// File: src/db/schema.ts
// Phase 31 placeholder. Real tables (production_orders, order_events,
// import_batches, users) defined in Phase 32 per DATA-02..05.
//
// `export {}` keeps this a valid TS module under isolatedModules without
// declaring any pgTable. drizzle-kit generate produces zero migrations
// in this state, which is the expected end-of-phase 31 outcome.

export {};
```

### `.env.example` — added entries

```bash
# Existing Clerk + E2E entries above (unchanged) ...

# E2E mill-operator test user (Phase 31, D-12 + D-14)
E2E_MILL_OPERATOR_USER_EMAIL=e2e-mill-operator+clerk_test@example.com
E2E_MILL_OPERATOR_USER_PASSWORD=

# Neon Postgres (Phase 31, D-07)
# DATABASE_URL: pooled endpoint (-pooler.neon.tech) for application queries.
# DATABASE_URL_UNPOOLED: direct endpoint for drizzle-kit migrations only.
# PgBouncer transaction mode breaks migration SET commands — never swap these.
DATABASE_URL=
DATABASE_URL_UNPOOLED=
```

### `playwright.config.ts` — `auth-mill-operator` project (D-14)

```typescript
// Append to projects[] in playwright.config.ts
{
  name: 'auth-mill-operator',
  testMatch: /demo-route-protection\.spec\.ts$/,  // existing spec OR a new mill-operator smoke spec
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/mill-operator.json',
    baseURL: 'http://localhost:3000',
  },
  dependencies: ['global setup'],
},
```

And in `e2e/global.setup.ts`, append a new entry to the `roles` record:
```typescript
'mill-operator': {
  envEmail: 'E2E_MILL_OPERATOR_USER_EMAIL',
  envPassword: 'E2E_MILL_OPERATOR_USER_PASSWORD',
  file: 'playwright/.clerk/mill-operator.json',
},
```

The existing for-loop iteration over `Object.entries(roles)` picks up the new entry automatically [VERIFIED: `e2e/global.setup.ts:54`].

### `src/test/fixtures/clerkAuth.ts` — additions

```typescript
// File: src/test/fixtures/clerkAuth.ts (additions)

/**
 * Seed mockAuth to resolve with a session whose roles array contains 'mill_operator'.
 */
export function mockMillOperatorSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: ['mill_operator'] } },
  });
}

/**
 * Seed mockAuth to resolve with a session whose roles array contains BOTH
 * 'demo' and 'mill_operator' — the canonical multi-role coverage path (D-13).
 * Verifies Array.prototype.includes membership semantics for multi-role users.
 */
export function mockDualRoleSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: ['demo', 'mill_operator'] } },
  });
}
```

**Compile-time check note:** The existing `mockNonDemoSession(role: Exclude<Role, 'demo'> = 'user')` signature [VERIFIED: `src/test/fixtures/clerkAuth.ts:181`] automatically widens to accept `'mill_operator'` (and `'admin'`, and `'user'`) once `Role` includes the new string. No edit to that signature is needed; existing tests calling `mockNonDemoSession('admin')` continue to work.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vercel Postgres (`@vercel/postgres`) as a distinct product | Direct `@neondatabase/serverless` use | Q1 2025 — Vercel migrated Postgres offering to Neon | Phase 31 uses `@neondatabase/serverless` directly (D-stack); `@vercel/postgres` is now a thin wrapper [CITED: neon.com/docs/guides/vercel-postgres-transition-guide] |
| `pg` (node-postgres) TCP driver | Neon HTTP driver via `drizzle-orm/neon-http` | Neon-specific: HTTP driver available since 2023, became Edge-compatible default | Phase 31 picks `neon-http`; TCP drivers are incompatible with Edge runtime |
| `drizzle-kit push` for schema iteration | `drizzle-kit generate` + `drizzle-kit migrate` workflow | Best practice for production-grade DBs since 2024 | Phase 31 doesn't run migrations yet, but `push` is banned per STATE.md so Phase 32 inherits clean discipline |
| `src/middleware.ts` for Clerk middleware | `src/proxy.ts` (rename in Next.js 16) | Next.js 16 deprecated `middleware.ts`; both work in 16.1.6 | NOT in Phase 31 scope — deferred per CONTEXT.md §"Deferred Ideas." Continue using `middleware.ts`. |
| Synchronous `searchParams` in pages | Async `searchParams: Promise<...>` in Next.js 16 | Next.js 15 → 16 breaking change | Not exercised in Phase 31 (`/` does not consume searchParams yet); Phase 34 brings nuqs + async searchParams |

**Deprecated / outdated:**
- `@vercel/postgres`: replaced by `@neondatabase/serverless`. Already not in this project's `package.json`.
- `prisma` for Edge: incompatible with Vercel Edge bundle size limits. Already avoided.
- `xlsx` (npm SheetJS): unpatched CVE-2023-30533. Already avoided per STACK.md (Phase 33 uses `read-excel-file`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `drizzle-kit generate` accepts `export {}` as a valid schema (produces zero migrations, no error). | §"Pattern 3" + §"Pitfall 8" | Low. Mitigation already documented: fall back to a no-op `pgTable` placeholder dropped in Phase 32. Verifiable in <1 minute by running `npx drizzle-kit generate` once. |
| A2 | `import 'server-only'` placement at line 1 vs line 3 (after framework imports) is functionally identical at build time. | §"Pitfall 3" + §"Why line 1" | None. The Next.js docs confirm the build-time error fires regardless of placement; line-1 is a *readability convention*. Functional correctness is independent of position. |
| A3 | Adding `auth-mill-operator` as a Playwright project does NOT require CI secrets updates beyond the new `E2E_MILL_OPERATOR_USER_EMAIL` / `E2E_MILL_OPERATOR_USER_PASSWORD` env vars. | §"Playwright auth project" | Medium. Project currently runs tests locally only (no CI workflow file present in `.github/workflows/` based on directory inspection). When CI is added, the new env vars must be set as GitHub Actions secrets — but that's not in Phase 31 scope. |
| A4 | Clerk JWT template (Step 1 of `docs/clerk-setup.md`) needs no edit for the new `mill_operator` role — the existing template `{"metadata": {"roles": "{{user.public_metadata.roles}}"}}` already forwards any string array. | §"Clerk dashboard test user creation" | Low. The template forwards the raw `publicMetadata.roles` value; the TypeScript `Role` union is purely a compile-time constraint on the client side. Verifiable by decoding the new mill-operator user's JWT at jwt.io after sign-in. |
| A5 | Drizzle's official Neon HTTP tutorial pattern (`drizzle({ client: sql })`) and the simpler pattern (`drizzle(process.env.DATABASE_URL!)`) are equivalent at runtime; the verbose form makes the dependency on `neon()` explicit. | §"Standard Stack" / §"Pattern 1" | Low. Both forms appear in official Drizzle docs; the verbose form is documented as "Option 2 - With explicit driver". Pin the verbose form for clarity. |

**User confirmation needed before lock:** None of these assumptions block Phase 31 planning. A1 and A4 have low-cost verification steps that should be encoded as plan acceptance criteria (run `drizzle-kit generate` once; decode mill-operator JWT after sign-in).

## Open Questions

1. **Does `<MillReadOnlyStub>` need a Jest unit test?**
   - What we know: The stub is a 10-line presentational component; the existing `src/app/page.test.tsx` covers DashboardLayout wrapper assertions, which the planner can adapt to cover the canEdit prop branches.
   - What's unclear: Whether to TDD a new `MillReadOnlyStub.test.tsx` or fold the canEdit-mode-toggle assertion into the rewritten `src/app/page.test.tsx`.
   - Recommendation: Fold into `src/app/page.test.tsx` (RSC tests pattern from Phase 28 fixtures). One test for `canEdit=true` (heading "Edit mode") and one for `canEdit=false` (heading "Read-only mode") covers the boolean branch. Keep `<MillReadOnlyStub>` itself untested at the unit level — its content is trivially derived from the prop and would only add maintenance burden.

2. **Should Phase 31 add a `auth-mill-operator` spec file or reuse the existing `demo-route-protection.spec.ts`?**
   - What we know: CONTEXT.md Claude's Discretion explicitly leaves this open: "Whether to update the existing E2E test matrix (`auth-demo` project) to cover the new dual-role behavior, or only add `auth-mill-operator` tests in Phase 31 and broaden the demo coverage when transitions land in Phase 33."
   - What's unclear: What "mill-operator-specific" behavior is observable in Phase 31 if the page is read-only-or-edit-banner with no functional difference for non-operators yet.
   - Recommendation: Add a minimal `e2e/mill-operator-smoke.spec.ts` (project: `auth-mill-operator`) that signs in, navigates to `/`, and asserts the `data-mode="edit"` attribute on the stub's mode indicator. Mirror under `auth-demo` (after D-13 metadata update propagates) to verify dual-role users see edit mode. This is the cheapest end-to-end proof that D-12 + D-13 wiring works.

3. **Verify a `+clerk_test` user's `publicMetadata` propagation latency.**
   - What we know: Clerk JWT template changes do NOT propagate until sign-out + sign-in. publicMetadata edits MAY propagate immediately to *new* sessions but stale for *active* sessions.
   - What's unclear: Whether the dev/test instance behaves identically to docs description.
   - Recommendation: The plan should include a manual verification step after the Clerk Dashboard cutover — decode the dual-role demo user's JWT at jwt.io and confirm `metadata.roles: ['demo','mill_operator']` is present.

4. **Is there a CI workflow file that needs updating?**
   - What we know: No `.github/workflows/` directory was inspected; STATE.md does not mention CI/CD configuration.
   - What's unclear: Whether Phase 31 must update any CI secrets / env-var manifests.
   - Recommendation: Plan task should include "verify no CI workflow files exist" as a discovery step. If they do exist, add `E2E_MILL_OPERATOR_USER_EMAIL` / `E2E_MILL_OPERATOR_USER_PASSWORD` to the secrets list. If not, defer.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| npm | Package install + drizzle-kit CLI | ✓ | 11.5.2 | — |
| Node.js | Next.js dev/build + drizzle-kit | ✓ | v24.1.0 | — |
| curl | Manual Neon API verification (optional) | ✓ | 8.7.1 | — |
| Docker | Local Postgres alternative (NOT used in Phase 31 — Neon serverless only) | ✓ | 29.1.3 | — |
| psql client | Manual DB inspection (optional, Phase 32+) | ✓ | 18.2 | — |
| Neon CLI (`neonctl`) | Programmatic project provisioning | ✗ | — | Manual project creation via neon.tech dashboard (D-06 already specifies manual provisioning) |
| Neon Postgres project | DB endpoint for `DATABASE_URL` | ✗ (operator action) | — | Phase 31 explicitly requires operator to provision (D-06). Plan must include this as an operator runbook step before `next build` smoke. |
| Clerk Dashboard access | Test user creation + JWT template inspection | ✓ (assumed from STATE.md "Open Blockers") | — | None — required for D-12 / D-13. |

**Missing dependencies with no fallback:**
- **Neon project** must be created by the operator before the verification `next build` runs. The build itself doesn't *need* the URL to succeed (the env-var checks throw at *runtime*, not at build time), but the end-of-phase verification of `db` working over HTTP does. Plan task: "Create Neon project, copy pooled + unpooled URLs to `.env.local`."

**Missing dependencies with fallback:**
- **`neonctl` CLI** — not needed; manual provisioning per D-06.

**Note on `next build` and unset env vars:** `src/db/index.ts` throws at *module evaluation time* when `DATABASE_URL` is missing. If `db` is not imported anywhere in Phase 31 code (which is the expectation — Phase 31 only stages the file), the module is never evaluated and the build succeeds even without env vars set. **Verification protocol:** the planner should explicitly note that Phase 31 acceptance does NOT require `DATABASE_URL` to be set at build time — it only requires the module to *compile* clean. The operator runbook for setting up `.env.local` can happen in parallel without blocking the build smoke test.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30 (`jest`, `jest-environment-jsdom`, `@testing-library/react`, `jest-axe`) + Playwright 1.59 (E2E) |
| Config file | `jest.config.ts` (root); `playwright.config.ts` (root) |
| Quick run command | `npm test -- --testPathPattern='auth\|clerkAuth\|page'` (Jest, scoped to Phase 31 touch points) |
| Full suite command | `npm test && npm run build && npm run test:e2e` |
| Phase gate | All three (Jest pass + clean `next build` + E2E auth projects pass) must be green before merge |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `'mill_operator'` is a member of `Role` union | unit (compile-time via `tsc`) | `npx tsc --noEmit` | ✅ tsconfig.json present; verification runs on existing infra |
| AUTH-01 | `'mill_operator'` is enumerable in the union (sanity check) | unit | `npm test -- --testPathPattern='auth.test\|clerkAuth.test'` — extend `src/lib/auth.test.ts` with a `Role[]` typed-array literal containing all four roles | ✅ `src/lib/auth.test.ts` exists (Phase 27); extend |
| AUTH-02 (rewritten) | Server actions in Phase 33 will use `requireRole('mill_operator')`; Phase 31 stages no actions but proves `requireRole('mill_operator')` works | unit | `npm test -- --testPathPattern='auth.test'` — add a test case `requireRole('mill_operator')` mirroring the existing demo/admin cases | ✅ `src/lib/auth.test.ts:24-69` already has the pattern |
| AUTH-03 (rewritten) | Middleware `/` flow uses `auth.protect()` only — no role check on `/` | unit (source-string inspection) | `npm test -- --testPathPattern='middleware.test'` — confirm the existing middleware.test.ts assertion that `isDemoRoute` matcher is `/demo(.*)`-only still passes | ✅ `src/middleware.test.ts:156-161` already enforces this |
| AUTH-03 | Authenticated user without `mill_operator` lands on `/` in read-only mode | E2E | `npx playwright test --project=auth-demo` (after D-13 metadata propagation: demo user sees edit mode; norole user, if signed in, would see read-only) | ⚠️ Wave 0 — new `e2e/mill-operator-smoke.spec.ts` recommended (see Open Question #2) |
| AUTH-04 | `docs/clerk-setup.md` runbook contains `mill_operator` row + dual-role guidance | doc inspection (manual / grep) | `grep -l 'mill_operator' docs/clerk-setup.md` | ✅ doc exists; planner edits in-place |
| DATA-01 | `.env.example` contains placeholders for `DATABASE_URL` + `DATABASE_URL_UNPOOLED` | unit (file-content grep) | `grep -E '^DATABASE_URL(_UNPOOLED)?=' .env.example` | ✅ file exists; planner adds lines |
| DATA-01 | `.env.local` contains real values (operator action, not automated) | manual (jwt.io decode + `node -e "console.log(process.env.DATABASE_URL)"`) | manual smoke | ⚠️ Operator runbook step |
| DATA-08 | `src/db/index.ts` has `import 'server-only'` as line 1 | unit (source-string inspection) | new test in `src/db/__tests__/index.test.ts` reading file content and asserting `lines[0] === "import 'server-only';"` | ❌ Wave 0 — new `src/db/__tests__/index.test.ts` |
| DATA-08 | `next build` succeeds with no Edge-bundle errors | smoke | `npm run build` (verify exit 0; verify no "Module not found: Can't resolve 'fs'" lines in output) | ✅ existing `npm run build` script |
| DATA-08 | Drizzle client compiles into server bundle only (negative test) | smoke | `npm run build` then inspect `.next/server/app/page.js` for absence of `drizzle` imports (more advanced verification deferred — line-1 + build success is sufficient) | ✅ existing infra |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern='auth\|clerkAuth\|page\|middleware\|db'` — runs Jest scoped to Phase 31's touch points. Targets ~5 second wallclock for fast inner-loop TDD.
- **Per wave merge:** `npm test && npx tsc --noEmit` — full Jest suite + TypeScript whole-tree compile. ~30-60 seconds.
- **Phase gate (before `/gsd-verify-work`):** `npm test && npx tsc --noEmit && npm run build && npm run test:e2e` — Jest + TS + Next.js build + Playwright E2E. ~3-5 minutes.

### Wave 0 Gaps

- [ ] `src/db/__tests__/index.test.ts` — new test file. Asserts (a) `import 'server-only'` is exactly line 1 of `src/db/index.ts`, (b) the file exports `db`, (c) the file does NOT import `next/navigation` / `react` / any client-side primitive (negative test). TDD-eligible (write before file body).
- [ ] `e2e/mill-operator-smoke.spec.ts` — new Playwright spec for `auth-mill-operator` project. Signs in as the mill-operator user (via storageState), navigates to `/`, asserts `data-mode="edit"` on `<MillReadOnlyStub>`. Mirror under `auth-demo` project (post-D-13) to verify dual-role behavior. Not strictly required for phase gate but strongly recommended per Open Question #2.
- [ ] `playwright/.clerk/mill-operator.json` — generated by `e2e/global.setup.ts` once the new roles entry is added. Gitignored already (`playwright/.clerk/` line in `.gitignore` [VERIFIED]).
- [ ] No framework install needed — Jest, Playwright, TypeScript all present.

**TDD eligibility map** (per TDD_MODE=ENABLED):

| Task | TDD-eligible? | Rationale |
|------|---------------|-----------|
| Add `'mill_operator'` to Role union | NO — pure type widening | A compile-time test exists post-edit but the change itself is mechanical. |
| Add `checkRole` to `src/lib/auth.ts` | **YES** | Business logic with I/O (reads sessionClaims). TDD: write 4 test cases (role present, role absent, no metadata, multi-role) BEFORE implementing the function. |
| Add `mockMillOperatorSession` + `mockDualRoleSession` to fixture | YES (light) | Mirror existing `mockDemoSession` test pattern in `src/test/fixtures/clerkAuth.test.ts`. |
| Rewrite `src/app/page.tsx` to canEdit pattern | **YES** | Business logic with I/O (auth() + checkRole()). TDD: write tests for unauthenticated → redirect, authenticated non-operator → canEdit=false, mill-operator → canEdit=true. |
| Create `<MillReadOnlyStub>` component | NO (or trivial) | Pure presentational; one prop → text branch. Optional snapshot test. |
| Create `src/db/index.ts` | **YES (source-string TDD)** | Test asserts line-1 placement BEFORE writing the file. Catches off-by-one bugs during refactors. |
| Create `src/db/schema.ts` (empty export) | NO | One-line placeholder. |
| Create `drizzle.config.ts` | NO | Config file; verified by `npx drizzle-kit generate` succeeding. |
| Add `auth-mill-operator` Playwright project | NO (config) | Tested via E2E run. |
| Update `e2e/global.setup.ts` roles record | NO (data) | Tested via storageState file generation. |
| Update `.env.example` | NO | Static text. |
| Update `docs/clerk-setup.md` | NO | Documentation. |
| Update `.planning/REQUIREMENTS.md` (D-17) | NO | Documentation. |
| Update `.planning/ROADMAP.md` (D-15, D-16) | NO | Documentation. |

**Sampling-theorem framing:** Every locked decision in CONTEXT.md should be observable in at least one verification artifact. Coverage map:

| Decision | Observable In |
|----------|---------------|
| D-01 (mill_operator is edit role) | `src/app/page.tsx` has no `requireRole('mill_operator')`; `e2e/mill-operator-smoke.spec.ts` asserts demo user reaches `/` without redirect |
| D-02 (auth gate only on `/`) | `src/app/page.tsx` body inspected — has `await auth()` + `redirect('/sign-in')` but no role redirect |
| D-03 (canEdit boolean prop) | `<MillReadOnlyStub>` source has `canEdit: boolean` prop; page test verifies branches |
| D-04 (server actions enforce in Phase 33) | Out of scope for Phase 31 verification; tracked as Phase 33 prerequisite |
| D-05 (no middleware coarse-gate) | `src/middleware.test.ts:156-161` already enforces — no edit needed |
| D-06 (fresh Neon project, local only) | `.env.local` populated; no Vercel env-var changes in this PR |
| D-07 (pooled vs unpooled URLs) | `.env.example` has both keys; `drizzle.config.ts` reads UNPOOLED; `src/db/index.ts` reads pooled |
| D-08 (drizzle.config.ts UNPOOLED) | source-string test on `drizzle.config.ts` — asserts `DATABASE_URL_UNPOOLED` literal present |
| D-09 (single schema.ts) | `src/db/schema.ts` exists; `src/db/schema/` directory does NOT exist |
| D-10 (server-only line 1) | `src/db/__tests__/index.test.ts` source-string test |
| D-11 (drizzle.config.ts at root) | `ls drizzle.config.ts` from repo root succeeds |
| D-12 (new mill-operator user) | `docs/clerk-setup.md` Step 2 table has the new row; `e2e-mill-operator+clerk_test@example.com` reachable via E2E sign-in |
| D-13 (demo user dual-role) | `docs/clerk-setup.md` Step 3 has dual-role JSON; demo user E2E smoke asserts edit mode on `/` |
| D-14 (Playwright project) | `playwright.config.ts` has `auth-mill-operator` entry; storageState file generated |
| D-15 (SC#2 text rewrite) | `.planning/ROADMAP.md` line edited |
| D-16 (SC#4 text rewrite) | `.planning/ROADMAP.md` line edited |
| D-17 (REQUIREMENTS.md AUTH-02/03 rewrite) | `.planning/REQUIREMENTS.md` lines 26-27 edited |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Clerk v7 (`@clerk/nextjs/server.auth()`) — unchanged in Phase 31. Middleware's `auth.protect()` is the outer guard; `await auth()` in `page.tsx` is the inner check. |
| V3 Session Management | yes | Clerk-managed session cookies + JWT; Phase 31 introduces no new session logic. |
| V4 Access Control | yes | Role-based via `Role[]` array on `sessionClaims.metadata.roles`. Phase 31 adds `'mill_operator'` to the union — does NOT introduce new enforcement primitives. The `canEdit` pattern is a *presentational suppressor*, NOT an authorization decision (real authz happens in Phase 33 server actions). |
| V5 Input Validation | no (Phase 31) | No user input handled. Phase 33 introduces input validation (Zod on bulk import rows). |
| V6 Cryptography | no | Phase 31 introduces no cryptographic operations. Clerk handles JWT signing; Neon handles SSL/TLS to Postgres. |
| V8 Data Protection | partial | `src/db/index.ts` `import 'server-only'` is a defense against accidentally exposing DB connection strings or query results in the client bundle. Build-time enforcement is the control. |
| V14 Configuration | yes | Env-var management: `DATABASE_URL` (pooled, for app) vs `DATABASE_URL_UNPOOLED` (direct, for migrations). Misconfiguration mode: wrong URL in `drizzle.config.ts` produces migration failures (medium-impact, low-likelihood after the explicit split). |

### Known Threat Patterns for Next.js 16 + Clerk + Neon stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DB driver leak into Edge runtime / client bundle | Information Disclosure (driver internals, env vars surfaced to client) | `import 'server-only'` line 1 of `src/db/index.ts` — D-10 |
| Connection-string disclosure in client bundle | Information Disclosure | `process.env.DATABASE_URL` is server-only by default in Next.js (only `NEXT_PUBLIC_*` keys reach client); reinforced by `import 'server-only'` |
| Role check on client (presentational bypass) | Elevation of Privilege | `<MillReadOnlyStub canEdit={canEdit}>` is acknowledged as presentational; real enforcement is Phase 33 `requireRole` in server actions. `docs/security-patterns.md` §4 codifies this. |
| Wrong URL for migrations (pooled used) | Denial of Service (migrations fail in production) | `drizzle.config.ts` explicit `DATABASE_URL_UNPOOLED` + runtime throw if missing — D-08 |
| Stale JWT after role update (Pitfall 6) | Elevation of Privilege / Authentication bypass | Runbook step in `docs/clerk-setup.md` Step 4 reiterated for Phase 31's demo-user update |
| Test-user email leak to real inbox (Pitfall 5) | Information Disclosure (low) | `+clerk_test` mailbox suffix per D-12 + runbook |

**Trust boundary summary for Phase 31:**
1. **Browser → Edge middleware:** unchanged from Phase 27; `auth.protect()` is the perimeter.
2. **Edge middleware → RSC:** unchanged; `await auth()` in `page.tsx` reads the verified session.
3. **RSC → Client component:** new boundary for `canEdit: boolean` prop. The prop is *presentational*; treating it as a security boundary would be wrong (and is explicitly called out in `docs/security-patterns.md` §4).
4. **RSC → DB:** NOT exercised in Phase 31. `src/db/index.ts` exists but is unused at runtime; the boundary is set up so Phase 33 server actions can cross it.

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM — Connect Neon](https://orm.drizzle.team/docs/connect-neon) — verified driver subpath (`neon-http`), exact `src/db/index.ts` shape, install commands
- [Drizzle ORM — Get Started with Neon](https://orm.drizzle.team/docs/get-started/neon-new) — verified `drizzle.config.ts` shape, dual install command (deps + devDeps)
- [Drizzle ORM — Drizzle with Neon tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-db/drizzle-with-neon) — official end-to-end pattern, including dotenv loading in `drizzle.config.ts`
- [Neon — Connection Pooling](https://neon.com/docs/connect/connection-pooling) — verified `-pooler.neon.tech` hostname convention + PgBouncer transaction-mode `SET` incompatibility for migrations
- [Next.js — Server and Client Components (16.2.6)](https://nextjs.org/docs/app/getting-started/server-and-client-components) — verified `server-only` package semantics, build-time error behavior, "Preventing environment poisoning" section
- [Next.js — Turbopack config](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack) — verified Turbopack respects standard module resolution including `react-server` export conditions (`server-only` works under Turbopack)
- `src/lib/auth.ts`, `src/test/fixtures/clerkAuth.ts`, `src/middleware.ts`, `e2e/global.setup.ts`, `playwright.config.ts`, `docs/security-patterns.md`, `docs/clerk-setup.md` — project source, verified by direct read
- npm registry — verified versions: `drizzle-orm@0.45.2` (2026-05-09), `drizzle-kit@0.31.10` (2026-05-09), `@neondatabase/serverless@1.1.0` (2026-04-17)
- `node_modules/server-only/index.js` + `package.json` — verified the package is already a transitive dep, with `react-server` export condition routing to `empty.js`

### Secondary (MEDIUM confidence)
- [Sentry — Fixing "Module not found: Can't resolve 'fs'" in Next.js](https://sentry.io/answers/module-not-found-nextjs/) — confirmed the exact error signature for Edge-runtime contamination
- [Sentry — Next.js middleware "Module not found"](https://sentry.io/answers/next-js-middleware-module-not-found-can-t-resolve-fs/) — confirmed middleware-Edge-Node mismatch error path
- [Drizzle ORM — Custom migrations / Empty schemas](https://orm.drizzle.team/docs/kit-custom-migrations) — semi-confirmed that empty schema files are accepted by drizzle-kit (assumption A1 logged)

### Tertiary (LOW confidence)
- None. Every load-bearing claim is sourced from Primary or Secondary above, or marked `[ASSUMED]` in §"Assumptions Log".

## Metadata

**Confidence breakdown:**
- Standard stack (drizzle + neon-http + drizzle-kit + server-only): HIGH — all versions verified on npm; official docs match exact code shapes used; `server-only` already in tree
- Architecture (canEdit prop pattern + middleware no-op + server-only line 1): HIGH — every decision in CONTEXT.md maps to an existing project pattern (Phase 28 RSC+client, `src/lib/auth.ts` server-only discipline)
- Pitfalls (Edge leak, pooled-URL migration failure, server-only placement, env-var loading divergence, +clerk_test suffix, stale JWT, missing checkRole, empty schema): HIGH — five of eight are project-internal (verified by direct file read); three are verified against official Next.js / Neon / Clerk docs

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (Drizzle / Neon / Next.js move at ~monthly cadence on these primitives; re-verify versions before any Phase 32+ work)

## RESEARCH COMPLETE

**Phase:** 31 — Role Expansion and DB Infrastructure
**Confidence:** HIGH

### Key Findings

- All locked decisions D-01..D-17 are implementable with **additive-only** code changes — no existing helper signatures need editing. `requireRole(role: Role)` and `mockNonDemoSession(role: Exclude<Role, 'demo'>)` both widen automatically when `'mill_operator'` joins the `Role` union.
- **One missing primitive must be added:** `checkRole(role: Role): Promise<boolean>` is referenced by CONTEXT.md but NOT exported from `src/lib/auth.ts` today (only `requireRole` exists). The planner must include adding `checkRole` as a Phase 31 task — it is load-bearing for D-03's `canEdit` pattern. This is the single most important finding for the planner.
- Standard stack versions verified current on 2026-05-12: `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, `@neondatabase/serverless@1.1.0`. All at `latest` dist-tag; package-lock pin to these exact versions.
- `next build` is the canonical "no Edge-runtime contamination" verification — `src/db/index.ts` having `import 'server-only';` as line 1 produces a clear build-time error if any client component or middleware transitively imports it. Project uses Webpack (not Turbopack — `package.json` "build" script is plain `next build`); both runtimes honor `server-only`.
- `drizzle-kit` is a separate Node process — `drizzle.config.ts` must explicitly load `.env.local` via `dotenv` (project already has `dotenv` ^17.4.2 in devDependencies for Playwright).
- The `e2e-demo` user becoming the dual-role test fixture (D-13) is the cleanest multi-role coverage path — `Array.prototype.includes` semantics validated without inventing a new user.

### Files Created
- `.planning/phases/31-role-expansion-and-db-infrastructure/31-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | npm-verified versions, official Drizzle + Neon docs match exact code shapes |
| Architecture | HIGH | Every decision maps to an existing project pattern; no novel infrastructure |
| Pitfalls | HIGH | 5/8 pitfalls verified by direct file inspection; 3/8 verified against official docs |
| Test Architecture | HIGH | Existing Jest + Playwright infra covers ~80% of Phase 31; only one new test file is strictly required (`src/db/__tests__/index.test.ts`) |
| Assumptions | MEDIUM | 5 assumptions logged; all have low-cost verification paths the planner can encode as acceptance criteria |

### Open Questions (for planner consideration, not blockers)

1. Where to put the canEdit-mode-toggle test — fold into `src/app/page.test.tsx` (recommended) vs new `MillReadOnlyStub.test.tsx`.
2. Whether to add a `auth-mill-operator` smoke spec in Phase 31 or defer to Phase 33 (recommended: add minimal smoke now).
3. Verify Clerk `+clerk_test` dual-role propagation via manual JWT decode after Dashboard update (recommended runbook step).
4. Inspect for existing CI workflow files — add new env-var names to secrets if present.

### Ready for Planning

Research complete. The planner can now create PLAN.md files. Suggested plan partitioning (the planner has final say):

- **Plan 31-01:** Role union + `checkRole` helper + fixture extensions + REQUIREMENTS/ROADMAP edits (TDD-heavy: tests-first for `checkRole`, then implementation)
- **Plan 31-02:** Drizzle/Neon install + `drizzle.config.ts` + `src/db/index.ts` + `src/db/schema.ts` + `.env.example` (source-string TDD for line-1 server-only)
- **Plan 31-03:** `src/app/page.tsx` rewrite + `<MillReadOnlyStub>` + page test refresh (TDD: write page tests for canEdit branches first)
- **Plan 31-04:** Clerk Dashboard cutover runbook (`docs/clerk-setup.md` edits) + Playwright `auth-mill-operator` project + (optional) smoke spec + operator manual steps documented
- **Plan 31-05:** Verification — `npx tsc --noEmit` + `npm test` + `npm run build` + `npm run test:e2e` (gate before `/gsd-verify-work`)
