# Phase 23: User Experience Integration - Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 2 modified files
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/Header.tsx` | component | request-response | `src/components/Header.tsx` (existing) | exact |
| `src/lib/clerk-theme.ts` | config | export | `src/lib/clerk-theme.ts` (existing) | exact |

## Pattern Assignments

### `src/components/Header.tsx` (component, request-response)

**Analog:** `src/components/Header.tsx` (existing file)

**Current structure to preserve** (lines 1-142):

**Imports pattern** (lines 1-10):
```typescript
'use client';

import { Search, Bell, Settings } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getNotifications } from '@/services/notifications';
import { Notification } from '@/types/notification';
import NotificationDropdown from './NotificationDropdown';
```

**Client directive pattern** (line 1):
```typescript
'use client';
```

**Header layout structure** (lines 80-91):
```typescript
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
```

**Actions container pattern** (lines 92-93):
```typescript
  {/* Right Side - Actions */}
  <div className="flex items-center gap-4">
```

**Existing action items** (lines 94-138):
- Search input with icon (lines 94-104)
- Settings button (lines 106-113)
- Bell/notifications button with dropdown (lines 115-138)

**Action button pattern** (lines 107-113):
```typescript
<button
  onClick={() => router.push('/settings')}
  className="rounded-lg p-2 transition-colors hover:bg-white/50"
  aria-label="Settings"
>
  <Settings className="text-text-secondary h-4 w-4" />
</button>
```

**Icon sizing pattern** (lines 96, 112, 123):
```typescript
// All header icons use h-4 w-4 (16px)
<Search className="text-text-secondary h-4 w-4" />
<Settings className="text-text-secondary h-4 w-4" />
<Bell className="text-text-secondary h-4 w-4" />
```

**Integration point for UserButton:**
- Add after bell button (line 138, inside actions container before closing `</div>`)
- Maintain `gap-4` spacing between action items
- UserButton should be larger (32px) than icons (16px) for prominence

---

### Clerk UserButton Integration Pattern

**Source:** RESEARCH.md Pattern 1 (ClerkLoaded with Skeleton Fallback)

**New imports to add:**
```typescript
import { UserButton, ClerkLoaded } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk-theme';
```

**Skeleton component pattern** (from TableSkeleton.tsx lines 7, 15, 30):
```typescript
// Circular skeleton for avatar - matches UserButton 32px size
const UserButtonSkeleton = () => (
  <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--divider)]" />
);
```

**Skeleton class breakdown:**
- `h-8 w-8` - 32px diameter (matches Phase 22 design spec)
- `animate-pulse` - pulsing animation (established in TableSkeleton.tsx line 7)
- `rounded-full` - circular shape (established in DetailsSkeleton.tsx line 30)
- `bg-[var(--divider)]` - skeleton color (established in TableSkeleton.tsx line 7)

**ClerkLoaded wrapper pattern** (from RESEARCH.md):
```typescript
<ClerkLoaded fallback={<UserButtonSkeleton />}>
  <UserButton
    appearance={clerkAppearance}
    afterSignOutUrl="/sign-in"
  >
    <UserButton.MenuItems>
      <UserButton.Action label="signOut" />
    </UserButton.MenuItems>
  </UserButton>
</ClerkLoaded>
```

**Integration location:**
After bell button, before closing `</div>` of actions container (line 138):

```typescript
      {/* Right Side - Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-card)] px-3 py-2 shadow-[var(--shadow-sm)]">
          {/* ...existing search code... */}
        </div>

        {/* Settings */}
        <button
          onClick={() => router.push('/settings')}
          className="rounded-lg p-2 transition-colors hover:bg-white/50"
          aria-label="Settings"
        >
          <Settings className="text-text-secondary h-4 w-4" />
        </button>

        {/* Bell with Dropdown */}
        <div className="relative">
          {/* ...existing notifications code... */}
        </div>

        {/* UserButton - NEW */}
        <ClerkLoaded fallback={<UserButtonSkeleton />}>
          <UserButton
            appearance={clerkAppearance}
            afterSignOutUrl="/sign-in"
          >
            <UserButton.MenuItems>
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </ClerkLoaded>
      </div>
    </header>
