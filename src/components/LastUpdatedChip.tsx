'use client';

/**
 * LastUpdatedChip — Relative-time chip + manual refresh button.
 *
 * PROD-11 / D-20: The header strip shows a 'last updated' indicator that
 * ticks up in real time (5s tick) and resets after a manual refresh.
 * Chip + refresh icon live in the top-right of the board header strip per UI-SPEC §1.
 *
 * The 5-second tick forces a re-render so the relative-time label stays fresh
 * without needing a full server refresh.
 *
 * Manual refresh: uses useRouter().refresh() which triggers a server-side
 * re-render via Next.js App Router. The button disables itself during the
 * refresh to prevent click-spam (T-34-03-06: DoS mitigation).
 *
 * Analog: NotificationDropdown.tsx formatTimestamp (lines 42-53) + Button component.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Format a timestamp into a relative-time string.
 * Buckets: seconds (<60s), minutes (<60m), hours (>=60m).
 * UI-SPEC §1 copywriting: "Updated Xs ago" / "Updated Xm ago" / "Updated Xh ago".
 */
function formatRelative(timestamp: Date): string {
  const diff = Date.now() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

interface LastUpdatedChipProps {
  lastUpdated: Date;
}

export default function LastUpdatedChip({ lastUpdated }: LastUpdatedChipProps) {
  // tick increments every 5 seconds to force a re-render and update the relative time
  const [tick, setTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // 5-second tick — T-34-03-06: single interval, cleaned up on unmount
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  // Suppress unused variable warning — tick is used to drive re-renders
  void tick;

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    // Heuristic spinner duration: 600ms minimum feels responsive without waiting
    // for the router.refresh() to settle (no promise API in useRouter).
    // The next server render will update the lastUpdated prop via the parent.
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--text-muted)]">
        {formatRelative(lastUpdated)}
      </span>
      <Button
        variant="ghost"
        size="sm"
        loading={isRefreshing}
        aria-label="Refresh"
        onClick={handleRefresh}
        icon={<RotateCcw className="h-4 w-4" />}
      />
    </div>
  );
}
