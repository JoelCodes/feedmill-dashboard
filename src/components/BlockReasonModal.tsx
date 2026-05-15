'use client';
/**
 * BlockReasonModal — Radix Dialog wrapping a required textarea for the block reason.
 *
 * D-13: Block Order opens a modal dialog with a required textarea.
 *   - Confirm calls blockOrder(orderId, version, reason)
 *   - Confirm is disabled client-side until reason.trim().length > 0
 *   - Whitespace-only reason is blocked client-side (same guard)
 *   - Server still validates: returns { code: 'validation' } if empty slips through
 *   - On success, modal closes and textarea is cleared
 *   - Modal validation errors displayed inline next to the textarea
 *
 * UI-SPEC §6 "Block Reason Modal":
 *   - Title: "Block Order"
 *   - Textarea label: required reason field
 *   - Confirm button: destructive (variant="destructive")
 *   - Cancel button: "Cancel" (variant="secondary")
 *
 * Pitfall 4: This modal is a second-layer Dialog on top of the drawer.
 *   Radix Dialog.Portal renders to document.body so z-index is not an issue.
 *   ESC + backdrop click are handled natively by Radix via onOpenChange.
 *   The drawer's DrawerCloseHandlers gates its ESC listener on modalOpen state
 *   so the modal owns ESC while it is open.
 */

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { blockOrder, type TransitionResult } from '@/actions/transitions';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BlockReasonModalProps {
  orderId: string;
  version: number;
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BlockReasonModal({
  orderId,
  version,
  open,
  onClose,
}: BlockReasonModalProps): React.JSX.Element {
  const [reason, setReason] = useState('');
  const router = useRouter();

  // WR-04 (deep review 2026-05-14): useActionState memoises the FIRST action
  // callback, so directly closing over orderId / version / onClose pins them
  // to first-render values. After router.refresh() bumps version, the next
  // submit would still send the old version (mirror of CR-02 in
  // TransitionButtons). Read the latest values through a ref synced on every
  // render so the action always sees fresh props.
  const propsRef = useRef({ orderId, version, onClose });
  useEffect(() => {
    propsRef.current = { orderId, version, onClose };
  }, [orderId, version, onClose]);

  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev, formData) => {
      // Read reason from the FormData the form submission supplied — avoids
      // closing over the `reason` useState value (same pinned-closure trap).
      const currentReason = (formData.get('reason') as string | null) ?? '';
      const { orderId: id, version: v, onClose: close } = propsRef.current;
      const result = await blockOrder(id, v, currentReason);
      if (result.ok) {
        // WR-04: reorder side effects — clear local state and notify the
        // parent BEFORE scheduling the RSC re-fetch. router.refresh() kicks
        // off an async fetch; running it AFTER unmount handoff means we are
        // not scheduling state updates on a soon-to-unmount tree.
        setReason('');
        close();
        router.refresh();
      }
      return result;
    },
    null
  );

  // Derive the validation error message (if server returned validation code)
  const validationError =
    state?.ok === false && state.code === 'validation' ? state.message : undefined;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] rounded-[var(--radius-lg)] bg-[var(--bg-card)] p-6 shadow-lg"
          aria-labelledby="block-reason-title"
        >
          <Dialog.Title
            id="block-reason-title"
            className="text-base font-bold text-[var(--text-primary)]"
          >
            Block Order
          </Dialog.Title>

          <form action={formAction} className="mt-4 flex flex-col gap-4">
            {/* WR-04: pass `reason` through FormData so the action callback
                does not close over the `reason` useState value. The Textarea
                stays controlled for client-side disabled-when-empty UX. */}
            <input type="hidden" name="reason" value={reason} />
            <Textarea
              label="Reason (required)"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue..."
              error={validationError}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={reason.trim().length === 0}
                loading={isPending}
              >
                Confirm Block
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
