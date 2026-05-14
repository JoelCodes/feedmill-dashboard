'use server';

import { readSheet } from 'read-excel-file/node';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { orderEvents } from '@/db/schema/events';
import { importBatches } from '@/db/schema/imports';
import { inArray, sql, eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { productionOrderImportSchema } from '@/actions/import-schema';
import { MAX_IMPORT_BYTES } from '@/lib/import-constants';

// ────────────────────────────────────────────────────────────────────────────
// Constants & Types
// ────────────────────────────────────────────────────────────────────────────

// MAX_IMPORT_BYTES is imported from '@/lib/import-constants' (CR-01).
// Next.js 16's server-boundary rule forbids non-async-function exports from a
// 'use server' file; the constant therefore lives in a regular (non-'use server')
// module so that both the server action below and the Phase 34 client upload
// form can import it for the 3-layer DoS guard (T-33-DoS).

export type PreviewRow = {
  rowIndex: number;
  orderNumber: string;
  customer: string;
  product: string;
  weightLbs: number;
  deliveryTime: string;
  formulaType: string;
  millLine: 'Premix' | 'Excel' | 'CGM';
  textureType: string | null;
  lineCode: string | null;
  isDuplicate: boolean;
  duplicateOf?: string; // 'db' or `row ${number}` (intra-file)
  errors?: Array<{ path: string; message: string }>;
};

export type PreviewSummary = {
  rowCount: number;
  totalWeight: number; // sum of weightLbs across valid (non-error) rows
  validCount: number;
  duplicateCount: number;
  errorCount: number;
};

export type PreviewResult =
  | { ok: true; summary: PreviewSummary; rows: PreviewRow[] }
  | { ok: false; code: 'unauthorized' | 'validation' | 'server'; message: string };

// ────────────────────────────────────────────────────────────────────────────
// XLSX Schema — Book1.xlsx column mapping (RESEARCH.md §3 lines 309-337)
// D-16: Book1.xlsx has no Mill Line column; every row defaults to 'Premix'.
// ────────────────────────────────────────────────────────────────────────────

// GAP-05 (33-11): readSheet uses the v9.x typed-Schema API where schema keys are the
// OUTPUT property names and each entry has a `column` property pointing to the XLSX
// column title. This is the inverse of the legacy `readXlsxFile` prop-based format
// (column title → { prop, type, required }) used in the original implementation.
//
// v9.x format: { outputProp: { column: 'Column Title', type } }
// Legacy format: { 'Column Title': { prop: 'outputProp', type, required } }
//
// CORRECTION (33-11): The actual Book1.xlsx column headers differ from RESEARCH.md §3's
// documented schema. Verified against the real file (readSheet without schema returns
// row 1 as ["Document Number","Line Code","Texture Type","Customer Name","Ordered Quantity",
// "Farm Location Code","Early Delivery Date","Formula Type","Formula Type"]).
// - 'Customer' → actual header is 'Customer Name'
// - 'Product' → no such column exists in Book1.xlsx (removed)
// - 'Weight' → actual header is 'Ordered Quantity'
// The original readXlsxFile silently ignored the schema, so mismatched column titles
// never surfaced. See RESEARCH.md §3 CORRECTION 2026-05-14 for the full post-mortem.
//
// IMPORTANT — no `required: true` in this schema:
// When readSheet receives `required: true` on a field and a row has a null/empty value
// for that field, v9.x returns the ParseSheetDataResultError branch (objects: undefined,
// errors: Error[]). This is an all-or-nothing contract — if ANY row triggers a required
// error, ALL rows are lost from `objects`. Since partial imports are a core requirement
// (IMPORT-04 / WR-06: invalid rows surface as errors while valid rows proceed),
// `required` validation MUST NOT be delegated to the XLSX schema layer. Zod handles
// all required-field validation in the per-row safeParse loop below, including the
// .min(1) constraints from productionOrderImportSchema.
const xlsxSchema: Record<string, unknown> = {
  orderNumber:  { column: 'Document Number',    type: String },
  customer:     { column: 'Customer Name',       type: String },
  weightLbs:    { column: 'Ordered Quantity',    type: Number },
  deliveryDate: { column: 'Early Delivery Date', type: Date },
  formulaType:  { column: 'Formula Type',        type: String },
  textureType:  { column: 'Texture Type',        type: String },
  lineCode:     { column: 'Line Code',           type: String },
  // No 'millLine' key — Book1.xlsx has no Mill Line column (D-16)
  // No 'product' key — Book1.xlsx has no Product column; product field falls back to '' in parseAndValidate
};

// ────────────────────────────────────────────────────────────────────────────
// Private Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Converts a Date value from read-excel-file to a YYYY-MM-DD string.
 *
 * Assumption A1 (RESEARCH.md §3): read-excel-file returns a `Date` instance
 * for cells parsed with `type: Date`. We truncate to the ISO date prefix
 * (YYYY-MM-DD) for storage in the `delivery_time` text column (D-13).
 *
 * Defensive: if `d` is not a Date instance (e.g. undefined, null, or an
 * unexpected string), returns an empty string. The Zod schema will then
 * reject the row via the `min(1)` rule on `deliveryTime`.
 */
function dateToIsoString(d: unknown): string {
  if (d instanceof Date && !isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}

/**
 * Parses an XLSX buffer and validates each row with `productionOrderImportSchema`.
 *
 * Contract: buffer in → full per-row PreviewRow array out (valid + invalid rows).
 * This function is called by BOTH `previewImportAction` (this plan, read-only)
 * and (in plan 33-06) `commitImportAction` (write path). It must remain
 * completely side-effect free — no DB reads, no DB writes, no cache invalidation.
 *
 * Per-row errors are collected without aborting the parse: rows with Zod
 * errors carry an `errors` array; rows with read-excel-file parser errors
 * also carry an `errors` array. Both error types are surfaced to the operator
 * via the preview UI (IMPORT-04 partial-import semantics).
 *
 * read-excel-file `errors` array items have shape:
 *   { row: number; column: string; error: string; value: unknown }
 * where `row` is 1-based (matching XLSX row numbers).
 *
 * IMPORTANT: this helper calls `readSheet` (named export — schema-aware
 * v9.x overload), NOT `readXlsxFile` (default — returns Sheet[] without
 * schema support). See GAP-05 in 33-VERIFICATION.md.
 */
async function parseAndValidate(buffer: Buffer): Promise<PreviewRow[]> {
  // GAP-05 migration (2026-05-14): the SCHEMA-AWARE function is `readSheet`
  // (named export), NOT the default export `readXlsxFile`. Per
  // node_modules/read-excel-file/node/index.d.ts lines 73-97:
  //   - `export default readXlsxFile`: returns Promise<Sheet[]> (2D cell array,
  //     no schema support — the schema option is silently dropped at runtime).
  //   - `export function readSheet` (4th overload): takes OptionsWithSchema,
  //     returns Promise<ParseSheetDataResult> — the `{ objects, errors }`
  //     discriminated union below. Plans 33-05/33-06 originally used the
  //     default export by mistake; GAP-05 in 33-VERIFICATION.md is the
  //     post-mortem.
  //
  // v9.x ParseSheetDataResult discriminated union (parseSheetData.d.ts):
  //   ParseSheetDataResultSuccess: { objects: Object[];      errors: undefined }  ← clean file
  //   ParseSheetDataResultError:   { objects: undefined;     errors: Error[]   }  ← parse failure
  //
  // Both fields must be guarded with `?? []` before iteration:
  //   - `parserErrors ?? []`  (GAP-04 guard, carried forward)
  //   - `rawRows ?? []`       (GAP-05 new guard — objects: undefined on error branch)
  type XlsxFn = (
    input: Buffer,
    options: { schema: Record<string, unknown> }
  ) => Promise<{
    objects: Record<string, unknown>[] | undefined;  // undefined on ParseSheetDataResultError branch
    errors: Array<{ row: number; column: string; error: string; value: unknown }> | undefined;
  }>;
  const { objects: rawRows, errors: parserErrors } = await (readSheet as unknown as XlsxFn)(buffer, {
    schema: xlsxSchema,
  });

  // Index parser errors by 1-based row number for O(1) lookup.
  // The `?? []` guard is REQUIRED: read-excel-file v9.0.9 returns `errors: undefined`
  // (not `errors: []`) for clean files per its ParseSheetDataResultSuccess overload. Without
  // the guard, `for (const pe of undefined)` throws TypeError. See GAP-04 in 33-VERIFICATION.md.
  const parserErrorsByRow = new Map<
    number,
    Array<{ path: string; message: string }>
  >();
  for (const pe of parserErrors ?? []) {
    const rowIdx = pe.row; // 1-based
    if (!parserErrorsByRow.has(rowIdx)) {
      parserErrorsByRow.set(rowIdx, []);
    }
    parserErrorsByRow.get(rowIdx)!.push({
      path: pe.column ?? 'unknown',
      message: `${pe.error}: ${pe.value}`,
    });
  }

  const result: PreviewRow[] = [];

  // GAP-05: rawRows is undefined on the ParseSheetDataResultError branch — guard required.
  const rowsArr = rawRows ?? [];
  for (let i = 0; i < rowsArr.length; i++) {
    // readSheet can return null for completely empty rows; skip them.
    if (rowsArr[i] == null) continue;
    const raw = rowsArr[i] as Record<string, unknown>;
    const rowIndex = i + 1; // 1-based

    // D-16: inject 'Premix' default + date conversion before Zod validation.
    // CORRECTION (33-11): Book1.xlsx has no 'Product' column per the actual XLSX headers
    // (verified: Document Number, Line Code, Texture Type, Customer Name, Ordered Quantity,
    // Farm Location Code, Early Delivery Date, Formula Type, Formula Type). The RESEARCH.md §3
    // documented schema had wrong column names (`Customer`, `Product`, `Weight` vs actual
    // `Customer Name`, no-Product-column, `Ordered Quantity`). Since product is required by
    // D-15/productionOrderImportSchema but absent from the XLSX, rows missing `product`
    // will surface as Zod validation errors — this is correct per IMPORT-04 (partial-import
    // semantics: invalid rows are surfaced as errors, not silently skipped).
    const toValidate = {
      ...raw,
      millLine: 'Premix' as const,
      deliveryTime: dateToIsoString(raw.deliveryDate),
    };

    const parsed = productionOrderImportSchema.safeParse(toValidate);

    // Collect Zod issues
    const zodErrors: Array<{ path: string; message: string }> = [];
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        zodErrors.push({
          path: (issue.path.join('.') || issue.path[0]?.toString()) ?? 'unknown',
          message: issue.message,
        });
      }
    }

    // Merge Zod errors + parser errors for this row
    const rowParserErrors = parserErrorsByRow.get(rowIndex) ?? [];
    const allErrors = [...zodErrors, ...rowParserErrors];

    const data = parsed.success ? parsed.data : null;

    result.push({
      rowIndex,
      orderNumber: (data?.orderNumber ?? (raw.orderNumber as string) ?? '') as string,
      customer: (data?.customer ?? (raw.customer as string) ?? '') as string,
      product: (data?.product ?? (raw.product as string) ?? '') as string,
      weightLbs: (data?.weightLbs ?? (typeof raw.weightLbs === 'number' ? raw.weightLbs : 0)) as number,
      deliveryTime: (data?.deliveryTime ?? (raw.deliveryTime as string) ?? '') as string,
      formulaType: (data?.formulaType ?? (raw.formulaType as string) ?? '') as string,
      millLine: (data?.millLine ?? 'Premix') as 'Premix' | 'Excel' | 'CGM',
      textureType: (data?.textureType ?? (raw.textureType as string | null) ?? null) as string | null,
      lineCode: (data?.lineCode ?? (raw.lineCode as string | null) ?? null) as string | null,
      isDuplicate: false,
      ...(allErrors.length > 0 ? { errors: allErrors } : {}),
    });
  }

  // WR-06: surface parser errors for rows that read-excel-file did NOT emit in
  // `rawRows`. If the parser fails to materialize a row (e.g. fully unparseable),
  // it still emits an entry in the `errors` array keyed on the 1-based row
  // number, but the row never enters the main loop above. Without this pass the
  // operator sees errorCount: 0 / validCount: rowCount even though the file had
  // bad rows. Append a synthetic PreviewRow carrying just the parser errors so
  // the preview UI surfaces them like any other error row.
  const consumedRowIndices = new Set(result.map((r) => r.rowIndex));
  for (const [rowIdx, errs] of parserErrorsByRow.entries()) {
    if (!consumedRowIndices.has(rowIdx)) {
      result.push({
        rowIndex: rowIdx,
        orderNumber: '',
        customer: '',
        product: '',
        weightLbs: 0,
        deliveryTime: '',
        formulaType: '',
        millLine: 'Premix',
        textureType: null,
        lineCode: null,
        isDuplicate: false,
        errors: errs,
      });
    }
  }

  return result;
}

