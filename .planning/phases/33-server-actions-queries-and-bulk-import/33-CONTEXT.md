# Phase 33: Server Actions, Queries, and Bulk Import - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the **write side** of the v2.0 mill production data layer on top of the Phase 32 schema: typed query functions in `src/db/queries/` consumed by future Phase 34 RSCs, React 19 server actions in `src/actions/` for the four state transitions (Pending → Mixing → Completed plus Block/Resume) with optimistic-concurrency control via the `version` column, and the bulk XLSX import flow (parse → preview → commit) using `read-excel-file` 9.0.9.

**In scope:**
- `src/db/queries/orders.ts` — typed query functions consumed by Phase 34. At minimum: `getProductionOrders(filters?)`, `getOrderById(id)`. Functions are plain server-only async (no `'use server'`).
- `src/db/queries/events.ts` — typed query functions: `getOrderEvents(orderId)`. Used by Phase 34 detail panel.
- `src/actions/transitions.ts` — four named server actions:
  - `transitionToMixing(orderId, version)` (TRANS-01: Pending → Mixing)
  - `completeOrder(orderId, version)` (TRANS-02: Mixing → Completed)
  - `blockOrder(orderId, version, reason)` (TRANS-03: any active → Blocked; reason REQUIRED by TS)
  - `resumeFromBlocked(orderId, version, toState)` (TRANS-04: Blocked → Mixing or Pending)
- All four actions enforce `await requireRole('mill_operator')` (AUTH-02), execute the optimistic-concurrency `UPDATE … WHERE id = $id AND version = $version` (TRANS-06), insert an `order_events` row with `from_state`/`to_state`/`changed_by`/`changed_at`/`note` (TRANS-05), and call `revalidateTag('production-orders')` before returning (TRANS-07).
- `src/actions/import.ts` — two named server actions for XLSX bulk import:
  - `previewImportAction(file)` — parses, validates per-row with Zod, detects duplicates by `order_number`, returns the full per-row preview payload. NEVER writes to the DB. No `import_batches` row.
  - `commitImportAction(file, decisions)` — RE-PARSES the same file, re-validates, applies `decisions.skipRows` / `decisions.overwriteRows`, inserts row-by-row (partial-import allowed per IMPORT-04), writes one `import_batches` row on success.
- Zod schema `productionOrderImportSchema` co-located in `src/actions/import.ts` (or `src/actions/import-schema.ts`). Required: Document Number, Customer, Product, Weight, Mill Line, Early Delivery Date, Formula Type. Nullable: Texture Type, Line Code (matches Phase 32 D-12).
- Client-side file-size guard (≤ 2 MB) in the import form component (Phase 34 builds the actual form, but `import.ts` exports a `MAX_IMPORT_BYTES = 2 * 1024 * 1024` constant + server-side guard for defense-in-depth).
- `next.config.ts` `experimental.serverActions.bodySizeLimit: '2mb'` (IMPORT-07).
- `read-excel-file` 9.0.9 added as a dependency. **Banned:** `xlsx`/SheetJS (unpatched CVE-2023-30533).
- `zod` added as a dependency.
- Unit tests for actions and queries: action contracts (return shape + happy path + each failure code), Zod schema validation cases, the version-conflict path, the overwrite event-row pattern. Integration tests against a real Neon dev DB are recommended but optional (no CI Neon branch yet — same constraint as Phase 32).

**Out of scope (deferred to later phases):**
- Production dashboard UI — Phase 34. Phase 33 builds the action signatures; Phase 34 wires forms and buttons.
- KPI computation from DB data — Phase 35.
- Polling, `nuqs` URL state, status filter pills — Phase 34.
- Order details panel UI — Phase 34 (Phase 33 only ships `getOrderEvents` as the data source).
- Bulk import column-mapping UI for non-Book1.xlsx ERP exports — v2.1+ (IMPORT-FUT-01).
- Optimistic UI on transitions — v2.1+ (PROD-FUT-01).
- Undo last transition — v2.1+ (TRANS-FUT-01).
- `users` table sync mechanism (DATA-05 lazy upsert) — **flagged as ambiguous below**; Phase 33 implements only if needed for the actions; otherwise Phase 34 picks it up when display names are first rendered.
- Mill line reassignment UI — v2.1+ (imported orders default to Premix and cannot be moved in v2.0 — see D-15).

