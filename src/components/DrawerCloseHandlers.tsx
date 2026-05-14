'use client';
/**
 * DrawerCloseHandlers — purely behavioral client component.
 *
 * Binds ESC key listener to window. Returns null (no rendered output).
 *
 * Pitfall 4: When the BlockReasonModal is open (modalOpen=true), ESC must NOT close the drawer
 * because Radix Dialog owns ESC key handling while the modal is open. The `modalOpen` prop
 * gates the keydown listener to prevent the drawer from closing when the user presses ESC
 * inside the modal.
 *
 * Note: Backdrop click is handled directly by the parent component binding onClick to the
 * backdrop element — not via this component. This avoids document-level listeners that
 * would fire from inside the BlockReasonModal portal (Pitfall 4 mitigation).
 */

import { useEffect } from 'react';

interface DrawerCloseHandlersProps {
  onClose: () => void;
  modalOpen: boolean;
}

export default function DrawerCloseHandlers({
  onClose,
  modalOpen,
}: DrawerCloseHandlersProps): null {
  useEffect(() => {
    if (modalOpen) return; // Pitfall 4: modal owns ESC while open

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, onClose]);

  return null;
}
