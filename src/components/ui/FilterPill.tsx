export interface FilterPillColorConfig {
  bg: string;
  text: string;
  dot?: string;
  countBg?: string;
}

export interface FilterPillProps {
  label: string;
  count: number;
  color?: FilterPillColorConfig;
  isActive: boolean;
  onClick: () => void;
  showDot?: boolean;
  dotColor?: string;
}

export default function FilterPill({
  label,
  count,
  color,
  isActive,
  onClick,
  showDot,
  dotColor,
}: FilterPillProps) {
  // Only show dot when active AND (showDot=true OR color has dot)
  const hasDot = isActive && (showDot || !!color?.dot);

  // Colors based on active state - TOKEN REPLACEMENTS:
  // bg-gray-100 → bg-[var(--pending-light)]
  // text-gray-600 → text-[var(--text-secondary)]
  // bg-gray-200 → bg-[var(--divider)]
  // bg-gray-600 → bg-[var(--pending)]
  const bgClass = isActive ? 'bg-[var(--primary)]' : (color?.bg || 'bg-[var(--pending-light)]');
  const textClass = isActive ? 'text-white' : (color?.text || 'text-[var(--text-secondary)]');
  const countBgClass = isActive ? 'bg-white/20' : (color?.countBg || 'bg-[var(--divider)]');
  const dotBgClass = isActive
    ? (showDot ? 'bg-white' : 'bg-white/60')
    : (showDot ? (dotColor || 'bg-[var(--pending)]') : (color?.dot || 'bg-[var(--pending)]'));

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${bgClass} rounded-xl px-2.5 py-2 transition-colors hover:opacity-90`}
      aria-pressed={isActive}
      aria-label={`Filter by ${label}, ${count} orders`}
    >
      {hasDot && (
        <div
          data-testid="filter-pill-dot"
          className={`h-2 w-2 rounded-full ${dotBgClass}`}
        />
      )}
      <span className={`text-[var(--text-11)] font-bold ${textClass}`}>{label}</span>
      <div className={`${countBgClass} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[var(--text-10)] font-bold ${textClass}`}>{count}</span>
      </div>
    </button>
  );
}
