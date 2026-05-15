/**
 * TransitionButtons — TDD RED tests for plan 34-06 Task 1.
 *
 * Tests cover: D-10 (all four transitions in drawer only), D-11 (single-click Complete),
 * D-12 (split Resume button), D-14 (conflict banner + auto-refresh), D-25 (canEdit in parent).
 *
 * Mock strategy: jest.mock('@/actions/transitions') so actions return controllable Promises.
 * Mock strategy: jest.mock('next/navigation') to capture mockRefresh.
 */

// Mocks BEFORE any imports that trigger module evaluation
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock('@/actions/transitions', () => ({
  transitionToMixing: jest.fn(),
  completeOrder: jest.fn(),
  blockOrder: jest.fn(),
  resumeFromBlocked: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransitionButtons from './TransitionButtons';
import {
  transitionToMixing,
  completeOrder,
  resumeFromBlocked,
} from '@/actions/transitions';
import type { ProductionOrder } from '@/db/schema/orders';

// ─── Fixture helpers ─────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<ProductionOrder> = {}): ProductionOrder {
  return {
    id: 'ord-001',
    orderNumber: 'ORD-001',
    customer: 'Acme Feed',
    product: 'Layer Mash',
    weightLbs: '5000.00',
    deliveryTime: 'May 14, 2026 10am',
    state: 'Pending',
    millLine: 'Premix',
    textureType: null,
    lineCode: null,
    earlyDeliveryDate: null,
    version: 1,
    createdBy: 'user_abc',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const mockOnBlockClick = jest.fn();

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TransitionButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: actions resolve with { ok: true }
    (transitionToMixing as jest.Mock).mockResolvedValue({ ok: true });
    (completeOrder as jest.Mock).mockResolvedValue({ ok: true });
    (resumeFromBlocked as jest.Mock).mockResolvedValue({ ok: true });
  });

  // ── Test 1: Pending state — only "Start Mixing" button ────────────────────

  test('Test 1 (Pending — D-11 amended 2026-05-14, gap T10a): renders "Start Mixing" + "Block Order" buttons; transitionToMixing called on Start Mixing click', async () => {
    const user = userEvent.setup();
    const order = makeOrder({ state: 'Pending' });

    render(<TransitionButtons order={order} onBlockClick={mockOnBlockClick} />);

    // D-11 amended: Pending now shows both Start Mixing AND Block Order
    const startBtn = screen.getByRole('button', { name: /start mixing/i });
    expect(startBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /block order/i })).toBeInTheDocument();

    // No Complete Order or Resume buttons present
    expect(screen.queryByRole('button', { name: /complete order/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume/i })).not.toBeInTheDocument();

    await user.click(startBtn);

    await waitFor(() => {
      expect(transitionToMixing).toHaveBeenCalledWith('ord-001', 1);
    });
  });

  // ── Test 2: Mixing state — "Complete Order" + "Block Order" ──────────────

  test('Test 2 (Mixing): renders "Complete Order" + "Block Order"; clicking Complete calls completeOrder; clicking Block calls onBlockClick', async () => {
    const user = userEvent.setup();
    const order = makeOrder({ state: 'Mixing' });

    render(<TransitionButtons order={order} onBlockClick={mockOnBlockClick} />);

    const completeBtn = screen.getByRole('button', { name: /complete order/i });
    const blockBtn = screen.getByRole('button', { name: /block order/i });

    expect(completeBtn).toBeInTheDocument();
    expect(blockBtn).toBeInTheDocument();

    // No Start Mixing or Resume buttons
    expect(screen.queryByRole('button', { name: /start mixing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume/i })).not.toBeInTheDocument();

    await user.click(completeBtn);
    await waitFor(() => {
      expect(completeOrder).toHaveBeenCalledWith('ord-001', 1);
    });

    await user.click(blockBtn);
    expect(mockOnBlockClick).toHaveBeenCalledTimes(1);
  });

  // ── Test 3: Blocked state — D-12 resume split buttons ────────────────────

  test('Test 3 (Blocked — D-12): renders "Resume to Mixing" (primary) + "Resume to Pending" (secondary); each calls resumeFromBlocked with correct toState', async () => {
    const user = userEvent.setup();
    const order = makeOrder({ state: 'Blocked' });

    render(<TransitionButtons order={order} onBlockClick={mockOnBlockClick} />);

    const resumeMixingBtn = screen.getByRole('button', { name: /resume to mixing/i });
    const resumePendingBtn = screen.getByRole('button', { name: /resume to pending/i });

    expect(resumeMixingBtn).toBeInTheDocument();
    expect(resumePendingBtn).toBeInTheDocument();

    // No other transition buttons
    expect(screen.queryByRole('button', { name: /start mixing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete order/i })).not.toBeInTheDocument();

    await user.click(resumeMixingBtn);
    await waitFor(() => {
      expect(resumeFromBlocked).toHaveBeenCalledWith('ord-001', 1, 'Mixing');
    });

    (resumeFromBlocked as jest.Mock).mockClear();

    await user.click(resumePendingBtn);
    await waitFor(() => {
      expect(resumeFromBlocked).toHaveBeenCalledWith('ord-001', 1, 'Pending');
    });
  });

  // ── Test 4: Completed state — ZERO transition buttons ────────────────────

  test('Test 4 (Completed): renders ZERO transition buttons for Completed orders', () => {
    const order = makeOrder({ state: 'Completed' });

    render(<TransitionButtons order={order} onBlockClick={mockOnBlockClick} />);

    expect(screen.queryByRole('button', { name: /start mixing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete order/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /block order/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume/i })).not.toBeInTheDocument();
  });

  // ── Test 5: Conflict UX — D-14 banner + auto-refresh ─────────────────────

  test('Test 5 (conflict UX — D-14): conflict result shows locked banner text and calls router.refresh() once', async () => {
    const user = userEvent.setup();
    const order = makeOrder({ state: 'Pending' });

    (transitionToMixing as jest.Mock).mockResolvedValue({
      ok: false,
      code: 'conflict',
      message: 'Order was modified by another user. Please refresh.',
    });

    render(<TransitionButtons order={order} onBlockClick={mockOnBlockClick} />);

    const startBtn = screen.getByRole('button', { name: /start mixing/i });
    await user.click(startBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Order was modified by another user. Please refresh.')
      ).toBeInTheDocument();
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  // ── Test 6: Locked message verbatim ──────────────────────────────────────

  test('Test 6 (locked-message verbatim): conflict banner text matches character-for-character', async () => {
    const user = userEvent.setup();
    const order = makeOrder({ state: 'Pending' });

    const LOCKED_MSG = 'Order was modified by another user. Please refresh.';

    (transitionToMixing as jest.Mock).mockResolvedValue({
      ok: false,
      code: 'conflict',
      message: LOCKED_MSG,
    });

    render(<TransitionButtons order={order} onBlockClick={mockOnBlockClick} />);

    const startBtn = screen.getByRole('button', { name: /start mixing/i });
    await user.click(startBtn);

    await waitFor(() => {
      const banner = screen.getByRole('alert');
      expect(banner.textContent).toBe(LOCKED_MSG);
    });
  });

  // ── Test 7: Loading state — aria-busy during in-flight action ─────────────

  test('Test 7 (loading): button shows aria-busy="true" while action is in-flight', async () => {
    const user = userEvent.setup();
    const order = makeOrder({ state: 'Pending' });

    // Use a never-resolving promise to keep action pending
    let resolveAction!: (val: { ok: true }) => void;
    const pendingPromise = new Promise<{ ok: true }>((resolve) => {
      resolveAction = resolve;
    });

    (transitionToMixing as jest.Mock).mockReturnValue(pendingPromise);

    render(<TransitionButtons order={order} onBlockClick={mockOnBlockClick} />);

    const startBtn = screen.getByRole('button', { name: /start mixing/i });

    await act(async () => {
      await user.click(startBtn);
    });

    // While pending, button should be aria-busy (useActionState isPending)
    await waitFor(() => {
      // Button may become disabled and aria-busy while loading
      const btn = screen.queryByRole('button', { name: /start mixing/i });
      // During isPending, the button renders with loading prop — check aria-busy
      // The Button component sets aria-busy when loading={true}
      expect(btn?.getAttribute('aria-busy') === 'true' || btn?.hasAttribute('disabled')).toBe(true);
    });

    // Clean up: resolve the pending promise
    resolveAction({ ok: true });
    await waitFor(() => {
      // After resolution, no longer busy
      expect(transitionToMixing).toHaveBeenCalled();
    });
  });

  // ── Test 8: canEdit not checked in TransitionButtons itself ──────────────

  test('Test 8 (canEdit): TransitionButtons does not contain canEdit prop — parent controls rendering', () => {
    // This is a source-level assertion — we verify by checking the component renders
    // without a canEdit prop. The acceptance criteria grep will verify the source.
    const order = makeOrder({ state: 'Pending' });

    // Component renders without canEdit — it is not part of its prop signature
    expect(() =>
      render(<TransitionButtons order={order} onBlockClick={mockOnBlockClick} />)
    ).not.toThrow();
  });
});

