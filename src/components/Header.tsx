'use client';

import { Bell, Settings } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getNotifications } from '@/services/notifications';
import { Notification } from '@/types/notification';
import NotificationDropdown from './NotificationDropdown';
import { UserButton, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk-theme';

// Skeleton component for UserButton - matches 32px avatar per D-04
const UserButtonSkeleton = () => (
  <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--divider)]" />
);

const getPageTitle = (path: string): string => {
  // Demo routes (check first - more specific)
  if (path.startsWith('/demo/orders')) return 'Orders';
  if (path.startsWith('/demo/customers')) return 'Customers';
  if (path.startsWith('/demo/mill-production')) return 'Mill Production';

  // Production routes (UI-SPEC sidebar update contract)
  if (path === '/') return 'Dashboard';             // exact match — was 'Coming Soon'
  if (path.startsWith('/import')) return 'Import';  // NEW: /import route
  if (path.startsWith('/settings')) return 'Settings';

  return 'Dashboard';
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);

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
            className="relative rounded-lg p-2 transition-colors hover:bg-white/50"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={isDropdownOpen}
          >
            <Bell className="text-text-secondary h-4 w-4" />
            {unreadCount > 0 && (
              <span className="bg-error absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full font-bold text-[var(--fs-10)] text-white">
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

        {/* UserButton - Per D-02: Position after notifications */}
        <ClerkLoading>
          <UserButtonSkeleton />
        </ClerkLoading>
        <ClerkLoaded>
          <UserButton appearance={clerkAppearance}>
            <UserButton.MenuItems>
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </ClerkLoaded>
      </div>
    </header>
  );
}
