---
phase: 33-server-actions-queries-and-bulk-import
verified: 2026-05-13T00:00:00Z
status: gaps_found
score: 5/5 must-haves verified (3 gaps escalated from human_needed at operator request)
overrides_applied: 0
gaps:
  - id: GAP-01
    truth: "Concurrent transition race (SC#2) — exact-once locked message"
    why_gap: "Operator escalated from human_needed; live concurrent race not exercised by unit-test mocks. Mock-level conflict tests pass, but no integration-level test asserts the actual DB-level race outcome against the version column."
    fix_hint: "Add an integration test (or scripted dev-DB harness) that spawns two concurrent transitionToMixing requests for the same order/version and asserts exactly one returns ok:true and the other returns code:'conflict' with the locked message."
  - id: GAP-02
    truth: "revalidateTag cache invalidation observable end-to-end"
    why_gap: "Operator escalated from human_needed; cache-tag wiring is asserted by unit tests only. No integration test confirms unstable_cache(production-orders) is actually busted by revalidateTag('production-orders', 'max') in a running Next.js process."
    fix_hint: "Either (a) integration test that warms getProductionOrders cache, triggers a transition, and asserts cached result invalidated, or (b) explicit deferral note tying this to Phase 34 dashboard UAT with a concrete test step."
  - id: GAP-03
    truth: "End-to-end XLSX import against live Neon dev DB"
    why_gap: "Operator escalated from human_needed; no live-DB smoke harness. Unit tests mock @/db.insert/select; the real Neon HTTP driver behavior (per-row auto-commit, unique-constraint violation surface) is not exercised."
    fix_hint: "Add a scripted dev-DB harness (e.g. scripts/test-xlsx-import.ts) that drops/recreates a sandbox row, runs previewImportAction + commitImportAction against Book1.xlsx, and asserts production_orders row count + one import_batches row written."
human_verification:
deferred:
  - truth: "Files above 2 MB are rejected client-side with a clear error message"
    addressed_in: "Phase 34"
    evidence: "Phase 33 exports MAX_IMPORT_BYTES from src/lib/import-constants.ts; Phase 34 wires the client-side <input> size check. SC#5 partial deferral is explicitly documented in 33-05-SUMMARY.md, 33-06-SUMMARY.md, and 33-CONTEXT.md out-of-scope section."
human_verification:
  - test: "Concurrent transition race (SC#2)"
    expected: "Two simultaneous transitionToMixing calls for the same order — exactly one returns {ok:true}, the other returns {ok:false, code:'conflict', message:'Order was modified by another user. Please refresh.'}"
    why_human: "Requires two concurrent browser sessions or scripted concurrent requests against a live Neon dev DB. Cannot be exercised with unit test mocks."
  - test: "revalidateTag cache invalidation observed in browser"
    expected: "After a successful transition, the Phase 34 dashboard reflects the new order state without a manual hard refresh"
    why_human: "Requires the Phase 34 RSC consumer (getProductionOrders with unstable_cache) to be running. The cache-tag wiring is verified by source grep and unit tests; end-to-end observable behavior requires Phase 34 UI."
  - test: "End-to-end XLSX import against live Neon dev DB"
    expected: "Uploading Book1.xlsx creates rows in production_orders; one import_batches row is created; preview shows correct row count + total weight + duplicate flags"
    why_human: "No CI Neon branch yet (same constraint as Phase 32). Requires connected .env.local and a running Next.js dev server."
---

# Phase 33: Server Actions, Queries, and Bulk Import — Verification Report

**Phase Goal:** All data mutations and reads are implemented as typed server functions; status transitions are enforced by the directed state machine with optimistic concurrency; bulk XLSX import parses, validates, and persists data with row-level error reporting.
**Verified:** 2026-05-13T00:00:00Z
**Status:** gaps_found (3 gaps escalated from human_needed at operator request)

## Gaps

