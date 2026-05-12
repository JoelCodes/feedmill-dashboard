# Phase 28: Client Component Security Audit - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit every existing client component for compliance with server-side role enforcement, refactor `/demo/*` pages onto a canonical server-fetch pattern, and produce written guidelines that future work follows. When complete:

- All `/demo/*` page entry points are async Server Components that call `await requireRole('demo')` before fetching mock data and pass it as props to client children
- Middleware demo-role enforcement (Phase 25 ACCESS-01) is retained as the outer layer; page-level `requireRole` is the inner layer (defense-in-depth)
- `docs/security-patterns.md` documents the client-vs-server boundary, the `<Protect>` "UX-not-security" rule, and the localStorage exception, with an embedded audit findings table snapshot at the top
- No new `<Protect>` usage is introduced into the codebase yet — pattern is documented for use when a real role-conditional UI need arises
- Settings page stays unguarded beyond Clerk auth (user-preference UI, no role gating)

This phase **does not** add new product capabilities. It hardens existing routes and writes the rules of the road. Mock data is treated as canonical "sensitive" data for the purposes of the refactor, so the resulting pattern carries forward unchanged when real data lands.

</domain>

<decisions>
## Implementation Decisions

### Audit Depth and Refactor Scope
- **D-01:** Full refactor to server-fetch pattern for every `/demo/*` page. Each page becomes an async Server Component that: (a) calls `await requireRole('demo')`, (b) `await`s the mock-service fetch (`getOrders`, `getCustomers`, `getProductionOrders`), (c) renders a client child component with the data passed as props.
- **D-02:** Existing client components (`OrdersTable`, the customer-list UI, the mill-production UI) keep their interactivity (filters, search, selection, URL params) — they just receive data via props instead of fetching internally. New thin client wrappers are introduced only if the existing component cannot be cleanly adapted to accept-as-props.
- **D-03:** Audit findings are captured as a point-in-time inventory table at the top of `docs/security-patterns.md` (component → fetch site → status before/after). No separate `28-AUDIT.md` artifact; the findings live with the forward-looking guidance so future readers see both together.

### Guard Layering (Defense-in-Depth)
- **D-04:** Keep middleware demo-role enforcement (Phase 25 ACCESS-01) AS-IS — do not re-open that decision in this audit phase. Middleware redirects at the edge; the page-level `requireRole` is a redundant inner check in case middleware matcher coverage ever drifts.
- **D-05:** `requireRole('demo')` is added to every `/demo/*` page entry point (`/demo/orders/page.tsx`, `/demo/customers/page.tsx`, `/demo/customers/[id]/page.tsx`, `/demo/mill-production/page.tsx`). The `[id]` server component already exists — it gains `requireRole` but keeps its current `Promise.all` fetch shape.
- **D-06:** `/settings/page.tsx` is NOT given a `requireRole` guard. Settings is intentionally accessible to all authenticated users (NAV-02 / Phase 25 D-07); only Clerk `auth.protect()` from middleware applies. This is an explicit non-gap, documented in the guidelines doc.

### Sensitivity Classification (Forward-Looking Pattern)
- **D-07:** Mock data is treated as canonical "sensitive" for refactor purposes. The audit commits the codebase to "all `/demo/*` app data is server-fetched after a server-side role check, mock or real." Future phases that add real data follow this same shape — no exit ramp for client-side data fetching on `/demo/*`.
- **D-08:** `localStorage`-backed preferences in `/settings` are an **explicit exception** — they are browser-state, not data-loading, and remain client-side. The exception is documented in `docs/security-patterns.md` with the rule: "browser-local state (theme, density, UI preferences) is not 'data fetching' and may live in client components."

