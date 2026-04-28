# Phase 5: Header - Research

**Researched:** 2026-04-28
**Domain:** Header UI components with search, notifications, and settings in Next.js App Router
**Confidence:** HIGH

## Summary

This phase enhances the existing Header component with three functional features: global search across orders, a notification system with read/unread tracking, and navigation to a settings page with persistent user preferences. The implementation leverages existing patterns from the codebase — Client Components with hooks, localStorage persistence via the existing useLocalStorage hook, and Next.js App Router for routing and dynamic page titles.

The technical domain is well-established: React patterns for dropdown UI with click-outside detection, debounced search inputs, localStorage for client-side persistence, and Next.js usePathname for route-based dynamic content. All core dependencies (React 19, Next.js 16) are current and well-documented.

**Primary recommendation:** Wire functionality into the existing Header component structure using established codebase patterns. Create a notifications service following the orders.ts mock service pattern. Use useLocalStorage hook for persistence. Implement click-outside detection with useRef + useEffect for dropdown. Add debouncing for search input to optimize performance.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Global search filtering | Browser / Client | — | Client-side filtering of existing order data; no API calls needed for v1 |
| Notification dropdown UI | Browser / Client | — | Pure UI state management with localStorage persistence |
| Notification badge indicator | Browser / Client | — | Derived from notification read/unread state |
| Settings page routing | Frontend Server (SSR) | — | Next.js App Router handles route definition and navigation |
| Settings persistence | Browser / Client | — | User preferences stored in localStorage; no backend required |
| Dynamic page title | Browser / Client | — | Client Component reads pathname and updates title dynamically |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component framework | Already in project, stable release [VERIFIED: npm registry] |
| Next.js | 16.1.6 | App Router for pages/routing | Already in project, current stable [VERIFIED: npm registry] |
| lucide-react | 0.577.0 | Icons for bell, settings, search | Already in project for UI icons [VERIFIED: package.json] |
| TypeScript | ^5 | Type safety | Already in project [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | ^4 | Styling | All component styling; already in project [VERIFIED: package.json] |
| useLocalStorage hook | — | State persistence | Notification read/unread state, user preferences [VERIFIED: existing hook at src/hooks/useLocalStorage.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage | Context API only | Context provides in-session state but doesn't persist across page reloads; user decisions state no backend, so localStorage is required |
| Custom debounce | lodash.debounce | Lodash adds dependency weight; custom implementation with useCallback + useRef is lighter and sufficient for single search input |
| Notification library | react-toastify / MagicBell | These are toast notification systems for push alerts; requirement is for a notification history panel, not toasts |

**Installation:**
```bash
# No new packages required — all dependencies already installed
```

**Version verification:**
```bash
npm view next@16.1.6 version    # 16.1.6 (current stable)
npm view react@19.2.3 version   # 19.2.3 (current stable)
```
Verified 2026-04-28. Both versions are current.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interaction                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
          ┌──────────────┐ ┌──────────┐ ┌──────────┐
          │ Search Input │ │   Bell   │ │ Settings │
          │   (debounced)│ │  Button  │ │  Button  │
          └──────────────┘ └──────────┘ └──────────┘
                    │            │            │
                    │            ▼            │
                    │     ┌──────────────┐   │
                    │     │ Notification │   │
                    │     │   Dropdown   │   │
                    │     │ (click-outside)│ │
                    │     └──────────────┘   │
                    │            │            │
                    ▼            ▼            ▼
          ┌──────────────┐ ┌──────────┐ ┌──────────┐
          │ Filter Orders│ │  Update  │ │ Navigate │
          │  (in-memory) │ │Read State│ │ to /settings│
          └──────────────┘ └──────────┘ └──────────┘
                    │            │            │
                    │            ▼            │
                    │     ┌──────────────┐   │
                    │     │ localStorage │   │
                    │     │ (persist state)│ │
                    │     └──────────────┘   │
                    │                         │
                    ▼                         ▼
          ┌──────────────┐           ┌──────────────┐
          │ Orders View  │           │Settings Page │
          │  (filtered)  │           │(preferences) │
          └──────────────┘           └──────────────┘
                                              │
                                              ▼
                                     ┌──────────────┐
                                     │ localStorage │
                                     │(persist prefs)│
                                     └──────────────┘
```

**Data flow:**
1. **Search**: User types → debounce delay → filter orders array → update view
2. **Notifications**: Bell click → toggle dropdown → click notification → mark read → save to localStorage → update badge count
3. **Settings**: Click button → navigate to /settings → edit preferences → save to localStorage → apply on mount

**Decision points:**
- Search: Apply debounce before filtering (300-500ms typical)
- Notification dropdown: Detect click outside dropdown ref to close
- Page title: usePathname() detects route change → map route to title

### Recommended Project Structure
```
src/
├── components/
│   ├── Header.tsx              # Existing — wire functionality
│   ├── NotificationDropdown.tsx # New — dropdown panel UI
│   └── ...
├── hooks/
│   ├── useLocalStorage.ts      # Existing — reuse for persistence
│   ├── useClickOutside.ts      # New — dropdown close detection
│   └── useDebounce.ts          # New — search input optimization
├── services/
│   ├── orders.ts               # Existing — search will query this
│   └── notifications.ts        # New — mock notification data
├── types/
│   ├── order.ts                # Existing
│   ├── notification.ts         # New — notification shape
│   └── settings.ts             # New — user preferences shape
└── app/
    ├── settings/
    │   └── page.tsx            # New — settings page
    └── ...
```

### Pattern 1: Dynamic Page Title (Route-Based)
**What:** Update header title based on current route using Next.js usePathname hook
**When to use:** When a Client Component needs to react to route changes (header is shared across routes)
**Example:**
```typescript
// Source: [CITED: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/use-pathname.mdx]
'use client'

import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  // Map pathname to display title
  const getTitleFromPath = (path: string): string => {
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/orders')) return 'Orders'
    if (path.startsWith('/settings')) return 'Settings'
    if (path.startsWith('/mill-production')) return 'Production'
    // ... etc
    return 'Dashboard'
  }

  const title = getTitleFromPath(pathname)

  return <h1>{title}</h1>
}
```

### Pattern 2: Click Outside Detection (Dropdown Close)
**What:** Detect clicks outside a dropdown to close it automatically
**When to use:** Any dropdown, modal, or popover that should close when user clicks elsewhere
**Example:**
```typescript
// Pattern synthesized from: [CITED: https://usehooks-ts.com/react-hook/use-on-click-outside]
import { useEffect, useRef } from 'react'

function useClickOutside<T extends HTMLElement>(
  handler: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current
      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(event.target as Node)) {
        return
      }
      handler()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler])

  return ref
}

