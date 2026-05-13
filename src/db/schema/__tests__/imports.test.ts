import { importBatches } from '../imports';
import type { ImportBatch, NewImportBatch } from '../imports';

describe('src/db/schema/imports.ts exports', () => {
  it('exports importBatches pgTable', () => {
    expect(importBatches).toBeDefined();
  });

  it('ImportBatch and NewImportBatch are exported (type-level check)', () => {
    // Compile-time only — if this file compiles, the types are exported.
    const _selectCheck: ImportBatch | undefined = undefined;
    const _insertCheck: NewImportBatch | undefined = undefined;
    expect(true).toBe(true);
  });
});
