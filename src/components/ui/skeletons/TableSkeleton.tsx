export default function TableSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[var(--radius-xl)] bg-[var(--bg-card)] p-[var(--card-padding-lg)] shadow-[var(--shadow-sm)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="h-5 w-32 animate-pulse rounded bg-[var(--divider)]" />
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--divider)]" />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-xl bg-[var(--divider)]" />
        ))}
      </div>

      {/* Table */}
      <div className="flex w-full flex-col">
        {/* Table Header */}
        <div className="flex gap-4 py-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-16 flex-1 animate-pulse rounded bg-[var(--divider)]" />
          ))}
        </div>

        <div className="h-px bg-[var(--divider)]" />

        {/* Table Rows */}
        {[...Array(5)].map((rowIndex) => (
          <div key={rowIndex}>
            <div className="flex items-center gap-4 py-3">
              {/* Column 1: Icon + Text */}
              <div className="flex flex-1 items-center gap-2">
                <div className="h-6 w-6 animate-pulse rounded-md bg-[var(--divider)]" />
                <div className="h-3 w-20 animate-pulse rounded bg-[var(--divider)]" />
              </div>
              {/* Column 2: Text */}
              <div className="flex-1">
                <div className="h-3 w-32 animate-pulse rounded bg-[var(--divider)]" />
              </div>
              {/* Column 3: Text */}
              <div className="flex-1">
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--divider)]" />
              </div>
              {/* Column 4: Text */}
              <div className="flex-1">
                <div className="h-3 w-12 animate-pulse rounded bg-[var(--divider)]" />
              </div>
              {/* Column 5: Badge */}
              <div className="flex-1">
                <div className="h-6 w-20 animate-pulse rounded-lg bg-[var(--divider)]" />
              </div>
            </div>
            {rowIndex < 4 && <div className="h-px bg-[var(--divider)]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
