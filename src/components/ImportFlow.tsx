'use client';

/**
 * ImportFlow — Three-phase client wrapper for XLSX bulk import.
 *
 * Phases: 'entry' → 'preview' → 'committed'
 *
 * D-15: Bulk import lives at /import (full-page, not a modal).
 * D-17: Client-side file-size guard (≤ MAX_IMPORT_BYTES = 2MB) on input/drop handler.
 *       Locked copywriting: "File exceeds 2 MB limit. Please upload a smaller file."
 * D-18: Per-row Skip/Overwrite radio for duplicates; Skip is the default (safer).
 * D-25: canEdit=false shows read-only notice instead of drop zone.
 * D-21: After commit, ImportHistoryTable refreshes via parent RSC revalidation.
 *
 * Threat model:
 *   T-34-07-07 (DoS): client-side size guard is layer 1 of 3; server re-checks.
 *   T-34-07-08 (EoP): canEdit=false hides drop zone; server enforces requireRole.
 *   T-34-07-CSRF: Next.js 16 server actions enforce same-origin at framework level.
 */

import React, { useState } from 'react';
import {
  previewImportAction,
  commitImportAction,
  type PreviewResult,
  type ImportDecisions,
} from '@/actions/import';
import { MAX_IMPORT_BYTES } from '@/lib/import-constants';
import ImportHistoryTable from '@/components/ImportHistoryTable';
import type { ImportBatch } from '@/db/schema/imports';
import type { PreviewRow, PreviewSummary } from '@/actions/import';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'entry' | 'preview' | 'committed';

