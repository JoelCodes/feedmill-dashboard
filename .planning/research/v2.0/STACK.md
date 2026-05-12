# Technology Stack — v2.0 Additions

**Project:** CGM Dashboard — Mill Production MVP
**Researched:** 2026-05-12
**Scope:** Additions only. Existing stack (Next.js 16.1.6, React 19.2.3, Tailwind CSS 4, Clerk v7,
TypeScript 5) is not re-evaluated here.

---

## Quick Decision Table

| Decision | Recommendation | Package | Version |
|---|---|---|---|
| Postgres provider | Neon | `@neondatabase/serverless` | 1.1.0 |
| ORM | Drizzle ORM | `drizzle-orm` | 0.45.2 |
| Migration tooling | drizzle-kit | `drizzle-kit` | 0.31.10 |
| XLSX/CSV parsing | read-excel-file | `read-excel-file` | 9.0.9 |
| Real-time | Polling (10s interval) | — built-in — | n/a |
| URL state | nuqs | `nuqs` | 2.8.9 |
| Form handling | React 19 `useActionState` | — built-in React 19 — | n/a |
| Validation | Zod | `zod` | 4.4.3 |

---

## Decision Rationale

### 1. Postgres Provider: Neon

**Recommendation: Neon via direct integration (not Vercel Marketplace)**

**Why Neon:**
- Vercel Postgres was deprecated in Q4 2024 and fully migrated to Neon by Q1 2025. There is no
  longer a distinct "Vercel Postgres" product — Vercel's marketplace offering IS Neon.
- `@neondatabase/serverless` 1.1.0 is the only Postgres driver that works in BOTH the Vercel Edge
  runtime (over HTTP/WebSocket) and the Node.js runtime. This is critical: standard `pg` / `postgres`
  drivers use TCP sockets, which are unavailable in the Edge runtime.
- Drizzle ORM's official tutorial for Next.js + Neon uses `drizzle-orm/neon-http` as the canonical
  path. The integration is officially documented and tested.
- Neon's serverless driver supports SQL over HTTP, which reduces cold-start latency to
  single-digit milliseconds from Vercel Functions (same-region). This matters for server actions
  triggered by operator status transitions.
- Neon's database branching creates a separate branch per Vercel Preview deployment automatically,
  enabling safe preview testing with isolated data.
- Scale-to-zero on the free tier means no idle database cost between shifts.

**Why not Supabase:**
- Supabase is a full BaaS platform (auth, storage, realtime, database). The project already has
  Clerk for auth and doesn't need Supabase Realtime (see Real-time section below). Paying for
  Supabase's full platform to use only Postgres is waste.
- Connection pooling via PgBouncer adds configuration complexity not needed at this scale.
- Supabase doesn't have first-class Vercel Preview branch integration.

**Why not raw Vercel Postgres (`@vercel/postgres`):**
- The package still exists (v0.10.0) but is now just a thin wrapper around the Neon serverless
  driver. Using `@neondatabase/serverless` directly avoids the indirection and keeps you on Neon's
  update cadence.

**Runtime recommendation: Node.js runtime (default), not Edge.**
The Edge runtime is appropriate for route handlers that must be geographically distributed and
latency-critical (e.g., auth redirects). For data mutations (status transitions, bulk import),
the Node.js runtime is correct: it has full `fs` access needed for file parsing, no API surface
restrictions, and 300s max duration on Hobby / 800s on Pro. The Neon HTTP driver works on both,
so there is no migration cost if specific route handlers are later promoted to Edge.

**Install:**
```bash
npm install @neondatabase/serverless
```