/**
 * Detects intra-file duplicate orderNumbers using a single-pass Set.
 *
 * The FIRST occurrence of a given orderNumber is kept as-is (isDuplicate: false).
 * Every SUBSEQUENT occurrence is flagged with isDuplicate: true and
 * duplicateOf: 'row <firstRowIndex>' referencing the original row.
 *
 * Pitfall 7 (RESEARCH.md): When `commitImportAction` (plan 33-06) implements
 * per-row overwrite decisions, intra-file duplicates produce non-obvious
 * behavior — if the operator selects "overwrite" for the second occurrence of
 * an orderNumber, the commit path must decide which row wins. Plan 33-06 must
 * handle this case explicitly; do NOT assume that flagging a row isDuplicate
 * means the commit path will simply skip it.
 */
function detectIntraFileDuplicates(rows: PreviewRow[]): PreviewRow[] {
  // Map from orderNumber -> rowIndex of the first occurrence
  const seen = new Map<string, number>();
  return rows.map((row) => {
    if (!row.orderNumber) return row;
    if (seen.has(row.orderNumber)) {
      return {
        ...row,
        isDuplicate: true,
        duplicateOf: `row ${seen.get(row.orderNumber)}`,
      };
    }
    seen.set(row.orderNumber, row.rowIndex);
    return row;
  });
}

