# Phase 33: Server Actions, Queries, and Bulk Import - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 33-server-actions-queries-and-bulk-import
**Areas discussed:** Action return shape & error UX, XLSX preview/commit flow shape, Duplicate row handling semantics, Row validation strategy

---

## Action return shape & error UX

### Q1: When a transition action succeeds, what should it return to the client?

| Option | Description | Selected |
|--------|-------------|----------|
| Discriminated union { ok: true } \| { ok: false, ... } | Type-safe pattern that forces every call site to handle errors. TypeScript narrows on `result.ok`. Pairs with React 19 useActionState. | ✓ |
| Plain Promise<void> + throw on error | Returns nothing on success; throws on failure. Simpler signatures but every UI binding needs try/catch. | |
| Return updated order on success { ok: true, order } | Returns the fresh row including new version. Slightly fatter payload; useful for optimistic UI later. | |

**Notes:** Standard React 19 server-action shape. Forces explicit error handling at every call site.

### Q2: On error, how granular should the failure code be?

| Option | Description | Selected |
|--------|-------------|----------|
| Tagged union with code field | { ok: false, code: 'conflict' \| 'unauthorized' \| 'validation' \| 'not_found' \| 'server', message: string }. UI matches on code. | ✓ |
| Boolean + message only | { ok: false, message: string }. UI parses the message or shows a generic toast. Brittle when messages get rewritten. | |
| Throw typed errors, catch in client | Idiomatic Node but doesn't compose with React 19's action result type inference. | |

**Notes:** Five codes cover the realistic failure surface. New codes can be added without breaking existing call sites.

### Q3: How should the optimistic-concurrency conflict (TRANS-06) appear to the operator?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline banner on the affected order card + auto-refetch | When { code: 'conflict' } returns, the card flashes a red banner with the locked text and the handler calls router.refresh() automatically. Operator doesn't lose place. | ✓ |
| Modal dialog blocking the page | Full-screen modal with OK to refresh. Heavy-handed for a mill floor dashboard. | |
| Toast notification only, no auto-refetch | Toast appears; operator manually refreshes. Leaves stale data on screen. | |

**Notes:** Locked conflict message text: `"Order was modified by another user. Please refresh."` (TRANS-06).

### Q4: How should the server action signatures be shaped — one action per transition or one parameterized action?

| Option | Description | Selected |
|--------|-------------|----------|
| One action per transition | transitionToMixing, completeOrder, blockOrder, resumeFromBlocked. Required params enforced by TypeScript (block REQUIRES reason). | ✓ |
| Single parameterized action transitionOrder(orderId, version, toState, note?) | Fewer lines; required-param invariants move from TS to runtime. | |
| Hybrid — parameterized core + named convenience wrappers | Best of both at the cost of two layers of indirection. | |

**Notes:** Maps cleanly to per-button bindings in Phase 34 UI; self-documenting; testable in isolation.

---

## XLSX preview/commit flow shape

### Q1: How should the parse → preview → commit flow be structured on the server?

| Option | Description | Selected |
|--------|-------------|----------|
| Two actions; commit re-parses the file | previewImportAction(file) returns preview; commitImportAction(file, decisions) re-parses and inserts. Stateless server; immune to stale-cache bugs. | ✓ |
| Single action with dry-run flag | importAction(file, { dryRun: true \| false, decisions? }). One export; mixes two responsibilities. | |
| Server-cached intermediate state (token-based) | Stash parsed rows in a server cache keyed by token. Saves one re-parse; introduces state, TTL, cleanup. Vercel functions stateless — in-memory map won't survive cold starts. | |

**Notes:** Re-parsing a < 2MB XLSX is fast (< 100ms typical). The simplicity gain is worth the trivial cost.

### Q2: What does the preview action return for each row?

| Option | Description | Selected |
|--------|-------------|----------|
| Full per-row data + duplicate/error flags | rows: Array<{ rowIndex, ...all fields, isDuplicate, duplicateOf, errors }>. Client renders full table with per-row toggles. | ✓ |
| Summary + only-problematic rows | { summary, problematicRows }. Smaller payload; operator can't review valid rows. | |
| Summary + duplicate indices only | Just counts and indices; operator can't inspect details without follow-up requests. | |

**Notes:** Matches IMPORT-03 "preview screen shows row count, total weight, and duplicates" — the operator needs to see the data, not just counts.

### Q3: Where does the import_batches row get inserted?

| Option | Description | Selected |
|--------|-------------|----------|
| Only on successful commit | row_count = committed rows. Abandoned previews leave no trace. Matches IMPORT-06 "Confirmed imports recorded." | ✓ |
| On every preview, with a status column | status: 'previewed' \| 'committed' \| 'abandoned'. Requires a schema change in Phase 33 (column not in Phase 32 D-04). | |
| On commit + separate import_attempts table | Two tables, more rigor. Premature — no requirement demands auditable previews. | |

