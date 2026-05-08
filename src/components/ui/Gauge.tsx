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
  const fillHeight = (clampedPercentage / 100) * 66; // 66px max fill height within gauge
  const thresholdColor = getThresholdColor(clampedPercentage);
  const textColor = getTextColor(clampedPercentage);

  return (
    <div
      data-testid="gauge"
      className="flex flex-col items-center gap-2 w-[var(--gauge-width)]"
    >
      {/* Gauge container */}
      <div
        data-testid="gauge-container"
        className="relative w-[var(--gauge-container-w)] h-[var(--gauge-container-h)] rounded-lg border-2 border-[var(--divider)]"
      >
        {/* Fill bar - anchored to bottom, grows upward */}
        <div
          data-testid="fill-bar"
          className={`absolute bottom-[var(--gauge-fill-inset)] left-[var(--gauge-fill-inset)] w-[var(--gauge-fill-width)] rounded-b-[var(--gauge-fill-radius)] ${thresholdColor}`}
          style={{ height: `${fillHeight}px` }}
        />
        {/* Percentage text - centered in gauge */}
        <span
          className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${textColor}`}
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