/**
 * Maximum number of orderNumbers to include in a single `inArray()` query.
 *
 * WR-09: a 2 MB XLSX could plausibly hold ~10k+ rows. A single
 * `WHERE order_number IN ($1, ..., $N)` with 10k 32-char parameters approaches
 * 300 KB of bind payload, which can exceed Neon's HTTP request size limit and
 * fail with a 400/413 before the per-row commit loop even runs. Splitting the
 * query into chunks of at most this many parameters keeps each round-trip well
 * under the HTTP limit while still using the parameterized `inArray()` form
 * (no SQL injection vector — T-33-Input).
 */
const DB_DUPLICATE_CHUNK_SIZE = 1000;

/**
 * Returns the set of orderNumbers from `orderNumbers` that already exist in
 * the `production_orders` table — used to flag file-vs-DB duplicates.
 *
 * Drizzle parameterizes the inArray() call, so there is no SQL injection
 * vector even for operator-supplied values (T-33-Input).
 *
 * Short-circuit: `inArray(col, [])` is a Drizzle quirk that generates invalid
 * SQL (`col IN ()`). We guard against it explicitly by returning an empty Set
 * when the input array is empty — avoids a runtime error and an unnecessary
 * round-trip to the DB.
 *
 * WR-09: chunk the query in groups of `DB_DUPLICATE_CHUNK_SIZE` so a large
 * valid-file import cannot exceed Neon's HTTP request size limit with a single
 * unbounded IN-list. Each chunk is still a single round-trip; results are
 * accumulated into one Set returned to the caller.
 */
