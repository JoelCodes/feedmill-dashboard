# Phase 20: Clerk Foundation Setup - Pattern Map

**Mapped:** 2026-05-09
**Files analyzed:** 5 new/modified files
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/middleware.ts` | middleware | request-response | N/A (new pattern) | no-analog |
| `src/app/layout.tsx` | provider | wrapper | `src/app/layout.tsx` (existing) | exact |
| `src/lib/clerk-theme.ts` | config | export | `src/lib/utils.ts` | role-match |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | page | request-response | `src/app/settings/page.tsx` | role-match |
| `.env.local` | config | environment | N/A (new file type) | no-analog |

## Pattern Assignments

### `src/middleware.ts` (middleware, request-response)

**Analog:** None (new middleware pattern for Next.js App Router)

**Purpose:** Edge middleware for authentication route protection using Clerk.

**Expected pattern from RESEARCH.md:**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/(api|trpc)(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Key considerations:**
- No existing middleware in codebase (confirmed via Grep and directory listing)
- Must use broad matcher pattern to avoid "auth() called but no middleware detected" errors
- File location at project root, not in src/ directory
- Async auth.protect() pattern (CVE-2025-29927 mitigation requires Next.js ≥15.2.3, project is on 16.1.6)

---

### `src/app/layout.tsx` (provider wrapper, modification)

**Analog:** `src/app/layout.tsx` (existing file to be modified)

**Current implementation** (lines 1-22):
```typescript
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "FeedMill Pro - Dashboard",
  description: "Feed mill production management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

**Pattern to copy:**
- Import pattern (lines 1-3): Named imports from packages, local component imports with `@/` alias
- Metadata export pattern (lines 5-8): Static metadata object
- Provider wrapper pattern (lines 17-18): ThemeProvider wrapping children
- suppressHydrationWarning on html element (line 16): Required for next-themes

**Modification approach:**
- Add ClerkProvider import: `import { ClerkProvider } from '@clerk/nextjs'`
- Nest ClerkProvider around ThemeProvider: `<ClerkProvider><ThemeProvider>...</ThemeProvider></ClerkProvider>`
- Preserve existing suppressHydrationWarning, antialiased class, metadata

---

### `src/lib/clerk-theme.ts` (config export, NEW)

**Analog:** `src/lib/utils.ts`

**Import pattern** (lines 1-2):
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
```

**Export pattern** (lines 15-17):
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**File structure pattern:**
- Imports first (external packages, then types)
- JSDoc comment explaining purpose
- Named export function with descriptive name
- TypeScript typing for parameters and return values

**Expected structure for clerk-theme.ts:**
```typescript
import type { Appearance } from '@clerk/types';

/**
 * Clerk appearance configuration for theme integration.
 *
 * Maps design tokens from globals.css to Clerk components.
 * Uses CSS variable references (var(--token-name)) for automatic theme switching.
 *
 * Apply to SignIn, UserButton, and other Clerk components via appearance prop.
 *
 * @example
 * <SignIn appearance={clerkAppearance} />
 */
export const clerkAppearance: Appearance = {
  // ... config with var(--primary), var(--bg-card), etc.
};
```

**Design tokens to reference** (from `src/app/globals.css`):
- Colors: `var(--primary)`, `var(--bg-card)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--divider)`, `var(--error)`
- Typography: `font-family: Helvetica, Arial, sans-serif` (line 300)
- Border radius: `var(--radius-md)`, `var(--radius-lg)`
- Spacing: `var(--space-2)`, `var(--space-4)`, `var(--space-6)`
- Shadows: `var(--shadow-card)`

---

### `src/app/sign-in/[[...sign-in]]/page.tsx` (page component, NEW)

**Analog:** `src/app/settings/page.tsx`

**Page structure pattern** (lines 1-59):
```typescript
"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
// ... other imports

export default function SettingsPage() {
  // ... state and logic

  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />

        <div className="mx-auto w-full max-w-2xl">
          {/* Content */}
        </div>
      </main>
    </div>
  );
}
```

**Pattern to copy:**
- `"use client"` directive at top (line 1) — required for client components
- React imports (line 3) — hooks from react
- Component imports (lines 5-6) — Sidebar, Header using `@/` alias
- Export default function with descriptive name (line 16)
- Root div with `bg-bg-page flex h-screen` (line 55)
- Sidebar + main layout structure (lines 56-59)
- Main content with `flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8` (line 57)
- Centered content wrapper: `mx-auto w-full max-w-2xl` (line 60)

**Sign-in page structure:**
```typescript
"use client";