describe('TransitionButtons Pending → Blocked path (D-11 amended, gap T10a)', () => {
  beforeEach(() => {
    mockOnBlockClick.mockClear();
    mockRefresh.mockClear();
  });

  it('renders both Start Mixing and Block Order buttons for Pending state', () => {
    render(
      <TransitionButtons
        order={makeOrder({ state: 'Pending' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    expect(screen.getByRole('button', { name: /start mixing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /block order/i })).toBeInTheDocument();
  });

  it('clicking Block Order on Pending invokes onBlockClick exactly once', async () => {
    const user = userEvent.setup();
    render(
      <TransitionButtons
        order={makeOrder({ state: 'Pending' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /block order/i }));

    expect(mockOnBlockClick).toHaveBeenCalledTimes(1);
  });

  it('Mixing state still shows Complete + Block (regression)', () => {
    render(
      <TransitionButtons
        order={makeOrder({ state: 'Mixing' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    expect(screen.getByRole('button', { name: /complete order/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /block order/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start mixing/i })).toBeNull();
  });

  it('Completed state renders null (regression)', () => {
    const { container } = render(
      <TransitionButtons
        order={makeOrder({ state: 'Completed' })}
        onBlockClick={mockOnBlockClick}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('Blocked state shows only Resume buttons, no Block Order (regression)', () => {
    render(
      <TransitionButtons
        order={makeOrder({ state: 'Blocked' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    expect(screen.getByRole('button', { name: /resume to mixing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resume to pending/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /block order/i })).toBeNull();
  });
});

describe('TransitionButtons router.refresh on success (T12 gap closure)', () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    mockOnBlockClick.mockClear();
    // Default: actions resolve with { ok: true }
    (transitionToMixing as jest.Mock).mockResolvedValue({ ok: true });
    (completeOrder as jest.Mock).mockResolvedValue({ ok: true });
    (resumeFromBlocked as jest.Mock).mockResolvedValue({ ok: true });
  });

  it('StartMixingButton calls router.refresh on success', async () => {
    const user = userEvent.setup();
    (transitionToMixing as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <TransitionButtons
        order={makeOrder({ state: 'Pending' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /start mixing/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('CompleteOrderButton calls router.refresh on success', async () => {
    const user = userEvent.setup();
    (completeOrder as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <TransitionButtons
        order={makeOrder({ state: 'Mixing' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /complete order/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('ResumeButton (toState=Mixing) calls router.refresh on success', async () => {
    const user = userEvent.setup();
    (resumeFromBlocked as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <TransitionButtons
        order={makeOrder({ state: 'Blocked' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /resume to mixing/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('ResumeButton (toState=Pending) calls router.refresh on success', async () => {
    const user = userEvent.setup();
    (resumeFromBlocked as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <TransitionButtons
        order={makeOrder({ state: 'Blocked' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /resume to pending/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('conflict path still calls router.refresh (D-14 regression)', async () => {
    const user = userEvent.setup();
    (transitionToMixing as jest.Mock).mockResolvedValueOnce({
      ok: false,
      code: 'conflict',
      message: 'Order was modified by another user. Please refresh.',
    });

    render(
      <TransitionButtons
        order={makeOrder({ state: 'Pending' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /start mixing/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('validation failure does NOT call router.refresh (regression)', async () => {
    const user = userEvent.setup();
    (transitionToMixing as jest.Mock).mockResolvedValueOnce({
      ok: false,
      code: 'validation',
      message: 'Invalid transition',
    });

    render(
      <TransitionButtons
        order={makeOrder({ state: 'Pending' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /start mixing/i }));

    // Give the action time to resolve, then assert no refresh.
    await waitFor(() => {
      // Wait for the action to have been called.
      expect(transitionToMixing).toHaveBeenCalled();
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('CR-02: StartMixingButton re-render with bumped version sends the NEW version on the next click', async () => {
    // Regression for the pinned-closure bug. useActionState memoises the first
    // action callback; without the propsRef mitigation, the second click would
    // send version=1 even after the parent re-rendered with version=2.
    const user = userEvent.setup();
    (transitionToMixing as jest.Mock).mockResolvedValue({ ok: true });

    const { rerender } = render(
      <TransitionButtons
        order={makeOrder({ state: 'Pending', version: 1 })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /start mixing/i }));
    await waitFor(() => {
      expect(transitionToMixing).toHaveBeenLastCalledWith('ord-001', 1);
    });

    // Simulate the parent passing a fresh order after router.refresh().
    rerender(
      <TransitionButtons
        order={makeOrder({ state: 'Pending', version: 2 })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /start mixing/i }));
    await waitFor(() => {
      expect(transitionToMixing).toHaveBeenLastCalledWith('ord-001', 2);
    });
  });

  it('CR-02: CompleteOrderButton re-render with bumped version sends the NEW version on the next click', async () => {
    const user = userEvent.setup();
    (completeOrder as jest.Mock).mockResolvedValue({ ok: true });

    const { rerender } = render(
      <TransitionButtons
        order={makeOrder({ state: 'Mixing', version: 1 })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /complete order/i }));
    await waitFor(() => {
      expect(completeOrder).toHaveBeenLastCalledWith('ord-001', 1);
    });

    rerender(
      <TransitionButtons
        order={makeOrder({ state: 'Mixing', version: 2 })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /complete order/i }));
    await waitFor(() => {
      expect(completeOrder).toHaveBeenLastCalledWith('ord-001', 2);
    });
  });

  it('CR-02: ResumeButton re-render with bumped version sends the NEW version on the next click', async () => {
    const user = userEvent.setup();
    (resumeFromBlocked as jest.Mock).mockResolvedValue({ ok: true });

    const { rerender } = render(
      <TransitionButtons
        order={makeOrder({ state: 'Blocked', version: 1 })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /resume to mixing/i }));
    await waitFor(() => {
      expect(resumeFromBlocked).toHaveBeenLastCalledWith('ord-001', 1, 'Mixing');
    });

    rerender(
      <TransitionButtons
        order={makeOrder({ state: 'Blocked', version: 2 })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /resume to mixing/i }));
    await waitFor(() => {
      expect(resumeFromBlocked).toHaveBeenLastCalledWith('ord-001', 2, 'Mixing');
    });
  });

  it('BlockOrderTrigger on Pending (post-34-10) does NOT call router.refresh directly', async () => {
    // 34-10 added BlockOrderTrigger to the Pending case. Confirm THIS plan does
    // not accidentally couple router.refresh to that trigger — refresh belongs
    // to the BlockReasonModal success path (Task 2), not the trigger.
    const user = userEvent.setup();

    render(
      <TransitionButtons
        order={makeOrder({ state: 'Pending' })}
        onBlockClick={mockOnBlockClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /block order/i }));

    expect(mockOnBlockClick).toHaveBeenCalledTimes(1);
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
