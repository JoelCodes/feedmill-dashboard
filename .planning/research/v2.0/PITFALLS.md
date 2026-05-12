# Pitfalls: v2.0 Mill Production MVP

**Project:** CGM Dashboard — Adding Postgres + Drizzle + Real-time to Next.js 15 + Clerk App
**Researched:** 2026-05-12
**Confidence:** HIGH (driver/runtime issues, async params), MEDIUM (concurrency, testing patterns)

---

## Summary

v2.0 is the first milestone that introduces stateful infrastructure (Postgres, real mutations, audit
trail) to what has been a mock-data app. The upgrade risks concentrate in five areas: runtime
incompatibility (Edge vs Node), cache invalidation discipline, the 4.5 MB server-action wall, Clerk
identity ↔ DB identity mismatch, and the shift from mock-data Playwright tests to tests that require
a real DB. Each pitfall below includes a phase mapping so the roadmap can place guard-rails in the
right phase rather than discovering the problem mid-build.

---

## Critical Pitfalls

### Pitfall 1: Wrong Postgres Driver for the Runtime (Edge vs Node)

**What goes wrong:**
The `pg` (node-postgres) driver uses Node.js built-ins (`stream`, `fs`, `net`). If any import of
the Drizzle client lands in the Edge runtime — middleware, an Edge-flagged route handler, or a
module that was accidentally included in the middleware bundle — you get a build-time or runtime
error:

```
Module not found: Can't resolve 'fs'
```

or a silent cold-start failure. The same problem hits if you try to use `drizzle-orm/node-postgres`
in a file that Next.js decides to bundle for Edge because it is transitively imported through a
shared module.

**Why it happens:**
Next.js 15 App Router runs middleware exclusively on the Edge runtime. Route handlers and RSC pages
default to Node.js but can opt into Edge via `export const runtime = 'edge'`. The project's
`src/middleware.ts` currently only does Clerk checks — it never touches the DB — but if a shared
utility (e.g., a `lib/db.ts` that is also imported by RSC pages) leaks into the middleware bundle,
the `pg` driver explodes.

**Warning signs:**
- Build error: `Module not found: Can't resolve 'stream'` or `'fs'`
- Runtime error in middleware or Edge route: `ReferenceError: process is not defined`
- Vercel deployment log shows function size dramatically larger than expected
- `drizzle-kit generate` succeeds but the app fails to start

**Prevention:**
1. Use `postgres.js` (via `drizzle-orm/postgres-js`) for Node.js route handlers and RSC pages.
   `postgres.js` is the recommended modern default — faster than `pg`, TypeScript-native, built-in
   pooling, and also an Edge-incompatible TCP driver.
2. Use `@neondatabase/serverless` (via `drizzle-orm/neon-http`) **only** for anything that must run
   on Edge. Middleware never needs DB access; keep it that way.
3. Mark the DB client file with `import 'server-only'` at the top. This throws a build error if
   the file is ever imported in a Client Component or middleware bundle.
4. Never put DB imports in shared utilities that are transitively imported by `middleware.ts`.
5. Verify at build time: `next build` will warn about Edge-incompatible modules if they appear in
   Edge bundles.

**Driver decision matrix for this project:**

| Use-case | Runtime | Driver | Drizzle adapter |
|----------|---------|--------|-----------------|
| RSC pages, route handlers (app/) | Node.js | postgres.js | `drizzle-orm/postgres-js` |
| Drizzle migrations (CLI only) | Node.js (local/CI) | postgres.js | `drizzle-kit` |
| Middleware | Edge | **No DB access** | N/A |
| Edge route handler (if ever needed) | Edge | @neondatabase/serverless HTTP | `drizzle-orm/neon-http` |

**Phase mapping:** DB Infrastructure phase (before any route handler or RSC touches the DB).

---

### Pitfall 2: Connection Exhaustion on Vercel Serverless Functions

**What goes wrong:**
Serverless functions scale horizontally and immediately. Each function invocation that creates a new
`pg`/`postgres.js` connection without a pooler consumes a Postgres connection slot. At modest
traffic (e.g., 50 simultaneous requests during a shift handover) you exceed Neon's default 10-20
connection limit, and queries start failing with:

```
error: remaining connection slots are reserved for non-replication superuser connections
```

or simply `too many clients already`.