**Connection setup (`src/db/index.ts`):**
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });
```

**Sources:**
- Neon docs: https://neon.com/docs/guides/nextjs (HIGH confidence — official docs)
- Drizzle tutorial: https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon (HIGH confidence — official)
- Vercel Postgres transition: https://neon.com/docs/guides/vercel-postgres-transition-guide (HIGH confidence — official)

---

### 2. Drizzle ORM + drizzle-kit

**Recommendation: drizzle-orm 0.45.2 + drizzle-kit 0.31.10**

This was already decided. Confirming current versions and setup details.

**Why Drizzle over Prisma:**
- Drizzle is fully Edge-runtime compatible; Prisma requires a query engine binary incompatible
  with Edge and Vercel's bundle size limits.
- Drizzle's schema is TypeScript-first with no separate SDL schema file. The existing codebase
  is all TypeScript — Drizzle fits the convention.
- Drizzle generates raw SQL migrations (via drizzle-kit), making them inspectable and reviewable
  in PRs without a black-box migration engine.
- The Drizzle query builder is a thin layer over SQL. The existing mock services use
  `async function getProductionOrders()` returning arrays — Drizzle server queries drop in with
  the same async interface.
- `drizzle-orm/neon-http` is the Neon-specific subpackage; it uses the Neon HTTP driver
  directly with no extra configuration for serverless.

**Key packages:**
| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | 0.45.2 | ORM runtime + query builder |
| `drizzle-kit` | 0.31.10 | Schema migration CLI (dev dep) |
| `@neondatabase/serverless` | 1.1.0 | Neon HTTP/WebSocket driver |

**Install:**
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

**drizzle.config.ts:**
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Migration workflow:**
```bash
npx drizzle-kit generate    # generates SQL diff files in ./drizzle/
npx drizzle-kit migrate     # applies pending migrations to DATABASE_URL
```

**Edge runtime note:** `drizzle-orm/neon-http` (HTTP transport) is Edge-compatible.
`drizzle-orm/neon-serverless` (WebSocket transport, uses `Pool`) is Node.js only.
Use `neon-http` for all server actions and route handlers in this project.

**Sources:**
- https://orm.drizzle.team/docs/tutorials/drizzle-with-db/drizzle-with-neon (HIGH confidence — official)
- https://orm.drizzle.team/docs/tutorials/drizzle-on-the-edge/drizzle-with-vercel-edge-functions (HIGH confidence — official)

---

### 3. XLSX/CSV Parsing: read-excel-file

**Recommendation: `read-excel-file` 9.0.9**

**Why read-excel-file:**
- Actively maintained: version 9.0.9 published 2026-05-02 (10 days ago). This is the most
  recently updated Excel parsing library in the Node.js ecosystem.
- Works server-side in Node.js — can be called from Next.js server actions or route handlers
  directly with a `Buffer` or `Blob` from a multipart form upload.
- Parses to JSON with a typed schema (column mapping). The `Book1.xlsx` import use case is
  perfectly suited: fixed column names (Document Number, Line Code, Texture Type, Customer Name,
  Ordered Quantity, Farm Location Code, Early Delivery Date, Formula Type) map cleanly to a
  schema definition.
- No CDN tarball required — installs cleanly from npm registry.
- Much smaller than exceljs (~50KB vs ~2MB) — matters for Vercel bundle size limits.

**Why NOT SheetJS (xlsx npm package):**
- The npm registry version (0.18.5) contains high-severity vulnerability CVE-2023-30533
  (Prototype Pollution). The fix exists in 0.19.3+ but has NOT been published to the npm registry
  by SheetJS. Installing from `npm install xlsx` installs the vulnerable version.
- Installing from the SheetJS CDN tarball (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`)
  is a valid workaround but introduces supply chain risk (tarball served from third-party CDN,
  no integrity guarantees from npm lockfile hash semantics).
- SheetJS is appropriate for projects needing write support across many Excel formats.
  This project is import-only with a fixed schema — that power is unnecessary.

**Why NOT exceljs:**
- Last stable publish: 2023-10-19 (4.4.0). Nearly 2 years without a release.
- Pre-release 4.4.1-prerelease.0 published 2024-12-20 — not stable.
- Unmaintained for production use given the maintenance cadence.

**Install:**
```bash
npm install read-excel-file
```