```

---

### `src/lib/clerk-theme.ts` (config export, modification)

**Analog:** `src/lib/clerk-theme.ts` (existing file)

**Current implementation** (lines 1-258):

**Import pattern** (line 1):
```typescript
import type { Appearance } from "@clerk/types";
```

**Export pattern** (lines 22-258):
```typescript
export const clerkAppearance: Appearance = {
  variables: {
    // Primary color, backgrounds, text, etc.
  },
  elements: {
    // Component-specific styling
  },
};
```

**Existing UserButton support:**

The current `clerkAppearance` configuration already includes UserButton styling:

**Avatar styling** (lines 242-245):
```typescript
// Avatar
avatarBox: {
  borderRadius: "var(--radius-lg)",
  backgroundColor: "var(--primary)",
},
```

**Potential elements for UserButton dropdown** (already defined):
- `card` (lines 63-69) - dropdown container styling
- `footerActionLink` (lines 149-159) - link styling for menu items
- `dividerLine` (lines 183-185) - dividers between menu sections

**No modifications required to clerk-theme.ts:**

The existing appearance configuration already supports UserButton via:
1. `avatarBox` element for avatar styling
2. `variables.colorPrimary`, `variables.colorBackground`, etc. for dropdown colors
3. CSS variable references ensure automatic theme switching

**If additional customization needed** (optional, only if default dropdown styling needs adjustment):

```typescript
// Add to elements object if UserButton dropdown needs custom styling
userButtonPopoverCard: {
  backgroundColor: "var(--bg-card)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-card)",
  border: "1px solid var(--divider)",
},
userButtonPopoverActionButton: {
  color: "var(--text-primary)",
  "&:hover": {
    backgroundColor: "var(--bg-page)",
  },
},
```

**Decision:** Start without modifications. The existing `clerkAppearance` config is comprehensive (258 lines covering all Clerk elements). Only add UserButton-specific overrides if testing reveals styling gaps.

---

## Shared Patterns

### ClerkLoaded Hydration Pattern

**Source:** RESEARCH.md Pattern 1 + Phase 20 Clerk integration patterns

**Apply to:** All Clerk components that depend on auth state (UserButton, useAuth, useUser)

**Pattern:**
```typescript
import { ClerkLoaded } from '@clerk/nextjs';

<ClerkLoaded fallback={<SkeletonComponent />}>
  <ClerkComponent />
</ClerkLoaded>
```

**Why:** Prevents SSR/CSR hydration mismatch by showing identical skeleton on server and client until Clerk initializes, then swapping to real component.

**Warning signs if not used:**
- Console error: "Text content did not match. Server: '' Client: 'John Doe'"
- Console error: "Hydration failed because the server rendered HTML didn't match the client"
- UserButton flickers or disappears on page load

---

### Skeleton Loading States

**Source:** `src/components/ui/skeletons/TableSkeleton.tsx`, `src/components/ui/skeletons/DetailsSkeleton.tsx`

**Apply to:** All loading placeholders for async content

**Pattern:**
```typescript
// Base skeleton classes
<div className="h-{size} w-{size} animate-pulse rounded{-variant} bg-[var(--divider)]" />

// Circular skeleton (avatars, icons)
<div className="h-8 w-8 animate-pulse rounded-full bg-[var(--divider)]" />

// Rectangular skeleton (text, buttons)
<div className="h-4 w-32 animate-pulse rounded bg-[var(--divider)]" />

// Rounded rectangle (badges, pills)
<div className="h-6 w-20 animate-pulse rounded-lg bg-[var(--divider)]" />
```

**Key classes:**
- `animate-pulse` - pulsing animation (Tailwind built-in)
- `bg-[var(--divider)]` - skeleton color (theme-aware)
- `rounded-full` - circular (avatars)
- `rounded-lg` - rounded rectangle (badges)
- `rounded` - slight rounding (text lines)

**Match dimensions exactly:** Skeleton must match final component size to prevent layout shift (CLS metric).

---

### CSS Variable References for Theme Integration

**Source:** `src/lib/clerk-theme.ts` (lines 22-258), `src/app/globals.css`

**Apply to:** All Clerk components via `appearance` prop

**Pattern:**
```typescript
// Import existing config
import { clerkAppearance } from '@/lib/clerk-theme';

// Pass to Clerk component
<UserButton appearance={clerkAppearance} />
<SignIn appearance={clerkAppearance} />
```

**Available design tokens** (from globals.css):
- Primary colors: `--primary`, `--primary-hover`, `--primary-active`, `--primary-disabled`
- Backgrounds: `--bg-page`, `--bg-card`, `--bg-sidebar`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-white`
- Status: `--success`, `--warning`, `--error`, `--info`
- Borders: `--divider`
- Shadows: `--shadow-sm`, `--shadow-card`
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
- Spacing: `--space-1` through `--space-12`

**Why CSS variables:** Theme changes (light → dark) automatically update Clerk components without re-rendering or prop changes.

---

### UserButton MenuItems Customization

**Source:** RESEARCH.md Pattern 2 (UserButton MenuItems Customization)

**Apply to:** UserButton dropdown contents

**Pattern:**
```typescript
<UserButton appearance={clerkAppearance} afterSignOutUrl="/sign-in">
  <UserButton.MenuItems>
    {/* Only explicitly rendered actions appear in dropdown */}
    <UserButton.Action label="signOut" />
    {/* Omitting "manageAccount" hides it */}
  </UserButton.MenuItems>
</UserButton>
```

