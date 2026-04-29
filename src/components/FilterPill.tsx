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

  // Colors based on active state
  const bgClass = isActive ? 'bg-primary' : (color?.bg || 'bg-gray-100');
  const textClass = isActive ? 'text-white' : (color?.text || 'text-gray-600');
  const countBgClass = isActive ? 'bg-white/20' : (color?.countBg || 'bg-gray-200');
  const dotBgClass = isActive
    ? (showDot ? 'bg-white' : 'bg-white/60')
    : (showDot ? (dotColor || 'bg-gray-600') : (color?.dot || 'bg-gray-600'));

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
      <span className={`text-[11px] font-bold ${textClass}`}>{label}</span>
      <div className={`${countBgClass} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[10px] font-bold ${textClass}`}>{count}</span>
      </div>
    </button>
  );
}