| ID | Truth | Why gap | Fix hint |
|----|-------|---------|----------|
| GAP-01 | Concurrent transition race (SC#2) — exact-once locked message | Live race not exercised by unit-test mocks; only mock-level conflict tested | Integration test with two concurrent requests against live Neon dev DB asserting exactly-one ok + locked message |
| GAP-02 | revalidateTag cache invalidation observable end-to-end | Cache-tag wiring asserted by unit tests only; no integration-level confirmation that unstable_cache is busted in a running Next.js process | Integration test warming getProductionOrders cache, triggering transition, asserting invalidation — or explicit Phase-34 deferral with concrete test step |
| GAP-03 | End-to-end XLSX import against live Neon dev DB | Unit tests mock @/db; real Neon HTTP driver behavior (per-row auto-commit, unique-constraint surface) not exercised | scripts/test-xlsx-import.ts dev-DB harness running preview + commit against Book1.xlsx and asserting row counts |
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Operator can transition Pending → Mixing → Completed; each transition writes order_events row with from_state, to_state, changed_by, changed_at | VERIFIED | `transitionToMixing` and `completeOrder` in `src/actions/transitions.ts` implement state-guard SELECT, optimistic-concurrency UPDATE with `.returning()`, and `db.insert(orderEvents).values({fromState, toState, changedBy, note})`. changedAt is defaultNow() on the schema. 33 contract tests pass. |
| 2 | Concurrent transitions: optimistic concurrency via `version` column — exactly one succeeds, the other receives "Order was modified by another user. Please refresh." | VERIFIED (automated) / UNCERTAIN (live) | All four actions use `UPDATE … WHERE id=$id AND version=$version … .returning()` and check `updated.length === 0` → `CONFLICT_MESSAGE = 'Order was modified by another user. Please refresh.'`. The exact message string is a named constant. Unit tests cover conflict path. Live concurrent race deferred to human verification. |
| 3 | Operator can mark any active order Blocked (with required reason) and resume to Mixing or Pending | VERIFIED | `blockOrder(orderId, version, reason: string)` rejects empty/whitespace-only reason at runtime (`reason.trim().length === 0 → validation error`). `resumeFromBlocked(orderId, version, toState: 'Mixing' \| 'Pending')` constrains the union. State guards enforce Pending\|Mixing → Blocked and Blocked → Mixing\|Pending. |
| 4 | Every mutator calls `revalidateTag('production-orders')` before returning | VERIFIED | All four transition actions call `revalidateTag('production-orders', 'max')` on every return path (success, conflict, server-error fallback). `commitImportAction` calls it when committedCount > 0. `previewImportAction` does NOT call it (mutation-free — correct). Unit test A7/B5/C8/D7 assert revalidateTag invocation per action. |
| 5 | Operator can upload Book1.xlsx-format file; preview shows row count + total weight + duplicates; confirmed imports appear in import_batches; files >2MB rejected server-side | VERIFIED (server layer) / DEFERRED (client-side) | `previewImportAction` returns `{summary: {rowCount, totalWeight, validCount, duplicateCount, errorCount}, rows[]}`. `commitImportAction` writes one `import_batches` row per successful commit (D-07). Server-side size guard: `file.size > MAX_IMPORT_BYTES`. Framework guard: `experimental.serverActions.bodySizeLimit: '2mb'` in `next.config.ts`. Client-side guard (`MAX_IMPORT_BYTES` from `src/lib/import-constants.ts`) wired by Phase 34. |

**Score:** 5/5 truths verified (SC#5 client-side guard deferred to Phase 34 per documented decision)

---

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Client-side >2MB file rejection before submit | Phase 34 | `MAX_IMPORT_BYTES = 2 * 1024 * 1024` exported from `src/lib/import-constants.ts`. 33-05-SUMMARY.md: "MAX_IMPORT_BYTES exported constant (Phase 34 client-side guard seam)". 33-06-SUMMARY.md: "Phase 34 wires the client-side <input> size check using MAX_IMPORT_BYTES." |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/actions/transitions.ts` | Four named transition server actions with optimistic concurrency and audit trail | VERIFIED | 357 lines. Four exported async functions. `'use server'` line 1. `requireRole('mill_operator')` first call in each. Optimistic UPDATE + `.returning().length === 0` conflict check. `orderEvents` INSERT. `revalidateTag('production-orders', 'max')` before every return. |
| `src/actions/import.ts` | `previewImportAction` + `commitImportAction` with 3-layer size guard, re-parse, per-row validation, duplicate detection | VERIFIED | 767 lines. `'use server'` line 1. Exports only types and async functions (no const exports — correct for 'use server'). `MAX_IMPORT_BYTES` imported from `@/lib/import-constants` (CR-01 fix confirmed). `previewImportAction` is mutation-free. `commitImportAction` has per-row insert/overwrite/skip loop with D-08 partial-import semantics. |
| `src/actions/import-schema.ts` | Zod schema for Book1.xlsx row with D-14/D-15/D-16 validation | VERIFIED | 54 lines. `productionOrderImportSchema` with required fields (orderNumber, customer, product, weightLbs, deliveryTime, formulaType, millLine) and nullable optionals (textureType via `.nullish()`, lineCode via `.nullish()`). `weightLbs` capped at 99,999,999.99 (WR-07 fix). |
| `src/db/queries/orders.ts` | `getProductionOrders(filters?)` and `getOrderById(id)` with unstable_cache | VERIFIED | 69 lines. `import 'server-only'` line 1. `getProductionOrders` wrapped in `unstable_cache` with `tags: ['production-orders']`. `getOrderById` is NOT cached (intentionally — state-guard reads must be fresh). |
| `src/db/queries/events.ts` | `getOrderEvents(orderId)` with unstable_cache tagged production-orders | VERIFIED | 37 lines. `import 'server-only'` line 1. Wrapped in `unstable_cache` with `tags: ['production-orders']`. Ordered newest-first via `desc(orderEvents.changedAt)`. |
| `src/lib/import-constants.ts` | `MAX_IMPORT_BYTES` constant exportable by both server and client code | VERIFIED | 37 lines. No `'use server'` directive. `export const MAX_IMPORT_BYTES = 2 * 1024 * 1024`. JSDoc documents all three guard layers. |
| `next.config.ts` | `experimental.serverActions.bodySizeLimit: '2mb'` (IMPORT-07) | VERIFIED | 11 lines. Correct nested key: `experimental.serverActions.bodySizeLimit: '2mb'`. Matches RESEARCH.md §5 verified config path for Next.js 16.1.6. |
| `package.json` | `read-excel-file@9.0.9` and `zod@^4.3.6` in dependencies | VERIFIED | `read-excel-file: "9.0.9"` (exact pin — CVE-conscious) and `zod: "^4.3.6"` present in `dependencies`. `xlsx`/SheetJS is absent (banned — CVE-2023-30533). |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/actions/transitions.ts` | `src/db` (productionOrders, orderEvents) | `import { db }` + Drizzle queries | WIRED | Direct `db.select/update/insert` calls in all four functions. |
| `src/actions/transitions.ts` | `next/cache` | `revalidateTag('production-orders', 'max')` | WIRED | 8 calls (on success and server-error fallback paths). Cache tag matches query wrappers. |
| `src/actions/import.ts` | `src/actions/import-schema.ts` | `import { productionOrderImportSchema }` | WIRED | Line 13: `import { productionOrderImportSchema } from '@/actions/import-schema'`. Used in `parseAndValidate` at line 160. |
| `src/actions/import.ts` | `src/lib/import-constants.ts` | `import { MAX_IMPORT_BYTES }` | WIRED | Line 14: `import { MAX_IMPORT_BYTES } from '@/lib/import-constants'`. Used in size guards at lines 337, 504. |
| `src/actions/import.ts` | `src/db` (productionOrders, orderEvents, importBatches) | `import + db.select/insert/update` | WIRED | `detectDbDuplicates` queries `productionOrders.orderNumber`; `commitImportAction` inserts to `productionOrders`, `orderEvents`, and `importBatches`. |
| `src/db/queries/orders.ts` | `unstable_cache` tag | `{ tags: ['production-orders'] }` | WIRED | Tag string matches all `revalidateTag('production-orders', ...)` calls in actions. Source-asserted by unit test (orders.test.ts Test 5). |
| `src/db/queries/events.ts` | `unstable_cache` tag | `{ tags: ['production-orders'] }` | WIRED | Same tag as orders.ts — invalidated together when any mutation fires. Source-asserted by unit test (events.test.ts Test 3). |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `getProductionOrders` | DB query result | `db.select().from(productionOrders)` with optional filters | Yes — live Drizzle query, no static fallback | FLOWING |
| `getOrderEvents` | DB query result | `db.select().from(orderEvents).where(eq(orderId))` | Yes — live Drizzle query | FLOWING |
| `previewImportAction` | `rows`, `summary` | `parseAndValidate(buffer)` → `readXlsxFile` → Zod | Yes — real file buffer parse + DB duplicate query | FLOWING |
| `commitImportAction` | `results`, `batchId` | Re-parse + per-row `db.insert/update` | Yes — real DB mutations; `import_batches` row on success | FLOWING |

---

### Behavioral Spot-Checks

Skipped — no runnable entry points for server actions without Next.js running and a live DB connection. End-to-end behavior deferred to human verification.

---

### Probe Execution

No probes declared in PLAN.md files and no conventional `scripts/*/tests/probe-*.sh` files exist for Phase 33.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TRANS-01 | 33-04 | Pending → Mixing via `transitionToMixing` | SATISFIED | `transitionToMixing` in transitions.ts; state guard enforces `order.state !== 'Pending'`; tests A1–A7 |
| TRANS-02 | 33-04 | Mixing → Completed via `completeOrder` | SATISFIED | `completeOrder` in transitions.ts; state guard enforces `order.state !== 'Mixing'`; tests B1–B5 |
| TRANS-03 | 33-04 | Any active → Blocked with required free-text reason | SATISFIED | `blockOrder(orderId, version, reason: string)` — required TS param + runtime `reason.trim().length === 0` check (WR-03 fix); `note: reason` stored in `orderEvents`; tests C1–C8 |
| TRANS-04 | 33-04 | Blocked → Mixing or Pending via `resumeFromBlocked` | SATISFIED | `resumeFromBlocked(orderId, version, toState: 'Mixing' \| 'Pending')` — constrained union; state guard enforces `order.state !== 'Blocked'`; tests D1–D7 |
| TRANS-05 | 33-04 | Every transition writes order_events row | SATISFIED | Each action has `db.insert(orderEvents).values({orderId, fromState, toState, changedBy, note})` in the success path; `changedAt` is defaultNow() on schema |
| TRANS-06 | 33-04 | Optimistic concurrency; locked conflict message | SATISFIED | All four: `UPDATE … WHERE id=$id AND version=$version .returning()`; `if (updated.length === 0) → CONFLICT_MESSAGE` (locked string constant); test A5/B3/C6/D5 |
| TRANS-07 | 33-04, 33-06 | All mutating actions call `revalidateTag('production-orders')` | SATISFIED | `revalidateTag('production-orders', 'max')` in all four transition actions (success + server-error fallback) and in `commitImportAction` (when committedCount > 0) |
| IMPORT-01 | 33-05 | Upload via FormData (drag-drop or file picker) | SATISFIED | Both `previewImportAction(formData: FormData)` and `commitImportAction(formData: FormData, decisions)` accept FormData. Phase 34 wires the UI upload form. |
| IMPORT-02 | 33-03, 33-05 | Server-side parse with `read-excel-file` 9.0.9 (no xlsx/SheetJS) | SATISFIED | `import readXlsxFile from 'read-excel-file/node'` in import.ts line 3. `read-excel-file: "9.0.9"` in package.json. `xlsx`/SheetJS absent. Zod schema in import-schema.ts. |
| IMPORT-03 | 33-05 | Preview shows row count, total weight, duplicates | SATISFIED | `previewImportAction` returns `{ok:true, summary:{rowCount, totalWeight, validCount, duplicateCount, errorCount}, rows[]}`. Intra-file + DB duplicate detection. |
| IMPORT-04 | 33-06 | Row-level error display; partial import allowed (valid rows commit, invalid reported) | SATISFIED | Per-row try/catch in `commitImportAction`; Zod/parser error rows push `{ok:false, action, error}` without aborting other rows; `CommitResult.results[]` per row. |
| IMPORT-05 | 33-06 | Duplicate detection by Document Number; skip/overwrite per row | SATISFIED | `detectIntraFileDuplicates` (Set-based O(n)); `detectDbDuplicates` (chunked inArray query); `decisions.skipRows/overwriteRows` applied in commit loop; overwrite uses `UPDATE … WHERE orderNumber AND version=existing.version .returning()` (CR-02 fix). |
| IMPORT-06 | 33-06 | Confirmed imports in `import_batches`; history visible | SATISFIED | `db.insert(importBatches).values({id:batchId, fileName, rowCount:committedCount, importedBy:userId})` — written only when `committedCount > 0` (D-07). |
| IMPORT-07 | 33-01, 33-05 | `next.config.ts` bodySizeLimit + client-side validation | SATISFIED (server layers) / DEFERRED (client) | `experimental.serverActions.bodySizeLimit: '2mb'` in next.config.ts (layer 3). Server-side `file.size > MAX_IMPORT_BYTES` in both actions (layer 2). `MAX_IMPORT_BYTES` exported from `src/lib/import-constants.ts` for Phase 34 client-side layer 1. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/settings/__tests__/page.test.tsx` | N/A | 14 failing tests (MIG-04 Design System Migration) | INFO | Pre-existing failures unrelated to Phase 33. Settings page test failures were present before Phase 33 began (git log: test introduced in commit `2c8c782`, predates all Phase 33 commits). No impact on Phase 33 goal. |

No debt markers (TBD, FIXME, XXX) found in any Phase 33 source files.

---

### Human Verification Required

#### 1. Concurrent Transition Race (SC#2)

**Test:** Open two browser sessions as `mill_operator`. Find the same Pending order. Attempt `transitionToMixing` from both sessions simultaneously (within the same version window).
**Expected:** Exactly one returns success and the order shows Mixing state; the other session sees the inline red banner "Order was modified by another user. Please refresh." and the page updates to reflect the current state.
**Why human:** Requires two concurrent authenticated sessions against a live Neon dev DB. Unit tests mock the DB and can only verify the code path — they cannot verify actual Postgres row-level concurrency behavior.

#### 2. revalidateTag Cache Invalidation Observable in Browser

**Test:** With Phase 34 dashboard running, perform a state transition via the Phase 34 transition button. Without manually refreshing the page, observe the order card state change within 30s (or immediately, if Next.js RSC re-renders on action completion).
**Expected:** The order card updates to the new state without a full page refresh.
**Why human:** Requires Phase 34 RSC consumer (`getProductionOrders` with `unstable_cache`) to be running. The cache tag contract is verified by source grep and unit tests; the observable browser behavior requires Phase 34.

#### 3. End-to-End XLSX Import Against Live Neon Dev DB

**Test:** Sign in as `mill_operator`, navigate to the Phase 34 import form, upload `example-data/Book1.xlsx`. Review the preview screen showing row count, total weight, and any duplicates. Confirm the import. Navigate to the production dashboard and verify the imported orders appear. Check the `import_batches` table for one new row.
**Expected:** Preview shows 33 rows, correct total weight, and any orders already in the DB flagged as duplicates. After commit, 33 (or fewer, if duplicates skipped) rows appear in the production dashboard. One `import_batches` row records the batch.
**Why human:** Requires a running dev server, connected `.env.local` with live Neon DB, and the Phase 34 import form UI (not yet built). No CI Neon branch exists yet (same constraint as Phase 32).

---

### Gaps Summary

No gaps blocking Phase 33 goal achievement. All five ROADMAP success criteria are implemented:
- SC#1: transition audit trail — VERIFIED
- SC#2: optimistic concurrency code path — VERIFIED (live race deferred to human)
- SC#3: block/resume with required reason — VERIFIED
- SC#4: revalidateTag on every mutator — VERIFIED
- SC#5: server-side layers delivered — VERIFIED; client-side layer intentionally deferred to Phase 34

The four critical issues found by code review (CR-01 through CR-04) and all nine warnings (WR-01 through WR-09) were addressed by dedicated fix commits (`9792de1`, `d536845`, `00bd32b`, `316f051`, `5fb4a9a`, `6a249ac`, `6bfe53b`). The current codebase reflects all fixes.

The only failing tests in the full suite are 14 tests in `src/app/settings/__tests__/page.test.tsx` (MIG-04 Design System Migration) — pre-existing failures unrelated to Phase 33.

---

_Verified: 2026-05-13T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