**Why it happens:**
Unlike a long-running Node server that creates one pool and reuses it, each Vercel function
invocation has no warm-state guarantee. Even with Vercel Fluid Compute (which reuses warm
instances), a traffic spike will fan out to many cold instances. Each instance opens its own
connection. Without a pooler (PgBouncer or Neon's built-in pooled endpoint), every active
connection counts against Postgres's `max_connections`.

**Warning signs:**
- `FATAL: sorry, too many clients already` in Vercel function logs
- Queries intermittently fail under load but succeed in isolation
- Neon console shows connections repeatedly hitting the max
- Database response times spike during peak usage (shift start/end)

**Prevention:**
1. **Always use the Neon pooled connection string** (the `-pooler` hostname) for application
   queries. Neon's built-in pooler (PgBouncer in transaction mode) handles hundreds of concurrent
   serverless connections against a small Postgres connection count.
2. Keep two connection strings in env vars:
   - `DATABASE_URL` — pooled URL (ends in `-pooler.neon.tech`) for application queries
   - `DATABASE_URL_UNPOOLED` — direct URL for Drizzle migrations (`drizzle-kit migrate` must use
     the unpooled URL because PgBouncer transaction mode does not support SET commands used by
     migrations)
3. In the Drizzle client module, default to `DATABASE_URL`. In `drizzle.config.ts`, explicitly use
   `DATABASE_URL_UNPOOLED`.
4. Limit `max` connections in `postgres.js`: `postgres(url, { max: 1 })` per serverless function —
   since each instance is ephemeral, a pool size of 1 is correct and prevents per-instance
   over-allocation.

**Detection before prod:**
- Load-test the bulk import endpoint with 5 concurrent requests and watch Neon's connection
  graph. If it spikes to the limit during 5 concurrent requests, you'll overflow at 50.

**Phase mapping:** DB Infrastructure phase (before any route handler is merged).

---

### Pitfall 3: Server Actions That Mutate Without Revalidating — Users See Stale Data

**What goes wrong:**
A server action transitions an order status from Pending to Mixing. The action writes to the DB and
returns success. The user sees the order card still showing "Pending" because the RSC page
rendered from cached data. They click again. The order gets double-transitioned.

The inverse also happens: a successful bulk import shows the "0 pending orders" count from before
the import because the mill production page is still serving a cached RSC payload.

**Why it happens:**
In Next.js 15, RSC pages that use `fetch()` or `db` queries without `{ cache: 'no-store' }` or
`export const dynamic = 'force-dynamic'` will be statically generated at build time or served from
the Full Route Cache. A mutation in a server action does not automatically bust either the Full
Route Cache or the client-side Router Cache unless you explicitly call `revalidatePath` or
`revalidateTag`.

**Warning signs:**
- After a status transition, the UI still shows the old status until a hard refresh
- KPI counts (e.g., "6 Pending") don't change after bulk import
- Playwright E2E tests pass with mock data but fail with real DB because they check immediate UI
  updates after server actions

**Prevention:**
1. Every server action that mutates data must call `revalidatePath` or `revalidateTag` before
   returning. Treat this as a checklist item for every action.
2. Use `revalidateTag` over `revalidatePath` where possible — it is more surgical and does not
   nuke unrelated pages. Tag DB query results at read time:
   ```typescript
   // In the query function
   const orders = await unstable_cache(
     () => db.select().from(ordersTable),
     ['orders'],
     { tags: ['orders'] }
   )();

   // In the server action
   revalidateTag('orders');
   ```
3. For pages that must always show live data (the mill production dashboard), add
   `export const dynamic = 'force-dynamic'` at the top. This opts the entire route out of the
   Full Route Cache and forces a fresh DB query on every request. Accept the trade-off: no static
   caching means every request hits the DB — acceptable for an operations dashboard used during
   working hours.
4. Never use `revalidatePath('/', 'layout')` as a catch-all. It invalidates every cached page in
   the app and causes unnecessary DB queries.
5. If real-time updates are added later (polling, SSE, Pusher), the cache strategy changes:
   `force-dynamic` remains correct, but polling bypasses the cache entirely via client-side fetch.
   Do not mix server-action revalidation with a polling loop — they will fight each other.

**Phase mapping:** All mutation phases (status transitions, bulk import, audit trail). Add to the
definition-of-done checklist: "Action calls `revalidateTag` or `revalidatePath`."

---

### Pitfall 4: Server Action Body Limit Kills XLSX Bulk Import

**What goes wrong:**
A user selects a 10,000-row XLSX export from their ERP system (common in feed mill operations —
a full week's orders). The file is ~800 KB–3 MB. The server action silently returns no error, but
no records are imported. Or on Vercel Pro it returns a 413 or `FUNCTION_PAYLOAD_TOO_LARGE` error.

**Why it happens:**
Next.js server actions have a default body size limit of **4.5 MB** on Vercel. On the Hobby plan
this is enforced by both Next.js and Vercel's infrastructure limit. The error is sometimes silent
— Next.js does not throw a user-visible error on the client; the action just resolves with no data
and no error state in the default handler.

Additionally, Next.js 15.5+ introduced `proxyClientMaxBodySize` (default 1 MB) which silently
truncates binary data before it even reaches the action. A 2 MB XLSX file can be truncated to 1 MB
of garbled binary, producing a corrupt parse result with no error.

**Warning signs:**
- Import of large XLSX files silently produces 0 imported rows
- Import succeeds for small files (<500 KB) but fails for large ones
- Vercel function logs show no error but import count is 0
- `FUNCTION_PAYLOAD_TOO_LARGE` error in Vercel logs for files > 4.5 MB

**Prevention:**
1. Do **not** parse XLSX in a server action. Use an API route handler instead — route handlers
   use `request.formData()` and are not subject to the server action body limit config. They do
   still respect Vercel's 4.5 MB function payload limit, but the limit is enforced consistently
   and returns a proper 413.
2. If staying with server actions (simpler DX), configure both limits in `next.config.ts`:
   ```typescript
   experimental: {
     serverActions: {
       bodySizeLimit: '10mb', // Raise the action limit
     },
   },
   proxyClientMaxBodySize: '10mb', // Must match or exceed bodySizeLimit (Next.js 15.5+)
   ```
3. For files > 4.5 MB, upload to a temporary storage location (Vercel Blob, S3, or even a
   Neon large object) and pass the storage URL to the action/handler. The action then streams the
   file for parsing instead of receiving it as a payload. This is the only solution that scales
   beyond Vercel's hard infrastructure limit.
4. Validate file size on the client before submission and show a clear error:
   ```typescript
   if (file.size > 8 * 1024 * 1024) {
     setError('File must be under 8 MB. Split large exports into multiple files.');
     return;
   }
   ```
5. XLSX parsing (via `xlsx` or `exceljs`) is CPU-intensive for large files. Keep it in a Node.js
   runtime route handler, not an Edge function. A 10,000-row parse takes ~200–500 ms and will
   exceed Edge function CPU time limits.

**Phase mapping:** Bulk Import phase. Address before wiring the file upload UI.

---

### Pitfall 5: Clerk User ID vs Internal DB User ID — Wrong Choice Causes Schema Pain Later

**What goes wrong:**
Two common mistakes diverge here:

**Mistake A — Foreign key directly to Clerk ID (string):**
Orders table stores `created_by_clerk_id VARCHAR` and has no local users table. Works fine until
you need: per-user settings, display names without a Clerk API call, role history, or a user who
was deleted from Clerk but whose orders must be preserved. Every query that joins "who created this
order" requires a Clerk API call. At 500 orders per day, that is 500 Clerk API calls per page load.

**Mistake B — Local users table without sync:**
A `users` table has `id SERIAL PRIMARY KEY` and a `clerk_user_id VARCHAR UNIQUE`. You sync users
via Clerk webhooks. Fine in theory, but:
- The first Vercel deployment has no webhook registered, so no users exist in the DB
- A user logs in, the app tries to create an order with `created_by_user_id` FK, the FK fails
  because the users table is empty
- Webhooks can fail or arrive out-of-order, leaving users missing from the DB

**Why it happens:**
Both mistakes come from under-specifying the user identity contract before building the data model.

**Warning signs (Mistake A):**
- Every order query does a `fetch()` to Clerk to get the creator's name
- "Who is this user?" requires parsing a Clerk ID string in the UI
- After a user is deleted from Clerk, their orders show `null` creator

**Warning signs (Mistake B):**
- First login after a new deploy fails with FK constraint error
- Orders are created successfully but the creator field is blank
- Webhook delivery failures cause inconsistent user records

**Prevention:**
Use a hybrid pattern — **store Clerk ID as the direct FK on orders** but maintain an explicit
`users` table for anything you want to display or query:

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT UNIQUE NOT NULL,  -- Clerk's user ID (e.g., user_2abc...)
  full_name   TEXT,
  email       TEXT,
  role        TEXT,
  synced_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT NOT NULL,    -- Direct Clerk ID — no FK constraint
  ...
);
```

Why no FK constraint on `clerk_user_id`:
- Clerk is the source of truth for users; your DB is a cache
- A deleted Clerk user should not cascade-delete their orders
- Skip-the-FK prevents the "webhook hasn't fired yet" race condition

Why keep a local `users` table anyway:
- Store display names locally so the orders page does not need a Clerk API call
- Upsert user data on every sign-in (one write per session, not per query)
- Use the local table for audit trail display, not for auth decisions

For this milestone (single-user ops staff, manual role assignment), the simplest safe pattern is:
1. Store `clerk_user_id TEXT` on orders (no FK, no constraint)
2. Upsert a local `users` row on every authenticated request to the dashboard (lazy sync)
3. Never query Clerk API from inside a DB query; join locally

**Phase mapping:** DB Schema design phase (schema is hard to migrate later).

---

### Pitfall 6: Audit Trail Concurrency — Two Operators Race on the Same Order

**What goes wrong:**
Two operators have the mill production dashboard open. Both click "Start Mixing" on order #255154
at approximately the same time. Both server actions read the order as `status = 'Pending'`, both
write `status = 'Mixing'`, both insert audit log entries. The order appears to have been started
twice. The audit trail shows two "Pending → Mixing" transitions by two different users within 500 ms
of each other. The KPI count is now off.

**Why it happens:**
Server actions are independent HTTP requests. Without a concurrency control mechanism, both
read-modify-write sequences interleave. Postgres does not prevent this at the application layer.

**Warning signs:**
- Audit trail shows duplicate status transitions within milliseconds
- KPI counts become inconsistent after periods of simultaneous use
- "Undo" logic fails because the previous state recorded in the audit log is already stale

**Prevention:**
Use optimistic concurrency with a `version` column on the orders table. This is the correct
pattern for a low-write-frequency operations dashboard (a given order changes status ~4 times per
day, not thousands of times per second):

```sql
CREATE TABLE orders (
  id          UUID PRIMARY KEY,
  status      TEXT NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  ...
);
```

In the server action, include `version` in the WHERE clause of the UPDATE:

```typescript
const result = await db
  .update(orders)
  .set({ status: 'Mixing', version: currentVersion + 1 })
  .where(
    and(
      eq(orders.id, orderId),
      eq(orders.version, currentVersion)  // Optimistic lock check
    )
  )
  .returning({ id: orders.id });

if (result.length === 0) {
  // Another actor updated the order first
  throw new Error('Order was modified by another user. Please refresh and try again.');
}
```

This pattern:
- Requires zero extra locks (no `SELECT FOR UPDATE`)
- Works correctly with serverless functions (no shared state needed)
- Gives the user a clear, actionable error instead of silent corruption
- Is trivially testable: concurrent DB writes with the same version produce exactly one success

Do **not** use trigger-based audit logs as the only concurrency control — triggers record what
happened but do not prevent the race. Use the version check in the action, and use triggers
(or explicit audit inserts inside transactions) to record what happened after the check succeeds.

**Phase mapping:** Status transitions phase and audit trail phase. The `version` column must be in
the initial schema — adding it retroactively requires a migration and changes the action signatures.

---

### Pitfall 7: Real-time via SSE Keeps Vercel Functions Warm Forever

**What goes wrong:**
A Server-Sent Events (SSE) route handler at `app/api/orders/stream/route.ts` opens a streaming
`ReadableStream`. On Vercel Hobby, the function times out after **10 seconds** and the client
gets a network error. On Vercel Pro, the function times out after **60 seconds** (or 300s with
`maxDuration`). Each connected client holds one Vercel function invocation open for the duration of
their session. 10 operators = 10 simultaneous long-running function invocations. These are billed
per GB-second and each one counts against Vercel's concurrent execution limit.

**Why it happens:**
Vercel Serverless Functions are designed for request-response cycles, not persistent connections.
SSE works for short bursts (AI streaming, file upload progress) but is structurally incompatible
with a persistent dashboard that needs updates for an 8-hour shift.

**Warning signs:**
- Client EventSource fires `error` event every 10–60 seconds and reconnects
- Vercel usage dashboard shows consistently high function invocation duration
- Operators report the dashboard "refreshing itself" every minute
- Costs on Vercel spike unexpectedly

**Prevention — choose one based on scope:**

**Option A: Polling (recommended for v2.0 MVP)**
Client polls a route handler every 30 seconds. No persistent connection. Simple, works on all
Vercel plans, zero infra cost beyond normal route invocations. The operations dashboard updates
within 30 seconds — acceptable for shift management.
```typescript
// Client Component
useEffect(() => {
  const interval = setInterval(() => refetch(), 30_000);
  return () => clearInterval(interval);
}, []);
```
Recommended polling interval: 30s (not shorter — the operations team checks the dashboard
periodically, not in real-time). 15s if the team needs faster updates; do not go below 10s.

**Option B: Pusher / Ably (for genuine real-time)**
External pub/sub service. The server action pushes an event to Pusher after a successful status
transition; every connected client receives it via WebSocket. No Vercel function stays open.
Pusher Channels starts at $0 for 200k messages/day — adequate for a single-mill operation.
The added complexity (Pusher SDK, channel naming convention, auth token) is the cost.

**Option C: SSE with maxDuration (last resort)**
If SSE is required, set `export const maxDuration = 300` on Pro plan only and use client-side
auto-reconnect via EventSource's built-in retry. Do not use SSE on Hobby.

**Decision for v2.0:** Start with polling (Option A). The complexity delta between polling and
Pusher is not worth the effort for a single-mill MVP where users are not staring at the screen
waiting for instant updates. Promote to Pusher in a later milestone if operators explicitly request
sub-10-second updates.

**Phase mapping:** Real-time infrastructure phase. Decide the mechanism before building any
"live update" UI — the component design differs between polling and SSE/WebSocket.

---

### Pitfall 8: Coming Soon Homepage → Real Homepage Breaks Unauthenticated Flow

**What goes wrong:**
The current homepage at `/` is a Coming Soon page rendered through `DashboardLayout`. The v1.5
middleware calls `auth.protect()` for all non-public routes, meaning unauthenticated users visiting
`/` are redirected to `/sign-in`. This is currently correct behavior for the Coming Soon page.

When `/` becomes the real mill production dashboard, the same redirect applies — which is also
correct. But there are two subtle regressions:

1. **Redirect loop if sign-in success redirects back to `app/`:** Clerk's `afterSignInUrl` defaults
   to `'/'`. If `'/'` now requires authentication and immediately fires `auth.protect()`, the
   sign-in → redirect → auth check → sign-in chain will resolve correctly — but only because
   the token is already set. The risk is if `'/'` is also protected at the layout level with a
   redundant RSC `requireRole` call that fails before the middleware check runs.

2. **unauthenticated bookmarks to `/demo/*` now redirect to `/` which redirects to `/sign-in`:**
   Previously users who were not logged in hit `/demo/orders` and got redirected to `/` (Coming
   Soon). After the promotion, `/` is the real dashboard, and unauthenticated users hitting `/`
   get redirected to `/sign-in`. This two-step redirect is fine but should be tested.

3. **Sidebar navigation context:** The context-aware Sidebar uses route prefix matching to decide
   whether to show "demo" or "production" navigation. Once `/` is the production dashboard, the
   sidebar must show the production nav for `/` without needing a path prefix. The v1.5 pattern
   (`isDemoRoute`) works by detecting `/demo/*`. The production branch must be triggered by the
   absence of `/demo/`, not by the presence of a `/production/` prefix.

**Warning signs:**
- After deploying the real homepage, logged-out users see an infinite spinner or blank page instead
  of being redirected to `/sign-in`
- The sidebar shows "Coming Soon" navigation instead of production navigation on `/`
- Users who sign in are redirected to `/` but see the Coming Soon component still cached

**Prevention:**
1. The middleware already protects all non-public routes. No changes needed there for the basic
   promotion. Verify the `isPublicRoute` matcher excludes `/` (it currently does — only `/sign-in`
   and `/sign-up` are public).
2. Add an explicit E2E test for the sign-in → `'/'` → dashboard flow before promoting.
3. For the sidebar: update the production-nav condition to match `!pathname.startsWith('/demo/')`.
   Test with `pathname === '/'` to confirm production nav renders.
4. After deployment, verify the cached Coming Soon RSC payload is busted. Run
   `revalidatePath('/')` in a one-time script or accept that the Full Route Cache will serve
   the new version after the Vercel build deployment (new build = full cache bust, so this is
   automatic).

**Phase mapping:** Homepage promotion phase (the last phase of v2.0).

---

### Pitfall 9: Copy-Pasting v1.x Patterns with Synchronous `params` / `searchParams`

**What goes wrong:**
A developer copies a page component from `/demo/orders/page.tsx` (v1.5 vintage) to the new
production orders page. The old page destructures `searchParams` synchronously:

```typescript
// v1.x PATTERN — WRONG in Next.js 15
export default function OrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status; // Synchronous access
}
```

In Next.js 15, `searchParams` and `params` are **Promises**. Synchronous access still works in
development (with a deprecation warning) but will silently return `undefined` in some rendering
contexts and will break in Next.js 16. The bug surfaces as filter/search state being ignored on
initial page load.

**Why it happens:**
The existing `/demo/*` pages were refactored to async RSC in v1.5, but the existing code may not
have been updated to `await searchParams` everywhere. When new production pages are scaffolded
from those templates, the synchronous pattern carries forward.

**Warning signs:**
- URL parameters (e.g., `?status=Pending`) are ignored on initial render
- `nuqs` integration does not populate initial state on server render
- console.warn: `"searchParams should be awaited before accessing properties"`
- Filter pills reset to "all" on every hard refresh despite the URL containing the filter

**Prevention:**
1. All new page components must use async searchParams:
   ```typescript
   export default async function OrdersPage({
     searchParams,
   }: {
     searchParams: Promise<{ status?: string; q?: string }>
   }) {
     const { status, q } = await searchParams;
   }
   ```
2. Use `nuqs` with `createSearchParamsCache` for server-side URL state — it handles the async
   unwrapping and provides type-safe defaults:
   ```typescript
   // lib/search-params.ts
   import { createSearchParamsCache, parseAsString } from 'nuqs/server';
   export const ordersSearchParams = createSearchParamsCache({
     status: parseAsString.withDefault(''),
     q: parseAsString.withDefault(''),
   });

   // In the page
   const { status, q } = ordersSearchParams.parse(await searchParams);
   ```
3. Run the Next.js codemod if migrating old pages:
   `npx @next/codemod@canary next-async-request-api .`
4. Add a lint rule or a note in the code review checklist: "No synchronous `searchParams.xxx`
   access in RSC pages."

**Phase mapping:** URL state / nuqs integration phase. Also applies during the homepage promotion
phase when `/` receives search params for filter state.

---

### Pitfall 10: Playwright Tests Break When Real DB Is Added

**What goes wrong:**
The existing E2E suite runs against mock data. After the DB layer is added, tests that previously
ran deterministically now depend on DB state. Two failure modes:

**Mode A — Ordering/timing:**
Test asserts "order #255154 is in the Pending column." But CI runs `npm test` against a DB that
was seeded in a different order or has leftover state from a previous test run. The order is not
there, or it is in the wrong state. Test fails intermittently.

**Mode B — Migration drift:**
Local schema is at migration 003. CI runs from a fresh DB and applies all migrations. Local dev
has a DB that was manually schema-pushed during development (common with `drizzle-kit push`).
The migration files in `drizzle/migrations/` do not match the actual local DB state. CI passes
but local test fails.

**Warning signs:**
- E2E tests pass on first run but fail on second run (leftover DB state)
- CI passes but local tests fail (migration drift)
- Tests are ordered-dependent: test B only passes if test A ran first
- `drizzle-kit push` was used locally instead of `drizzle-kit migrate`

**Prevention:**
1. **Never use `drizzle-kit push` after the schema is in production.** `push` introspects and
   modifies the DB directly without creating migration files. This silently diverges the local DB
   from the migration history. Use `drizzle-kit generate` + `drizzle-kit migrate` from day one.
2. **For E2E tests, reset the DB before each test run using a global setup file:**
   ```typescript
   // playwright/global-setup.ts
   import { execSync } from 'child_process';
   export default async function globalSetup() {
     // Apply all migrations to test DB
     execSync('npx drizzle-kit migrate', { env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL } });
     // Seed test fixtures
     await seedTestDatabase();
   }
   ```
3. **Use a separate test database.** Set `TEST_DATABASE_URL` in `.env.test.local` pointing to a
   different Neon branch or a local Postgres instance. Never run E2E tests against the development
   or production DB.
4. **For order-state tests, create the fixture in the test setup, not as pre-seeded data:**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await db.insert(orders).values(testOrder); // Fresh, predictable state
   });
   test.afterEach(async () => {
     await db.delete(orders).where(eq(orders.id, testOrder.id));
   });
   ```
5. **jest-axe + RSC:** Do not try to render async RSC components with jest-axe. The jsdom
   environment does not support RSC. Use jest-axe for extracted Client Components and pure
   UI elements only. RSC accessibility must be tested via Playwright (which does render the full
   page). This is consistent with the existing test split in this project.

**Phase mapping:** DB Infrastructure phase (set up test DB and migration strategy before any
test touches real data). Playwright test update phase.

---

## Moderate Pitfalls

### Pitfall 11: Drizzle `drizzle-kit push` in Development Creates Unmigrated Schema Drift

**What goes wrong:**
`drizzle-kit push` is the fastest way to iterate on a schema locally — it applies changes
directly without generating migration files. After several push cycles during development, the
local DB has a schema that no migration file can reproduce. When a colleague runs `drizzle-kit
migrate` on a fresh DB, they get a different schema. CI fails on the migration step.

**Prevention:**
From the first day of DB development, always use the generate → migrate workflow:
```bash
npx drizzle-kit generate   # Creates migration file
npx drizzle-kit migrate    # Applies it
```
Never use `push` on a DB that has or will have real data. Reserve `push` only for rapid
prototyping on a completely throw-away local DB.

**Phase mapping:** DB Infrastructure phase. Document in the project's contributing guide.

---

### Pitfall 12: `force-dynamic` Opt-out on Every DB-Reading Page Increases TTFB

**What goes wrong:**
`force-dynamic` is placed on every page that reads from the DB (to avoid stale cache issues from
Pitfall 3). This prevents any static generation, so every request goes to the DB cold. For pages
where data changes rarely (e.g., a settings page that reads user preferences), this adds
unnecessary latency.

**Prevention:**
Use `force-dynamic` only on pages that display data that changes within a single user session:
- Mill production dashboard: yes (orders change every few minutes)
- Bulk import status: yes
- Settings page: no (use `revalidatePath('/settings')` only when settings are saved)
- Static content pages: no

For pages that use `force-dynamic`, co-locate a `loading.tsx` file to provide an instant skeleton
while the DB query runs. This restores the perceived performance cost.

**Phase mapping:** DB infrastructure phase (decide the caching strategy per route before building).

---

### Pitfall 13: XLSX Parsing Library Bundle Size on the Client

**What goes wrong:**
`xlsx` (SheetJS) is imported in a component that ends up client-side. The library is ~750 KB
uncompressed. It never needs to run in the browser — parsing happens server-side. The bundle size
alert fires, First Load JS increases noticeably.

**Prevention:**
Ensure XLSX parsing only happens in server-side code. Keep the `import 'xlsx'` inside a route
handler or server action file that is `'use server'` / only used in Node.js context. Add
`import 'server-only'` at the top of the parsing utility to get a build error if it ever leaks to
the client.

**Phase mapping:** Bulk import phase.

---

### Pitfall 14: Real-time Polling Interval Too Short Causes Read Amplification

**What goes wrong:**
The mill production dashboard polls the DB every 5 seconds for all users simultaneously. With
10 operators on shift, that is 120 DB reads per minute for what is essentially a read-heavy query
(all orders for today's shift). Under Neon's free/launch tier, this can cause query queueing.

**Prevention:**
30-second polling is the right default for this use case. The operations team looks at the
dashboard periodically, not in real-time. If individual operators need to know immediately when
an order they are working on changes status, use a focused poll (only query the specific order
they have selected) with a shorter interval, not a full-table refresh.

Implement stale-time awareness: if the last poll returned the same data hash, do not trigger a
re-render. `react-query` handles this automatically via `staleTime`.

**Phase mapping:** Real-time / polling phase.

---

## Phase-Specific Warnings

| Phase Topic | Pitfall | Mitigation |
|-------------|---------|------------|
| DB schema design | Clerk ID FK choice locks in wrong identity model | Use hybrid pattern (Pitfall 5) before first migration |
| DB schema design | No `version` column = no concurrency control | Add `version INTEGER DEFAULT 1` in initial schema (Pitfall 6) |
| DB Infrastructure | Wrong driver in Edge runtime | `import 'server-only'`, driver decision matrix (Pitfall 1) |
| DB Infrastructure | Connection exhaustion | Pooled URL for app, unpooled URL for migrations (Pitfall 2) |
| DB Infrastructure | `push` vs `migrate` drift | Use generate+migrate from day one (Pitfall 11) |
| DB Infrastructure | Test DB not isolated | Separate `TEST_DATABASE_URL`, migration-based reset (Pitfall 10) |
| Status transitions | Stale UI after mutation | `revalidateTag('orders')` in every action (Pitfall 3) |
| Status transitions | Concurrent double-transition | Optimistic lock with `version` column (Pitfall 6) |
| Bulk import | File size limit | Route handler not server action, raise `bodySizeLimit` (Pitfall 4) |
| Bulk import | XLSX bundle on client | `import 'server-only'` on parser utility (Pitfall 13) |
| Real-time | SSE function timeout | Use polling for v2.0, defer Pusher (Pitfall 7) |
| Real-time | Poll interval too aggressive | 30s default, focused query for selected order (Pitfall 14) |
| URL state | Sync searchParams copy-paste | Async `await searchParams`, nuqs server cache (Pitfall 9) |
| Homepage promotion | Sidebar navigation context | `!pathname.startsWith('/demo/')` pattern (Pitfall 8) |
| Homepage promotion | Cache busting Coming Soon | New build auto-busts Full Route Cache (Pitfall 8) |
| Playwright E2E update | Tests fail with real DB state | Per-test DB reset, `TEST_DATABASE_URL` isolation (Pitfall 10) |
| Playwright E2E update | jest-axe + RSC incompatibility | RSC a11y via Playwright only (Pitfall 10) |
| RSC caching | `force-dynamic` on every page | Apply only to live-data pages; use `loading.tsx` (Pitfall 12) |

---

## "Looks Done But Isn't" Checklist

Cross-cutting items that appear complete but will surface as bugs in production:

- [ ] **DB connection:** `DATABASE_URL` uses pooled URL; `DATABASE_URL_UNPOOLED` set for migrations
- [ ] **DB client:** `import 'server-only'` at top of `lib/db.ts`
- [ ] **Schema:** `version INTEGER DEFAULT 1` on the orders table
- [ ] **Schema:** `clerk_user_id TEXT` on orders (no FK constraint to local users table)
- [ ] **Every server action that mutates:** calls `revalidateTag` or `revalidatePath`
- [ ] **Bulk import route:** uses API route handler (not server action) OR `bodySizeLimit` raised
- [ ] **XLSX parser:** wrapped in `server-only` file, not importable in client components
- [ ] **Real-time:** polling interval >= 30s OR Pusher with no long-running function invocations
- [ ] **`searchParams` access:** all new RSC pages use `await searchParams` (not synchronous)
- [ ] **nuqs server cache:** `createSearchParamsCache` used for server-rendered filter state
- [ ] **Migration discipline:** `drizzle-kit generate` + `migrate` used; `push` banned after day 1
- [ ] **Test DB:** `TEST_DATABASE_URL` points to isolated DB; E2E global setup resets state
- [ ] **Homepage promotion:** Sidebar uses `!pathname.startsWith('/demo/')` for production nav
- [ ] **Homepage promotion:** E2E test covers sign-in → `/` → dashboard flow end-to-end

---

## Sources

**Driver Compatibility:**
- [Drizzle with Vercel Edge Functions](https://orm.drizzle.team/docs/tutorials/drizzle-with-vercel-edge-functions)
- [pg vs postgres.js vs @neondatabase/serverless 2026](https://www.pkgpulse.com/guides/pg-vs-postgres-js-vs-neon-serverless-postgresql-drivers-2026)
- [Edge runtime timeout with drizzle and vercel postgres](https://github.com/vercel/next.js/issues/49918)

**Connection Pooling:**
- [Connecting to Neon from Vercel](https://neon.com/docs/guides/vercel-connection-methods)
- [Connection Pooling with Vercel Functions](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Neon Serverless Driver](https://neon.com/docs/serverless/serverless-driver)

**RSC Caching and Revalidation:**
- [Next.js revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Deep Dive: Caching and Revalidating](https://github.com/vercel/next.js/discussions/54075)
- [Client-side cache not revalidated when calling revalidatePath + redirect](https://github.com/vercel/next.js/issues/49450)

**Server Action Body Limit:**
- [Next.js serverActions config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- [How to bypass Vercel body size limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)
- [Next15 large file upload drops binary data](https://github.com/vercel/next.js/discussions/86985)

**Real-time / SSE:**
- [SSE Time Limits on Vercel](https://community.vercel.com/t/sse-time-limits/5954)
- [Configuring Maximum Duration for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/duration)

**Async Params / searchParams:**
- [Next.js 15 searchParams breaking change](https://dev.to/caisere/-nextjs-15-the-searchparams-breaking-change-you-need-to-know-about-1d97)
- [Dynamic APIs are Asynchronous](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [nuqs with Next.js 15](https://nuqs.dev/)

**Migrations and Testing:**
- [Drizzle migrations in production](https://budivoogt.com/blog/drizzle-migrations)
- [E2E Playwright tests with Neon branching](https://neon.com/guides/e2e-playwright-tests-with-neon-branching)
- [Database rollback strategies in Playwright](https://www.thegreenreport.blog/articles/database-rollback-strategies-in-playwright/database-rollback-strategies-in-playwright.html)

**Concurrency:**
- [Implementing optimistic locking in PostgreSQL](https://reintech.io/blog/implementing-optimistic-locking-postgresql)

---
*Pitfalls research for: CGM Dashboard v2.0 — Adding Postgres + Drizzle + Real-time to Next.js 15 + Clerk App*
*Researched: 2026-05-12*
