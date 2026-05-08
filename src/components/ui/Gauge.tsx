export interface GaugeProps {
  /** Fill percentage (0-100) */
  fillPercentage: number;
  /** Primary label below gauge */
  label: string;
  /** Secondary label below primary label */
  sublabel?: string;
}

/**
 * Get threshold color based on fill percentage.
 * - Green (success): > 25%
 * - Yellow (warning): 10-25%
 * - Red (error): < 10%
 */
function getThresholdColor(percentage: number): string {
  if (percentage > 25) {
    return 'bg-[var(--success)]';
  }
  if (percentage >= 10) {
    return 'bg-[var(--warning)]';
  }
  return 'bg-[var(--error)]';
}

/**
 * Get text color based on fill percentage.
 * - White for high fill (>= 25%) for contrast against colored background
 * - Dark (token) for low fill (< 25%) for readability
 */
function getTextColor(percentage: number): string {
  if (percentage >= 25) {
    return 'text-white';
  }
  return 'text-[var(--text-primary)]';
}

/**
 * Clamp value to 0-100 range to prevent CSS overflow (T-15-02 mitigation).
 */
function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Gauge - Vertical gauge component showing fill level with threshold colors.
 *
 * Displays fill percentage visually with color indicators:
 * - Green: normal (>25%)
 * - Yellow: low (10-25%)
 * - Red: critical (<10%)
 */
export function Gauge({ fillPercentage, label, sublabel }: GaugeProps) {
  const clampedPercentage = clampPercentage(fillPercentage);
  const fillHeight = (clampedPercentage / 100) * 85; // 85px max fill height within 100px gauge
  const thresholdColor = getThresholdColor(clampedPercentage);

  return (
    <div
      data-testid="gauge"
      className="flex flex-col items-center gap-2 w-[60px]"
    >
      {/* Gauge container */}
      <div
        data-testid="gauge-container"
        className="relative w-[60px] h-[100px] rounded-[var(--radius-md)] bg-[var(--pending-light)] overflow-hidden"
      >
        {/* Fill bar - anchored to bottom, grows upward */}
        <div
          data-testid="fill-bar"
          className={`absolute bottom-0 left-0 right-0 rounded-[var(--radius-md)] ${thresholdColor}`}
          style={{ height: `${fillHeight}px` }}
        />
        {/* Percentage text - positioned at fill level */}
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white"
        >
          {clampedPercentage}%
        </span>
      </div>

      {/* Labels below gauge - centered */}
      <span className="text-[var(--fs-10)] font-bold text-[var(--text-primary)] text-center">{label}</span>
      {sublabel && (
        <span className="text-[var(--fs-10)] text-[var(--text-secondary)] text-center">{sublabel}</span>
      )}
    </div>
  );
}

// Re-export with old name for backwards compatibility during migration
export { Gauge as BinGauge };