**Default behavior (WITHOUT MenuItems):**
- Name/email display at top
- "Manage Account" link (opens Clerk user profile modal)
- "Sign Out" action

**Custom behavior (WITH MenuItems - D-03 requirement):**
- Name/email display at top (automatic)
- Only explicitly rendered actions (signOut only)
- No "Manage Account" link

**Available actions:**
- `<UserButton.Action label="signOut" />` - Sign out button
- `<UserButton.Action label="manageAccount" />` - Manage account link
- `<UserButton.Link label="Custom" href="/path" />` - Custom links

---

### Sign-out Redirect Configuration

**Source:** RESEARCH.md Pattern 3, Phase 20 Clerk patterns

**Apply to:** UserButton component

**Pattern:**
```typescript
<UserButton afterSignOutUrl="/sign-in" />
```

**Why:** Direct redirect to sign-in page after sign-out, bypassing middleware redirect chain (no double redirect).

**Alternative (global config):** Can be set in ClerkProvider but UserButton prop is simpler for single-component usage.

**Warning if omitted:** User redirects to `/` (root), then middleware redirects to `/sign-in` - visible double redirect with brief flash.

---

## Testing Patterns

### Clerk Component Mocking

**Source:** `src/app/sign-in/__tests__/page.test.tsx` (lines 6-25)

**Apply to:** New Header test file (`src/components/__tests__/Header.test.tsx`)

**Mock pattern:**
```typescript
// Mock Clerk components
jest.mock("@clerk/nextjs", () => ({
  UserButton: ({ appearance, afterSignOutUrl, children }: {
    appearance?: unknown;
    afterSignOutUrl?: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid="clerk-userbutton">
      <div data-testid="appearance">{JSON.stringify(appearance !== undefined)}</div>
      <div data-testid="after-signout-url">{afterSignOutUrl}</div>
      <div data-testid="menu-items">{children}</div>
    </div>
  ),
  ClerkLoaded: ({ fallback, children }: {
    fallback?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="clerk-loaded">
      <div data-testid="fallback">{fallback}</div>
      <div data-testid="loaded-content">{children}</div>
    </div>
  ),
}));

// Mock clerk-theme
jest.mock("@/lib/clerk-theme", () => ({
  clerkAppearance: { variables: { colorPrimary: "var(--primary)" } },
}));
```

**Test assertions:**
```typescript
it("renders UserButton with correct props", () => {
  render(<Header />);

  const userButton = screen.getByTestId("clerk-userbutton");
  expect(userButton).toBeInTheDocument();

  // Verify appearance prop passed
  expect(screen.getByTestId("appearance")).toHaveTextContent("true");

  // Verify afterSignOutUrl
  expect(screen.getByTestId("after-signout-url")).toHaveTextContent("/sign-in");
});

it("wraps UserButton in ClerkLoaded with skeleton fallback", () => {
  render(<Header />);

  const clerkLoaded = screen.getByTestId("clerk-loaded");
  expect(clerkLoaded).toBeInTheDocument();

  // Verify skeleton fallback present
  const fallback = screen.getByTestId("fallback");
  expect(fallback).toBeInTheDocument();
});
```

**Existing Header test gaps** (no test file exists currently):
- Need to create `src/components/__tests__/Header.test.tsx`
- Mock existing dependencies: `usePathname`, `useRouter`, `getNotifications`
- Test UserButton integration without breaking existing functionality

---

## No Analog Found

No files without analogs. Both modified files already exist with established patterns.

---

## Metadata

**Analog search scope:**
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components` (Header.tsx)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/lib` (clerk-theme.ts)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/ui/skeletons` (skeleton patterns)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/app/sign-in/__tests__` (Clerk mocking patterns)
- `/Users/joel/Desktop/Projects/cgm-dashboard/.planning/phases/20-clerk-foundation-setup` (Phase 20 Clerk patterns)

**Files scanned:** 7 files (Header.tsx, clerk-theme.ts, TableSkeleton.tsx, DetailsSkeleton.tsx, page.tsx sign-in, page.test.tsx sign-in, 20-PATTERNS.md)

**Pattern extraction date:** 2026-05-10

**Codebase characteristics:**
- Existing Header component with search, settings, notifications
- Existing Clerk theme config with comprehensive CSS variable mapping
- Established skeleton loading pattern with `animate-pulse` and `bg-[var(--divider)]`
- Clerk integration from Phase 20 (SignIn component, middleware, theme config)
- No existing ClerkLoaded usage (new pattern for Phase 23)
- No existing UserButton integration
- Test infrastructure: Jest + @testing-library/react with Clerk mocking pattern
