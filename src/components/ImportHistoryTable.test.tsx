/**
 * Tests for ImportHistoryTable — plan 34-07.
 *
 * Tests 1-4: pure presentational rendering of ImportBatch[] data.
 *   - Test 1: empty batches → "No imports yet" + zero data rows
 *   - Test 2: 3 batches → "Recent Imports" + 4 column headers + 3 data rows
 *   - Test 3: date format via Intl.DateTimeFormat('en-US', { month: 'short', ... })
 *   - Test 4: renders all rows passed (no internal slicing — query handles limit)
 *
 * Tests T9b (plan 34-09): date hydration contract regression.
 *   - Baseline: real Date instance renders without throwing
 *   - Contract pin: string-typed importedAt throws RangeError (documents that
 *     callers MUST hydrate before passing; ImportFlow now enforces this via useMemo)
 */
import { render, screen } from "@testing-library/react";
import ImportHistoryTable from "./ImportHistoryTable";
import type { ImportBatch } from "@/db/schema/imports";

const BATCH_BASE: Omit<ImportBatch, 'id' | 'importedAt'> = {
  fileName: "Book1.xlsx",
  rowCount: 5,
  importedBy: "user_clerk_123",
};

function makeBatch(overrides: Partial<ImportBatch> & { importedAt: Date }): ImportBatch {
  return {
    id: `batch_${Math.random().toString(36).slice(2)}`,
    ...BATCH_BASE,
    ...overrides,
  };
}

describe("ImportHistoryTable", () => {
  it("Test 1: with batches=[], renders 'No imports yet' and zero data rows", () => {
    render(<ImportHistoryTable batches={[]} />);

    expect(screen.getByText("No imports yet")).toBeInTheDocument();
    // No table rows for data
    const rows = screen.queryAllByRole("row");
    // If there's no table at all, queryAllByRole returns []
    // The table should not exist or have zero data rows
    const dataRows = rows.filter(row => row.querySelectorAll('td').length > 0);
    expect(dataRows).toHaveLength(0);
  });

  it("Test 2: with 3 batches, renders 'Recent Imports' + 4 column headers + 3 data rows", () => {
    const batches = [
      makeBatch({ importedAt: new Date("2026-05-14T14:34:00Z") }),
      makeBatch({ importedAt: new Date("2026-05-13T09:00:00Z"), fileName: "orders.xlsx" }),
      makeBatch({ importedAt: new Date("2026-05-12T16:45:00Z"), fileName: "export.xlsx" }),
    ];

    render(<ImportHistoryTable batches={batches} />);

    expect(screen.getByText("Recent Imports")).toBeInTheDocument();

    // 4 column headers
    expect(screen.getByText("File Name")).toBeInTheDocument();
    expect(screen.getByText("Rows")).toBeInTheDocument();
    expect(screen.getByText("Imported By")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();

    // 3 data rows (each with td cells)
    const rows = screen.getAllByRole("row");
    const dataRows = rows.filter(row => row.querySelectorAll('td').length > 0);
    expect(dataRows).toHaveLength(3);
  });

  it("Test 3: date is formatted via Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })", () => {
    const knownDate = new Date("2026-05-14T14:34:00Z");
    const expectedText = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(knownDate);

    render(<ImportHistoryTable batches={[makeBatch({ importedAt: knownDate })]} />);

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it("Test 4: renders all rows when given batches.length > 10 (component does not slice)", () => {
    const batches = Array.from({ length: 12 }, (_, i) =>
      makeBatch({
        importedAt: new Date(`2026-05-${String(i + 1).padStart(2, '0')}T10:00:00Z`),
        fileName: `file_${i + 1}.xlsx`,
      })
    );

    render(<ImportHistoryTable batches={batches} />);

    const rows = screen.getAllByRole("row");
    const dataRows = rows.filter(row => row.querySelectorAll('td').length > 0);
    expect(dataRows).toHaveLength(12);
  });
});

describe('ImportHistoryTable date hydration contract (CR-03 — deep review 2026-05-14)', () => {
  it('renders without throwing when importedAt is a Date (baseline)', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b1',
        fileName: 'Book1.xlsx',
        rowCount: 33,
        importedBy: 'user_abc',
        importedAt: new Date('2026-05-14T19:00:00.000Z'),
      },
    ];
    expect(() => render(<ImportHistoryTable batches={batches} />)).not.toThrow();
    expect(screen.getByText('Book1.xlsx')).toBeInTheDocument();
  });

  it('renders correctly when importedAt is an ISO string (matches RSC serialization)', () => {
    // CR-03: formatBatchDate now accepts Date | string and normalises internally,
    // so any caller — admin pages, embedded widgets, future RSC consumers that
    // bypass ImportFlow — can pass the RSC-serialised string directly without
    // crashing. The previous test pinned the RangeError as a contract; this one
    // pins the corrected contract: string input renders the formatted date.
    const stringBatches = [
      {
        id: 'b1',
        fileName: 'Book1.xlsx',
        rowCount: 33,
        importedBy: 'user_abc',
        importedAt: '2026-05-14T19:00:00.000Z',
      },
    ] as unknown as ImportBatch[];

    expect(() => render(<ImportHistoryTable batches={stringBatches} />)).not.toThrow();
    expect(screen.getByText('Book1.xlsx')).toBeInTheDocument();

    // The same row also renders the formatted date derived from the ISO string.
    const expectedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date('2026-05-14T19:00:00.000Z'));
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('renders the row with an empty date cell when importedAt is unparseable (defensive)', () => {
    const badBatches = [
      {
        id: 'b1',
        fileName: 'Book1.xlsx',
        rowCount: 33,
        importedBy: 'user_abc',
        importedAt: 'not-a-real-date' as unknown as Date,
      },
    ] as unknown as ImportBatch[];

    expect(() => render(<ImportHistoryTable batches={badBatches} />)).not.toThrow();
    // Row is still visible (file name renders) — the date cell falls back to ''
    // rather than crashing the page.
    expect(screen.getByText('Book1.xlsx')).toBeInTheDocument();
  });
});
