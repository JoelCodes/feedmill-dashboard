'use client';
/**
 * ProductionDrawer — order details slide-over drawer.
 *
 * Planner decision (context_amendment): Implemented as a client component for simplicity,
 * even though the plan section header says "server component". The drawer must own modal-open
 * state (for BlockReasonModal) and close-handler state (for DrawerCloseHandlers). A client
 * component boundary is the cleanest solution. Server-side data is fetched by the page RSC
 * (D-09 preserved) and passed via props.
 *
 * D-08: Order details panel shows all order fields + transition history timeline.
 * D-09: Data fetched by the page RSC (getOrderById + getOrderEvents) — not fetched here.
 * D-13: Block reason modal is mounted inside this drawer.
 * D-25: canEdit prop (server-computed via checkRole('mill_operator')) controls whether
 *       TransitionButtons are shown. Read-only viewers see drawer body + timeline but no buttons.
 *
 * Pitfall 4: DrawerCloseHandlers gates ESC on modalOpen state so the modal owns ESC
 *            while the BlockReasonModal is open.
 * Pitfall 7: When order === null (stale ?order= URL), renders "Order not found" empty state
 *            instead of crashing.
 */

import React, { useState } from 'react';
import { useQueryStates, parseAsString } from 'nuqs';
import { X } from 'lucide-react';

import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import TransitionButtons from '@/components/TransitionButtons';
import BlockReasonModal from '@/components/BlockReasonModal';
import DrawerCloseHandlers from '@/components/DrawerCloseHandlers';

import type { ProductionOrder, ProductionState } from '@/db/schema/orders';
import type { OrderEvent } from '@/db/schema/events';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DrawerProps {
  order: ProductionOrder | null;
  events: OrderEvent[];
  canEdit: boolean;
}

// ─── Timeline event display ───────────────────────────────────────────────────

function formatEventDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

// State → border color map for timeline dots
const STATE_DOT_COLORS: Record<ProductionState, string> = {
  Pending: 'var(--status-pending-border)',
  Mixing: 'var(--status-mixing-border)',
  Completed: 'var(--status-completed-border)',
  Blocked: 'var(--status-blocked-border)',
};

function EventTimelineItem({
  event,
  showConnector,
}: {
  event: OrderEvent;
  showConnector: boolean;
}) {
  const dotColor = STATE_DOT_COLORS[event.toState] ?? 'var(--divider)';
  return (
    <div className="flex items-stretch gap-3.5">
      <div className="flex w-9 flex-col items-center">
        <div
          className="h-2 w-2 rounded-full mt-1 flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        {showConnector && <div className="w-0.5 flex-1 bg-[var(--divider)] mt-1" />}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 pb-4">
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {event.fromState
            ? `${event.fromState} → ${event.toState}`
            : `Created (${event.toState})`}
        </span>
        <span className="text-[11px] text-[var(--text-secondary)]">
          {formatEventDate(event.changedAt)}
        </span>
        <span className="text-[11px] text-[var(--text-secondary)] font-mono">
          {event.changedBy}
        </span>
        {event.note && (
          <span className="text-xs italic text-[var(--text-secondary)] mt-1">
            {event.note}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </dt>
      <dd className="text-sm text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

// ─── ProductionDrawer ─────────────────────────────────────────────────────────

export default function ProductionDrawer({
  order,
  events,
  canEdit,
}: DrawerProps): React.JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);
  const [, setQuery] = useQueryStates({
    order: parseAsString.withDefault(''),
  });

  const handleClose = () => setQuery({ order: '' });

  // ─── Backdrop (shared) ─────────────────────────────────────────────────────
  const backdrop = (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-30 bg-black/30"
      aria-hidden="true"
    />
  );

  // ─── Null branch (Pitfall 7) ──────────────────────────────────────────────
  if (order === null) {
    return (
      <>
        {backdrop}
        <div className="fixed right-0 top-0 z-40 flex h-full w-[480px] flex-col items-center justify-center bg-[var(--bg-card)] p-6 shadow-xl">
          <DrawerCloseHandlers onClose={handleClose} modalOpen={false} />
          <p className="text-sm text-[var(--text-secondary)]">Order not found</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="mt-3"
          >
            Close
          </Button>
        </div>
      </>
    );
  }

  // ─── Valid order render ────────────────────────────────────────────────────

  // Find blocker note from the most recent Blocked event
  const blockerNote = order.state === 'Blocked'
    ? [...events]
        .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
        .find((e) => e.toState === 'Blocked')?.note
    : undefined;

  // Timeline: events passed in order from page RSC (getOrderEvents returns DESC by changedAt)
  // Reverse to chronological (ascending) for display per UI-SPEC §5
  const chronologicalEvents = [...events].reverse();

  return (
    <>
      {backdrop}

      <aside className="fixed right-0 top-0 z-40 flex h-full w-[480px] flex-col overflow-y-auto bg-[var(--bg-card)] shadow-xl">
        <DrawerCloseHandlers onClose={handleClose} modalOpen={modalOpen} />

        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 p-6 pb-4">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">
              {order.orderNumber} — {order.customer}
            </h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.state} />
              <span className="text-xs text-[var(--text-secondary)]">{order.millLine}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex-shrink-0 rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ─── Divider ─────────────────────────────────────────────────────── */}
        <div className="h-px bg-[var(--divider)] mx-6" />

        {/* ─── Fields ──────────────────────────────────────────────────────── */}
        <dl className="flex flex-col gap-4 p-6 pb-4">
          <FieldRow label="Document Number" value={order.orderNumber} />
          <FieldRow label="Customer" value={order.customer} />
          <FieldRow label="Product" value={order.product} />
          <FieldRow
            label="Weight"
            value={`${parseFloat(order.weightLbs).toLocaleString()} lbs`}
          />
          <FieldRow label="Delivery" value={order.deliveryTime} />
          <FieldRow label="Mill Line" value={order.millLine} />
          <FieldRow label="Texture Type" value={order.textureType ?? '—'} />
          {order.state === 'Blocked' && blockerNote && (
            <FieldRow label="Blocker Note" value={blockerNote} />
          )}
        </dl>

        {/* ─── Divider ─────────────────────────────────────────────────────── */}
        <div className="h-px bg-[var(--divider)] mx-6" />

        {/* ─── Timeline ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 p-6 pb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Transition History
          </h3>
          {chronologicalEvents.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">No transitions yet.</p>
          ) : (
            <div className="mt-2">
              {chronologicalEvents.map((event, idx) => (
                <EventTimelineItem
                  key={event.id}
                  event={event}
                  showConnector={idx < chronologicalEvents.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── Transition buttons (conditional on canEdit + state) ─────────── */}
        {canEdit && order.state !== 'Completed' && (
          <div className="px-6 pb-6 pt-2">
            <TransitionButtons
              order={order}
              onBlockClick={() => setModalOpen(true)}
            />
          </div>
        )}

        {/* ─── Block reason modal ───────────────────────────────────────────── */}
        <BlockReasonModal
          orderId={order.id}
          version={order.version}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </aside>
    </>
  );
}