// Usage in NotificationDropdown:
function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false))

  return (
    <div ref={dropdownRef}>
      {/* dropdown content */}
    </div>
  )
}
```

### Pattern 3: Debounced Search Input
**What:** Delay search execution until user stops typing to reduce unnecessary computations
**When to use:** Search inputs that trigger filtering/API calls on every keystroke
**Example:**
```typescript
// Pattern from: [CITED: https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b]
import { useState, useCallback, useRef, useEffect } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Usage in search component:
function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    // This runs only after user stops typing for 300ms
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  return <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
}
```

### Pattern 4: Mock Service with Async Interface
**What:** Create a service file that returns mock data with delay to simulate API calls
**When to use:** When building UI before backend is ready; makes replacing with real API trivial
**Example:**
```typescript
// Following pattern from: [VERIFIED: src/services/orders.ts]
// src/services/notifications.ts

export interface Notification {
  id: string
  type: 'order_status' | 'alert' | 'system'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  relatedOrderId?: string
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'order_status',
    title: 'Order Status Changed',
    message: 'Order ORD-2847 is now Ready for delivery',
    timestamp: new Date('2026-04-28T10:30:00Z'),
    isRead: false,
    relatedOrderId: 'ORD-2847'
  },
  // ... more mock notifications
]

export async function getNotifications(): Promise<Notification[]> {
  await delay(200)
  return mockNotifications
}

export async function markAsRead(id: string): Promise<void> {
  await delay(100)
  const notification = mockNotifications.find(n => n.id === id)
  if (notification) notification.isRead = true
}
```

### Pattern 5: localStorage Persistence with useLocalStorage Hook
**What:** Use existing useLocalStorage hook to persist notification read state and user preferences
**When to use:** Any state that must survive page reloads (notification read status, user settings)
**Example:**
```typescript
// Hook already exists: [VERIFIED: src/hooks/useLocalStorage.ts]
import { useLocalStorage } from '@/hooks/useLocalStorage'

