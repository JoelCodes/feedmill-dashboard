import { Search, Bell, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="flex w-full items-center justify-between">
      {/* Left Side - Breadcrumb */}
      <div className="flex flex-col gap-0.5">
        <div className="text-text-secondary flex items-center gap-1 text-xs">
          <span>Pages</span>
          <span>/</span>
          <span className="text-text-primary">Dashboard</span>
        </div>
        <h1 className="text-text-primary text-sm font-bold">Dashboard</h1>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
          <Search className="text-text-secondary h-4 w-4" />
          <input
            type="text"
            placeholder="Type here..."
            className="placeholder:text-text-secondary w-32 bg-transparent text-xs outline-none"
          />
        </div>

        {/* Icons */}
        <button className="rounded-lg p-2 transition-colors hover:bg-white/50">
          <Settings className="text-text-secondary h-4 w-4" />
        </button>
        <button className="rounded-lg p-2 transition-colors hover:bg-white/50">
          <Bell className="text-text-secondary h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
