'use server';

import readXlsxFile from 'read-excel-file/node';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';
import { productionOrderImportSchema } from '@/actions/import-schema';

// ────────────────────────────────────────────────────────────────────────────
// Constants & Types
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maximum accepted upload size in bytes (2 MB).
 * Layer 2 server-side DoS guard (T-33-DoS).
 * Layer 1 = Phase 34 client-side <input> check using this constant.
 * Layer 3 = Next.js framework body-size limit (plan 33-01).
 * Exported for Phase 34 upload form to import and use as client-side guard.
 */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

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

// read-excel-file 9.x TypeScript type definitions use the new typed-Schema API
// (output keys → { column: '...', type, required }). The runtime still accepts
// the legacy prop-based format (column titles → { prop, type, required }) used
// in this codebase per RESEARCH.md §3 lines 309-337. Using `Record<string, unknown>`
// here avoids the type mismatch while preserving the correct runtime behavior.
// The `as unknown as Parameters<typeof readXlsxFile>[1]` cast ensures the options
// pass TypeScript type-checking at the call site without sacrificing correctness.
const xlsxSchema: Record<string, unknown> = {
  'Document Number': { prop: 'orderNumber', type: String, required: true },
  Customer: { prop: 'customer', type: String, required: true },
  Product: { prop: 'product', type: String, required: true },
  Weight: { prop: 'weightLbs', type: Number, required: true },
  'Early Delivery Date': { prop: 'deliveryDate', type: Date },
  'Formula Type': { prop: 'formulaType', type: String, required: true },
  'Texture Type': { prop: 'textureType', type: String },
  'Line Code': { prop: 'lineCode', type: String },
  // No 'Mill Line' key — Book1.xlsx has no Mill Line column (D-16)
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
 */
async function parseAndValidate(buffer: Buffer): Promise<PreviewRow[]> {
  // Type cast required: read-excel-file 9.x TypeScript types use new-style Schema
  // but the runtime (and this codebase) use the legacy prop-based schema format
  // (see xlsxSchema definition above). The cast is safe — runtime behavior is correct.
  // Type cast required: read-excel-file 9.x TypeScript types use new-style Schema
  // but the runtime (and this codebase) use the legacy prop-based schema format
  // (see xlsxSchema definition above). The double-cast through `unknown` is safe —
  // runtime behavior is correct and tests mock this call.
  type XlsxFn = (
    input: Buffer,
    options: { schema: Record<string, unknown> }
  ) => Promise<{ rows: Record<string, unknown>[]; errors: Array<{ row: number; column: string; error: string; value: unknown }> }>;
  const { rows: rawRows, errors: parserErrors } = await (readXlsxFile as unknown as XlsxFn)(buffer, {
    schema: xlsxSchema,
  });

  // Index parser errors by 1-based row number for O(1) lookup
  const parserErrorsByRow = new Map<
    number,
    Array<{ path: string; message: string }>
  >();
  for (const pe of parserErrors) {
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

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i] as Record<string, unknown>;
    const rowIndex = i + 1; // 1-based

    // D-16: inject 'Premix' default + date conversion before Zod validation
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
 * Returns the set of orderNumbers from `orderNumbers` that already exist in
 * the `production_orders` table — used to flag file-vs-DB duplicates.
 *
 * Single batch SELECT: Drizzle parameterizes the inArray() call, so there is
 * no SQL injection vector even for operator-supplied values (T-33-Input).
 *
 * Short-circuit: `inArray(col, [])` is a Drizzle quirk that generates invalid
 * SQL (`col IN ()`). We guard against it explicitly by returning an empty Set
 * when the input array is empty — avoids a runtime error and an unnecessary
 * round-trip to the DB.
 */
async function detectDbDuplicates(orderNumbers: string[]): Promise<Set<string>> {
  if (orderNumbers.length === 0) return new Set();

  const existing = await db
    .select({ orderNumber: productionOrders.orderNumber })
    .from(productionOrders)
    .where(inArray(productionOrders.orderNumber, orderNumbers));

  return new Set(existing.map((r) => r.orderNumber));
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
    // FormData.get returns a string when the entry was set as a string, or a File/Blob.
    // We accept any non-string, non-null value (Blob/File) from FormData.
    if (!file || typeof file === 'string') {
      return { ok: false, code: 'validation', message: 'No file provided.' };
    }
    const fileObj = file as { size: number; arrayBuffer: () => Promise<ArrayBuffer> };

    // T-33-DoS layer 2: server-side size guard
    if (fileObj.size > MAX_IMPORT_BYTES) {
      return { ok: false, code: 'validation', message: 'File exceeds 2MB limit.' };
    }

    // Convert File/Blob to Buffer for read-excel-file.
    // Note: jsdom (used in tests) does not implement Blob.prototype.arrayBuffer();
    // in production Next.js server runtime, Blob/File always has arrayBuffer().
    // The cast covers both environments.
    const rawArrayBuffer = await (fileObj.arrayBuffer as (() => Promise<ArrayBuffer>) | undefined)?.();
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
  } catch {
    return { ok: false, code: 'server', message: 'Failed to parse XLSX file.' };
  }
}