</domain>

<decisions>
## Implementation Decisions

### Action return shape & error UX

- **D-01:** Every server action returns a **discriminated union** `{ ok: true } | { ok: false, code, message }`. No `Promise<void>` + throw; no Error subclasses. React 19's `useActionState` consumes the result type directly and downstream UI bindings get full TypeScript narrowing.
- **D-02:** Error shape is a **tagged union** with five codes: `'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server'`. Each code maps to a deterministic UI surface in Phase 34 (`conflict` → inline banner; `unauthorized` → redirect to `/sign-in`; `validation` → form-level error list; `not_found` → toast; `server` → generic error toast). The `message` field carries a human-readable string. The `conflict` message string is locked: `"Order was modified by another user. Please refresh."` (TRANS-06).
- **D-03:** Optimistic-concurrency conflicts surface as an **inline red banner on the affected order card** with auto-`router.refresh()`. The action handler in Phase 34's client component detects `code === 'conflict'`, sets local card state to show the banner, calls `router.refresh()` to re-fetch fresh state. Operator doesn't lose their place; the page repaints with current data without intervention. No modal, no toast-only.
- **D-04:** Server action signatures use **one named export per transition** — `transitionToMixing(orderId, version)`, `completeOrder(orderId, version)`, `blockOrder(orderId, version, reason)`, `resumeFromBlocked(orderId, version, toState)`. The `reason` parameter on `blockOrder` is REQUIRED at the TypeScript signature level. No parameterized `transitionOrder(orderId, version, toState, note?)` mega-function. Self-documenting; UI buttons bind to discrete actions.

### XLSX preview/commit flow shape

- **D-05:** Two server actions: `previewImportAction(file)` and `commitImportAction(file, decisions)`. The commit action **re-parses the file** rather than referencing a server-side cached preview. Server is stateless; Vercel cold starts don't lose preview state; the same Zod validation pipeline runs on both passes; client re-uploads on commit (small file, fast).
- **D-06:** `previewImportAction` returns the **full per-row preview payload**: `{ summary: { rowCount, totalWeight, validCount, duplicateCount, errorCount }, rows: Array<{ rowIndex, ...allFields, isDuplicate, duplicateOf?, errors? }> }`. The UI (Phase 34) renders a full table with per-row Skip/Overwrite controls.
- **D-07:** `import_batches` row is written **only on successful commit**. Abandoned previews leave no trace. `row_count` records committed rows (not previewed rows). `file_name` from `file.name`, `imported_by` from Clerk user ID, `imported_at = now()`. Matches IMPORT-06 literal wording.
- **D-08:** Commit uses **per-row inserts with partial-import semantics** — a for-loop over validated rows; each `db.insert(productionOrders).values(row)` is its own statement; row-level failures are reported back to the client but valid rows commit. Matches IMPORT-04 ("partial import is allowed (valid rows commit, invalid rows reported)"). Also the correct path for the Neon HTTP driver — multi-statement transactions are not supported. NO switch to the Pool driver in Phase 33. The `import_batches` row is the final statement after the row loop completes (whether all rows succeeded or some failed).
- **D-09:** File size validation runs **both client-side and server-side**. Client checks `file.size > 2 * 1024 * 1024` on the input handler and rejects before submit (instant UX). Server action checks the same threshold and returns `{ ok: false, code: 'validation', message: 'File exceeds 2MB limit' }` if a >2MB file slips through. `next.config.ts` `serverActions.bodySizeLimit: '2mb'` is the third defense layer (returns 413 from Next.js before the action body even runs).

### Duplicate row handling semantics

