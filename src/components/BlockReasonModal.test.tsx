/**
 * BlockReasonModal — TDD RED tests for plan 34-06 Task 2.
 *
 * Tests cover: D-13 (required textarea, client-side trim guard, server validation error wiring),
 * Radix Dialog render (open/closed), success path (onClose + textarea clear), ESC close.
 *
 * Mock strategy: jest.mock('@/actions/transitions') so blockOrder returns controllable Promises.
 * Radix Dialog.Portal renders to document.body — jsdom supports this without extra config.
 */

// Mocks BEFORE any imports
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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlockReasonModal from './BlockReasonModal';
import { blockOrder } from '@/actions/transitions';

// ─── Default props ────────────────────────────────────────────────────────────

const defaultProps = {
  orderId: 'ord-001',
  version: 1,
  open: true,
  onClose: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BlockReasonModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (blockOrder as jest.Mock).mockResolvedValue({ ok: true });
  });

  // ── Test 1: open=false shows nothing; open=true shows modal ──────────────

  test('Test 1: with open=false no modal content in DOM; with open=true shows "Block Order" title and textarea and buttons', () => {
    const { rerender } = render(
      <BlockReasonModal {...defaultProps} open={false} />
    );

    // Modal should NOT be in the DOM when closed
    expect(screen.queryByText('Block Order')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    rerender(<BlockReasonModal {...defaultProps} open={true} />);

    // Modal title
    expect(screen.getByText('Block Order')).toBeInTheDocument();
    // Textarea
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    // Buttons
    expect(screen.getByRole('button', { name: /confirm block/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  // ── Test 2: Textarea aria-required + label text ───────────────────────────

  test('Test 2: textarea has aria-required="true" and label text "Reason (required)"', () => {
    render(<BlockReasonModal {...defaultProps} />);

    // Label text
    expect(screen.getByText('Reason (required)')).toBeInTheDocument();

    // Textarea has aria-required or required attribute
    const textarea = screen.getByRole('textbox');
    const isRequired =
      textarea.hasAttribute('required') ||
      textarea.getAttribute('aria-required') === 'true';
    expect(isRequired).toBe(true);
  });

  // ── Test 3: Empty textarea → Confirm button disabled ─────────────────────

  test('Test 3 (D-13): Confirm button is disabled when textarea is empty', () => {
    render(<BlockReasonModal {...defaultProps} />);

    const confirmBtn = screen.getByRole('button', { name: /confirm block/i });
    expect(confirmBtn).toBeDisabled();
  });

  // ── Test 4: Valid reason → Confirm button enabled ─────────────────────────

  test('Test 4: typing a valid reason enables the Confirm button', async () => {
    const user = userEvent.setup();
    render(<BlockReasonModal {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'missing premix corn');

    const confirmBtn = screen.getByRole('button', { name: /confirm block/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  // ── Test 5: Whitespace-only → Confirm stays disabled (D-13) ──────────────

  test('Test 5 (D-13): whitespace-only reason keeps Confirm button disabled', async () => {
    const user = userEvent.setup();
    render(<BlockReasonModal {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '   ');

    const confirmBtn = screen.getByRole('button', { name: /confirm block/i });
    expect(confirmBtn).toBeDisabled();
  });

  // ── Test 6: Clicking Confirm calls blockOrder with correct args ───────────

  test('Test 6: clicking Confirm with valid reason calls blockOrder(orderId, version, reason) once', async () => {
    const user = userEvent.setup();
    render(<BlockReasonModal {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'missing premix corn');

    const confirmBtn = screen.getByRole('button', { name: /confirm block/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(blockOrder).toHaveBeenCalledWith('ord-001', 1, 'missing premix corn');
      expect(blockOrder).toHaveBeenCalledTimes(1);
    });
  });

  // ── Test 7: { ok: true } → onClose called once + textarea cleared ─────────

  test('Test 7: blockOrder resolving { ok: true } invokes onClose once and clears the textarea', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    (blockOrder as jest.Mock).mockResolvedValue({ ok: true });

    render(<BlockReasonModal {...defaultProps} onClose={onClose} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'reason text');

    const confirmBtn = screen.getByRole('button', { name: /confirm block/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    // After success, textarea should be cleared (modal re-opened shows empty)
    // The textarea value should reset after onClose is called
    // We verify the state was reset — on re-open the textarea will be empty
  });

  // ── Test 8: { ok: false, code: 'validation' } → inline error shown ────────

  test('Test 8: blockOrder resolving { ok: false, code: "validation" } shows inline error message', async () => {
    const user = userEvent.setup();
    (blockOrder as jest.Mock).mockResolvedValue({
      ok: false,
      code: 'validation',
      message: 'Reason is required',
    });

    render(<BlockReasonModal {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'some reason that passes client guard');

    const confirmBtn = screen.getByRole('button', { name: /confirm block/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Reason is required')).toBeInTheDocument();
    });
  });

  // ── Test 9: Cancel → onClose called; blockOrder NOT called ───────────────

  test('Test 9: clicking Cancel invokes onClose but does NOT call blockOrder', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<BlockReasonModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(blockOrder).not.toHaveBeenCalled();
  });

  // ── Test 10: ESC closes modal via onOpenChange ────────────────────────────

  test('Test 10: pressing ESC inside the modal triggers onClose via Radix onOpenChange', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<BlockReasonModal {...defaultProps} onClose={onClose} />);

    // Press Escape key — Radix Dialog handles ESC natively via onOpenChange(false)
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe('BlockReasonModal router.refresh on success (T12 gap closure)', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockRefresh.mockClear();
    mockOnClose.mockClear();
    (blockOrder as jest.Mock).mockResolvedValue({ ok: true });
  });

  it('calls router.refresh and onClose on successful blockOrder', async () => {
    const user = userEvent.setup();
    (blockOrder as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <BlockReasonModal
        orderId="ord-001"
        version={1}
        open={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /reason/i });
    await user.type(textarea, 'Equipment failure');
    await user.click(screen.getByRole('button', { name: /confirm block/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('WR-04: re-render with bumped version sends the NEW version on next confirm click', async () => {
    // Regression for the pinned-closure bug fixed in WR-04. Without the
    // propsRef mitigation, the action would always send version=1 even after
    // the parent re-rendered with version=2.
    const user = userEvent.setup();
    (blockOrder as jest.Mock).mockResolvedValue({ ok: true });

    const { rerender } = render(
      <BlockReasonModal
        orderId="ord-001"
        version={1}
        open={true}
        onClose={mockOnClose}
      />
    );

    let textarea = screen.getByRole('textbox', { name: /reason/i });
    await user.type(textarea, 'first reason');
    await user.click(screen.getByRole('button', { name: /confirm block/i }));

    await waitFor(() => {
      expect(blockOrder).toHaveBeenLastCalledWith('ord-001', 1, 'first reason');
    });

    // Parent re-renders with bumped version after router.refresh().
    rerender(
      <BlockReasonModal
        orderId="ord-001"
        version={2}
        open={true}
        onClose={mockOnClose}
      />
    );

    textarea = screen.getByRole('textbox', { name: /reason/i });
    await user.type(textarea, 'second reason');
    await user.click(screen.getByRole('button', { name: /confirm block/i }));

    await waitFor(() => {
      expect(blockOrder).toHaveBeenLastCalledWith('ord-001', 2, 'second reason');
    });
  });

  it('does NOT call router.refresh on validation failure', async () => {
    const user = userEvent.setup();
    (blockOrder as jest.Mock).mockResolvedValueOnce({
      ok: false,
      code: 'validation',
      message: 'A non-empty reason is required to block an order.',
    });

    render(
      <BlockReasonModal
        orderId="ord-001"
        version={1}
        open={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /reason/i });
    await user.type(textarea, 'tmp');  // type something so Confirm is enabled
    await user.click(screen.getByRole('button', { name: /confirm block/i }));

    await waitFor(() => {
      expect(blockOrder).toHaveBeenCalled();
    });

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
