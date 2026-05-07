'use client';

import { Search, Bell, Settings } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getNotifications } from '@/services/notifications';
import { Notification } from '@/types/notification';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const getPageTitle = (path: string): string => {
  if (path === '/') return 'Dashboard';
  if (path.startsWith('/orders')) return 'Orders';
  if (path.startsWith('/mill-production')) return 'Production';
  if (path.startsWith('/inventory')) return 'Inventory';
  if (path.startsWith('/shipments')) return 'Shipments';
  if (path.startsWith('/customers')) return 'Customers';
  if (path.startsWith('/settings')) return 'Settings';
  return 'Dashboard';
};

export default function Header({ onSearch }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useLocalStorage<string[]>(
    'notifications-read',
    []
  );

  // Load notifications on mount
  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch((error) => {
        console.error('Failed to load notifications:', error);
      });
  }, []);

  // Search callback (debounced)
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  // Compute unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readNotificationIds.includes(n.id)).length;
  }, [notifications, readNotificationIds]);

  // Mark notification as read
  const handleMarkAsRead = useCallback((id: string) => {
    if (!readNotificationIds.includes(id)) {
      setReadNotificationIds((prev) => [...prev, id]);
    }
  }, [readNotificationIds, setReadNotificationIds]);

  // Clear all notifications
  const handleClearAll = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
  }, [notifications, setReadNotificationIds]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="flex w-full items-center justify-between">
      {/* Left Side - Breadcrumb */}
      <div className="flex flex-col gap-0.5">
        <div className="text-text-secondary flex items-center gap-1 text-xs">
          <span>Pages</span>
          <span>/</span>
          <span className="text-text-primary">{title}</span>
        </div>
        <h1 className="text-text-primary text-sm font-bold">{title}</h1>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-card)] px-3 py-2 shadow-[var(--shadow-sm)]">
          <Search className="text-text-secondary h-4 w-4" />
          <input
            type="text"
            placeholder="Type here..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="placeholder:text-text-secondary w-32 bg-transparent text-xs outline-none"
          />
        </div>

        {/* Icons */}
        <button
          onClick={() => router.push('/settings')}
          className="rounded-lg p-2 transition-colors hover:bg-white/50"
          aria-label="Settings"
        >
          <Settings className="text-text-secondary h-4 w-4" />
        </button>

        {/* Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="rounded-lg p-2 transition-colors hover:bg-white/50 relative"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={isDropdownOpen}
          >
            <Bell className="text-text-secondary h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-error text-white text-[var(--text-10)] font-bold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown
            notifications={notifications}
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAll}
            readNotificationIds={readNotificationIds}
          />
        </div>
      </div>
    </header>
  );
}