import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-theme";
import { Wheat } from "lucide-react"; // Icon used in Sidebar branding

export default function SignInPage() {
  return (
    <div className="bg-bg-page flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[var(--primary)]" />
          <span className="text-sm font-bold text-[var(--text-primary)]">
            CGM DASHBOARD
          </span>
        </div>

        {/* Clerk SignIn Component */}
        <SignIn
          appearance={clerkAppearance}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
        />
      </div>
    </div>
  );
}
```

**Key differences from settings page:**
- No Sidebar/Header (auth page is standalone)
- Centered layout with `items-center justify-center` instead of sidebar split
- Branding matches Sidebar pattern (lines 40-44 of Sidebar.tsx): logo square + app name
- Uses prebuilt Clerk component instead of custom form

**Sidebar branding pattern** (from `src/components/Sidebar.tsx` lines 40-44):
```typescript
<div className="flex items-center gap-2.5 pb-5">
  <div className="h-8 w-8 rounded-lg bg-[var(--primary)]" />
  <span className="text-sm font-bold text-[var(--text-primary)]">
    FEEDMILL PRO
  </span>
</div>
```

**Sign-in page branding modification:**
- Change "FEEDMILL PRO" to "CGM DASHBOARD" per D-02 decision
- Remove `pb-5` padding (not needed for centered layout)
- Add `items-center` to center logo + text

---

### `.env.local` (environment variables, NEW)

**Analog:** None (gitignored file, no existing .env files)

**Pattern from existing environment usage:**
```typescript
// src/services/mockData.ts uses process.env pattern for conditional logic
const useMockData = process.env.NODE_ENV === 'development';
```

**Expected structure:**
```bash
# Clerk Authentication Keys
# Get these from https://dashboard.clerk.com

# Publishable key (client-side, NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_****

# Secret key (server-side only, never commit to git)
CLERK_SECRET_KEY=sk_test_****

# Optional: Customize sign-in/sign-up URLs
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
# NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

**Key considerations:**
- File must be at project root (confirmed: no existing .env files)
- NEXT_PUBLIC_ prefix for client-accessible variables (Clerk publishable key)
- No NEXT_PUBLIC_ prefix for server-only secrets (Clerk secret key)
- Comments explaining where to get keys
- Git ignore pattern (verified in .gitignore: standard Next.js ignores .env*.local)

---

## Shared Patterns

### CSS Variable References for Theme Integration

**Source:** `src/app/globals.css` (lines 6-144 for :root, lines 147-224 for .dark)

**Apply to:** `src/lib/clerk-theme.ts` Clerk appearance configuration

**Pattern:**
```typescript
// CSS variables auto-update when theme changes (next-themes applies .dark class)
const appearance = {
  variables: {
    colorPrimary: 'var(--primary)',
    colorBackground: 'var(--bg-card)',
    colorText: 'var(--text-primary)',
    colorTextSecondary: 'var(--text-secondary)',
    colorDanger: 'var(--error)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'Helvetica, Arial, sans-serif',
  },
};
```

**Available design tokens:**
- Primary colors: `--primary`, `--primary-dark`, `--primary-hover`, `--primary-active`, `--primary-disabled` (lines 8-12)
- Backgrounds: `--bg-page`, `--bg-card`, `--bg-sidebar` (lines 15-17)
- Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-medium` (lines 20-22, 142-144)
- Status: `--success`, `--warning`, `--error`, `--info`, `--purple`, `--pending` (lines 25-56)
- Borders: `--divider` (line 60)
- Shadows: `--shadow-sm`, `--shadow-card` (lines 63-64)
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` (lines 67-70)
- Spacing: `--space-1` through `--space-12` (lines 73-81)

---

### "use client" Directive

**Source:** Multiple existing client components

**Apply to:** `src/app/sign-in/[[...sign-in]]/page.tsx` (uses Clerk client components)

**Pattern examples:**
- `src/app/page.tsx` (line 1): `"use client";`
- `src/app/settings/page.tsx` (line 1): `"use client";`
- `src/components/Sidebar.tsx` (line 1): `"use client";`
- `src/components/Header.tsx` (line 1): `'use client';`

**Rule:** Always first line of file, before any imports. Use double quotes for consistency with majority of codebase.

---

### Path Alias Imports

**Source:** All existing components and pages

**Apply to:** All new files

**Pattern:**
```typescript
// Absolute imports using @/ alias for src/ directory
import { cn } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
```