type Props = {
  batches: ImportBatch[];
  canEdit: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportFlow({ batches, canEdit }: Props): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('entry');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ summary: PreviewSummary; rows: PreviewRow[] } | null>(null);
  // D-18: row decisions keyed on rowIndex — 'skip' is the default for duplicates
  const [rowDecisions, setRowDecisions] = useState<Record<number, 'skip' | 'overwrite'>>({});
  const [dragOver, setDragOver] = useState(false);
  const [isPending, setIsPending] = useState(false);
  // Store the file for commit re-submission (server must re-parse — D-05 stateless)
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // ── File handler — validates size, calls previewImportAction ──────────────

  async function onFileSelect(file: File) {
    setError(null);
    setIsPending(false);

    // D-17 + T-34-07-07: layer-1 DoS guard (locked copywriting)
    if (file.size > MAX_IMPORT_BYTES) {
      setError('File exceeds 2 MB limit. Please upload a smaller file.');
      return;
    }

    setCurrentFile(file);
    setIsPending(true);

    const formData = new FormData();
    formData.append('file', file);

    const result: PreviewResult = await previewImportAction(formData);
    setIsPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    // Initialize per-row decisions — duplicates default to 'skip' (D-18)
    const initialDecisions: Record<number, 'skip' | 'overwrite'> = {};
    for (const row of result.rows) {
      if (row.isDuplicate) {
        initialDecisions[row.rowIndex] = 'skip';
      }
    }
    setRowDecisions(initialDecisions);
    setPreview({ summary: result.summary, rows: result.rows });
    setPhase('preview');
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void onFileSelect(file);
    }
  }

  // ── Commit handler ─────────────────────────────────────────────────────────

  async function handleCommit() {
    if (!currentFile || !preview) return;
    setError(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append('file', currentFile);

    // Build decisions from rowDecisions state (D-18)
    const decisions: ImportDecisions = {
      skipRows: preview.rows
        .filter(r => r.isDuplicate && rowDecisions[r.rowIndex] !== 'overwrite')
        .map(r => r.rowIndex),
      overwriteRows: preview.rows
        .filter(r => r.isDuplicate && rowDecisions[r.rowIndex] === 'overwrite')
        .map(r => r.rowIndex),
    };

    const result = await commitImportAction(formData, decisions);
    setIsPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setPhase('committed');
  }

  // ── Cancel handler ─────────────────────────────────────────────────────────

  function handleCancel() {
    setPhase('entry');
    setPreview(null);
    setRowDecisions({});
    setError(null);
    setCurrentFile(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Active phase ────────────────────────────────────────────────── */}

      {phase === 'entry' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Bulk Import Orders</h2>

          {!canEdit ? (
            // D-25: read-only mode — canEdit=false hides drop zone
            <div className="rounded-[var(--radius-md)] border border-[var(--divider)] bg-[var(--bg-page)] p-6 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Read-only mode — sign in as mill_operator to import
              </p>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                'flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-md)] border-2 border-dashed p-10 text-center transition-colors',
                dragOver
                  ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]'
                  : 'border-[var(--divider)] hover:border-[var(--primary)]',
              ].join(' ')}
            >
              <p className="text-base font-semibold text-[var(--text-primary)]">
                Drop your Excel file here
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                or click to browse — .xlsx only, max 2 MB
              </p>
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                id="xlsx-upload"
                disabled={isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onFileSelect(file);
                }}
              />
              <label
                htmlFor="xlsx-upload"
                className="cursor-pointer rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {isPending ? 'Processing…' : 'Browse file'}
              </label>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="rounded-[var(--radius-sm)] border border-[var(--error)] bg-[var(--error-light)] px-4 py-2 text-sm text-[var(--error-dark)]">
              {error}
            </p>
          )}
        </div>
      )}

      {phase === 'preview' && preview && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Preview Import</h2>

          {/* Summary bar */}
          <div className="flex gap-4 rounded-[var(--radius-md)] border border-[var(--divider)] bg-[var(--bg-page)] px-4 py-3 text-sm">
            <span className="font-semibold text-[var(--text-primary)]">
              {preview.summary.rowCount} rows
            </span>
            <span className="text-[var(--text-secondary)]">·</span>
            <span className="text-[var(--text-secondary)]">
              {preview.summary.totalWeight.toLocaleString()} lbs total
            </span>
            <span className="text-[var(--text-secondary)]">·</span>
            <span className="text-[var(--text-secondary)]">
              {preview.summary.duplicateCount} duplicates
            </span>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--divider)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--divider)] bg-[var(--bg-page)]">
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)]">Row #</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)]">Document Number</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)]">Customer</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)]">Product</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)]">Weight (lbs)</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)]">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)]">Decision</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowIndex} className="border-b border-[var(--divider)] last:border-0">
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.rowIndex}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{row.orderNumber}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{row.customer}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{row.product}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{row.weightLbs.toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {row.isDuplicate ? (
                        <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-[var(--error-light)] text-[var(--error-dark)]">
                          Duplicate
                        </span>
                      ) : row.errors?.length ? (
                        <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-[var(--error-light)] text-[var(--error-dark)]">
                          Error
                        </span>
                      ) : (
                        <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-[var(--status-completed-bg-22)] text-[var(--status-completed-header)]">
                          Valid
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.isDuplicate && (
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <input
                              type="radio"
                              name={`decision-${row.rowIndex}`}
                              value="skip"
                              aria-label="Skip"
                              checked={(rowDecisions[row.rowIndex] ?? 'skip') === 'skip'}
                              onChange={() => setRowDecisions(prev => ({
                                ...prev,
                                [row.rowIndex]: 'skip',
                              }))}
                            />
                            Skip
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <input
                              type="radio"
                              name={`decision-${row.rowIndex}`}
                              value="overwrite"
                              aria-label="Overwrite"
                              checked={(rowDecisions[row.rowIndex] ?? 'skip') === 'overwrite'}
                              onChange={() => setRowDecisions(prev => ({
                                ...prev,
                                [row.rowIndex]: 'overwrite',
                              }))}
                            />
                            Overwrite
                          </label>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Error message */}
          {error && (
            <p className="rounded-[var(--radius-sm)] border border-[var(--error)] bg-[var(--error-light)] px-4 py-2 text-sm text-[var(--error-dark)]">
              {error}
            </p>
          )}

          {/* Commit + Cancel buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handleCommit()}
              disabled={isPending}
              className="rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? 'Committing…' : 'Commit Import'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--bg-card)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-page)] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'committed' && (
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-md)] border border-[var(--divider)] bg-[var(--bg-page)] p-8 text-center">
          <p className="text-lg font-bold text-[var(--text-primary)]">Import complete!</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Your file has been imported successfully. The history table below has been updated.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--bg-card)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-page)]"
          >
            Back to import
          </button>
        </div>
      )}

      {/* ── Import history — always visible below the active phase ────── */}
      <hr className="my-6 border-[var(--divider)]" />
      <ImportHistoryTable batches={batches} />
    </div>
  );
}