### Guidelines Deliverable
- **D-09:** Create `docs/security-patterns.md` as the single forward-looking reference. Sections (minimum):
  1. Audit findings table (per-page status: before / after / notes)
  2. The server-fetch pattern (with a code example mirroring `/demo/customers/[id]/page.tsx`)
  3. When to use `requireRole` vs `checkRole` vs middleware (decision table)
  4. `<Protect>` is UX, not security — with "do" / "don't" snippets and a link to `.planning/research/PITFALLS.md` Pitfall 6
  5. localStorage / browser-state exception (settings page example)
  6. How to onboard new pages: checklist for adding a `/demo/*` or other role-gated route
- **D-10:** No new `<Protect>` usage is added to the codebase. The guidelines doc shows the pattern with snippets only. A live `<Protect>` will be introduced by the first phase that has a genuine role-conditional UI need (not this audit).

### Claude's Discretion
- The exact split between "modify existing client component to accept data prop" vs "introduce thin client wrapper" is left to planning. Heuristic: if the existing component's only entanglement with the fetch is a single `useEffect` + `useState` pair, lift those out and accept data as a prop; if the component is deeply tied to its own loading/error states, introduce a wrapper.
- Loading-state handling during the server-fetch transition (e.g., whether each page gets a `loading.tsx`, or wraps the client child in `<Suspense>`) is a planning-level concern. The current orders page already uses `<Suspense>` for the `useSearchParams` boundary — that pattern can stay.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §Out of Scope — "Client-side role checking for security: security theater — always enforce server-side" (load-bearing constraint for this phase)
- `.planning/REQUIREMENTS.md` §v1.5 Requirements — ACCESS-02 (role utilities already complete in Phase 27)
- `.planning/ROADMAP.md` §Phase 28 — Success criteria (3 items: no client-side fetch of sensitive data, `<Protect>` usage documented, role-dependent loading in Server Components)

### Prior Phase Decisions (must carry forward)
- `.planning/phases/25-foundation-and-middleware-configuration/25-CONTEXT.md` — D-01 (redirect-to-root for role failure), D-02 (no logging), D-07 (settings accessible to all)
- `.planning/phases/26-route-restructuring-and-migration/26-CONTEXT.md` — D-07 (settings link visible in both contexts)
- `.planning/phases/27-role-assignment-and-testing/27-CONTEXT.md` — D-01/D-02/D-03 (`requireRole`/`checkRole` API), D-04 (session-claims source), D-10/D-11 (E2E coverage)

### Research (security-pattern guidance)
- `.planning/research/PITFALLS.md` §Pitfall 6 — `<Protect>` exposes data in browser source (the canonical "do not use as a security boundary" argument; `security-patterns.md` should link to and summarize this)
- `.planning/research/SUMMARY.md` §6 — Pattern summary for `<Protect>` misuse

