/**
 * Tests for useProductionPolling hook (PROD-09 / D-19)
 *
 * TDD RED → GREEN cycle:
 * - RED: these tests fail because useProductionPolling does not exist yet
 * - GREEN: after hook implementation, all four cases pass
 *
 * Uses fake timers to verify:
 * 1. 30-second polling cadence (router.refresh called at correct intervals)
 * 2. Cleanup on unmount (no calls after component unmounts)
 * 3. Named REFRESH_INTERVAL_MS constant exported correctly
 */

import { renderHook } from '@testing-library/react';
import { useProductionPolling, REFRESH_INTERVAL_MS } from '@/hooks/useProductionPolling';

// Mock next/navigation — useProductionPolling calls useRouter().refresh()
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe('useProductionPolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls router.refresh() exactly once after 30_000 ms', () => {
    renderHook(() => useProductionPolling());

    jest.advanceTimersByTime(30_000);

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls router.refresh() exactly twice after 60_000 ms', () => {
    renderHook(() => useProductionPolling());

    jest.advanceTimersByTime(60_000);

    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });

  it('does not call router.refresh() after unmount (cleanup runs)', () => {
    const { unmount } = renderHook(() => useProductionPolling());

    // Advance 15s — no calls yet (interval is 30s)
    jest.advanceTimersByTime(15_000);
    expect(mockRefresh).toHaveBeenCalledTimes(0);

    // Unmount — cleanup should clear the interval
    unmount();

    // Advance another 30s — interval should be gone, no calls
    jest.advanceTimersByTime(30_000);
    expect(mockRefresh).toHaveBeenCalledTimes(0);
  });

  it('exports REFRESH_INTERVAL_MS constant equal to 30_000', () => {
    expect(REFRESH_INTERVAL_MS).toBe(30_000);
  });
});