async function detectDbDuplicates(orderNumbers: string[]): Promise<Set<string>> {
  if (orderNumbers.length === 0) return new Set();

  const found = new Set<string>();
  for (let i = 0; i < orderNumbers.length; i += DB_DUPLICATE_CHUNK_SIZE) {
    const slice = orderNumbers.slice(i, i + DB_DUPLICATE_CHUNK_SIZE);
    const existing = await db
      .select({ orderNumber: productionOrders.orderNumber })
      .from(productionOrders)
      .where(inArray(productionOrders.orderNumber, slice));
    for (const r of existing) found.add(r.orderNumber);
  }
  return found;
}

// ────────────────────────────────────────────────────────────────────────────
// Server Action: previewImportAction
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parses and validates an uploaded XLSX file, returning a full preview payload
 * for operator review. NO mutations are performed (D-05):
 *   - No database mutations (no insert/update/delete)
 *   - No cache revalidation (revalidateTag not called)
 *   - No `import_batches` row
 *
 * This action is the read-only first half of the two-step import flow.
 * Plan 33-06 adds `commitImportAction` to this same file; that action re-runs
 * `parseAndValidate` + duplicate detection and then writes to the DB.
 *
 * AUTH-02: `requireRole('mill_operator')` is the very first call — any session
 * without the mill_operator role is redirected before any file processing.
 */
