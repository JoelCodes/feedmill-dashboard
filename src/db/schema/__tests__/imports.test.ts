import { getTableConfig } from 'drizzle-orm/pg-core';
import { importBatches } from '../imports';
import type { ImportBatch, NewImportBatch } from '../imports';

describe('importBatches table contract', () => {
  const cfg = getTableConfig(importBatches);
  const cols = Object.fromEntries(cfg.columns.map((c) => [c.name, c]));

  it('has the 5 required columns (D-06, D-09, D-14)', () => {
    expect(Object.keys(cols).sort()).toEqual(
      ['id', 'file_name', 'row_count', 'imported_by', 'imported_at'].sort()
    );
  });

  it('all columns are NOT NULL', () => {
    for (const name of ['id', 'file_name', 'row_count', 'imported_by', 'imported_at']) {
      expect(cols[name].notNull).toBe(true);
    }
  });

  it('id is uuid primary key with default (D-06)', () => {
    expect(cols.id.primary).toBe(true);
    expect(cols.id.columnType).toBe('PgUUID');
    expect(cols.id.hasDefault).toBe(true);
  });

  it('file_name is text', () => {
    expect(cols.file_name.columnType).toBe('PgText');
  });

  it('row_count is integer', () => {
    expect(cols.row_count.columnType).toBe('PgInteger');
  });

  it('imported_by is text (Clerk user id, no FK — D-09)', () => {
    expect(cols.imported_by.columnType).toBe('PgText');
  });

  it('imported_at is a timestamp with default now() (D-14)', () => {
    expect(cols.imported_at.columnType).toBe('PgTimestamp');
    expect(cols.imported_at.hasDefault).toBe(true);
  });

  it('ImportBatch and NewImportBatch are exported (type-level check)', () => {
    const _selectCheck: ImportBatch | undefined = undefined;
    const _insertCheck: NewImportBatch | undefined = undefined;
    expect(_selectCheck).toBeUndefined();
    expect(_insertCheck).toBeUndefined();
  });
});