### Existing Implementation (must integrate with)
- `src/lib/auth.ts` — `checkRole()` / `requireRole()` server-only utilities (already JSDoc'd; the new pages call these)
- `src/middleware.ts` — Demo-role middleware enforcement; do NOT modify in this phase
- `src/app/demo/orders/page.tsx` — Currently client; refactor target (becomes server, fetches via `getOrders`, passes to `OrdersTable`)
- `src/app/demo/customers/page.tsx` — Currently client with inline fetch + sort + search; refactor target
- `src/app/demo/customers/[id]/page.tsx` — Already an async server component; gains `requireRole` only
- `src/app/demo/mill-production/page.tsx` — Currently client; refactor target
- `src/components/OrdersTable.tsx` — Owns the `getOrders()` call inside `useEffect`; will accept `orders` as a prop after refactor
- `src/services/orders.ts`, `src/services/customers.ts`, `src/services/millProduction.ts` — Mock service surfaces called from the new server pages (no API changes expected)
- `src/app/settings/page.tsx` — Client component; remains unchanged (documented as the canonical browser-state exception)

### Docs to Create
- `docs/security-patterns.md` — New canonical security-patterns reference (see D-09 for required sections); embeds the per-component audit findings table at the top

### External (linked from the new doc, not required reading for planning)
- Clerk `<Protect>` component reference (the new doc links out; we do not depend on it during planning)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/auth.ts`: `requireRole('demo')` is the single call site for the new page guards — no new utility needed.
- `src/app/demo/customers/[id]/page.tsx`: Existing async Server Component with `Promise.all` parallel fetch — use this file as the canonical shape for the other `/demo/*` page refactors. Add `await requireRole('demo')` at the top.
- `OrdersTable` / mill-production / customers-list client UIs: All interactive surfaces already exist; the refactor lifts only the data acquisition step out, leaving filtering, sorting, search, URL-param sync, and selection intact.
- Mock services (`getOrders`, `getCustomers`, `getProductionOrders`, `getCustomerById`, `getOrdersByCustomerId`, `getActivityEvents`, `getBinsByCustomerId`): All return `Promise<...>` and are safely callable from a Server Component.

### Established Patterns
- **Server-fetch + client-render** (already in `[id]/page.tsx`): Async server page does the data acquisition, renders a client child with data props. Phase 28 generalizes this to every `/demo/*` page.
- **Defense-in-depth role enforcement**: Phase 25 already established middleware enforcement; Phase 28 adds the page-level layer. Both layers redirect to `/` for non-demo users — symmetric behavior, no surprises.
- **JSDoc-as-contract** (visible in `src/lib/auth.ts`): The new `docs/security-patterns.md` should reference and link to these JSDoc blocks rather than duplicating their content.
- **`<Suspense>` boundary for `useSearchParams`** (visible in `src/app/demo/orders/page.tsx`): Keep this boundary when the orders page becomes a Server Component — the client child still owns the URL-param-driven selection state.

### Integration Points
- Each `/demo/*` page becomes the boundary between server (data + role check) and client (interactivity). The refactor narrows the client surface to only what genuinely needs to be interactive.
- Tests for the refactored pages will mock `requireRole`/`auth` per the established `jest.mock('@clerk/nextjs/server')` pattern (see `src/middleware.test.ts`, `src/lib/auth.test.ts`) — no new mocking pattern required.
- Existing component-level tests for `OrdersTable` and the other client UIs will need their `(getOrders as jest.Mock)` shims migrated to "render with `orders` prop" assertions. This is a non-trivial slice of the test churn — flag during planning.

</code_context>

<specifics>
## Specific Ideas

- `docs/security-patterns.md` is the **single** new doc artifact for the phase. No separate `28-AUDIT.md`.
- Audit findings table format: rows for every `/demo/*` page + `/settings` + sign-in/sign-up; columns: `Path | Component type before | Component type after | Data fetch site before | Data fetch site after | Role guard | Notes`.
- The doc explicitly references PITFALLS.md Pitfall 6 (one-line pointer + the verbatim "Why" sentence) so the reasoning isn't repeated in two places.
- The "decision table" in section 3 of the doc covers exactly three rows: middleware (route-level enforcement, runs first), `requireRole` (page-level enforcement, defense-in-depth, redirects), `checkRole` (server-component conditional rendering, returns boolean, no redirect).
- Settings page is the worked example for the "browser-state exception" — naming it makes the rule less abstract.

</specifics>

<deferred>
## Deferred Ideas

- **Live `<Protect>` usage in the UI:** Documented as a pattern only; first real adoption deferred to a future phase that has a genuine role-conditional UI need (e.g., admin-only badge, demo-mode banner with role-specific copy). Not in v1.5 scope.
- **Removing middleware role check** (single-source-of-truth simplification): User chose defense-in-depth. If page-guard coverage proves consistently complete in a later milestone, revisit then. Not now.
- **Granular sensitivity tiers** (public summary stats vs sensitive detail): Considered but rejected — current mock data is uniformly treated as canonical "sensitive." Reopen if a future phase introduces genuinely public data that benefits from client-side fetching.
- **Programmatic audit (lint rule / CI check) that flags `'use client'` files importing data services:** Out of scope for this phase. The audit findings table is point-in-time; a CI rule could enforce it going forward, but that's a tooling phase, not a security phase.

</deferred>

---

*Phase: 28-Client Component Security Audit*
*Context gathered: 2026-05-11*
