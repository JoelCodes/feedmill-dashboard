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
      className="flex w-[var(--gauge-width)] flex-col items-center gap-2"
    >
      {/* Gauge container */}
      <div
        data-testid="gauge-container"
        className="relative h-[var(--gauge-height)] w-[var(--gauge-width)] overflow-hidden rounded-[var(--radius-md)] bg-[var(--pending-light)]"
      >
        {/* Fill bar - anchored to bottom, grows upward */}
        <div
          data-testid="fill-bar"
          className={`absolute right-0 bottom-0 left-0 rounded-[var(--radius-md)] ${thresholdColor}`}
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
      <span className="text-center font-bold text-[var(--fs-10)] text-[var(--text-primary)]">{label}</span>
      {sublabel && (
        <span className="text-center text-[var(--fs-10)] text-[var(--text-secondary)]">{sublabel}</span>
      )}
    </div>
  );
}

// Re-export with old name for backwards compatibility during migration
export { Gauge as BinGauge };
