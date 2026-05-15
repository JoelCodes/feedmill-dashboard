/**
 * Zod validation schema for one row of a Book1.xlsx-format production order import file.
 *
 * Source-of-truth decisions:
 * - D-14: Zod is the canonical runtime-validation library for v2.0+. No yup/joi alternatives.
 *   Schema is defined here (not co-located in import.ts) to avoid 'use server' co-location
 *   ambiguity (Pitfall 2: files marked 'use server' have different import semantics).
 * - D-15: Required fields: orderNumber, customer, product, weightLbs, deliveryTime,
 *   formulaType, millLine. Nullable optionals: textureType, lineCode. Rows missing any
 *   required field fail validation with a per-field error message (path-named issue).
 * - D-16: Book1.xlsx has no Mill Line column. Every imported row defaults to 'Premix'.
 *   This is a v2.0 limitation; mill line reassignment is deferred to v2.1+.
 *
 * CR-01 number/string boundary:
 * ---------------------------------
 * `weightLbs` is validated here as z.number().positive() because read-excel-file with
 * `type: Number` returns a JS number for numeric cells. The Drizzle `numeric(10,2)` column
 * expects a string at insert time (CR-01 boundary from src/db/schema/orders.ts).
 * The number-to-string conversion (`.toString()`) belongs in the action body
 * (src/actions/import.ts, plans 33-05/33-06), NOT in this schema. This separation
 * keeps the validator boundary clean and avoids masking a contract violation if the
 * upstream parser changes shape.
 *
 * .nullish() vs .nullable() for optional fields (RESEARCH.md Pitfall 8):
 * -------------------------------------------------------------------------
 * read-excel-file returns `undefined` for absent XLSX cells. `z.string().nullable()`
 * rejects `undefined` — rows with absent textureType/lineCode would fail validation
 * unexpectedly. `z.string().nullish()` accepts BOTH `null` AND `undefined`, matching
 * the actual read-excel-file output shape for absent cells.
 */
import { z } from 'zod';

export const productionOrderImportSchema = z.object({
  orderNumber: z.string().min(1, 'Document Number is required'),   // D-15: required
  customer: z.string().min(1, 'Customer is required'),             // D-15: required
  product: z.string().min(1, 'Product is required'),               // D-15: required
  // WR-07: cap at numeric(10,2) maximum (99,999,999.99). Without the cap a row
  // with an oversized weight passes Zod, then fails at the DB layer with a generic
  // "numeric field overflow" caught as `error: String(err)` in the per-row result.
  // The operator sees a cryptic Postgres error in the UI instead of a clean
  // validation message. Bound the value at the schema layer where we already
  // know the column's precision (Phase 32 D-12 — numeric(10, 2)).
  weightLbs: z
    .number()
    .positive('Weight must be positive')
    .max(99_999_999.99, 'Weight exceeds maximum (99,999,999.99 lbs).'), // D-15: required; CR-01: number here, string at DB insert
  deliveryTime: z.string().min(1, 'Early Delivery Date is required'), // D-15: required
  formulaType: z.string().min(1, 'Formula Type is required'),      // D-15: required
  millLine: z.enum(['Premix', 'Excel', 'CGM']).default('Premix'),  // D-16: Book1.xlsx has no Mill Line column - defaults to 'Premix' at parse time
  textureType: z.string().nullish(),                               // D-15: nullable (.nullish handles undefined too — Pitfall 8)
  lineCode: z.string().nullish(),                                  // D-15: nullable (.nullish handles undefined too — Pitfall 8)
  // D-05: YYYY-MM-DD string mapped from the Book1.xlsx "Early Delivery Date" column.
  earlyDeliveryDate: z.string().nullish(),                         // D-05: YYYY-MM-DD or null; .nullish handles undefined (absent cell)
});

export type ProductionOrderImportRow = z.infer<typeof productionOrderImportSchema>;
