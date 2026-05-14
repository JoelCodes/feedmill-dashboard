/**
 * DrawerSkeleton — Suspense fallback for the order details drawer.
 *
 * PROD-10: While the order drawer is loading, the operator sees a
 * drawer-shaped loading placeholder of the same width as the populated drawer.
 * D-23: Drawer gets its own Suspense boundary distinct from per-column boundaries.
 * UI-SPEC §7 Loading Skeletons:
 * - 480px wide container
 * - Header block (2 lines)
 * - 6 field rows (label + value pairs)
 * - 3 timeline rows (dot + content)
 *
 * Analog: src/components/ui/skeletons/DetailsSkeleton.tsx
 */
export default function DrawerSkeleton(): JSX.Element {
  return (
    <div className="w-[480px] flex flex-col gap-4 p-6">
      {/* Header block */}
      <div className="flex flex-col gap-2">
        <div className="h-3 w-32 animate-pulse rounded bg-[var(--divider)]" />
        <div className="h-5 w-48 animate-pulse rounded bg-[var(--divider)]" />
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-[var(--divider)]" />

      {/* Field section: 6 label + value rows */}
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--divider)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--divider)]" />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-[var(--divider)]" />

      {/* Timeline section: 3 rows */}
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-2 w-2 rounded-full bg-[var(--divider)] animate-pulse mt-1" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-3 w-32 animate-pulse rounded bg-[var(--divider)]" />
              <div className="h-3 w-48 animate-pulse rounded bg-[var(--divider)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