function NotificationPanel() {
  // Persist read notification IDs
  const [readNotificationIds, setReadNotificationIds] = useLocalStorage<string[]>(
    'notifications-read',
    []
  )

  const markAsRead = (id: string) => {
    if (!readNotificationIds.includes(id)) {
      setReadNotificationIds([...readNotificationIds, id])
    }
  }

  // ...
}

function SettingsPage() {
  const [preferences, setPreferences] = useLocalStorage('user-preferences', {
    theme: 'light',
    density: 'comfortable',
    notificationsEnabled: true
  })

  // ...
}
```

### Anti-Patterns to Avoid
- **Avoid: Using useState for debounce timer IDs** — Causes re-renders and timer resets. Use useRef instead [CITED: https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b]
- **Avoid: Not cleaning up event listeners** — Memory leaks in dropdowns. Always return cleanup function in useEffect [CITED: https://usehooks-ts.com/react-hook/use-on-click-outside]
- **Avoid: Calling usePathname in Server Component** — usePathname is client-only. Header must be 'use client' component [VERIFIED: Next.js docs]
- **Avoid: Storing transient UI state in localStorage** — Don't persist dropdown open/closed state; only persist user decisions (read status, preferences) [CITED: https://medium.com/@lcs2021021/the-art-of-persistent-local-storage-a-developers-guide-to-state-persistence-29ed77816ea6]
- **Avoid: Filtering orders on every keystroke without debounce** — Performance degrades with large datasets. Always debounce search inputs [CITED: https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Click outside detection | Custom document listener logic | useClickOutside hook pattern | Handles touch events, proper cleanup, edge cases with React portals [CITED: https://usehooks-ts.com/react-hook/use-on-click-outside] |
| Debounce implementation | Custom setTimeout wrapper | useDebounce hook with useRef for timer | Prevents infinite re-renders, proper cleanup, memoization between renders [CITED: https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b] |
| localStorage sync | Manual window.localStorage calls | useLocalStorage hook | SSR-safe (checks `typeof window`), handles JSON parse errors, syncs state automatically [VERIFIED: existing hook implementation] |
| Route-to-title mapping | Manual location parsing | usePathname from next/navigation | Framework-provided, SSR-aware, handles nested routes and rewrites [CITED: Next.js official docs] |

**Key insight:** React hook patterns for common UI interactions (click-outside, debounce, localStorage) are well-established and handle edge cases (SSR, cleanup, touch events, memory leaks) that custom implementations often miss. Don't reinvent these wheels — the custom hook pattern is the React community standard.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with localStorage
**What goes wrong:** Server-rendered content shows default state (e.g., 0 unread notifications), but client has persisted state (e.g., 3 unread), causing hydration error.
**Why it happens:** Server doesn't have access to localStorage during SSR; reads default value. Client reads from localStorage on mount and gets different value.
**How to avoid:** Either (1) mark component as client-only with 'use client' and accept SSR shows default briefly, or (2) use pattern from Next.js docs: useState with empty initial, then useEffect to read localStorage after mount [CITED: https://dev.to/collegewap/how-to-use-local-storage-in-nextjs-2l2j]
**Warning signs:** "Hydration failed" error in console, content flickering on page load

### Pitfall 2: Debounce Function Recreated on Every Render
**What goes wrong:** Debounce timer resets on every render, so search never actually fires (always waiting for quiet period that never comes)
**Why it happens:** Creating new debounce function in component body means new function instance every render, timer IDs lost
**How to avoid:** Use useCallback to memoize the debounced handler, or use useRef to persist timer ID across renders [CITED: https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b]
**Warning signs:** Search never executes, or executes on every keystroke despite debounce code

### Pitfall 3: usePathname Called in Server Component
**What goes wrong:** Error: "usePathname only works in Client Components"
**Why it happens:** usePathname is a React hook that reads browser location; hooks don't work in Server Components
**How to avoid:** Add 'use client' directive at top of Header.tsx (or create a separate client component for dynamic title logic) [VERIFIED: Next.js docs - usePathname requires 'use client']
**Warning signs:** Build error or runtime error mentioning hooks/client components

### Pitfall 4: Event Listener Memory Leaks in Dropdown
**What goes wrong:** Multiple event listeners accumulate, dropdown stops working correctly, memory usage grows
**Why it happens:** Adding document event listener in useEffect but forgetting to return cleanup function
**How to avoid:** Always return cleanup function from useEffect that removes listeners: `return () => { document.removeEventListener(...) }` [CITED: https://usehooks-ts.com/react-hook/use-on-click-outside]
**Warning signs:** Dropdown behavior becomes erratic after navigating away and back, React DevTools shows listeners piling up

### Pitfall 5: Notification Badge Count Recalculated on Every Render
**What goes wrong:** Performance degrades with long notification lists; unnecessary re-renders
**Why it happens:** Calculating unread count inline in render (e.g., `notifications.filter(n => !n.isRead).length`) runs on every render
**How to avoid:** Use useMemo to memoize the count calculation, or store unread count separately in state [CITED: https://www.magicbell.com/blog/react-notification-badges]
**Warning signs:** Profiler shows expensive filtering operations on every render

## Code Examples

Verified patterns from official sources and existing codebase:

### Route Detection and Dynamic Title
```typescript
// Source: [VERIFIED: Next.js docs] + [VERIFIED: existing Sidebar.tsx pattern]
'use client'