export async function previewImportAction(formData: FormData): Promise<PreviewResult> {
  // AUTH-02: requireRole must be the first call in the body.
  await requireRole('mill_operator');

  try {
    // Extract file from FormData
    const file = formData.get('file');
    // WR-08: validate that the FormData entry is actually a Blob (or File, which
    // is a Blob subclass). The previous `!file || typeof file === 'string'` check
    // accepted any non-string non-nullish value — including primitives or plain
    // objects — even though Next.js FormData deserialization is expected to yield
    // only strings or Blobs. `instanceof Blob` narrows the type without the
    // unsafe `as` cast below.
    if (!(file instanceof Blob)) {
      return { ok: false, code: 'validation', message: 'No file provided.' };
    }

    // T-33-DoS layer 2: server-side size guard
    if (file.size > MAX_IMPORT_BYTES) {
      return { ok: false, code: 'validation', message: 'File exceeds 2MB limit.' };
    }

    // Convert File/Blob to Buffer for read-excel-file.
    // Note: jsdom (used in tests) does not implement Blob.prototype.arrayBuffer();
    // in production Next.js server runtime, Blob/File always has arrayBuffer().
    const rawArrayBuffer = await (file.arrayBuffer as (() => Promise<ArrayBuffer>) | undefined)?.();
    const buffer = Buffer.from(rawArrayBuffer ?? new ArrayBuffer(0));

    // Parse + validate all rows (no DB access here — pure parse)
    let rows = await parseAndValidate(buffer);

    // Intra-file duplicate detection (Pitfall 7 — see helper JSDoc)
    rows = detectIntraFileDuplicates(rows);

    // DB duplicate detection — only query orderNumbers from rows without errors
    // (don't pollute DB lookup with malformed rows that would never match anyway)
    const validOrderNumbers = rows
      .filter((r) => !r.errors?.length && !r.isDuplicate)
      .map((r) => r.orderNumber)
      .filter(Boolean);

    const dbDuplicates = await detectDbDuplicates(validOrderNumbers);

    // Flag DB duplicates that weren't already flagged as intra-file duplicates
    rows = rows.map((row) => {
      if (!row.isDuplicate && dbDuplicates.has(row.orderNumber)) {
        return { ...row, isDuplicate: true, duplicateOf: 'db' };
      }
      return row;
    });

    // Compute summary
    const errorCount = rows.filter((r) => r.errors && r.errors.length > 0).length;
    const duplicateCount = rows.filter((r) => r.isDuplicate).length;
    const validCount = rows.filter((r) => !r.errors?.length && !r.isDuplicate).length;
    // totalWeight sums only rows without Zod/parser errors (duplicates can still contribute)
    const totalWeight = rows
      .filter((r) => !r.errors?.length)
      .reduce((sum, r) => sum + r.weightLbs, 0);

    const summary: PreviewSummary = {
      rowCount: rows.length,
      totalWeight,
      validCount,
      duplicateCount,
      errorCount,
    };

    return { ok: true, summary, rows };
  } catch (err) {
    // WR-05: log error context so production failures can be correlated with
    // operator reports. The generic message returned to the caller is preserved
    // (no internal-error leakage), but the server logs now show the underlying
    // exception class and stack — including typed errors from read-excel-file
    // (malformed XLSX, password-protected, wrong sheet, etc.).
    console.error('[previewImportAction] failed:', err);
    return { ok: false, code: 'server', message: 'Failed to parse XLSX file.' };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Types: commitImportAction decision/result shapes
// ────────────────────────────────────────────────────────────────────────────

/**
 * Operator decisions from the preview step — which rows to skip (default safe)
 * and which rows to UPDATE an existing DB record (overwrite).
 *
 * Decision precedence: if a rowIndex appears in BOTH skipRows AND overwriteRows,
 * skipRows wins (Test 21). This is the safer default — the operator must
 * explicitly remove a row from skipRows to allow the overwrite to proceed.
 */
export type ImportDecisions = {
  skipRows: number[];       // rowIndex values to skip (from preview)
  overwriteRows: number[];  // rowIndex values to UPDATE existing DB row
};

export type CommitRowResult =
  | { rowIndex: number; ok: true; action: 'inserted' | 'overwritten' | 'skipped'; orderId?: string }
  | { rowIndex: number; ok: false; action: 'insert' | 'overwrite'; error: string };

export type CommitResult =
  | { ok: true; batchId: string; committedCount: number; failedCount: number; results: CommitRowResult[] }
  | { ok: false; code: 'unauthorized' | 'validation' | 'server'; message: string };

// ────────────────────────────────────────────────────────────────────────────
// Server Action: commitImportAction
// ────────────────────────────────────────────────────────────────────────────

/**
 * Commits an XLSX import, writing per-row DB mutations and one `import_batches` audit row.
 *
 * ## Re-parse contract (D-05 — stateless server)
 * The server holds NO state between preview and commit. Every call re-parses the
 * uploaded file via `parseAndValidate` and re-runs duplicate detection. This means:
 * - Abandoned previews leave zero server-side trace.
 * - A fabricated commit call with no prior preview is indistinguishable from a
 *   normal commit — the validation pipeline runs in both cases.
 *
 * ## Per-row sequential insert (D-08 — Neon HTTP no-transactions)
 * Each row is its own auto-committed HTTP call to Neon. There is NO multi-statement
 * transaction wrapper (CR-02 carryover from Phase 32: the neon-http driver does not
 * support multi-statement transactions). Partial-import is the contracted behavior
 * (IMPORT-04): valid rows commit even when sibling rows fail.
 *
 * ## No-transaction residual risk (RESEARCH.md §1 line 259, Phase 32 CR-02)
 * If a `productionOrders` INSERT succeeds but the paired `orderEvents` INSERT fails,
 * the production order row exists without its initial audit trail. This is accepted
 * residual risk for v2.0: the `orderEvents` insert is a simple append with no unique
 * constraints, so runtime failures are rare (transient Neon HTTP errors only). A
 * future v2.1 option: use Neon's connection-pooler in "session" mode which supports
 * `BEGIN/COMMIT`. See also `src/db/seed.ts` for the same accepted-risk pattern.
 *
 * ## import_batches row (D-07 — success-only)
 * One `import_batches` row is written ONLY if `committedCount > 0`. If every row
 * fails or is skipped, no batch row is written. Abandoned previews never write a
 * batch row (they never call commitImportAction at all).
 *
 * ## Decision precedence (Test 21)
 * If a rowIndex appears in both `decisions.skipRows` AND `decisions.overwriteRows`,
 * skipRows wins. The conditional check order enforces this: skip is tested first.
 *
 * ## [OVERWRITE] batch_id= marker (D-11)
 * The overwrite event note uses the literal prefix `[OVERWRITE] batch_id=` followed
 * by the batch UUID. Phase 34's timeline UI uses this prefix to distinguish overwrite
 * events (same fromState → toState, changed data) from state-transition events
 * (fromState !== toState). Do NOT change this prefix without updating Phase 34.
 *
 * AUTH-02: `requireRole('mill_operator')` is the first call in the body.
 */
export async function commitImportAction(
  formData: FormData,
  decisions: ImportDecisions
): Promise<CommitResult> {
  // AUTH-02: requireRole must be the first call in the body.
  await requireRole('mill_operator');

  // WR-01: validate the decisions payload at the network boundary. Server
  // actions are public endpoints and the TS signature is only enforced at
  // compile time — a malformed payload like { skipRows: null, overwriteRows: null }
  // would otherwise crash at decisions.skipRows.includes() and be caught by the
  // outer try/catch, surfacing as a generic 'server' error with no diagnostic
  // value. Validate with Zod so the caller sees a clean 'validation' code.
  const decisionsSchema = z.object({
    skipRows: z.array(z.number().int().nonnegative()),
    overwriteRows: z.array(z.number().int().nonnegative()),
  });
  const parsedDecisions = decisionsSchema.safeParse(decisions);
  if (!parsedDecisions.success) {
    return { ok: false, code: 'validation', message: 'Invalid decisions payload.' };
  }
  const safeDecisions = parsedDecisions.data;

  try {
    const { userId } = await auth();

    // Extract file from FormData (same validation as previewImportAction — D-05 re-parse)
    const file = formData.get('file');
    // WR-08: narrow the FormData entry with instanceof Blob instead of the
    // permissive '!file || typeof file === string' check.
    if (!(file instanceof Blob)) {
      return { ok: false, code: 'validation', message: 'No file provided.' };
    }

    // T-33-DoS layer 2: server-side size guard (re-checked on commit — separate upload)
    if (file.size > MAX_IMPORT_BYTES) {
      return { ok: false, code: 'validation', message: 'File exceeds 2MB limit.' };
    }

    // WR-04: validate and normalize the file name. A plain Blob (not File) lacks
    // .name (the default is 'blob'); the import_batches.file_name column is
    // NOT NULL, so an undefined name would crash the audit insert. Also cap the
    // length at 255 to bound persisted user input.
    const rawName = (file as { name?: unknown }).name;
    const fileName =
      typeof rawName === 'string' && rawName.trim().length > 0
        ? rawName.slice(0, 255)
        : 'unknown.xlsx';

    // Convert to Buffer for read-excel-file (D-05 — re-parse from uploaded file)
    const rawArrayBuffer = await (file.arrayBuffer as (() => Promise<ArrayBuffer>) | undefined)?.();
    const buffer = Buffer.from(rawArrayBuffer ?? new ArrayBuffer(0));

    // Step 4: Re-parse + validate (D-05 stateless server — identical pipeline to preview)
    const rows = await parseAndValidate(buffer);

    // Step 5: Re-run intra-file duplicate detection (Pitfall 7)
    const deduplicatedRows = detectIntraFileDuplicates(rows);

    // Step 6: Re-run DB duplicate detection for valid rows
    const validOrderNumbers = deduplicatedRows
      .filter((r) => !r.errors?.length && !r.isDuplicate)
      .map((r) => r.orderNumber)
      .filter(Boolean);
    const dbDuplicates = await detectDbDuplicates(validOrderNumbers);

    // Pre-generate the batch UUID so the [OVERWRITE] event note has a stable reference (D-11)
    // The same batchId is used both in overwrite event notes and in the import_batches insert.
    const batchId = crypto.randomUUID();

    // Step 8: Initialize per-row results accumulator
    const results: CommitRowResult[] = [];

    // Step 9: Process each parsed row
    for (const row of deduplicatedRows) {
      const rowIndex = row.rowIndex;

      // Decision precedence: skip wins over overwrite (Test 21 — safer default)
      if (safeDecisions.skipRows.includes(rowIndex)) {
        results.push({ rowIndex, ok: true, action: 'skipped' });
        continue;
      }

      // Rows with Zod/parser errors are excluded from commits
      if (row.errors && row.errors.length > 0) {
        // WR-02: report the action the operator intended, not always 'insert'.
        // An overwrite-listed row that fails validation should surface as an
        // overwrite failure so the audit/result trail reflects intent.
        const intendedAction = safeDecisions.overwriteRows.includes(rowIndex) ? 'overwrite' : 'insert';
        results.push({ rowIndex, ok: false, action: intendedAction, error: row.errors[0].message });
        continue;
      }

      // CR-03: un-decided duplicates (either intra-file or DB) default to skipped.
      // The preview already flagged isDuplicate=true for intra-file dupes and
      // detectDbDuplicates above gives us the DB-side set. Without this guard a
      // row that the preview marked as a DB-duplicate — and which the operator
      // neither explicitly skipped nor explicitly chose to overwrite — would
      // fall through to the INSERT path and hit the order_number UNIQUE
      // constraint at the DB layer, surfacing as a generic 'insert' error.
      // Defaulting un-decided duplicates to 'skipped' mirrors D-12 (Skip is the
      // default per-row UI selection — safer than silently inserting).
      const isUndecidedDuplicate =
        (row.isDuplicate || dbDuplicates.has(row.orderNumber)) &&
        !safeDecisions.overwriteRows.includes(rowIndex);
      if (isUndecidedDuplicate) {
        results.push({ rowIndex, ok: true, action: 'skipped' });
        continue;
      }

      if (safeDecisions.overwriteRows.includes(rowIndex)) {
        // ── Overwrite path (D-10 + D-11 + D-13) ──────────────────────────
        try {
          // Load existing order to capture current state AND version for
          // optimistic concurrency. CR-02: the original implementation only
          // selected { id, state } and gated the UPDATE on `orderNumber`
          // alone, which silently allowed two concurrent overwrites of the
          // same row (and would lose an in-flight transition change).
          const [existing] = await db
            .select({
              id: productionOrders.id,
              state: productionOrders.state,
              version: productionOrders.version,
            })
            .from(productionOrders)
            .where(eq(productionOrders.orderNumber, row.orderNumber));

          if (!existing) {
            results.push({ rowIndex, ok: false, action: 'overwrite', error: 'Order to overwrite not found' });
            continue;
          }

          // UPDATE the existing row — state intentionally absent (D-13 preserves state)
          // version bumped via sql`version + 1` to support optimistic concurrency (D-10 + T-33-Stale)
          // CR-02: gate the UPDATE on the version we just observed AND check
          // .returning().length for the zero-rows-as-conflict signal. Mirrors
          // transitions.ts:110-118. The TOCTOU window between this SELECT and
          // UPDATE is narrow; any post-preview mutation will now conflict-fail
          // visibly instead of silently clobbering the other writer's work.
          // updatedAt omitted — auto-set via $onUpdate (Pitfall 5)
          // formulaType omitted — not in productionOrders schema (schema has no formula_type column)
          const updated = await db
            .update(productionOrders)
            .set({
              customer: row.customer,
              product: row.product,
              weightLbs: row.weightLbs.toString(), // CR-01: numeric column expects string
              deliveryTime: row.deliveryTime,
              textureType: row.textureType ?? null,
              lineCode: row.lineCode ?? null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              version: sql`version + 1` as any,
              // state intentionally absent — D-13: overwrite does NOT change state
            })
            .where(
              and(
                eq(productionOrders.orderNumber, row.orderNumber),
                eq(productionOrders.version, existing.version),
              ),
            )
            .returning({ id: productionOrders.id });

          if (updated.length === 0) {
            // CR-02: zero-row UPDATE under our version predicate means
            // another writer mutated the row between SELECT and UPDATE.
            // Report a clear per-row conflict instead of writing the
            // overwrite audit event for an UPDATE that never happened.
            results.push({
              rowIndex,
              ok: false,
              action: 'overwrite',
              error: 'Order was modified after preview. Please refresh.',
            });
            continue;
          }

          // Audit row for overwrite: fromState === toState (same state, data changed)
          // [OVERWRITE] batch_id= is the D-11 canonical marker for Phase 34 timeline UI
          await db.insert(orderEvents).values({
            orderId: existing.id,
            fromState: existing.state,
            toState: existing.state,
            changedBy: userId!,
            note: `[OVERWRITE] batch_id=${batchId}`,
          });

          results.push({ rowIndex, ok: true, action: 'overwritten', orderId: existing.id });
        } catch (err) {
          results.push({ rowIndex, ok: false, action: 'overwrite', error: String(err) });
        }
      } else {
        // ── New insert path ───────────────────────────────────────────────
        try {
          // INSERT productionOrders — CR-01: weightLbs must be string for numeric column
          // D-16: millLine defaults to 'Premix' (Book1.xlsx has no Mill Line column)
          // D-13: state defaults to 'Pending' for all new imports
          // formulaType omitted — not in productionOrders schema (schema has no formula_type column)
          const [inserted] = await db
            .insert(productionOrders)
            .values({
              orderNumber: row.orderNumber,
              customer: row.customer,
              product: row.product,
              weightLbs: row.weightLbs.toString(), // CR-01: numeric column expects string
              deliveryTime: row.deliveryTime,
              millLine: 'Premix' as const,         // D-16: no Mill Line column in Book1.xlsx
              textureType: row.textureType ?? null,
              lineCode: row.lineCode ?? null,
              state: 'Pending' as const,            // D-13: all imports start as Pending
              version: 1,
              createdBy: userId!,
            })
            .returning({ id: productionOrders.id });

          // Audit row: initial-insert event (RESEARCH.md Open Question 2 — recommended YES)
          // fromState: null (no prior state — row is being created)
          // toState: 'Pending' (the initial state assigned above)
          await db.insert(orderEvents).values({
            orderId: inserted.id,
            fromState: null,
            toState: 'Pending',
            changedBy: userId!,
            note: 'Imported from XLSX',
          });

          results.push({ rowIndex, ok: true, action: 'inserted', orderId: inserted.id });
        } catch (err) {
          results.push({ rowIndex, ok: false, action: 'insert', error: String(err) });
        }
      }
    }

    // Step 10: Count committed vs failed
    const committedCount = results.filter(
      (r) => r.ok && (r.action === 'inserted' || r.action === 'overwritten')
    ).length;
    const failedCount = results.filter((r) => !r.ok).length;

    // Step 11: If no rows committed, skip batch row + revalidateTag (Test 10 + Test 12)
    if (committedCount === 0) {
      return { ok: true, batchId, committedCount: 0, failedCount, results };
    }

    // Step 12: Write import_batches row (D-07 — one row per successful commit)
    // rowCount = committedCount (NOT total rows — D-07 exact wording)
    // importedAt defaults via defaultNow() — omitted here
    //
    // CR-04: wrap the audit-row insert in its OWN try/catch. The per-row loop
    // already committed `committedCount` production_orders rows; if the
    // import_batches insert fails (NOT NULL on fileName, transient Neon error,
    // schema drift, etc.), we MUST NOT discard `results[]` by falling through
    // to the outer catch. A missing batch row is an audit-only failure, not a
    // row-commit failure. Cache must still be invalidated since the data did
    // change.
    try {
      await db
        .insert(importBatches)
        .values({
          id: batchId,
          fileName, // WR-04: validated/normalized at action entry
          rowCount: committedCount,
          importedBy: userId!,
        })
        .returning({ id: importBatches.id });
    } catch (err) {
      // WR-05: log the batch-row failure for production triage.
      console.error('[commitImportAction] import_batches insert failed:', err);
      // Step 13a: cache invalidation still required (data DID change).
      try {
        revalidateTag('production-orders', 'max');
      } catch (revalErr) {
        console.error('[commitImportAction] revalidateTag failed after batch-insert failure:', revalErr);
      }
      // Surface degraded-success — the operator sees the per-row results
      // and the committed count so they can verify in the dashboard.
      return { ok: true, batchId, committedCount, failedCount, results };
    }

    // Step 13: Revalidate cache tag (TRANS-07 + STATE.md mutation invariant).
    // CR-04: also wrap revalidateTag — a thrown revalidateTag here would
    // otherwise hit the outer catch and discard `results[]` despite every row
    // having been persisted successfully.
    // 'max' is the revalidateTag type parameter — matches project convention from transitions.ts
    try {
      revalidateTag('production-orders', 'max');
    } catch (revalErr) {
      console.error('[commitImportAction] revalidateTag failed:', revalErr);
    }

    // Step 14: Return success
    return { ok: true, batchId, committedCount, failedCount, results };
  } catch (err) {
    // WR-05: bind the error for server-side log correlation. The operator-facing
    // message is preserved as a generic 'server' code — no internal-error leak.
    console.error('[commitImportAction] failed:', err);
    return { ok: false, code: 'server', message: 'Failed to commit import.' };
  }
}
