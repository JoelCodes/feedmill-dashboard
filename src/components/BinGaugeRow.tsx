import { Bin } from '@/types/bin';
import { Gauge } from '@/components/ui/Gauge';

interface BinGaugeRowProps {
  bins: Bin[];
}

/**
 * BinGaugeRow - Container component for displaying multiple bin gauges.
 *
 * Renders bins in a horizontal row with bottom alignment.
 * Returns null when bins array is empty (D-01 - hide section entirely).
 */
export function BinGaugeRow({ bins }: BinGaugeRowProps) {
  // D-01: Hide entirely when no bins
  if (bins.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="bin-gauge-row"
      className="flex flex-row gap-6 items-end"
    >
      {bins.map((bin) => (
        <Gauge
          key={bin.id}
          fillPercentage={bin.fillPercentage}
          label={bin.locationCode}
          sublabel={bin.feedType}
        />
      ))}
    </div>
  );
}
