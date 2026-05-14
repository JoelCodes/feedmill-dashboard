'use client';
/**
 * TransitionButtons — client component wiring the four Phase 33 server actions.
 *
 * D-10: All four transition actions live in the drawer ONLY. Cards are click-targets;
 *       no inline transition controls on cards.
 * D-11: Pending → Start Mixing (single-click, no confirm). Mixing → Complete Order (single-click, no confirm).
 * D-12: Blocked → split Resume: "Resume to Mixing" (primary) + "Resume to Pending" (secondary).
 * D-14: On conflict (code === 'conflict'), render the EXACT locked message inline + auto router.refresh().
 * D-25: The read-only gate lives in the PARENT (ProductionDrawer). TransitionButtons does NOT implement it.
 *
 * UI-SPEC §5 "Transition buttons" + Copywriting Contract:
 *   - Pending:   "Start Mixing"
 *   - Mixing:    "Complete Order" (primary) + "Block Order" (destructive trigger)
 *   - Blocked:   "Resume to Mixing" (primary) + "Resume to Pending" (secondary)
 *   - Completed: no buttons
 *
 * Pitfall 10: useActionState closure wrapper — each sub-button passes orderId/version via closure
 * to the server action, not as FormData fields (server action signature uses named params, not FormData).
 *
 * LOCKED conflict message (D-02, ROADMAP SC#2) — verbatim copy from src/actions/transitions.ts line 59.
 * This string MUST match character-for-character.
 */

import React, { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  transitionToMixing,
  completeOrder,
  resumeFromBlocked,
  type TransitionResult,
} from '@/actions/transitions';
import Button from '@/components/ui/Button';
import type { ProductionOrder } from '@/db/schema/orders';

// LOCKED conflict message (D-02, ROADMAP SC#2) — must match src/actions/transitions.ts line 59 verbatim.
const CONFLICT_MESSAGE = 'Order was modified by another user. Please refresh.';

// ─── Conflict banner ─────────────────────────────────────────────────────────

function ConflictBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-2 rounded border-l-4 border-[var(--error)] bg-[var(--error-light)] p-2 text-sm text-[var(--error-dark)]"
    >
      {message}
    </p>
  );
}

// ─── StartMixingButton ───────────────────────────────────────────────────────

export function StartMixingButton({
  orderId,
  version,
}: {
  orderId: string;
  version: number;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => transitionToMixing(orderId, version),
    null
  );

  useEffect(() => {
    if (state?.ok === false && state.code === 'conflict') {
      router.refresh(); // D-14: auto-refresh on conflict
    }
  }, [state, router]);

  return (
    <form action={formAction} className="w-full">
      <Button variant="primary" loading={isPending} className="w-full">
        Start Mixing
      </Button>
      {state?.ok === false && state.code === 'conflict' && (
        <ConflictBanner message={state.message} />
      )}
    </form>
  );
}

// ─── CompleteOrderButton ─────────────────────────────────────────────────────

export function CompleteOrderButton({
  orderId,
  version,
}: {
  orderId: string;
  version: number;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => completeOrder(orderId, version),
    null
  );

  useEffect(() => {
    if (state?.ok === false && state.code === 'conflict') {
      router.refresh(); // D-14: auto-refresh on conflict
    }
  }, [state, router]);

  return (
    <form action={formAction} className="w-full">
      <Button variant="primary" loading={isPending} className="w-full">
        Complete Order
      </Button>
      {state?.ok === false && state.code === 'conflict' && (
        <ConflictBanner message={state.message} />
      )}
    </form>
  );
}

// ─── BlockOrderTrigger ───────────────────────────────────────────────────────
// NOT bound to useActionState — it is a trigger that opens the BlockReasonModal.
// The modal is rendered by the parent drawer, not by TransitionButtons.

export function BlockOrderTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="destructive" className="w-full" onClick={onClick} type="button">
      Block Order
    </Button>
  );
}

// ─── ResumeButton ────────────────────────────────────────────────────────────

export function ResumeButton({
  orderId,
  version,
  toState,
}: {
  orderId: string;
  version: number;
  toState: 'Mixing' | 'Pending';
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => resumeFromBlocked(orderId, version, toState),
    null
  );

  useEffect(() => {
    if (state?.ok === false && state.code === 'conflict') {
      router.refresh(); // D-14: auto-refresh on conflict
    }
  }, [state, router]);

  const label = toState === 'Mixing' ? 'Resume to Mixing' : 'Resume to Pending';
  const variant = toState === 'Mixing' ? 'primary' : 'secondary';

  return (
    <form action={formAction} className="w-full">
      <Button variant={variant} loading={isPending} className="w-full">
        {label}
      </Button>
      {state?.ok === false && state.code === 'conflict' && (
        <ConflictBanner message={state.message} />
      )}
    </form>
  );
}

// ─── Default export: TransitionButtons ──────────────────────────────────────

/**
 * TransitionButtons — switches on order.state to render the appropriate subset of buttons.
 *
 * Props:
 *   order       — the current production order (state drives which buttons appear)
 *   onBlockClick — callback invoked when the operator clicks "Block Order"; the parent
 *                  drawer opens BlockReasonModal in response.
 *
 * The read-only gate (D-25) lives in ProductionDrawer — not here.
 */
export default function TransitionButtons({
  order,
  onBlockClick,
}: {
  order: ProductionOrder;
  onBlockClick: () => void;
}): React.JSX.Element | null {
  switch (order.state) {
    case 'Pending':
      return (
        <div className="flex gap-3">
          <StartMixingButton orderId={order.id} version={order.version} />
        </div>
      );

    case 'Mixing':
      return (
        <div className="flex gap-3">
          <CompleteOrderButton orderId={order.id} version={order.version} />
          <BlockOrderTrigger onClick={onBlockClick} />
        </div>
      );

    case 'Blocked':
      return (
        <div className="flex gap-3">
          <ResumeButton orderId={order.id} version={order.version} toState="Mixing" />
          <ResumeButton orderId={order.id} version={order.version} toState="Pending" />
        </div>
      );

    case 'Completed':
      return null;

    default:
      return null;
  }
}