- **D-10:** Duplicate detection uses `order_number` (Phase 32 `productionOrders.order_number` UNIQUE index). When the operator chooses **overwrite** for a duplicate, the action **UPDATEs** the existing row (preserves `id`, bumps `version`, replaces customer/product/weight/etc.) AND writes an `order_events` row to preserve the audit trail. No DELETE + INSERT (would cascade-destroy event history).
- **D-11:** The overwrite event row is structured as `{ order_id, from_state: <current state>, to_state: <current state>, changed_by: <operator>, changed_at: now(), note: '[OVERWRITE] batch_id=<batch_id>' }`. The `[OVERWRITE]` prefix in the note is the canonical marker Phase 34's timeline UI uses to distinguish overwrite events from state transitions. No schema change to `order_events` — the `from_state = to_state` shape uses the existing nullable/non-null columns as-is.
- **D-12:** The duplicate UI is a **per-row Skip/Overwrite radio** in the preview table. Default selection is Skip (safest). No batch "set all to X" toggle in v2.0 — keeps the UI shape simple; can add a top-row bulk control in v2.1+ if operator feedback demands it.
- **D-13:** Overwrite is **always allowed regardless of current state** (including `Mixing`). Operator is `mill_operator` role — trusted. Overwrite preserves state (the existing `state` value is not overwritten by the import; only the demographic/order fields are). Version is bumped so any concurrent transition action will conflict and refresh. No "are you sure" modal for mid-flight overwrites in v2.0.

### Row validation strategy

- **D-14:** Row validation uses **Zod schemas** via `z.object({...}).safeParse(row)`. Schema defined in `src/actions/import.ts` (or a sibling `import-schema.ts`). Output type matches the Drizzle `NewProductionOrder` insert shape. Zod becomes the project's canonical runtime-validation library for v2.0+ — no additional libraries (no `yup`, `joi`, etc.).
- **D-15:** Required columns (must be non-empty for the row to validate): **Document Number, Customer, Product, Weight (positive), Mill Line, Early Delivery Date, Formula Type**. Nullable columns: **Texture Type, Line Code** (matches Phase 32 D-12 — mock data has rows with missing texture_type). Rows missing any required column fail validation with a per-field error message; they appear in the preview with `errors: [...]` and are NOT committable (client should disable the Commit button if any required-column errors remain after skip decisions are applied, OR the server fails the commit with code: 'validation' for that row).
- **D-16:** Book1.xlsx has **no Mill Line column** — every imported row's `mill_line` defaults to `'Premix'`. This is acknowledged as a v2.0 limitation: imported orders cluster in the Premix column until v2.1+ adds a reassignment UI. The default is hardcoded in the import action; no derivation rule from Formula Type or species code (deferred — needs operator-validated mapping). The Premix-clustering is a visible artifact in dev/staging — flag for stakeholder review post-Phase 34 demo.

### Claude's Discretion
- **Whether to ship `relations()` declarations** for `productionOrders` ↔ `orderEvents` in Phase 33. Phase 32 D-86 deferred them to Phase 33. Recommended: ship them now since `getOrderEvents(orderId)` query joins through them. Planner decides based on whether the query uses `db.query.productionOrders.findFirst({ with: { events: true } })` or hand-written joins.
- **`users` table lazy-sync mechanism (DATA-05)**: Not asked in discussion. Two reasonable paths — (a) a helper called inside every server action (`await syncUserDisplay()` after auth check), (b) a separate `syncUser()` server action called from Phase 34 RSC root once per session via a cookie sentinel. Planner picks based on how Phase 34 wants to render display names. NEITHER is required for the transition actions to work — `changed_by` is the Clerk user ID, not the display name. Recommend deferring to Phase 34 if it's not needed for Phase 33 functionality.
- **Whether to insert a `from_state: null → to_state: 'Pending'` event on initial bulk-import insert** (NOT overwrite — first-time insert). Phase 32 D-18 explicitly rejected synthetic events in the seed. For import: arguably useful for timeline continuity ("this order entered the system on day X"). Recommend YES for imports, NO for seed — distinguish by `created_by !== 'system-seed'`.
- **Blocker reason capture UX in Phase 34**: out of Phase 33 scope, but the action signature `blockOrder(orderId, version, reason: string)` constrains what the form must collect. Recommend a modal with required textarea for v2.0; inline expanding row is acceptable. Phase 34's UI-SPEC.md should lock this.
- **Test coverage strategy for actions**: planner decides whether to use the same Neon dev DB (slow, accurate) or stub `@/db` for unit tests (fast, may diverge). Phase 32 chose JSON-fixture testing for schema modules and the same pattern can extend here.

