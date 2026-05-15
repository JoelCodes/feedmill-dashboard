'use client';
/**
 * TransitionButtons — client component wiring the four Phase 33 server actions.
 *
 * D-10: All four transition actions live in the drawer ONLY. Cards are click-targets;
 *       no inline transition controls on cards.
 * D-11 (amended 2026-05-14, gap T10a): Pending shows Start Mixing + Block Order. Mixing → Complete Order (single-click, no confirm).
 * D-12: Blocked → split Resume: "Resume to Mixing" (primary) + "Resume to Pending" (secondary).
 * D-14: On conflict (code === 'conflict'), render the EXACT locked message inline + auto router.refresh().
 * D-25: The read-only gate lives in the PARENT (ProductionDrawer). TransitionButtons does NOT implement it.
 *
 * UI-SPEC §5 "Transition buttons" + Copywriting Contract:
 *   - Pending:   "Start Mixing" (primary) + "Block Order" (destructive trigger) [D-11 amended 2026-05-14, gap T10a]
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

import React, { useActionState, useEffect, useRef } from 'react';
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
  // CR-02 (deep review 2026-05-14): useActionState memoises the FIRST action
  // callback it receives. A subsequent render with a new `version` prop (e.g.
  // after router.refresh() bumps it) does NOT rebind the closure — clicking
  // again would send the stale version and trigger a spurious server conflict.
  // Read the latest props through a ref that we sync in an effect on every
  // render, so the action always reads the current orderId/version.
  const propsRef = useRef({ orderId, version });
  useEffect(() => {
    propsRef.current = { orderId, version };
  }, [orderId, version]);

  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => {
      const { orderId: id, version: v } = propsRef.current;
      return transitionToMixing(id, v);
    },
    null
  );

  useEffect(() => {
    if (state?.ok === true) {
      // T12 fix (2026-05-14): cross-tab latency 15s polling → ~1s router.refresh.
      // Server already calls revalidateTag('production-orders', 'max'); this is
      // the client-side counterpart that picks up the invalidated cache.
      router.refresh();
    } else if (state?.ok === false && state.code === 'conflict') {
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
  // CR-02: see StartMixingButton — same pinned-closure mitigation via propsRef.
  const propsRef = useRef({ orderId, version });
  useEffect(() => {
    propsRef.current = { orderId, version };
  }, [orderId, version]);

  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => {
      const { orderId: id, version: v } = propsRef.current;
      return completeOrder(id, v);
    },
    null
  );

  useEffect(() => {
    if (state?.ok === true) {
      // T12 fix (2026-05-14): cross-tab latency 15s polling → ~1s router.refresh.
      router.refresh();
    } else if (state?.ok === false && state.code === 'conflict') {
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
  // CR-02: see StartMixingButton — same pinned-closure mitigation via propsRef.
  // toState is included so a future re-render that swaps the resume target also
  // reaches the action (current call sites mount one ResumeButton per toState,
  // but the ref keeps the contract honest).
  const propsRef = useRef({ orderId, version, toState });
  useEffect(() => {
    propsRef.current = { orderId, version, toState };
  }, [orderId, version, toState]);

  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => {
      const { orderId: id, version: v, toState: ts } = propsRef.current;
      return resumeFromBlocked(id, v, ts);
    },
    null
  );

  useEffect(() => {
    if (state?.ok === true) {
      // T12 fix (2026-05-14): cross-tab latency 15s polling → ~1s router.refresh.
      router.refresh();
    } else if (state?.ok === false && state.code === 'conflict') {
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
      // D-11 amended 2026-05-14 (gap T10a): Pending now exposes both Start Mixing
      // AND Block Order. The Block path opens the same BlockReasonModal used from
      // the Mixing case. blockOrder() (src/actions/transitions.ts:215) already
      // accepts fromState='Pending' — no server change required.
      return (
        <div className="flex gap-3">
          <StartMixingButton orderId={order.id} version={order.version} />
          <BlockOrderTrigger onClick={onBlockClick} />
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
