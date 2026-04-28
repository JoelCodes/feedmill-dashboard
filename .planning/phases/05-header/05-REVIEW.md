---
phase: 05-header
reviewed: 2026-04-28T19:45:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/app/page.tsx
  - src/app/settings/page.tsx
  - src/components/Header.tsx
  - src/components/NotificationDropdown.tsx
  - src/components/OrdersTable.tsx
  - src/hooks/useClickOutside.ts
  - src/services/notifications.ts
  - src/types/notification.ts
  - src/types/settings.ts
findings:
  critical: 0
  warning: 8
  info: 1
  total: 9
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-28T19:45:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This review covers the header component implementation including search functionality, notification system, and settings page. The code is generally well-structured with TypeScript types and React best practices. However, several issues were identified including missing error handling in async operations, potential race conditions with useEffect dependencies, type inconsistencies between the notification data model and UI state management, and accessibility gaps in interactive components.

The most significant issues involve:
- Missing error handling in async notification loading
- Stale closure bug in useClickOutside hook
- Type mismatch between Notification.isRead and localStorage-based read tracking
- Missing ARIA attributes for accessibility

## Warnings

### WR-01: Missing Error Handling in Notification Loading

**File:** `src/components/Header.tsx:41-43`
**Issue:** The `getNotifications()` promise has no error handling. If the service call fails, the error will be silently swallowed and notifications state will remain empty. Users won't know if notifications failed to load vs. no notifications exist.

**Fix:**
```typescript
// Load notifications on mount
useEffect(() => {
  getNotifications()
    .then(setNotifications)
    .catch((error) => {
      console.error('Failed to load notifications:', error);
      // Optional: Set error state to show user-facing error message
    });
}, []);
```

### WR-02: Stale Closure in useClickOutside Hook

**File:** `src/hooks/useClickOutside.ts:8`
**Issue:** The `stableHandler` callback wraps `handler()` unnecessarily, which defeats the purpose of memoization. If `handler` changes, `stableHandler` will still use the old reference due to the dependency array `[handler]`. This creates a stale closure where the callback will execute the old handler function, not the current one.

**Fix:**
```typescript
// Remove the unnecessary wrapper - just use handler directly
const stableHandler = useCallback(handler, [handler]);

// Or if you want to avoid re-registering listeners, use useRef:
const handlerRef = useRef(handler);
useEffect(() => {
  handlerRef.current = handler;
}, [handler]);

const stableHandler = useCallback(() => {
  handlerRef.current();
}, []);
```

### WR-03: Type Inconsistency Between Notification Model and Read State

**File:** `src/types/notification.ts:9` and `src/components/Header.tsx:35-38`
**Issue:** The `Notification` type includes an `isRead: boolean` field, but the Header component ignores this field and maintains read state separately in localStorage as `readNotificationIds: string[]`. This creates two sources of truth for read status. The service returns `isRead: false` for all new notifications, but this field is never used or synced with localStorage.

**Fix:**
Either remove `isRead` from the type if client-side localStorage is the sole source of truth:
```typescript
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  // Remove isRead - managed in localStorage
  relatedOrderId?: string;
}
```

Or sync the service data with localStorage:
```typescript
useEffect(() => {
  getNotifications().then((notifications) => {
    // Filter out notifications already marked as read in the service
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    setReadNotificationIds(unreadIds);
    setNotifications(notifications);
  });
}, []);
```

### WR-04: Dependency Array Missing setReadNotificationIds

**File:** `src/components/Header.tsx:58-62`
**Issue:** The `handleMarkAsRead` callback includes `setReadNotificationIds` in its dependency array. Since `setReadNotificationIds` comes from `useLocalStorage` hook which returns a new setter function on every render (not a stable identity), this causes the callback to be recreated unnecessarily. While not a bug, it's inefficient and indicates the hook should return a stable setter.

**Fix:**
Verify that `useLocalStorage` returns a stable setter function (wrapped in useCallback). If not, wrap it:
```typescript
// In useLocalStorage.ts
const setValue = useCallback((value: T | ((prev: T) => T)) => {
  setStoredValue(value);
}, []);

return [storedValue, setValue];
```

Alternatively, remove it from the dependency array if the setter is guaranteed stable:
```typescript
const handleMarkAsRead = useCallback((id: string) => {
  if (!readNotificationIds.includes(id)) {
    setReadNotificationIds((prev) => [...prev, id]);
  }
}, [readNotificationIds]); // setReadNotificationIds removed if stable
```

