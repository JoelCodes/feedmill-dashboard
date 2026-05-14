'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Canonical polling interval for the production dashboard.
 *
 * PROD-09 / D-19: The dashboard auto-refreshes every 30 seconds.
 * This constant is exported as a single source of truth so Phase 35 KPI
 * surfaces can import it and reuse the same cadence without drift.
 *
 * @example
 * import { REFRESH_INTERVAL_MS } from '@/hooks/useProductionPolling';
 */
export const REFRESH_INTERVAL_MS = 30_000;

/**
 * Mounts a 30-second polling interval that calls `router.refresh()` to
 * re-render the production dashboard RSC against the latest DB state.
 *
 * PROD-09 / D-19: Polling cadence locked at {@link REFRESH_INTERVAL_MS}.
 * Navigating away unmounts the hook, which clears the interval — no
 * background timers are left running after route change.
 *
 * @example
 * // Inside ProductionDashboard.tsx
 * useProductionPolling();
 */
export function useProductionPolling(): void {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);
}