**Notes:** Schema stays frozen; history surface stays clean.

### Q4: Should the commit run inside a single DB transaction, or row-by-row with partial-import semantics?

| Option | Description | Selected |
|--------|-------------|----------|
| Per-row inserts; partial import allowed | for-loop over rows; each insert independent. Matches IMPORT-04 "partial import allowed" AND Neon HTTP driver's lack of multi-statement transactions. | ✓ |
| All-or-nothing transaction | Requires Pool driver switch (Phase 32 CR-02 review flagged). Contradicts IMPORT-04. | |
| Single batch insert + import_batches in one HTTP call; no transaction | One bad row rejects the whole batch — worse than per-row. | |

**Notes:** Aligns with the Neon HTTP driver constraint Phase 32's review surfaced.

### Q5: Where does file size validation happen — client-side, server-side, or both?

| Option | Description | Selected |
|--------|-------------|----------|
| Both — client first, server as defense-in-depth | Client rejects > 2MB before submit (UX); server-action guard catches tampering or older browsers. 2MB locked by IMPORT-07. | ✓ |
| Server-side only | Trust next.config.ts + action guard. Worse UX (operator sees error after upload). | |
| Client-side only | No server check. Bypassable; defense-in-depth gap. | |

**Notes:** Three layers — client guard, server-action guard, next.config.ts bodySizeLimit.

---

## Duplicate row handling semantics

### Q1: When the operator chooses 'overwrite' for a duplicate Document Number, what should happen on the DB side?

| Option | Description | Selected |
|--------|-------------|----------|
| UPDATE existing row + write an order_events 'overwrite' row | Same row, version bumped, fields replaced. Event row records who/when/which batch. Preserves audit trail. | ✓ |
| UPDATE existing row, no event log entry | Simpler; loses per-order audit signal. import_batches alone is the audit. | |
| DELETE existing + INSERT new (cascade clears events) | ON DELETE CASCADE destroys event history. NOT recommended. | |

**Notes:** Preserves order timeline continuity. The overwrite is auditable at both the order level (event row) and the batch level (import_batches row).

### Q2: How should the overwrite event row be structured?

| Option | Description | Selected |
|--------|-------------|----------|
| from_state = to_state = current state, note = '[OVERWRITE] batch_id=...' | No schema change. The note prefix lets timeline UI distinguish overwrite rows. | ✓ |
| Add event_type column to order_events | Cleanest semantically; requires a schema migration. Expands Phase 33 scope. | |
| Don't write an event row; rely on import_batches + an overwritten_by_batch_id column on production_orders | Loses chronological visibility in the order timeline; also requires a schema change. | |

**Notes:** Pragmatic — schema frozen, audit preserved, timeline UI can filter by `note.startsWith('[OVERWRITE]')` in Phase 34.

### Q3: What's the per-row duplicate UI?

| Option | Description | Selected |
|--------|-------------|----------|
| Per-row Skip/Overwrite radio in the preview table | Each duplicate shows discrete radios, default Skip. Matches IMPORT-05 "duplicates flagged in preview with user choice to skip or overwrite per row" literal. | ✓ |
| Batch toggle + per-row override expander | Top-of-preview "Apply to all" sets a default; per-row override available in collapsed UI. | |
| Two-step — first choose batch policy, then per-row exception screen | Two screens; minimizes UI complexity for the common case but adds a screen. | |

**Notes:** v2.1+ can add a batch toggle on top of the per-row controls if operators ask. Per-row is the right primitive.

### Q4: What happens when an overwrite-target row is mid-flight (state = Mixing)?

| Option | Description | Selected |
|--------|-------------|----------|
| Always allowed; overwrite preserves current state | Overwrite updates demographic fields but NOT state. Version bumped → concurrent transition conflicts and refreshes. Trusts the operator. | ✓ |
| Blocked for in-progress states | If state ∈ {Mixing}, the row is marked "cannot overwrite." Protects in-flight production. | |
| Allowed but with a confirmation modal | Two-step trust-but-verify. | |

**Notes:** mill_operator role is trusted; state is preserved (not overwritten); version-bump triggers any in-flight transition action to conflict naturally.

---

## Row validation strategy

### Q1: Which validation library / approach should drive row-level validation?

| Option | Description | Selected |
|--------|-------------|----------|
| Zod schema | z.object + safeParse. Composable, ~8KB gzipped. Industry standard for v2.0-era TypeScript apps. | ✓ |
| Hand-rolled validators (zero new deps) | No dependency; ~150 LOC; reinvents Zod's error structure. Brittle if schema evolves. | |
| read-excel-file built-in schema | Couples parsing and validation. Less idiomatic in a Drizzle/zod TS app. | |