**Server action usage pattern:**
```typescript
import readXlsxFile from 'read-excel-file/node';
// schema maps column headers to typed fields
const { rows, errors } = await readXlsxFile(buffer, { schema });
```

**CSV note:** The `Book1.xlsx` import is Excel-format only. If CSV support is needed later,
`papaparse` 5.5.3 is the standard (no security concerns, actively maintained). Do not add it
speculatively for v2.0 since the example data file is `.xlsx`.

**Sources:**
- https://github.com/catamphetamine/read-excel-file (MEDIUM confidence — GitHub, maintained)
- SheetJS vulnerability: https://git.sheetjs.com/sheetjs/sheetjs/issues/2961 (HIGH confidence — vendor issue tracker)
- npm info confirmed: read-excel-file 9.0.9 published 2026-05-02

---

### 4. Real-time: Polling (10-second interval)

**Recommendation: Client-side polling with `router.refresh()` or `revalidateTag`, not SSE**

**Why polling over SSE for this app:**

SSE is technically viable on Vercel (Node.js runtime, 300s max duration). The implementation
works. However, for a mill production dashboard the tradeoffs favor polling:

1. **Operator usage pattern:** Mill operators check the board periodically — they are not
   watching it tick-by-tick. A 10-second stale window is operationally acceptable. Orders
   move through Pending → Mixing → Completed on a timescale of minutes to hours.

2. **Complexity vs. benefit:** SSE requires a persistent Route Handler with streaming response,
   a client-side `EventSource` connection, and reconnect logic. It also cannot be used directly
   inside RSC — it needs a client component boundary with `useEffect`. Polling with
   `router.refresh()` or `revalidateTag` integrates naturally with the RSC data model.

3. **Vercel SSE constraint:** Edge runtime SSE cannot preserve connection state across
   requests (serverless cold-start model). Node.js runtime SSE can, but the 300s hard limit
   means the client must reconnect every 5 minutes regardless. The complexity of SSE without
   persistent connection semantics approaches that of polling.

4. **Next.js 16 `updateTag()` / `refresh()`:** The new Server Actions-only cache APIs in
   Next.js 16 (`updateTag`, `refresh`) are designed for exactly this pattern: a server action
   mutates data, calls `updateTag('production-orders')`, and the client sees updated data on
   next render. Status transition server actions call `updateTag` and the RSC tree
   re-fetches automatically.

**Implementation:**
```typescript
// Status transition server action
'use server';
import { updateTag } from 'next/cache';

export async function transitionOrderStatus(orderId: string, newState: string) {
  await db.update(productionOrders).set({ state: newState }).where(...);
  updateTag('production-orders'); // invalidates RSC cache, triggers refresh
}
```

