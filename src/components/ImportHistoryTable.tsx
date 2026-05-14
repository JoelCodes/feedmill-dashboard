/**
 * ImportHistoryTable — presents ImportBatch[] from getImportBatches.
 *
 * D-16: Import history page shows the N most recent imports (caller passes limit: 10).
 * UI-SPEC §8: Table with columns: File Name, Rows, Imported By, Date.
 * Empty state: "No imports yet" (locked copywriting per UI-SPEC).
 *
 * Server component — no event handlers or client state required.
 * The caller (ImportFlow) passes batches received from the page RSC.
 */
import type { ImportBatch } from "@/db/schema/imports";

// ─── Date formatter — UI-SPEC §8 (locked format) ────────────────────────────

/**
 * Formats an ImportBatch.importedAt Date per UI-SPEC §8 copywriting:
 * "May 14, 2026, 2:34 PM"-style output using locked Intl.DateTimeFormat options.
 */
function formatBatchDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  batches: ImportBatch[];
};

export default function ImportHistoryTable({ batches }: Props): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-bold text-[var(--text-primary)]">Recent Imports</h3>

      {batches.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-secondary)]">No imports yet</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--divider)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--divider)] bg-[var(--bg-page)]">
                <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-secondary)]">
                  File Name
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-secondary)]">
                  Rows
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-secondary)]">
                  Imported By
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-secondary)]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr
                  key={batch.id}
                  className="border-b border-[var(--divider)] last:border-0 hover:bg-[var(--bg-page)]"
                >
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">{batch.fileName}</td>
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">{batch.rowCount}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--text-secondary)]">
                    {batch.importedBy}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                    {formatBatchDate(batch.importedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