### WR-05: Notification Timestamp Deserialization Issue

**File:** `src/services/notifications.ts:5-65`
**Issue:** The mock service returns `Notification` objects with `timestamp: new Date(...)`, but in a real API scenario, timestamps would be JSON strings. When notifications are fetched from an API, `timestamp` will be a string, not a Date object, breaking `formatTimestamp` logic in NotificationDropdown. This is a latent bug waiting to surface when the service is connected to a real backend.

**Fix:**
Add deserialization in the service layer:
```typescript
export async function getNotifications(): Promise<Notification[]> {
  await delay(200);
  // When connecting to real API:
  // const response = await fetch('/api/notifications');
  // const data = await response.json();
  // return data.map(n => ({
  //   ...n,
  //   timestamp: new Date(n.timestamp)
  // }));
  return mockNotifications;
}
```

### WR-06: Missing Accessibility Attributes on Interactive Elements

**File:** `src/components/Header.tsx:102-108` and `111-121`
**Issue:** The Settings and Bell buttons lack ARIA labels, making them inaccessible to screen readers. Users with assistive technology won't know what these icon-only buttons do.

**Fix:**
```typescript
<button
  onClick={() => router.push('/settings')}
  className="rounded-lg p-2 transition-colors hover:bg-white/50"
  aria-label="Settings"
>
  <Settings className="text-text-secondary h-4 w-4" />
</button>

<button
  onClick={toggleDropdown}
  className="rounded-lg p-2 transition-colors hover:bg-white/50 relative"
  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
  aria-expanded={isDropdownOpen}
>
  <Bell className="text-text-secondary h-4 w-4" />
  {/* ... */}
</button>
```

### WR-07: Missing Keyboard Navigation for Notification Dropdown

**File:** `src/components/NotificationDropdown.tsx:40-106`
**Issue:** The notification dropdown has no keyboard navigation support. Users cannot use arrow keys to navigate through notifications or Escape to close the dropdown. This violates WCAG 2.1 keyboard navigation guidelines for interactive components.

**Fix:**
Add keyboard event handler to the dropdown:
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') {
    onClose();
  }
  // Optional: Add arrow key navigation between notification items
};

return (
  <div
    ref={ref}
    className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg bg-white shadow-lg"
    onKeyDown={handleKeyDown}
    role="dialog"
    aria-label="Notifications"
  >
    {/* ... */}
  </div>
);
```

### WR-08: Unchecked Array Access in OrdersTable

**File:** `src/components/OrdersTable.tsx:151` and `158`
**Issue:** The code accesses `filteredOrders[0]` without checking if the array has elements. While there is a length check (`filteredOrders.length > 0`), TypeScript cannot guarantee the array won't be modified between the check and access in concurrent renders, especially with async state updates.

**Fix:**
Use optional chaining for defensive programming:
```typescript
// Auto-select first row on initial load
useEffect(() => {
  if (!selectedOrderId && filteredOrders.length > 0) {
    const firstOrder = filteredOrders[0];
    if (firstOrder) {
      handleSelectOrder(firstOrder.id);
    }
  }
}, [selectedOrderId, filteredOrders, handleSelectOrder]);

// Auto-select first visible when current selection filtered out
useEffect(() => {
  if (!validSelectedId && selectedOrderId && filteredOrders.length > 0) {
    const firstOrder = filteredOrders[0];
    if (firstOrder) {
      handleSelectOrder(firstOrder.id);
    }
  }
}, [validSelectedId, filteredOrders, selectedOrderId, handleSelectOrder]);
```

## Info

### IN-01: Console.error in Production Code

**File:** `src/hooks/useLocalStorage.ts:25`
**Issue:** The hook uses `console.error` for localStorage errors. While this is acceptable for development, production builds should use a proper error logging service (e.g., Sentry, LogRocket) or suppress non-critical errors to avoid console noise.

**Fix:**
```typescript
// Option 1: Use environment-aware logging
if (process.env.NODE_ENV === 'development') {
  console.error(`Error setting localStorage key "${key}":`, error);
}

// Option 2: Use a logging service
// logError(`Error setting localStorage key "${key}"`, error);
```

---

_Reviewed: 2026-04-28T19:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