**For cross-dashboard updates** (e.g., supervisor sees operator's status change):
Use 10-second polling via `startTransition` + `router.refresh()` in a client component. This
is 2-3 lines of code vs. a full SSE implementation.

**Upgrade path:** If v3.0 requires true sub-second realtime (e.g., a mixing-line display
on the factory floor), add Ably or Pusher at that point. Both integrate cleanly alongside
the existing RSC architecture.

**What NOT to add:**
- Pusher / Ably — premature for this workload and adds a paid third-party dependency
- Supabase Realtime — would require adopting the Supabase platform just for one feature
- WebSockets — Vercel does not support persistent WebSocket connections in serverless functions

**Sources:**
- Vercel Function limits: https://vercel.com/docs/functions/limitations (HIGH confidence — official)
- Next.js 16 `updateTag()`: https://nextjs.org/blog/next-16 (HIGH confidence — official release notes)

---

### 5. URL State Management: nuqs

**Recommendation: `nuqs` 2.8.9**

**Why nuqs:**
- Purpose-built for Next.js App Router URL query state. The `useQueryState` hook is the
  `useState` equivalent for URL params — type-safe, serialized, shareable.
- Version 2 adds `NuqsAdapter` (required for App Router / Next.js >= 14.2) and
  `createSearchParamsCache` for server components. This is exactly the v2.0 use case:
  filter state parsed server-side (for initial RSC render), then mutated client-side via
  `useQueryState` without full page navigations.
- `shallow: false` option triggers a server-side re-render when filter state changes — needed
  for server-fetched data (Postgres queries) to respond to filter changes.
- Supports `nuqs/server` `createSearchParamsCache` for reading URL params inside RSC without
  prop drilling.

**Why not raw `searchParams`:**
- `searchParams` is a Promise in Next.js 16 (async params requirement). Reading it
  requires `await` in every RSC that needs filter context. nuqs centralizes the parsing and
  type coercion.
- Updating `searchParams` from a client component requires manual `useRouter` + string
  serialization. nuqs handles serialization for dates, numbers, arrays, and custom types.

**Why not next-usequerystate:**
- `next-usequerystate` was the predecessor to nuqs (same author, same package — it was
  renamed). Current package name is `nuqs`.

**Setup: add NuqsAdapter to root layout:**
```typescript
// src/app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

**Install:**
```bash
npm install nuqs
```

**Sources:**
- https://nuqs.dev/docs/adapters (HIGH confidence — official docs via Context7)
- nuqs README: Next.js >= 14.2.0 required, confirmed compatible (HIGH confidence)

---

### 6. Form Handling: React 19 `useActionState`

**Recommendation: React 19 built-in `useActionState` — no additional library**

**Why `useActionState` over react-hook-form:**
- Status transitions (Pending → Mixing → Completed) are the primary "forms" in v2.0. These
  are simple 1-2 field state machines: an order ID and a new status value. There is no
  complex validation, no multi-step form, no conditional field logic. This is the exact use
  case `useActionState` was designed for.
- `useActionState` integrates directly with Next.js Server Actions — the form's `action`
  attribute receives the server action function. No client-side submission logic, no `fetch`,
  no serialization.
- The bulk import form (file upload) is also simple: one file input, submitted to a server
  action. `useActionState` handles the pending/error/success states.
- react-hook-form requires a client component boundary and a `onSubmit` + `fetch` pattern,
  which works against the RSC + server action architecture.

**Pattern for status transitions:**
```typescript
// Server action
'use server';
export async function updateOrderStatus(prevState: unknown, formData: FormData) {
  const orderId = formData.get('orderId') as string;
  const newState = formData.get('state') as string;
  await db.update(productionOrders).set({ state: newState }).where(eq(productionOrders.id, orderId));
  updateTag('production-orders');
  return { success: true };
}

// Client component
'use client';
import { useActionState } from 'react';
const [state, action, isPending] = useActionState(updateOrderStatus, null);
```

**Validation:** Use Zod inside the server action to validate the transition is legal
(e.g., Blocked cannot be set from Completed). Do NOT add Zod as a new dependency — it is
already the standard in the ecosystem and the recommendation is to add it as a dep now.

**What NOT to add:**
- `react-hook-form` — adds complexity without benefit for this pattern
- `conform` / `@conform-to/react` — useful for complex progressive-enhancement forms,
  overkill here
- `@hookform/resolvers` — unnecessary without react-hook-form

---

## Validation Library: Zod (Add as Dependency)

**Recommendation: Add `zod` 4.4.3 as a production dependency**

Zod is not currently in `package.json`. It should be added for:
1. Validating server action inputs (order ID format, state transition legality, import row shape)
2. Parsing `read-excel-file` schema output into typed `ProductionOrder` rows
3. Providing runtime type safety at the Postgres boundary

Zod 4.x has significant performance improvements over v3. There are no breaking changes for
basic use (object/string/number schemas). Add v4.

```bash
npm install zod
```

---

## What NOT to Add

| Package | Why Not |
|---|---|
| `@vercel/postgres` | Deprecated; just wraps `@neondatabase/serverless`. Use Neon directly. |
| `supabase-js` | Not needed — Clerk handles auth, polling handles realtime |
| `prisma` | Edge-runtime incompatible, binary query engine |
| `react-hook-form` | Overkill for status transition forms; `useActionState` is sufficient |
| `conform` / `@conform-to/react` | Same reason as react-hook-form |
| `pusher-js` / `ably` | Premature; polling is sufficient for shift-cadence updates |
| `exceljs` | Last stable release 2023; treat as unmaintained |
| `xlsx` (npm registry) | CVE-2023-30533 unpatched in npm version 0.18.5 |
| `papaparse` | Defer until CSV import is an explicit requirement; current example data is .xlsx |
| `ws` (WebSocket) | Not supported on Vercel serverless |
| `socket.io` | Not supported on Vercel serverless |
| `next-usequerystate` | Renamed to `nuqs` — same package |

---

## Integration Notes

### Next.js 16 Migration Flag: `middleware.ts` → `proxy.ts`

The existing `src/middleware.ts` (Clerk auth middleware) is **deprecated** in Next.js 16.
The file still works in 16.1.6 but will be removed in a future version. The rename to
`proxy.ts` (with the exported function renamed to `proxy`) is a straightforward 2-line change.

**Do not block v2.0 on this** — it is a deprecation warning, not a breaking change yet.
Schedule it as a housekeeping phase task.

**Clerk v7 compatibility:** `clerkMiddleware` from `@clerk/nextjs/server` is unaffected by
the rename. The logic is identical; only the filename and export name change.

### Runtime: Node.js (Default), Not Edge

All new v2.0 route handlers and server actions should use the default Node.js runtime.
Do NOT add `export const runtime = 'edge'` to any file that:
- Uses `read-excel-file` (requires Node.js Buffer/stream APIs)
- Accesses the filesystem for import uploads
- Uses Drizzle's `neon-http` driver (works on both, but neon-http over Node.js is simpler)

The Edge runtime adds restrictions (no `fs`, limited Node.js API surface) with negligible
latency benefit for database-backed server actions running in the same Vercel region as Neon.

### `searchParams` is Now a Promise (Next.js 16)

Next.js 16 requires `await searchParams` in page components (breaking change from 15).
nuqs's `createSearchParamsCache` handles this correctly in server components:

```typescript
// page.tsx
import { type SearchParams } from 'nuqs/server';
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { status, q } = await searchParamsCache.parse(searchParams);
  // ...
}
```

### Clerk JWT Session Claims — No Changes Needed

The v2.0 production pages (at `/`) will use the same `checkRole` / `requireRole` utilities
from v1.5. No Clerk changes are needed for the data layer. If a new `production` role is
introduced (distinct from `demo`), it reuses the existing `CustomJwtSessionClaims` interface
pattern — no library changes.

### Environment Variables to Add

```bash
# .env.local
DATABASE_URL=postgres://...@ep-...neon.tech/neondb?sslmode=require
```

---

## Full Install Command

```bash
# Production dependencies
npm install drizzle-orm @neondatabase/serverless nuqs zod read-excel-file

# Dev dependencies
npm install -D drizzle-kit
```

---

## Confidence Assessment

| Decision | Confidence | Basis |
|---|---|---|
| Neon as provider | HIGH | Official Neon + Drizzle docs; Vercel Postgres transition confirmed |
| Drizzle 0.45.2 + drizzle-kit 0.31.10 | HIGH | npm verified; official docs match |
| read-excel-file 9.0.9 | HIGH | npm verified; published 2026-05-02; SheetJS CVE confirmed |
| Polling over SSE | MEDIUM | Vercel limits confirmed; N16 `updateTag` confirmed; operator UX judgment |
| nuqs 2.8.9 | HIGH | npm verified; official docs via Context7; N16 async searchParams confirmed |
| useActionState (no library) | HIGH | Official React 19 docs; N16 server action docs |
| Zod 4.4.3 | HIGH | npm verified; no breaking change for basic schemas |
