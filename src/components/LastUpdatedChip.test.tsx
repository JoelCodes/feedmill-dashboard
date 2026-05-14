/**
 * RTL + fake-timer tests for LastUpdatedChip component.
 *
 * TDD RED phase: tests written before implementation.
 *
 * PROD-11 / D-20:
 * - Relative-time chip ticks every 5 seconds
 * - Three time buckets: seconds, minutes, hours
 * - Manual refresh button calls router.refresh()
 * - Loading state shown while refreshing (isRefreshing)
 */
import { render, screen, act, fireEvent } from '@testing-library/react';

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

import LastUpdatedChip from './LastUpdatedChip';

describe('LastUpdatedChip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Test 1: shows "Updated 12s ago" when lastUpdated is 12 seconds in the past', () => {
    const lastUpdated = new Date(Date.now() - 12_000);
    render(<LastUpdatedChip lastUpdated={lastUpdated} />);
    expect(screen.getByText(/Updated 12s ago/)).toBeInTheDocument();
  });

  it('Test 2: shows "Updated 5m ago" when lastUpdated is 5 minutes in the past', () => {
    const lastUpdated = new Date(Date.now() - 5 * 60_000);
    render(<LastUpdatedChip lastUpdated={lastUpdated} />);
    expect(screen.getByText(/Updated 5m ago/)).toBeInTheDocument();
  });

  it('Test 3: shows "Updated 2h ago" when lastUpdated is 2 hours in the past', () => {
    const lastUpdated = new Date(Date.now() - 2 * 3_600_000);
    render(<LastUpdatedChip lastUpdated={lastUpdated} />);
    expect(screen.getByText(/Updated 2h ago/)).toBeInTheDocument();
  });

  it('Test 4: chip re-renders with updated relative time after 5 seconds', () => {
    // Start 10s ago — shows "Updated 10s ago"
    const startTime = Date.now();
    const lastUpdated = new Date(startTime - 10_000);
    render(<LastUpdatedChip lastUpdated={lastUpdated} />);
    expect(screen.getByText(/Updated 10s ago/)).toBeInTheDocument();

    // Advance 5 seconds — now 15s ago
    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.getByText(/Updated 15s ago/)).toBeInTheDocument();
  });

  it('Test 5: clicking the refresh button calls router.refresh() exactly once', () => {
    const lastUpdated = new Date(Date.now() - 30_000);
    render(<LastUpdatedChip lastUpdated={lastUpdated} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('Test 6: button shows loading/busy state after click (isRefreshing)', () => {
    const lastUpdated = new Date(Date.now() - 30_000);
    render(<LastUpdatedChip lastUpdated={lastUpdated} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Button should be aria-busy or disabled during refresh
    expect(
      refreshButton.getAttribute('aria-busy') === 'true' ||
        refreshButton.hasAttribute('disabled')
    ).toBe(true);
  });
});