### Folded Todos
None — `gsd-sdk query todo.match-phase 33` returned 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning (LOCKED requirements + roadmap)
- `.planning/ROADMAP.md` — Phase 33 goal + 5 success criteria. SC#1 (every transition writes order_events row) + SC#2 (optimistic concurrency message text) + SC#3 (Block + free-text reason + resume to Mixing or Pending) + SC#4 (revalidateTag mandatory) + SC#5 (preview screen + duplicates + 2MB rejection).
- `.planning/REQUIREMENTS.md` — v2.0 requirements TRANS-01..07 + IMPORT-01..07 are in scope. PROD-* and KPI-* are Phase 34+ — read for action-signature implications only.
- `.planning/PROJECT.md` — v2.0 milestone context, `roles[]` shape, deferred items, Out of Scope list (inline editing banned, drag-drop banned, etc.).
- `.planning/STATE.md` — pre-loaded v2.0 implementation notes (DB driver locked at `drizzle-orm/neon-http`, `revalidateTag('production-orders')` mandatory, `read-excel-file` 9.0.9 only, `xlsx`/SheetJS banned).

### Phase carry-forward (do not relitigate)
- `.planning/phases/32-schema-migrations-and-seed-data/32-CONTEXT.md` — locked schema decisions. D-04 (canonical `ProductionOrder` = Drizzle `$inferSelect`), D-08 (Drizzle `$onUpdate` for `updated_at`), D-09 (clerk_user_id text no FK), D-11 (`version int DEFAULT 1`), D-12 (numeric(10,2) for weight; texture_type/line_code NULLABLE), D-17 (TRUNCATE behavior — `users` is NEVER truncated).
- `.planning/phases/32-schema-migrations-and-seed-data/32-REVIEW-FIX.md` — D-86 deferred `relations()` to Phase 33. Note CR-02 carryover: `seed.ts` uses Neon HTTP without transactions; Phase 33's per-row insert pattern aligns with that constraint and does NOT switch to the Pool driver.
- `.planning/phases/31-role-expansion-and-db-infrastructure/31-CONTEXT.md` — locked Drizzle/Neon setup: D-06 (Neon project), D-07/D-08 (pooled DATABASE_URL for app, unpooled for migrations), D-10 (`import 'server-only'` line 1).