**Examples from codebase:**
- `src/app/page.tsx` (lines 4-8): `@/components/*` imports
- `src/app/settings/page.tsx` (lines 6-14): `@/components/*`, `@/hooks/*`, `@/types/*` imports
- `src/components/ui/Button.tsx` (line 2): `@/lib/utils` import

**Never use relative imports** (`../lib/utils`) — always use `@/` alias.

---

### TypeScript Import Types

**Source:** `src/lib/utils.ts`, `src/app/layout.tsx`

**Apply to:** `src/lib/clerk-theme.ts` (importing Clerk types)

**Pattern:**
```typescript
// Import type with "type" keyword for type-only imports
import type { ClassValue } from "clsx";
import type { Metadata } from "next";
import type { Appearance } from '@clerk/types';
```

**Examples:**
- `src/lib/utils.ts` (line 1): `import { clsx, type ClassValue } from "clsx";`
- `src/app/layout.tsx` (line 1): `import type { Metadata } from "next";`
- `src/components/ThemeProvider.tsx` (line 4): `import type { ThemeProviderProps } from "next-themes";`

---

### Layout Structure: Sidebar + Main

**Source:** `src/app/page.tsx`, `src/app/settings/page.tsx`

**Apply to:** Protected pages ONLY (NOT sign-in page, which is standalone)

**Pattern** (from `src/app/page.tsx` lines 14-42):
```typescript
return (
  <div className="bg-bg-page flex h-screen">
    {/* Sidebar */}
    <Sidebar />

    {/* Main Content */}
    <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
      {/* Header */}
      <Header onSearch={setHeaderSearchTerm} />

      {/* Page Content */}
      <div className="flex min-h-0 flex-1 gap-6">
        {/* ... page-specific content ... */}
      </div>
    </main>
  </div>
);
```

**Class breakdown:**
- Root: `bg-bg-page flex h-screen` — full screen flex container with theme background
- Sidebar: Fixed-width component (handles its own styling)
- Main: `flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8` — flexible main area with vertical layout, 6 spacing units gap, padding
- Header: Shared component at top of main area
- Content area: `flex min-h-0 flex-1 gap-6` — flexible content below header

**Sign-in page deviation:** Does NOT use Sidebar + Main structure. Uses centered layout:
```typescript
<div className="bg-bg-page flex h-screen items-center justify-center">
  {/* Centered content */}
</div>
```

---

### Component Variants with CVA

**Source:** `src/components/ui/Button.tsx`, `src/components/ui/Card.tsx`

**Apply to:** Custom components (NOT Clerk prebuilt components)

**Pattern** (from `src/components/ui/Button.tsx` lines 1-31):
```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary)] text-[var(--text-white)] hover:bg-[var(--primary-hover)] ...",
        secondary: "bg-[var(--bg-card)] text-[var(--primary)] border-2 border-[var(--primary)] ...",
        // ...
      },
      size: {
        sm: "h-8 px-3 text-sm gap-2",
        md: "h-10 px-4 text-base gap-2",
        lg: "h-12 px-6 text-lg gap-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // ... custom props
}
```

**Key points:**
- CVA for variant management (not inline conditionals)
- cn() helper for merging className props (lines 52)
- CSS variables for colors/spacing (not hardcoded values)
- TypeScript intersection types for props (HTMLAttributes + VariantProps)
- defaultVariants for sensible defaults

---

## No Analog Found

Files with no close match in the codebase (use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/middleware.ts` | middleware | request-response | No existing middleware in Next.js App Router project |
| `.env.local` | config | environment | Gitignored file, no existing .env files in repo |

**Research guidance:**
- `src/middleware.ts`: Follow Clerk official Next.js App Router middleware pattern from RESEARCH.md (clerkMiddleware with broad matcher, async auth.protect())
- `.env.local`: Standard Next.js environment variable file with NEXT_PUBLIC_ prefix for client-accessible vars

---

## Metadata

**Analog search scope:**
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/app` (pages and layouts)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components` (UI components)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/lib` (utilities and helpers)

**Files scanned:** 45+ files across app/, components/, lib/ directories

**Pattern extraction date:** 2026-05-09

**Codebase characteristics:**
- TypeScript project with strict typing
- Next.js 16.1.6 App Router (supports Clerk v7.3.3+)
- Existing theme system: next-themes with CSS variables
- Component library: Custom components with CVA variants
- No existing authentication (clean integration)
- No existing middleware (new pattern)
- Design system: Two-tier CSS variables (primitives + semantics)
- Icon library: lucide-react (Wheat icon used for branding)
