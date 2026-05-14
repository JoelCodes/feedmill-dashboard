/**
 * ColumnSkeleton — Suspense fallback for a single mill-line column.
 *
 * PROD-10: While a column's orders are loading, the operator sees a
 * column-shaped loading placeholder (not a layout shift or blank space).
 *
 * UI-SPEC §7 Loading Skeletons:
 * - 3 card-shaped placeholders, h-20 w-full rounded-r-xl
 * - gap-3 between cards
 * - Header skeleton: h-6 w-24 (title) + h-4 w-16 (subtitle)
 *
 * Analog: src/components/ui/skeletons/DetailsSkeleton.tsx
 */
export default function ColumnSkeleton(): JSX.Element {
  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-6 w-24 animate-pulse rounded bg-[var(--divider)]" />
        <div className="h-4 w-16 animate-pulse rounded bg-[var(--divider)]" />
      </div>

      {/* Card skeleton list — 3 placeholders per UI-SPEC §7 */}
      <div className="flex flex-col gap-3">
        <div className="h-20 w-full animate-pulse rounded-r-xl bg-[var(--divider)]" />
        <div className="h-20 w-full animate-pulse rounded-r-xl bg-[var(--divider)]" />
        <div className="h-20 w-full animate-pulse rounded-r-xl bg-[var(--divider)]" />
      </div>
    </div>
  );
}
