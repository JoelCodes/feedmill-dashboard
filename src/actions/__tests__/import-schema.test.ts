/**
 * RED tests for productionOrderImportSchema (plan 33-03)
 * These tests define the behavior contract for the Zod import schema
 * covering D-14, D-15, and D-16 from CONTEXT.md decisions.
 *
 * No mocks needed — Zod is pure (no DB, no server actions).
 */
import { productionOrderImportSchema } from '../import-schema';
import type { ProductionOrderImportRow } from '../import-schema';

// Type-check line: verifies ProductionOrderImportRow export at compile time.
// If the type export is missing, `npx tsc --noEmit` will fail here.
const _typeCheck: ProductionOrderImportRow['orderNumber'] = 'compile-time-only';

const validRow = {
  orderNumber: 'ORD-001',
  customer: 'Farm Co',
  product: 'Feed A',
  weightLbs: 6000,
  deliveryTime: '2025-08-15',
  formulaType: 'BRD',
  millLine: 'Premix' as const,
  textureType: null,
  lineCode: null,
};

describe('productionOrderImportSchema', () => {
  // Test 1: Happy path — accepts a valid row with all fields
  it('accepts a valid row with ALL required fields', () => {
    const result = productionOrderImportSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  // Test 2: Rejects missing customer
  it('rejects missing customer — error path includes "customer"', () => {
    const { customer: _customer, ...withoutCustomer } = validRow;
    const result = productionOrderImportSchema.safeParse(withoutCustomer);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'customer')).toBe(true);
    }
  });

  // Test 3: Rejects missing orderNumber
  it('rejects missing orderNumber — error path includes "orderNumber"', () => {
    const { orderNumber: _orderNumber, ...withoutOrderNumber } = validRow;
    const result = productionOrderImportSchema.safeParse(withoutOrderNumber);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'orderNumber')).toBe(true);
    }
  });

  // Test 4: Rejects missing product
  it('rejects missing product — error path includes "product"', () => {
    const { product: _product, ...withoutProduct } = validRow;
    const result = productionOrderImportSchema.safeParse(withoutProduct);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'product')).toBe(true);
    }
  });

  // Test 5: Rejects missing weightLbs
  it('rejects missing weightLbs — error path includes "weightLbs"', () => {
    const { weightLbs: _weightLbs, ...withoutWeightLbs } = validRow;
    const result = productionOrderImportSchema.safeParse(withoutWeightLbs);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'weightLbs')).toBe(true);
    }
  });

  // Test 6: Rejects missing deliveryTime
  it('rejects missing deliveryTime — error path includes "deliveryTime"', () => {
    const { deliveryTime: _deliveryTime, ...withoutDeliveryTime } = validRow;
    const result = productionOrderImportSchema.safeParse(withoutDeliveryTime);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'deliveryTime')).toBe(true);
    }
  });

  // Test 7: Rejects missing formulaType
  it('rejects missing formulaType — error path includes "formulaType"', () => {
    const { formulaType: _formulaType, ...withoutFormulaType } = validRow;
    const result = productionOrderImportSchema.safeParse(withoutFormulaType);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'formulaType')).toBe(true);
    }
  });

  // Test 8: Rejects weightLbs: 0 with "Weight must be positive" message (D-15)
  it('rejects weightLbs: 0 with message "Weight must be positive"', () => {
    const result = productionOrderImportSchema.safeParse({ ...validRow, weightLbs: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const weightIssue = result.error.issues.find((i) => i.path[0] === 'weightLbs');
      expect(weightIssue?.message).toBe('Weight must be positive');
    }
  });

  // Test 9: Rejects weightLbs: -100 with "Weight must be positive" message (D-15)
  it('rejects weightLbs: -100 with message "Weight must be positive"', () => {
    const result = productionOrderImportSchema.safeParse({ ...validRow, weightLbs: -100 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const weightIssue = result.error.issues.find((i) => i.path[0] === 'weightLbs');
      expect(weightIssue?.message).toBe('Weight must be positive');
    }
  });

  // Test 10: Accepts weightLbs: 0.01 (smallest valid positive number for numeric(10,2))
  it('accepts weightLbs: 0.01 (smallest valid positive number)', () => {
    const result = productionOrderImportSchema.safeParse({ ...validRow, weightLbs: 0.01 });
    expect(result.success).toBe(true);
  });

  // Test 11: Accepts row with textureType: null AND lineCode: null (explicit nulls per D-15)
  it('accepts row with textureType: null AND lineCode: null (explicit nulls per D-15)', () => {
    const result = productionOrderImportSchema.safeParse({
      ...validRow,
      textureType: null,
      lineCode: null,
    });
    expect(result.success).toBe(true);
  });

  // Test 12: Accepts row with textureType ABSENT (undefined) AND lineCode absent
  // RESEARCH.md §Pitfall 8: read-excel-file returns undefined for absent cells
  // .nullish() accepts both null and undefined; .nullable() would reject undefined
  it('accepts row with textureType absent (undefined) AND lineCode absent (undefined) — Pitfall 8', () => {
    const { textureType: _textureType, lineCode: _lineCode, ...withoutOptionals } = validRow;
    const result = productionOrderImportSchema.safeParse(withoutOptionals);
    expect(result.success).toBe(true);
  });

  // Test 13: millLine defaults to 'Premix' when omitted from input (D-16)
  it("millLine defaults to 'Premix' when omitted from input (D-16: Book1.xlsx has no Mill Line column)", () => {
    const { millLine: _millLine, ...withoutMillLine } = validRow;
    const result = productionOrderImportSchema.safeParse(withoutMillLine);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.millLine).toBe('Premix');
    }
  });

  // Test 14: millLine enum — accepts 'Excel', 'Premix', 'CGM'
  it("accepts all valid millLine values: 'Excel', 'Premix', 'CGM'", () => {
    const premixResult = productionOrderImportSchema.safeParse({ ...validRow, millLine: 'Premix' });
    const excelResult = productionOrderImportSchema.safeParse({ ...validRow, millLine: 'Excel' });
    const cgmResult = productionOrderImportSchema.safeParse({ ...validRow, millLine: 'CGM' });

    expect(premixResult.success).toBe(true);
    expect(excelResult.success).toBe(true);
    expect(cgmResult.success).toBe(true);
  });

  // Test 15: millLine: 'InvalidLine' is rejected (Zod enum constraint)
  it("rejects millLine: 'InvalidLine' (enum constraint)", () => {
    const result = productionOrderImportSchema.safeParse({ ...validRow, millLine: 'InvalidLine' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'millLine')).toBe(true);
    }
  });

  // Test 16: ProductionOrderImportRow type compiles
  // The _typeCheck declaration above ensures this type is exported and accessible.
  // If the type is missing, TypeScript compilation will fail.
  it('ProductionOrderImportRow type is exported and usable (compile-time check via _typeCheck)', () => {
    // If _typeCheck compiled without error, this test passes trivially.
    expect(typeof _typeCheck).toBe('string');
  });
});