import { usePathname } from 'next/navigation'

interface HeaderProps {
  title?: string // Allow override for custom titles
}

export default function Header({ title }: HeaderProps) {
  const pathname = usePathname()

  const getPageTitle = (path: string): string => {
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/orders')) return 'Orders'
    if (path.startsWith('/mill-production')) return 'Production'
    if (path.startsWith('/inventory')) return 'Inventory'
    if (path.startsWith('/shipments')) return 'Shipments'
    if (path.startsWith('/settings')) return 'Settings'
    return 'Dashboard'
  }

  const displayTitle = title || getPageTitle(pathname)

  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-text-secondary flex items-center gap-1 text-xs">
        <span>Pages</span>
        <span>/</span>
        <span className="text-text-primary">{displayTitle}</span>
      </div>
      <h1 className="text-text-primary text-sm font-bold">{displayTitle}</h1>
    </div>
  )
}
```

### Notification Badge with Unread Count
```typescript
// Pattern from: [CITED: https://www.magicbell.com/blog/react-notification-badges]
import { Bell } from 'lucide-react'
import { useMemo } from 'react'

interface NotificationButtonProps {
  notifications: Notification[]
  onClick: () => void
}

function NotificationButton({ notifications, onClick }: NotificationButtonProps) {
  // Memoize unread count to avoid recalculating on every render
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  )

  return (
    <button
      className="relative rounded-lg p-2 transition-colors hover:bg-white/50"
      onClick={onClick}
    >
      <Bell className="text-text-secondary h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
```

### Settings Page with Persisted Preferences
```typescript
// Pattern from: [VERIFIED: existing useLocalStorage hook] + [CITED: Next.js App Router docs]
// src/app/settings/page.tsx
'use client'

import { useLocalStorage } from '@/hooks/useLocalStorage'

interface UserPreferences {
  theme: 'light' | 'dark'
  density: 'comfortable' | 'compact'
  notifications: {
    orderStatus: boolean
    alerts: boolean
    system: boolean
  }
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  density: 'comfortable',
  notifications: {
    orderStatus: true,
    alerts: true,
    system: true
  }
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    'user-preferences',
    defaultPreferences
  )

  const updateNotificationSetting = (key: keyof UserPreferences['notifications'], value: boolean) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">Notification Settings</h2>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={preferences.notifications.orderStatus}
          onChange={(e) => updateNotificationSetting('orderStatus', e.target.checked)}
        />
        <span>Order Status Changes</span>
      </label>

      {/* More settings... */}
    </div>
  )
}
```

### Search with Debounce
```typescript
// Pattern from: [CITED: https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b]
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

interface SearchProps {
  onSearch: (query: string) => void
}

