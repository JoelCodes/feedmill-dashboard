export default function DetailsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 rounded-[15px] bg-white p-[21px]">
      {/* Header Area */}
      <div className="flex flex-col gap-2">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="h-px bg-[var(--divider)]" />

      {/* Info Grid */}
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="h-px bg-[var(--divider)]" />

      {/* Timeline Section */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-gray-200" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-[var(--divider)]" />

      {/* Change History Section */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
