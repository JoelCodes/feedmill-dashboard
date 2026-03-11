export default function TableSkeleton() {
  return (
    <div className="flex-1 bg-white rounded-[15px] p-[21px] flex flex-col gap-4 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Table */}
      <div className="flex flex-col w-full">
        {/* Table Header */}
        <div className="flex py-2.5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 h-3 w-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>

        <div className="h-px bg-[var(--divider)]" />

        {/* Table Rows */}
        {[...Array(5)].map((rowIndex) => (
          <div key={rowIndex}>
            <div className="flex py-3 items-center gap-4">
              {/* Column 1: Icon + Text */}
              <div className="flex-1 flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* Column 2: Text */}
              <div className="flex-1">
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* Column 3: Text */}
              <div className="flex-1">
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* Column 4: Text */}
              <div className="flex-1">
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* Column 5: Badge */}
              <div className="flex-1">
                <div className="h-6 w-20 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
            {rowIndex < 4 && <div className="h-px bg-[var(--divider)]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