function GlobalSearch({ onSearch }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    onSearch(debouncedSearchTerm)
  }, [debouncedSearchTerm, onSearch])

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      <Search className="text-text-secondary h-4 w-4" />
      <input
        type="text"
        placeholder="Type here..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="placeholder:text-text-secondary w-32 bg-transparent text-xs outline-none"
      />
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class components with componentDidMount | Functional components with useEffect | React 16.8 (Feb 2019) | Hooks are now standard; all new React code uses functional components [ASSUMED] |
| Pages Router (pages/) | App Router (app/) | Next.js 13 (Oct 2022) | Project uses App Router; all new routes go in src/app/ [VERIFIED: codebase] |
| Manual localStorage calls | Custom hooks (useLocalStorage) | Community pattern ~2020 | Project already uses hook pattern [VERIFIED: existing hook] |
| Inline event handlers | useCallback memoization | React best practice | Prevents unnecessary re-renders, especially with useEffect dependencies [ASSUMED] |
| Context API for all global state | localStorage for persistent data + local state for UI | Evolved pattern ~2021 | localStorage for persistence, state for reactivity, Context only when prop-drilling is excessive [CITED: https://medium.com/@lcs2021021/the-art-of-persistent-local-storage-a-developers-guide-to-state-persistence-29ed77816ea6] |

**Deprecated/outdated:**
- **next/router**: Replaced by next/navigation in App Router. Use usePathname, not useRouter from next/router [VERIFIED: Next.js 16 docs]
- **External debounce libraries for simple cases**: For single search input, custom useDebounce hook is sufficient and lighter than lodash dependency [CITED: debounce search articles]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Functional components with hooks are standard practice in modern React | State of the Art | None — this is industry consensus since React 16.8 |
| A2 | 300ms is an appropriate debounce delay for search | Architecture Patterns | Search feels sluggish (too high) or doesn't reduce computations enough (too low); easily tunable |
| A3 | Notification dropdown should close on outside click | Architecture Patterns | Users might expect it to stay open; low risk, standard UI pattern |
| A4 | All notifications should be shown in a single list (not grouped/paginated) | Don't specify | With many notifications, list could become unwieldy; v1 requirement doesn't specify scale |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Global search scope**
   - What we know: HEADER-01 says "search across all orders"
   - What's unclear: Should search also include other entities (customers, products) when those pages exist, or is it orders-only forever?
   - Recommendation: Implement orders-only search for v1. Design search service interface to be extensible (e.g., `searchOrders(query)` separate from potential future `searchAll(query)`)

2. **Notification types**
   - What we know: CONTEXT.md specifies "order status changes, alerts, and system messages"
   - What's unclear: What triggers each type? Are alerts manual from operations staff, or auto-generated from order changes flag?
   - Recommendation: Create mock notifications representing all three types. Service can be expanded when real trigger logic is defined.

3. **Settings page scope**
   - What we know: User preferences for notifications (toggle types) and display (theme, density)
   - What's unclear: Do display settings (theme, density) need to actually apply to the UI in Phase 5, or just persist for future use?
   - Recommendation: Persist settings but don't apply theme/density in Phase 5 unless explicitly required. Focus on notification toggles affecting dropdown behavior.

## Validation Architecture

> Validation framework detection

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | None found |
| Quick run command | Not applicable |
| Full suite command | Not applicable |

**Test framework status:** No testing framework is currently configured in the project. The package.json contains no test script, and no test configuration files (jest.config.js, vitest.config.ts, etc.) were found.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HEADER-01 | Global search filters orders by customer name and product | integration | Manual browser testing (no framework) | ❌ Wave 0 |
| HEADER-02 | Notification dropdown shows unread count and marks as read | integration | Manual browser testing (no framework) | ❌ Wave 0 |
| HEADER-03 | Settings button navigates to /settings page | smoke | Manual browser testing (no framework) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual browser smoke test of changed feature
- **Per wave merge:** Manual full feature test (search, notifications, settings)
- **Phase gate:** Manual verification of all three requirements before `/gsd-verify-work`

### Wave 0 Gaps
**No automated testing infrastructure exists.** All validation must be manual until a framework is installed. Recommended Wave 0 tasks if testing is desired:

- [ ] Install Vitest or Jest — `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom`
- [ ] Create `vitest.config.ts` — configure for React Testing Library
- [ ] Write `tests/components/Header.test.tsx` — covers HEADER-01, HEADER-02, HEADER-03
- [ ] Update package.json script — add `"test": "vitest"`

**Note:** Given this is a frontend UI phase with visual components, manual testing may be more practical than writing comprehensive automated tests at this stage. Automated testing is more valuable once business logic complexity increases.

## Security Domain

> Security analysis for Header phase

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No | Header displays user controls but no authentication in v1 |
| V3 Session Management | No | localStorage is client-only; no server sessions |
| V4 Access Control | No | All features client-side UI; no authorization needed |
| V5 Input Validation | Yes | Search input must sanitize for XSS if ever server-sent |
| V6 Cryptography | No | No sensitive data encryption required |

**V5 Input Validation details:**
- Search input: Client-side filtering only in v1; no server interaction. XSS risk is LOW because filtered results render from typed Order objects (not raw HTML). React escapes text by default.
- Notification messages: Mock data currently; if future API sends HTML in messages, must sanitize. For v1, TypeScript interface ensures string-only content.
- Settings values: Persist to localStorage only; no server transmission. Tampering affects only user's own view.

### Known Threat Patterns for React + Next.js + localStorage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via dangerouslySetInnerHTML | Tampering | Never use dangerouslySetInnerHTML; React escapes by default [ASSUMED best practice] |
| localStorage XSS injection | Tampering | Only store JSON-serializable data; validate on read with TypeScript interfaces [VERIFIED: existing useLocalStorage hook uses JSON.parse] |
| CSRF on future API calls | Tampering | Not applicable in v1 (no API); when added, use Next.js CSRF tokens or SameSite cookies [ASSUMED] |
| Sensitive data in localStorage | Information Disclosure | Never store tokens/passwords/PII in localStorage; only UI preferences and non-sensitive state [ASSUMED best practice] |

**Phase 5 specific risks:**
- **LOW**: Search input XSS — mitigated by React's default escaping and TypeScript interfaces for Order data
- **LOW**: Notification content tampering — user can edit their own localStorage; only affects their view, no server state
- **NONE**: Settings tampering — affects only user's preferences; no security boundary crossed

**Recommended controls for this phase:**
1. Ensure notification messages render as text, not HTML (React default behavior)
2. Validate localStorage data structure on read (useLocalStorage hook already handles JSON parse errors)
3. No additional security controls needed for v1 mock data implementation

## Sources

### Primary (HIGH confidence)
- [Next.js v16.1.6 usePathname documentation](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/use-pathname.mdx) — Context7 via official Next.js docs
- npm registry — Verified Next.js 16.1.6, React 19.2.3 versions current as of 2026-04-28
- Existing codebase — Header.tsx, useLocalStorage.ts, Sidebar.tsx, orders.ts service pattern verified by direct file reads

### Secondary (MEDIUM confidence)
- [How to handle click outside a div in React with a custom hook](https://medium.com/geekculture/how-to-handle-click-outside-a-div-in-react-d2283dc4ed57) — Geek Culture / Medium
- [useOnClickOutside hook pattern](https://usehooks-ts.com/react-hook/use-on-click-outside) — usehooks-ts
- [Debounce your Search - React Input Optimization](https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b) — Nerd For Tech / Medium
- [Setting Titles Dynamically with Next.js Metadata](https://dev.to/souhailxedits/setting-titles-dynamically-with-nextjs-metadata-4hog) — DEV Community
- [A Guide to React Notification Badges](https://www.magicbell.com/blog/react-notification-badges) — MagicBell Blog
- [The Art of Persistent Local Storage: A Developer's Guide to State Persistence](https://medium.com/@lcs2021021/the-art-of-persistent-local-storage-a-developers-guide-to-state-persistence-29ed77816ea6) — Medium
- [How to use Local Storage in Next.js](https://dev.to/collegewap/how-to-use-local-storage-in-nextjs-2l2j) — DEV Community
- [Next.js 16 App Router: The Complete Guide for 2026](https://dev.to/getcraftly/nextjs-16-app-router-the-complete-guide-for-2026-2hi3) — DEV Community

### Tertiary (LOW confidence)
- None — all research findings were verified against official documentation or existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies verified in package.json and npm registry; versions current
- Architecture: HIGH - Patterns verified from Next.js official docs, existing codebase follows same patterns
- Pitfalls: MEDIUM - Based on community articles and common React gotchas, not official documentation
- Security: MEDIUM - ASVS mapping is standard, but specific React XSS mitigations are assumed best practices

**Research date:** 2026-04-28
**Valid until:** ~2026-05-28 (30 days) — React/Next.js ecosystem is stable; hook patterns unlikely to change in 30 days
