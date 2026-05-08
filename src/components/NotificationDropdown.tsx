'use client';

import { useEffect, useRef } from 'react';
import { Notification } from '@/types/notification';
import { useClickOutside } from '@/hooks/useClickOutside';

interface NotificationDropdownProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  readNotificationIds: string[];
}

export default function NotificationDropdown({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onClearAll,
  readNotificationIds,
}: NotificationDropdownProps) {
  const clickOutsideRef = useClickOutside<HTMLDivElement>(onClose);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Focus dropdown when opened for keyboard accessibility
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const combinedRef = (node: HTMLDivElement | null) => {
    if (clickOutsideRef && typeof clickOutsideRef === 'object') {
      // eslint-disable-next-line react-hooks/immutability -- Combining refs from hook requires mutable assignment
      (clickOutsideRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
    if (dropdownRef) {
      (dropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Dialog needs keyboard dismissal
    <div
      ref={combinedRef}
      tabIndex={-1}
      className="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg bg-[var(--bg-card)] shadow-lg focus:outline-none"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 className="text-text-primary text-sm font-bold">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-primary text-xs font-medium hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h4 className="text-text-primary mb-1 text-sm font-bold">All caught up</h4>
            <p className="text-text-secondary text-xs">
              You&apos;ll see order updates and system alerts here.
            </p>
          </div>
        ) : (
          /* Notification Items */
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => onMarkAsRead(notification.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onMarkAsRead(notification.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer gap-3 p-3 transition-colors hover:bg-gray-50"
              >
                {/* Unread Indicator */}
                {!readNotificationIds.includes(notification.id) && (
                  <div className="flex-shrink-0">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                )}
                {readNotificationIds.includes(notification.id) && (
                  <div className="w-2 flex-shrink-0" />
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary mb-0.5 text-xs font-medium">
                    {notification.title}
                  </p>
                  <p className="text-text-secondary mb-1 text-xs">
                    {notification.message}
                  </p>
                  <p className="text-text-secondary text-[var(--fs-10)]">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
