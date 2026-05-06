interface BinGaugeProps {
  fillPercentage: number;
  locationCode: string;
  feedType: string;
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
 * - Dark for low fill (< 25%) for readability
 */
function getTextColor(percentage: number): string {
  if (percentage >= 25) {
    return 'text-white';
  }
  return 'text-[#2d3748]';
}

/**
 * Clamp value to 0-100 range to prevent CSS overflow (T-15-02 mitigation).
 */
function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * BinGauge - Vertical tank gauge component showing bin fill level.
 *
 * Displays fill percentage visually with color indicators:
 * - Green: normal (>25%)
 * - Yellow: low (10-25%)
 * - Red: critical (<10%)
 */
export function BinGauge({ fillPercentage, locationCode, feedType }: BinGaugeProps) {
  const clampedPercentage = clampPercentage(fillPercentage);
  const fillHeight = (clampedPercentage / 100) * 66; // 66px max fill height within gauge
  const thresholdColor = getThresholdColor(clampedPercentage);
  const textColor = getTextColor(clampedPercentage);

  return (
    <div
      data-testid="bin-gauge"
      className="flex flex-col items-center gap-2 w-[60px]"
    >
      {/* Gauge container */}
      <div
        data-testid="gauge-container"
        className="relative w-[40px] h-[70px] rounded-lg border-2 border-[#e2e8f0]"
      >
        {/* Fill bar - anchored to bottom, grows upward */}
        <div
          data-testid="fill-bar"
          className={`absolute bottom-[2px] left-[2px] w-[36px] rounded-b-[6px] ${thresholdColor}`}
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
      <span className="text-[10px] font-bold text-[#2d3748] text-center">{locationCode}</span>
      <span className="text-[10px] text-[#a0aec0] text-center">{feedType}</span>
    </div>
  );
}
