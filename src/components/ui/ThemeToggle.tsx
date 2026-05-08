"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className="inline-flex overflow-hidden rounded-[var(--radius-md)] border border-[var(--divider)]"
    >
      {options.map((option, idx) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex items-center gap-1 px-4 py-2 text-sm transition-colors",
              idx < options.length - 1 && "border-r border-[var(--divider)]",
              isActive
                ? "bg-[var(--primary)] font-semibold text-[var(--text-white)]"
                : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
