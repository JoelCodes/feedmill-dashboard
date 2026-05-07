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

  return (
    <div
      ref={(node) => {
        // Combine refs: one for click-outside, one for focus management
        (clickOutsideRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (dropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      tabIndex={-1}
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg bg-[var(--bg-card)] shadow-lg focus:outline-none"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-primary hover:underline"
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
            <h4 className="text-sm font-bold text-text-primary mb-1">All caught up</h4>
            <p className="text-xs text-text-secondary">
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
                className="flex gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* Unread Indicator */}
                {!readNotificationIds.includes(notification.id) && (
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                  </div>
                )}
                {readNotificationIds.includes(notification.id) && (
                  <div className="flex-shrink-0 w-2" />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary mb-0.5">
                    {notification.title}
                  </p>
                  <p className="text-xs text-text-secondary mb-1">
                    {notification.message}
                  </p>
                  <p className="text-[var(--text-10)] text-text-secondary">
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
