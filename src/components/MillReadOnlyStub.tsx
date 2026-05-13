'use client';

/**
 * Phase 31 placeholder stub for the mill production dashboard.
 *
 * Receives a server-computed `canEdit` boolean from `src/app/page.tsx`
 * and renders a mode indicator. The real three-column production board
 * replaces this component in Phase 34.
 *
 * Presentational only — see CONTEXT.md D-03 for the server-only
 * enforcement boundary and Phase 33 for where mutating server actions
 * own the real authorization gate.
 *
 * Markers consumed by Plan 31-03's E2E smoke spec:
 *   - data-testid="mill-stub" — the wrapper for the placeholder content
 *   - data-testid="mill-mode" + data-mode attribute — the primary
 *     assertion target
 */
export default function MillReadOnlyStub({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center" data-testid="mill-stub">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Mill Production Dashboard
        </h1>
        <p
          className="mt-2 text-sm text-text-secondary"
          data-testid="mill-mode"
          data-mode={canEdit ? 'edit' : 'read-only'}
        >
          {canEdit ? 'Edit mode (mill_operator)' : 'Read-only mode'}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          Production UI launching in Phase 34.
        </p>
      </div>
    </div>
  );
}
