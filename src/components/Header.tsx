import { Search, Bell, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between w-full">
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
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
          <Search className="w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Type here..."
            className="text-xs bg-transparent outline-none placeholder:text-[var(--text-secondary)] w-32"
          />
        </div>

        {/* Icons */}
        <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
          <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
        <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
          <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>
    </header>
  );
}
