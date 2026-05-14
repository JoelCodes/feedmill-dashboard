/**
 * Tests for ImportFlow — plan 34-07.
 *
 * Tests 5-12: three-phase client wrapper for XLSX bulk import.
 *   - Test 5: entry phase renders drop zone with correct text + file input
 *   - Test 6: file size > MAX_IMPORT_BYTES → error message, previewImportAction NOT called
 *   - Test 7: drop event with valid file → previewImportAction called with FormData
 *   - Test 8: preview phase after successful previewImportAction response
 *   - Test 9: per-row Skip default for duplicate; Overwrite radio toggle updates state
 *   - Test 10: commit flow → commitImportAction called; success transitions to committed phase
 *   - Test 11: cancel from preview → returns to entry phase
 *   - Test 12: commit failure → inline error, no transition to committed
 *
 * Test 16 (ImportDecisions shape match):
 *   - Type-level assertion ensures decisions passed to commitImportAction
 *     match the ImportDecisions type from src/actions/import.ts.
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import type { ImportDecisions } from "@/actions/import";

// Type-level assertion (Test 16) — if ImportDecisions type drifts from Phase 33's
// export, `npx tsc --noEmit` will fail. This import proves the shape is checked
// at compile time without executing the server action in the test environment.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typecheck_import: ImportDecisions = {
  skipRows: [],
  overwriteRows: [],
};

import { MAX_IMPORT_BYTES } from "@/lib/import-constants";

const mockPreviewImportAction = jest.fn();
const mockCommitImportAction = jest.fn();

jest.mock("@/actions/import", () => ({
  previewImportAction: (...args: unknown[]) => mockPreviewImportAction(...args),
  commitImportAction: (...args: unknown[]) => mockCommitImportAction(...args),
}));

import ImportFlow from "./ImportFlow";
import type { ImportBatch } from "@/db/schema/imports";

const EMPTY_BATCHES: ImportBatch[] = [];

const VALID_PREVIEW = {
  ok: true as const,
  summary: {
    rowCount: 3,
    totalWeight: 4500,
    validCount: 2,
    duplicateCount: 1,
    errorCount: 0,
  },
  rows: [
    {
      rowIndex: 1,
      orderNumber: 'ORD-001',
      customer: 'Acme Corp',
      product: 'Widget A',
      weightLbs: 1500,
      deliveryTime: '2026-05-20',
      formulaType: 'F1',
      millLine: 'Premix' as const,
      textureType: null,
      lineCode: null,
      isDuplicate: false,
    },
    {
      rowIndex: 2,
      orderNumber: 'ORD-002',
      customer: 'Beta Inc',
      product: 'Widget B',
      weightLbs: 1500,
      deliveryTime: '2026-05-21',
      formulaType: 'F2',
      millLine: 'Premix' as const,
      textureType: null,
      lineCode: null,
      isDuplicate: true,
      duplicateOf: 'db',
    },
    {
      rowIndex: 3,
      orderNumber: 'ORD-003',
      customer: 'Gamma Ltd',
      product: 'Widget C',
      weightLbs: 1500,
      deliveryTime: '2026-05-22',
      formulaType: 'F3',
      millLine: 'Premix' as const,
      textureType: null,
      lineCode: null,
      isDuplicate: false,
    },
  ],
};

beforeEach(() => {
  mockPreviewImportAction.mockReset();
  mockCommitImportAction.mockReset();
});

describe("ImportFlow", () => {
  it("Test 5: entry phase renders drop zone with primary text and file input", () => {
    render(<ImportFlow batches={EMPTY_BATCHES} canEdit={true} />);

    expect(screen.getByText("Drop your Excel file here")).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.accept).toBe(".xlsx");
  });

  it("Test 6 (D-17): file size > MAX_IMPORT_BYTES shows error; previewImportAction NOT called", async () => {
    render(<ImportFlow batches={EMPTY_BATCHES} canEdit={true} />);

    const oversizeFile = new File(
      [new ArrayBuffer(MAX_IMPORT_BYTES + 1)],
      "big.xlsx",
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [oversizeFile] } });
    });

    expect(screen.getByText("File exceeds 2 MB limit. Please upload a smaller file.")).toBeInTheDocument();
    expect(mockPreviewImportAction).not.toHaveBeenCalled();
  });

  it("Test 7: drop event with valid file calls previewImportAction with FormData", async () => {
    mockPreviewImportAction.mockResolvedValue(VALID_PREVIEW);

    render(<ImportFlow batches={EMPTY_BATCHES} canEdit={true} />);

    const validFile = new File(
      ["xlsx content"],
      "Book1.xlsx",
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );

    const dropZone = screen.getByText("Drop your Excel file here").closest("div");
    expect(dropZone).not.toBeNull();

    await act(async () => {
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [validFile] },
      });
    });

    await waitFor(() => {
      expect(mockPreviewImportAction).toHaveBeenCalledTimes(1);
    });

    const [calledFormData] = mockPreviewImportAction.mock.calls[0] as [FormData];
    expect(calledFormData).toBeInstanceOf(FormData);
    expect(calledFormData.get("file")).toEqual(validFile);
  });

  it("Test 8: preview phase shows summary bar + preview table + Commit/Cancel buttons", async () => {
    mockPreviewImportAction.mockResolvedValue(VALID_PREVIEW);

    render(<ImportFlow batches={EMPTY_BATCHES} canEdit={true} />);

    const validFile = new File(["xlsx"], "Book1.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    await waitFor(() => {
      // Summary bar shows row count
      expect(screen.getByText(/3 rows/)).toBeInTheDocument();
    });

    // Column headers for the preview table
    expect(screen.getByText("Document Number")).toBeInTheDocument();

    // Commit and Cancel buttons
    expect(screen.getByRole("button", { name: /commit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("Test 9 (D-18): duplicate row defaults to Skip; Overwrite radio toggle updates state", async () => {
    mockPreviewImportAction.mockResolvedValue(VALID_PREVIEW);

    render(<ImportFlow batches={EMPTY_BATCHES} canEdit={true} />);

    const validFile = new File(["xlsx"], "Book1.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/3 rows/)).toBeInTheDocument();
    });

    // Find Skip radio for the duplicate row (rowIndex 2 is the duplicate)
    const skipRadios = screen.getAllByRole("radio", { name: /skip/i });
    expect(skipRadios.length).toBeGreaterThanOrEqual(1);
    // The duplicate row's Skip radio should be checked by default
    expect(skipRadios[0]).toBeChecked();

    // Find Overwrite radio and toggle it
    const overwriteRadios = screen.getAllByRole("radio", { name: /overwrite/i });
    expect(overwriteRadios.length).toBeGreaterThanOrEqual(1);

    await act(async () => {
      fireEvent.click(overwriteRadios[0]);
    });

    await waitFor(() => {
      expect(overwriteRadios[0]).toBeChecked();
    });
  });

  it("Test 10: click Commit → commitImportAction called; on success → committed phase shown", async () => {
    mockPreviewImportAction.mockResolvedValue(VALID_PREVIEW);
    mockCommitImportAction.mockResolvedValue({
      ok: true,
      batchId: 'batch_abc123',
      committedCount: 2,
      failedCount: 0,
      results: [],
    });

    render(<ImportFlow batches={EMPTY_BATCHES} canEdit={true} />);

    const validFile = new File(["xlsx"], "Book1.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /commit/i })).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /commit/i }));
    });

    await waitFor(() => {
      expect(mockCommitImportAction).toHaveBeenCalledTimes(1);
    });

    // Verify decisions argument matches ImportDecisions shape
    const [, decisions] = mockCommitImportAction.mock.calls[0] as [FormData, ImportDecisions];
    expect(Array.isArray(decisions.skipRows)).toBe(true);
    expect(Array.isArray(decisions.overwriteRows)).toBe(true);

    // Should transition to committed phase (confirmation visible)
    await waitFor(() => {
      expect(screen.getByText(/import complete/i)).toBeInTheDocument();
    });
  });

  it("Test 11: click Cancel from preview → returns to entry phase", async () => {
    mockPreviewImportAction.mockResolvedValue(VALID_PREVIEW);

    render(<ImportFlow batches={EMPTY_BATCHES} canEdit={true} />);

    const validFile = new File(["xlsx"], "Book1.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    });

    // Should return to entry phase
    await waitFor(() => {
      expect(screen.getByText("Drop your Excel file here")).toBeInTheDocument();
    });
  });

  it("Test 12: commit failure → inline error shown; NOT transitioned to committed phase", async () => {
    mockPreviewImportAction.mockResolvedValue(VALID_PREVIEW);
    mockCommitImportAction.mockResolvedValue({
      ok: false,
      code: 'validation',
      message: 'Invalid file format.',
    });

    render(<ImportFlow batches={EMPTY_BATCHES} canEdit={true} />);

    const validFile = new File(["xlsx"], "Book1.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /commit/i })).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /commit/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Invalid file format.")).toBeInTheDocument();
    });

    // Should NOT have transitioned to committed phase
    expect(screen.queryByText(/import complete/i)).toBeNull();
  });
});