**Notes:** Zod becomes the project's canonical runtime-validation library for v2.0+. No other validators introduced.

### Q2: Which Book1.xlsx columns are STRICTLY REQUIRED? (initially multi-select; user picked two conflicting options, resolved below)

**Initial selection:** "Document Number, Customer, Product, Weight, Mill Line (Recommended)" AND "All eight Book1.xlsx columns" (conflicting — first is a subset of second).

**Follow-up clarification:** Asked which strictness the user actually wanted.

| Option | Description | Selected |
|--------|-------------|----------|
| All 8 required (strictest) | Every cell non-empty. Rejects rows with missing Texture Type / Line Code — conflicts with Phase 32 D-12. | |
| 5 + Date + Formula (middle path) | Required: Document Number, Customer, Product, Weight, Mill Line, Early Delivery Date, Formula Type. Nullable: Texture Type, Line Code. Honors Phase 32 schema. | ✓ |
| 5 only (original recommendation) | Most permissive. Texture, Line Code, Date, Formula all nullable. | |

**Notes:** Aligns with Phase 32 D-12 (Texture Type and Line Code nullable in the schema). Adds Date + Formula as required so KPI-08 (orders past earlyDeliveryDate) has the data it needs in Phase 35.

### Q3: Book1.xlsx has no 'Mill Line' column — how should mill_line be derived?

| Option | Description | Selected |
|--------|-------------|----------|
| Default all imports to 'Premix' + operator edits via Phase 34 detail panel | Simplest; honest about the data. (Note: Phase 34 panel is read-only — flagged below.) | ✓ (with caveat) |
| Derive from Formula Type prefix | Hardcoded mapping table; brittle without operator-validated rule. | |
| Add a Mill Line column to the import schema | Forces operator + ERP team coordination. Conflicts with Book1.xlsx fixed-format (OQ-3). | |
| Prompt the operator for a per-row Mill Line during preview | Most accurate; slowest UX for 500-row imports. | |

**Notes:** Caveat raised: Phase 34's detail panel is read-only per PROD-05; PROJECT.md keeps "inline editing of orders" out of scope. With "default to Premix," imported orders cluster in Premix until v2.1+ adds a reassignment UI.

### Q3-follow-up: Reconsider given Phase 34 has no edit affordances?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 'default to Premix' — accept imported orders cluster in Premix | Honest about current capability. User-visible artifact (Premix grows disproportionately). | ✓ |
| Per-row Mill Line dropdown in preview UI | Operator overrides per row before commit. Most accurate; no Phase 34 dependency. | |
| Derive from Formula Type prefix (heuristic) | Pick now; brittle. | |

**Notes:** User accepted the v2.0 limitation. Flag for stakeholder review after Phase 34 demo — may prioritize v2.1 reassignment UI.

---

## Claude's Discretion

Areas where the planner has flexibility (captured in CONTEXT.md `<decisions>` "Claude's Discretion" section):

1. **Whether to ship Drizzle `relations()` declarations in Phase 33** — Phase 32 deferred them; planner decides based on `getOrderEvents` query shape.
2. **`users` table lazy-sync mechanism (DATA-05)** — not asked in discussion. Two reasonable paths (action wrapper vs. Phase 34 session-sync). Recommend deferring to Phase 34 if not needed for Phase 33 actions.
3. **Whether to insert a `from_state: null → to_state: 'Pending'` event row on initial bulk-import insert** — Phase 32 D-18 rejected synthetic events in seed; planner picks whether import follows the same rule or generates an entry-event for timeline continuity.
4. **Blocker reason capture UX in Phase 34** — Phase 33 only constrains the action signature; Phase 34 UI-SPEC.md picks modal vs. inline.
5. **Test coverage strategy** — Neon dev DB vs. stubbed `@/db` for unit tests.

## Deferred Ideas

- Mill line reassignment UI (v2.1+) — operators can't move imported orders out of Premix until then.
- Mill line derivation rule from Formula Type column (v2.1+).
- Column-mapping UI for non-Book1.xlsx ERP exports (IMPORT-FUT-01, v2.1+).
- Undo last transition within 5 min window (TRANS-FUT-01, v2.1+).
- Optimistic UI update on transition (PROD-FUT-01, v2.1+).
- Batch "set all duplicates to X" toggle in import preview (v2.1+).
- `users` table lazy-sync mechanism (DATA-05) — defer to Phase 34 if not needed for Phase 33.
- `from_state: null → to_state: 'Pending'` initial event row on import — planner decides.
- Drizzle `relations()` declarations — planner decides.
- `delivery_date` typed column to replace text `delivery_time` — defer to Phase 35 (KPI-08).
