export default function DetailsSkeleton() {
  return (
    <div className="flex-1 bg-white rounded-[15px] p-[21px] flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col gap-2">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="h-px bg-[var(--divider)]" />

      {/* Info Grid */}
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="h-px bg-[var(--divider)]" />

      {/* Timeline Section */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-[var(--divider)]" />

      {/* Change History Section */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