### Research (drives v2.0 implementation decisions)
- `.planning/research/v2.0/ARCHITECTURE.md` — **Decision 2** (mutation pattern = server actions, not route handlers), **Decision 3** (XLSX import flow shape — confirms 4.5MB Vercel limit is not a constraint), **Decision 5** (URL state — Phase 33 doesn't touch this; Phase 34 does), **Decision 7** (audit trail = separate `order_events` table, append-only).
- `.planning/research/v2.0/STACK.md` — `read-excel-file` 9.0.9 install + rationale, "what NOT to add" list.
- `.planning/research/v2.0/PITFALLS.md` — Edge driver leak; the Phase 33 actions/queries must NOT use `export const runtime = 'edge'`. Connection-exhaustion guidance.
- `.planning/research/v2.0/FEATURES.md` — TRANS-FUT-* and IMPORT-FUT-* differentiators; the Phase 33 action signatures must leave room for them (e.g., not bake-in an undo-incompatible shape).

### Code (existing patterns Phase 33 must align with)
- `src/db/index.ts` — Phase 31 Drizzle/Neon singleton with `import 'server-only'`. Phase 33 query and action modules import `{ db }` from here. Phase 33 does NOT modify this file.
- `src/db/schema/orders.ts` — `productionOrders` pgTable + `ProductionOrder` / `NewProductionOrder` inferred types. Source of truth for action input shapes (e.g., `weight_lbs` is `numeric` → TS `string`; client may pass a number but Zod converts and the row insert uses the string form).
- `src/db/schema/events.ts` — `orderEvents` pgTable. Every transition + overwrite action writes here.
- `src/db/schema/imports.ts` — `importBatches` pgTable. `commitImportAction` writes one row per successful commit.
- `src/db/schema/users.ts` — `users` pgTable. Phase 33 may NOT need to touch this — see Claude's Discretion above re: DATA-05 lazy sync.
- `src/lib/auth.ts` — `requireRole('mill_operator')` is the canonical guard inside every Phase 33 mutating action (AUTH-02). Read-only queries do NOT call requireRole (the page-level RSC guard handles it).
- `src/types/clerk.d.ts` — `Role` union already includes `'mill_operator'` (added in Phase 31).
- `src/services/millProduction.ts` — the mock service is unchanged by Phase 33. Demo namespace stays mock-backed; production at `/` (Phase 34) consumes the new `src/db/queries/orders.ts` functions.
- `next.config.ts` — Phase 33 must add `experimental.serverActions.bodySizeLimit: '2mb'` (verify Next.js 16 config-key shape during implementation; in Next.js 16 it may be top-level `serverActions.bodySizeLimit`).

### Security and discipline (LOCKED, do not relitigate)
- `docs/security-patterns.md` — §2 inner-guard pattern: every Phase 33 mutating action calls `await requireRole('mill_operator')` as the first line after `'use server'`. §1 audit findings table gets a new row when Phase 33 ships.
- `docs/clerk-setup.md` — `mill_operator` test user assignment runbook.
- `.env.example` — `DATABASE_URL` (pooled) used by the actions/queries. Phase 33 does NOT add new env vars.

### External docs (referenced during research/discussion)
- `read-excel-file` 9.0.9 API: https://www.npmjs.com/package/read-excel-file — `readXlsxFile(input, { schema })` signature for server-side parsing.
- Zod 3.x docs: https://zod.dev/ — `z.object().safeParse()` pattern, error structure.
- Drizzle optimistic concurrency pattern: https://orm.drizzle.team/docs/guides/optimistic-concurrency — confirms `UPDATE … WHERE id = $id AND version = $version` returns 0 rows when stale; check `result.rowCount` or returning clause.
- Next.js 16 server actions body size limit: https://nextjs.org/docs/app/api-reference/next-config-js/serverActions — verify config-key shape during implementation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Drizzle/Neon singleton** (`src/db/index.ts`): Phase 33 queries and actions import `{ db }` from here. No new client setup.
- **`requireRole` + `checkRole`** (`src/lib/auth.ts`): canonical guards. `requireRole('mill_operator')` throws `NEXT_REDIRECT` if the user is not authenticated as mill_operator. Caller does NOT need to `return` after. Used at top of every mutating action.
- **Phase 32 schema types**: `ProductionOrder` (Drizzle `$inferSelect`) and `NewProductionOrder` (`$inferInsert`) from `src/db/schema/orders.ts` are the canonical input/output types for Phase 33 queries and actions. `weight_lbs` is TS `string` (Drizzle `numeric` precision quirk — see Phase 32 32-REVIEW-FIX.md CR-01 JSDoc); Phase 33 actions accept numbers from the client (Zod coerces) and let Drizzle store the string form.
- **State machine enum**: `productionStateEnum` from `src/db/schema/orders.ts` (`Pending | Mixing | Completed | Blocked`). Phase 33 actions reference this for the directed-transition guard: `transitionToMixing` requires current state === 'Pending'; `completeOrder` requires current state === 'Mixing'; `blockOrder` requires current state ∈ {Pending, Mixing}; `resumeFromBlocked` requires current state === 'Blocked'. Out-of-order transitions return `{ ok: false, code: 'validation', message: '...' }`.

### Established Patterns
- **`import 'server-only'` discipline**: `src/db/*` and `src/actions/*` directories are server-only. Action files use `'use server'` directive (line 1). Query files (NOT 'use server') still depend on `src/db/index.ts` which has `import 'server-only'` — keeps them off the client bundle.
- **`revalidateTag('production-orders')` mandatory** (STATE.md mutation invariant): every action that writes to `production_orders` or `order_events` calls `revalidateTag('production-orders')` BEFORE returning. The corresponding `getProductionOrders` query in `src/db/queries/orders.ts` is wrapped in `unstable_cache(...)` with that tag. Phase 34's RSC page consumes the cached query.
- **Connection-pooled URL for app queries**: `DATABASE_URL` (pooled `-pooler.neon.tech`) is what `src/db/index.ts` uses. Phase 33 queries and actions inherit this. No raw unpooled connections in app code.

### Integration Points
- `src/actions/transitions.ts` — NEW file. Four named exports. Each is a `'use server'` async function returning the discriminated union.
- `src/actions/import.ts` — NEW file. Two named exports (`previewImportAction`, `commitImportAction`). `MAX_IMPORT_BYTES` constant exported for client-side guard.
- `src/db/queries/orders.ts` — NEW file. `getProductionOrders(filters?)`, `getOrderById(id)`. Wrapped in `unstable_cache` with `tags: ['production-orders']` and a reasonable `revalidate` window (planner picks — likely 30s to match the polling interval, or `false` to rely on tag revalidation only).
- `src/db/queries/events.ts` — NEW file. `getOrderEvents(orderId)`. Same `unstable_cache` pattern. Phase 34 timeline UI consumes this.
- `next.config.ts` — add `experimental.serverActions.bodySizeLimit: '2mb'` (IMPORT-07).
- `package.json` — add `read-excel-file@9.0.9` and `zod@^3.x` (latest 3.x; verify against Next.js 16 compatibility during implementation).
- `src/db/schema/orders.ts` — MAY be modified to add Drizzle `relations()` declaration for `productionOrders` → `orderEvents` if `db.query.productionOrders.findMany({ with: { events: true } })` is used. Planner's call.

### Build-time risks Phase 33 must surface
- **Edge runtime contamination**: server actions and queries import `src/db/index.ts` which is `server-only`. Any client component that accidentally imports an action by name (forgetting `'use server'` directive flow) will throw a build error. Net positive — surfaces leaks early.
- **`numeric` ↔ `number` coercion**: Phase 32 32-REVIEW-FIX.md CR-01 JSDoc documents that Drizzle `numeric` columns return TS `string`. The Zod schema should accept a number from XLSX input (via `z.number().positive()`) but the insert payload must use the string-or-number form Drizzle expects. Verify the Zod-to-Drizzle bridge during implementation (likely `weightLbs: parsedRow.weightLbs.toString()`).
- **`revalidateTag('production-orders')` cache topology**: Phase 33 actions call `revalidateTag`; Phase 34's `unstable_cache(...)` wrappers must use the same tag string. Pre-commit checklist: grep for `'production-orders'` across the codebase before merging — drift breaks the cache invalidation contract.
- **Per-row insert performance**: 500-row commits run 500 sequential HTTP POSTs against Neon. ~50ms each → ~25s for 500 rows. Vercel function default timeout is 300s on Fluid Compute (per ARCHITECTURE.md), so within budget. For larger imports (1000+ rows), a batched-per-N-rows insert may be needed — defer until measured.
- **Date parsing from XLSX**: `read-excel-file` returns Date objects for date cells. `Early Delivery Date` in Book1.xlsx is a date column; Phase 33 must parse to ISO string for storage in the `delivery_time` text column OR introduce a new `delivery_date` date column (NOT in Phase 32 schema — would require a Phase 32 schema amendment). Recommend storing as ISO date string in `delivery_time` for v2.0; revisit when KPI-08 (orders past earlyDeliveryDate) lands in Phase 35.
- **Duplicate detection within a single upload**: if the SAME `order_number` appears twice in one file, the duplicate-detection logic must catch the intra-file collision in addition to file-vs-DB collisions. Preview marks the second occurrence with `isDuplicate: true, duplicateOf: 'intra-file row N'`. Commit's per-row loop would otherwise fail the second insert on the UNIQUE constraint at runtime — handled, but the preview should surface it first.

</code_context>

<specifics>
## Specific Ideas

- **The directed state machine is non-negotiable.** PROJECT.md Out of Scope lists "Status dropdown (arbitrary state assignment) — Breaks directed state machine. Only directed transition buttons; no free-form state writes." Phase 33 action signatures encode this — there's no `setOrderState(orderId, anyState)`. Each transition is its own named export with the from→to pair hard-coded.
- **The conflict message text is locked: `"Order was modified by another user. Please refresh."`** Phase 33 action returns that exact string in `{ code: 'conflict', message: ... }`. Phase 34 UI displays it verbatim. Translation/rewording requires a roadmap change.
- **Per-row UI control in import preview**: each duplicate gets a discrete Skip/Overwrite radio. No batch "set all" in v2.0. The operator's intent is to make per-row decisions when reconciling ERP discrepancies; collapsing to a global toggle hides the decision surface they need.
- **Mill Line clusters in Premix.** Acknowledged limitation. All imported orders default to `'Premix'`. Operators viewing the production dashboard at `/` will see Premix grow disproportionately. Stakeholder review post-Phase 34 demo will decide whether to (a) ship the v2.1 reassignment UI sooner, (b) add a derivation heuristic from Formula Type, or (c) live with the visible clustering as a v2.0 trade-off.
- **`mill_operator` role gates writes only** (AUTH-02 + AUTH-03). Read queries do NOT call `requireRole` — `/`-level RSC guard handles authentication. Any authenticated user can READ; only `mill_operator` can WRITE. Phase 33 must not add `requireRole('mill_operator')` to `getProductionOrders` or `getOrderEvents`.

</specifics>

<deferred>
## Deferred Ideas

- **Mill line reassignment UI** (v2.1+) — operators currently cannot move an imported order from Premix to Excel/CGM. Imports default to Premix and stay there. Track the user-visible clustering after Phase 34 demo to prioritize.
- **Mill line derivation rule** from XLSX Formula Type column (v2.1+) — requires operator-validated mapping table; deferred to avoid baking in a wrong heuristic.
- **Column-mapping UI** for ERP variants not matching Book1.xlsx (IMPORT-FUT-01, v2.1+).
- **Undo last transition** within 5-minute window (TRANS-FUT-01, v2.1+).
- **Optimistic UI update** on transition (instant card move, revert on error) (PROD-FUT-01, v2.1+).
- **Batch "set all duplicates to X"** toggle in import preview (v2.1+ if operator feedback demands).
- **`users` table lazy-sync mechanism** (DATA-05) — Phase 33 ships actions that record `changed_by` as the Clerk user ID directly; display-name sync is not required for action functionality. Phase 34 picks this up when display names are first rendered, OR Phase 33 planner may choose to bundle it for completeness.
- **`from_state: null → to_state: 'Pending'` initial event row** for newly-inserted production_orders (NOT overwrites) — Claude's Discretion above leans YES for bulk imports, NO for seed; planner finalizes.
- **Drizzle `relations()` declarations** (carried forward from Phase 32 D-86) — planner decides whether to introduce them in Phase 33 alongside `getOrderEvents` join.
- **`delivery_date` typed column** to replace the text `delivery_time` for KPI-08 (orders past earlyDeliveryDate). Would require a Phase 32 schema amendment — defer to Phase 35 when the KPI actually lands.

</deferred>

---

*Phase: 33-server-actions-queries-and-bulk-import*
*Context gathered: 2026-05-13*
