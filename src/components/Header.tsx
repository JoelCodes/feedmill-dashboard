import { Search, Bell, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="flex w-full items-center justify-between">
      {/* Left Side - Breadcrumb */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <span>Pages</span>
          <span>/</span>
          <span className="text-[var(--text-primary)]">Dashboard</span>
        </div>
        <h1 className="text-sm font-bold text-[var(--text-primary)]">Dashboard</h1>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
          <Search className="h-4 w-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Type here..."
            className="w-32 bg-transparent text-xs outline-none placeholder:text-[var(--text-secondary)]"
          />
        </div>

        {/* Icons */}
        <button className="rounded-lg p-2 transition-colors hover:bg-white/50">
          <Settings className="h-4 w-4 text-[var(--text-secondary)]" />
        </button>
        <button className="rounded-lg p-2 transition-colors hover:bg-white/50">
          <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
        </button>
      </div>
    </header>
  );
}
