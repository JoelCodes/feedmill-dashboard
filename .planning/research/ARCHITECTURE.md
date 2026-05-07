# Architecture Research: Design System Integration

**Domain:** Design system and theming for Next.js/Tailwind dashboard
**Researched:** 2026-05-07
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Design System Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Tokens  │  │  Theme   │  │  Utils   │  │   Docs   │        │
│  │   CSS    │  │  Config  │  │   (CVA)  │  │ (.pen)   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘        │
│       │             │             │                              │
│       └─────────────┴─────────────┘                              │
│                     │                                            │
├─────────────────────┴────────────────────────────────────────────┤
│                    Component Library Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  Primitives (Atoms)          Composites (Molecules)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Button  │  │  Input   │  │   Card   │  │  Table   │        │
│  │  Badge   │  │  Select  │  │  Panel   │  │Timeline  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │                │
├───────┴─────────────┴─────────────┴─────────────┴────────────────┤
│                     Page-Level Components                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Sidebar    │  │    Header    │  │  KPICards    │          │
│  │ FilterPills  │  │CustomerDetail│  │OrdersTable   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                          App Router Pages                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  orders  │  │customers │  │mill-prod │  │ settings │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Design Tokens** | Single source of truth for colors, spacing, typography, shadows | CSS custom properties in `@theme` block (Tailwind v4) |
| **Theme Config** | Light/dark mode variants, semantic token aliases | CSS variables with `[data-theme]` selectors |
| **Variant Utils** | Type-safe component variants with Tailwind classes | Class Variance Authority (CVA) |
| **Primitives** | Atomic UI elements: buttons, inputs, badges, typography | Reusable components with CVA variants |
| **Composites** | Molecules combining primitives: cards, panels, tables, forms | Components consuming primitives + custom logic |
| **Page Components** | Feature-specific complex components | Domain-specific implementations |

## Recommended Project Structure

### Current State (Existing)
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # CSS tokens (existing but will expand)
│   ├── orders/page.tsx
│   ├── customers/[id]/page.tsx
│   └── mill-production/page.tsx
├── components/             # Mixed component levels (will reorganize)
│   ├── FilterPill.tsx      # Has color config (to migrate)
│   ├── KPICard.tsx         # Hardcoded styles (to migrate)
│   ├── OrdersTable.tsx     # Page-level component
│   ├── CustomerDetailHeader.tsx
│   └── ui/                 # Partial UI separation exists
│       └── StatusBadge.tsx # Has STATUS_CONFIG (to migrate)
├── types/                  # TypeScript types
├── services/               # Mock data services
└── hooks/                  # React hooks
```

### Target Structure (After Design System)
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with theme provider
│   ├── globals.css         # Expanded design tokens (@theme)
│   └── [pages]/            # Unchanged
│
├── design-system/          # NEW: Design system foundation
│   ├── tokens/             # Design token definitions
│   │   ├── colors.css      # Color tokens (including light/dark)
│   │   ├── typography.css  # Font sizes, weights, line-heights
│   │   ├── spacing.css     # Margin, padding scales
│   │   ├── shadows.css     # Box shadows
│   │   └── index.css       # Aggregates all tokens
│   │
│   ├── theme/              # Theming system
│   │   ├── ThemeProvider.tsx  # Client component for theme switching
│   │   ├── useTheme.ts     # Hook for theme state
│   │   └── themes.css      # Light/dark theme overrides
│   │
│   └── utils/              # Design system utilities
│       ├── cn.ts           # Tailwind class merge utility
│       └── variants.ts     # CVA helper functions
│
├── components/             # Reorganized component library
│   ├── primitives/         # Atomic components (NEW)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── StatusBadge/    # MIGRATED from ui/
│   │   └── Typography/     # NEW: Text, Heading components
│   │
│   ├── composites/         # Molecule components (NEW)
│   │   ├── Card/
│   │   ├── Panel/
│   │   ├── FormField/      # Label + Input + Error
│   │   ├── FilterPill/     # MIGRATED from root
│   │   └── Table/          # Table primitives
│   │
│   ├── patterns/           # Page-level components (RENAMED)
│   │   ├── KPICard.tsx     # MIGRATED from root
│   │   ├── OrdersTable.tsx
│   │   ├── CustomerDetailHeader.tsx
│   │   ├── ActivityTimeline.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   │
│   └── ui/                 # DEPRECATED - components migrated
│       └── skeletons/      # Keep loading states here temporarily
│
├── types/                  # TypeScript types (unchanged)
├── services/               # Mock data services (unchanged)
└── hooks/                  # React hooks (unchanged)
```

### Structure Rationale

- **design-system/:** Centralizes all design system concerns (tokens, theme, utilities) in one place. Makes it easy to extract into a separate package later if needed. Follows industry standard of separating design system from application code.

- **components/primitives/:** Atomic design principle - smallest reusable units. Each primitive has its own folder with component, tests, and barrel export. These components are purely presentational with no business logic. Uses CVA for type-safe variants.

- **components/composites/:** Molecules combining primitives. More complex than primitives but still generic enough to reuse across pages. Examples: Card (primitive elements + layout), FilterPill (badge + counter), FormField (label + input + error message).

- **components/patterns/:** Page-level components with business logic or domain-specific implementations. These consume primitives and composites but are less likely to be reused across different pages. Can access services, hooks, and contain complex state.

- **Folder-per-component pattern:** Each significant component gets its own folder with index.ts barrel export. Keeps tests, stories (if using Storybook), and related files colocated. Makes components easy to move or extract.

## Architectural Patterns

### Pattern 1: Tailwind v4 @theme with CSS Variables

**What:** Define design tokens as CSS custom properties using the `@theme` directive. Tailwind automatically generates utility classes AND exposes tokens as runtime CSS variables.

**When to use:** Always for design systems. This is the recommended Tailwind v4 approach for design tokens.

**Trade-offs:**
- ✅ Single source of truth for design values
- ✅ Type-safe utilities auto-generated
- ✅ Runtime access via CSS variables
- ✅ Theming support via CSS variable overrides
- ⚠️ Requires Tailwind v4 (project already uses it)

**Example:**
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors - generates bg-primary, text-primary, etc. */
  --color-primary: #4fd1c5;
  --color-primary-dark: #38b2ac;

  /* Status colors - semantic naming */
  --color-status-success: #48bb78;
  --color-status-warning: #f59e0b;
  --color-status-error: #e53e3e;

  /* Spacing - generates gap-*, p-*, m-* utilities */
  --spacing-card: 18px;
  --spacing-section: 24px;

  /* Typography - generates text-* utilities */
  --text-label: 0.6875rem; /* 11px */
  --text-body: 0.9375rem;  /* 15px */

  /* Shadows - generates shadow-* utilities */
  --shadow-card: 0 3.5px 5px rgba(0, 0, 0, 0.03);

  /* Border radius - generates rounded-* utilities */
  --radius-sm: 6px;
  --radius-card: 12px;
}

/* These are now available as utilities AND CSS variables */
/* Utility: class="bg-primary text-body shadow-card" */
/* Variable: style={{ background: 'var(--color-primary)' }} */
```

### Pattern 2: Semantic Theming with CSS Variable Overrides

**What:** Separate primitive tokens (raw values) from semantic tokens (meaningful names). Use data attributes to override semantic tokens for theming.

**When to use:** When implementing light/dark mode or multiple theme variants.

**Trade-offs:**
- ✅ Enables theming without changing component code
- ✅ Clear semantic meaning (bg-surface vs bg-white)
- ✅ User preference detection with prefers-color-scheme
- ⚠️ Requires more CSS setup than single theme
- ⚠️ Need consistent semantic naming convention

**Example:**
```css
/* design-system/theme/themes.css */
@import "tailwindcss";

/* Light theme (default in :root) */
@theme {
  --color-bg-page: #f8f9fa;
  --color-bg-card: #ffffff;
  --color-bg-elevated: #ffffff;
  --color-text-primary: #2d3748;
  --color-text-secondary: #a0aec0;
  --color-border: #e2e8f0;
}

/* Dark theme overrides */
[data-theme="dark"] {
  --color-bg-page: #1a202c;
  --color-bg-card: #2d3748;
  --color-bg-elevated: #4a5568;
  --color-text-primary: #f7fafc;
  --color-text-secondary: #a0aec0;
  --color-border: #4a5568;

  /* Status colors might stay the same or adjust for contrast */
  --color-status-success: #68d391; /* Lighter for dark bg */
  --color-status-warning: #fbd38d;
  --color-status-error: #fc8181;
}

/* Respect user system preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg-page: #1a202c;
    --color-bg-card: #2d3748;
    /* ...other dark mode tokens */
  }
}
```

```tsx
// design-system/theme/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    root.setAttribute('data-theme', effectiveTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Pattern 3: Class Variance Authority (CVA) for Component Variants

**What:** Type-safe component variant system using CVA to compose Tailwind classes with proper defaults, compound variants, and TypeScript inference.

**When to use:** For all primitive and composite components with multiple visual variants (size, color, state).

**Trade-offs:**
- ✅ Type-safe variant props with autocomplete
- ✅ Compound variants for complex combinations
- ✅ Default variants documented in code
- ✅ Works perfectly with Tailwind utilities
- ⚠️ Small runtime overhead (negligible)
- ⚠️ Adds dependency (~3kb gzipped)

**Example:**
```tsx
// components/primitives/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center justify-center rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        outline: 'border-2 border-primary text-primary hover:bg-primary/10',
        ghost: 'text-gray-800 hover:bg-gray-100',
        danger: 'bg-error text-white hover:bg-error-dark',
      },
      size: {
        sm: 'px-2.5 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    compoundVariants: [
      // When primary + large, make text uppercase
      {
        variant: 'primary',
        size: 'lg',
        className: 'uppercase',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, fullWidth, className })}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}

// Usage with full TypeScript support
<Button variant="primary" size="lg">Click me</Button>
<Button variant="outline" size="sm" fullWidth>Submit</Button>
```

### Pattern 4: Migration Strategy - Strangler Fig Pattern

**What:** Incrementally refactor existing components to use the design system without breaking existing pages. Build new primitives alongside old code, then gradually replace usage.

**When to use:** When migrating an existing codebase to a design system (current situation).

**Trade-offs:**
- ✅ Low risk - no big bang rewrites
- ✅ Delivers value incrementally
- ✅ Can validate design system with real usage
- ⚠️ Temporary duplication of components
- ⚠️ Requires discipline to complete migration

**Example:**
```tsx
// PHASE 1: Build primitive alongside existing code
// components/primitives/Badge/Badge.tsx (NEW)
const badgeVariants = cva('inline-flex items-center gap-1 rounded-lg px-2.5 py-1', {
  variants: {
    status: {
      success: 'bg-success-light text-success-dark',
      warning: 'bg-warning-light text-warning',
      error: 'bg-error-light text-error',
      info: 'bg-info-light text-info',
      neutral: 'bg-gray-100 text-gray-600',
    },
    size: {
      sm: 'text-[10px]',
      md: 'text-xs',
    },
    showDot: {
      true: 'gap-1.5',
      false: 'gap-1',
    },
  },
  defaultVariants: { status: 'neutral', size: 'sm', showDot: false },
});

export function Badge({ status, size, showDot, children }: BadgeProps) {
  return (
    <div className={badgeVariants({ status, size, showDot })}>
      {showDot && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </div>
  );
}

// PHASE 2: Create adapter for existing StatusBadge
// components/ui/StatusBadge.tsx (MODIFIED)
import { Badge } from '@/components/primitives/Badge';
import { OrderStatus } from '@/types/order';

const STATUS_TO_BADGE_MAP: Record<OrderStatus, ComponentProps<typeof Badge>['status']> = {
  'Pending': 'neutral',
  'Producing': 'warning',
  'Ready': 'info',
  'In Transit': 'info',
  'Complete': 'success',
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge status={STATUS_TO_BADGE_MAP[status]} size="sm" showDot>
      {status}
    </Badge>
  );
}
// Existing code continues to work, now uses design system under the hood

// PHASE 3: New code uses Badge primitive directly
// components/patterns/CustomerDetailHeader.tsx (NEW CODE)
<Badge status="warning" size="md" showDot>Low Inventory</Badge>
```

### Pattern 5: Composite Components with Compound Pattern

**What:** Build composite components that encapsulate multiple primitives with a compound component API for flexibility.

**When to use:** For composites that have distinct sections but need flexible content (cards, panels, forms).

**Trade-offs:**
- ✅ Flexible API with type safety
- ✅ Clear component structure
- ✅ Easy to understand and maintain
- ⚠️ Slightly more verbose than single component
- ⚠️ Requires understanding of compound pattern

**Example:**
```tsx
// components/composites/Card/Card.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva('bg-bg-card rounded-card overflow-hidden', {
  variants: {
    shadow: {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-card',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    shadow: 'md',
    padding: 'md',
  },
});

interface CardProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {}

function CardRoot({ className, shadow, padding, ...props }: CardProps) {
  return <div className={cardVariants({ shadow, padding, className })} {...props} />;
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-border pb-3 ${className}`} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-body font-bold text-text-primary ${className}`} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`pt-3 ${className}`} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-t border-border pt-3 mt-3 ${className}`} {...props} />;
}

// Compound export
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Content: CardContent,
  Footer: CardFooter,
});

// Usage
<Card shadow="md" padding="lg">
  <Card.Header>
    <Card.Title>Customer Details</Card.Title>
  </Card.Header>
  <Card.Content>
    {/* Content here */}
  </Card.Content>
  <Card.Footer>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

### Pattern 6: Server/Client Component Split for Design System

**What:** Keep design system primitives as client components (need interactivity), but allow them to accept server component children via React.ReactNode.

**When to use:** In Next.js App Router when building interactive components that wrap server-rendered content.

**Trade-offs:**
- ✅ Maximizes server component usage
- ✅ Reduces client-side JavaScript
- ✅ Primitives can still be interactive
- ⚠️ Need to mark components 'use client' appropriately
- ⚠️ Understanding of RSC boundary important

**Example:**
```tsx
// components/primitives/Button/Button.tsx
'use client'; // This is a client component (needs onClick, hover states)

export function Button({ children, onClick, ...props }: ButtonProps) {
  return (
    <button onClick={onClick} {...props}>
      {children} {/* children can be server components */}
    </button>
  );
}

// app/customers/page.tsx (Server Component)
import { Button } from '@/components/primitives/Button';

export default async function CustomersPage() {
  const customers = await fetchCustomers(); // Server-side data fetch

  return (
    <div>
      <h1>Customers</h1>
      {customers.map(customer => (
        <div key={customer.id}>
          <p>{customer.name}</p>
          {/* Button is client component but content is server-rendered */}
          <Button variant="primary">
            View {customer.name}
          </Button>
        </div>
      ))}
    </div>
  );
}

// components/composites/Card/Card.tsx
// Note: NOT marked 'use client' - this can be a server component
export function Card({ children, ...props }: CardProps) {
  return <div {...props}>{children}</div>;
}
```

## Data Flow

### Design Token Flow

```
.pen Design Files (Source of Truth)
    ↓
CSS Token Definitions (@theme)
    ↓
Tailwind v4 Compiler
    ↓
    ├─→ Generated Utility Classes (bg-primary, text-body, etc.)
    └─→ CSS Variables (--color-primary, --text-body, etc.)
            ↓
    ┌───────┴───────┐
    ↓               ↓
Components      Inline Styles
(className)     (CSS variables)
```

### Component Consumption Flow

```
Design System Primitives (Button, Input, Badge)
    ↓ (imported by)
Design System Composites (Card, FilterPill, FormField)
    ↓ (imported by)
Page-Level Patterns (KPICard, OrdersTable, Sidebar)
    ↓ (imported by)
Next.js Pages (orders/page.tsx, customers/[id]/page.tsx)
```

### Theme Switching Flow

```
User Action (Settings page toggle)
    ↓
useTheme hook (setTheme('dark'))
    ↓
document.documentElement.setAttribute('data-theme', 'dark')
    ↓
CSS Variable Overrides Applied ([data-theme="dark"] { ... })
    ↓
All Components Re-render with New Token Values
```

### Key Data Flows

1. **Token cascading:** Primitive tokens → Semantic tokens → Theme overrides → Component usage. This hierarchy makes theming possible without changing component code.

2. **Component composition:** Primitives are imported by composites, composites by patterns, patterns by pages. This ensures changes to primitives cascade properly and prevents circular dependencies.

3. **Server-to-client boundary:** Pages (server) → Patterns (mixed) → Composites (server-compatible) → Primitives (client when interactive). Minimize client components to reduce JavaScript bundle size.

## Integration Points

### New Components → Existing Codebase

| Integration | Pattern | Notes |
|-------------|---------|-------|
| **globals.css expansion** | Append new @theme tokens to existing file | Keep existing tokens, add new semantic tokens, migrate hardcoded values gradually |
| **Primitive imports** | Import from @/components/primitives/ | New components use primitives directly |
| **Existing component migration** | Adapter pattern (see Pattern 4) | Wrap old components with new primitives, keep old API working |
| **Page-level patterns** | Move to components/patterns/ | Rename only, keep functionality identical initially |

### Design System → Application Boundary

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Tokens → Components** | Via Tailwind utilities + CSS variables | Components should ONLY use design tokens, never hardcoded values |
| **Primitives → Patterns** | Direct imports + TypeScript props | Patterns consume primitive components and compose them |
| **Design System → Pages** | Through patterns primarily | Pages should rarely import primitives directly, use patterns instead |
| **Theme → All Layers** | CSS variable overrides cascade automatically | No prop drilling needed, theme changes apply globally |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Current (6.4k LOC)** | Implement design system foundation, migrate components incrementally over 2-3 milestones |
| **10k-20k LOC** | Extract design system to separate package (@company/design-system), version independently from app |
| **20k+ LOC or multi-app** | Publish design system to private npm, add Storybook for documentation, implement visual regression testing |

### Scaling Priorities

1. **First bottleneck: Token inconsistency** - Happens around 10k LOC when multiple pages have hardcoded values. Fix: Complete token migration ASAP, add ESLint rule to prevent hardcoded colors/spacing.

2. **Second bottleneck: Component duplication** - Happens when second app/project needs same components. Fix: Extract design system to separate package, use npm workspaces for monorepo if multiple apps exist.

3. **Third bottleneck: Design-dev handoff** - Happens when design team can't verify implementations. Fix: Add Storybook, integrate with Figma, implement visual regression tests with Chromatic.

## Anti-Patterns

### Anti-Pattern 1: Mixing Hardcoded Values with Design Tokens

**What people do:** Start using design tokens but leave some hardcoded values in components.

**Why it's wrong:** Destroys single source of truth. Theming breaks. Some elements don't update with theme changes. Creates maintenance burden tracking down all hardcoded values.

**Do this instead:**
- Audit codebase for hardcoded hex colors, px values, font sizes
- Add ESLint rule: `no-hardcoded-colors` plugin
- During code review, reject any new hardcoded design values
- Use `eslint-plugin-tailwindcss` to enforce utility usage

### Anti-Pattern 2: Creating Too Many Component Variants

**What people do:** Add variant for every possible visual combination (primary-small-rounded, primary-large-square, secondary-small-rounded, etc.)

**Why it's wrong:** Combinatorial explosion makes components unmaintainable. Should use composition instead. CVA compound variants exist for rare combinations.

**Do this instead:**
```tsx
// BAD: Too many variants
<Button variant="primary-large-rounded-shadow" />

// GOOD: Compose orthogonal properties
<Button variant="primary" size="large" rounded shadow />

// GOOD: Use CVA compound variants for special cases
const buttonVariants = cva('...', {
  variants: {
    variant: { primary: '...', secondary: '...' },
    size: { sm: '...', lg: '...' },
  },
  compoundVariants: [
    { variant: 'primary', size: 'lg', className: 'uppercase' }
  ],
});
```

### Anti-Pattern 3: Creating Primitives with Business Logic

**What people do:** Put API calls, business rules, or domain logic inside primitive components.

**Why it's wrong:** Primitives become coupled to specific use cases, can't be reused across different domains, harder to test and document.

**Do this instead:**
- Primitives = pure presentation (Button, Input, Badge)
- Composites = composition + light logic (FormField, FilterPill)
- Patterns = business logic + domain data (OrdersTable, CustomerHeader)

```tsx
// BAD: Primitive with business logic
function Button({ orderId, onClick }) {
  const { data: order } = useOrder(orderId); // API call in primitive
  const canSubmit = order.status === 'pending'; // Business rule
  return <button disabled={!canSubmit} onClick={onClick}>Submit Order</button>;
}

// GOOD: Primitive is pure presentation
function Button({ disabled, onClick, children }) {
  return <button disabled={disabled} onClick={onClick}>{children}</button>;
}

// GOOD: Pattern component contains business logic
function OrderSubmitButton({ orderId }) {
  const { data: order } = useOrder(orderId);
  const canSubmit = order.status === 'pending';

  return (
    <Button disabled={!canSubmit} onClick={() => submitOrder(orderId)}>
      Submit Order
    </Button>
  );
}
```

### Anti-Pattern 4: Premature Design System Extraction

**What people do:** Extract design system to separate package before validating it with real usage.

**Why it's wrong:** Leads to frequent breaking changes, version mismatch issues, slows down iteration. Design systems need real-world usage to stabilize API.

**Do this instead:**
- Keep design system in same repo initially (monolith)
- Use strict folder boundaries (design-system/, components/)
- Extract to package ONLY when:
  - Used successfully across 3+ pages
  - API stable for 2+ months
  - Second application needs it
  - Team has bandwidth for versioning/publishing

### Anti-Pattern 5: Skipping the Migration Phase

**What people do:** Build complete design system, then try to migrate all pages at once in one PR.

**Why it's wrong:** Massive risk, breaks existing functionality, blocks other work, hard to review, all-or-nothing deployment.

**Do this instead:**
- Use Strangler Fig pattern (Pattern 4)
- Migrate one page/feature at a time
- Keep old components working during migration
- Delete old code only after all usage replaced
- Each migration = separate PR, can be deployed independently

### Anti-Pattern 6: Inconsistent Naming Between Design and Code

**What people do:** Design files use different names than code (Button/Primary in Figma, PrimaryButton in code).

**Why it's wrong:** Slows down handoff, causes confusion, makes it harder to find components, breaks design-dev sync.

**Do this instead:**
- Establish naming convention before building
- Use same names in .pen files, component files, and documentation
- Format: `<Component>` with variants, not `<Variant><Component>`
- Example: `Button variant="primary"` not `PrimaryButton`
- Document naming convention in CONVENTIONS.md

## Sources

**Tailwind CSS v4 (HIGH confidence):**
- [Tailwind CSS v4.0 - Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4.0 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4)
- Context7: /tailwindlabs/tailwindcss.com

**Class Variance Authority (HIGH confidence):**
- [CVA Documentation](https://cva.style)
- Context7: /joe-bell/cva
- [CVA GitHub Repository](https://github.com/joe-bell/cva)

**Next.js App Router Architecture (HIGH confidence):**
- [Next.js Architecture Documentation](https://nextjs.org/docs/architecture)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- Context7: /vercel/next.js

**Design System Best Practices (MEDIUM confidence):**
- [Design Systems 101 - Nielsen Norman Group](https://www.nngroup.com/articles/design-systems-101/)
- [Best Practices for Scalable Component Libraries - UXPin](https://www.uxpin.com/studio/blog/best-practices-for-scalable-component-libraries/)
- [Building and maintaining component libraries - Vaadin](https://vaadin.com/blog/building-and-maintaining-the-component-library-of-a-design-system)

**Atomic Design (MEDIUM confidence):**
- [Atomic Design Methodology - Brad Frost](https://atomicdesign.bradfrost.com/chapter-2/)
- [Atomic Design in Practice](https://blog.logrocket.com/ux-design/atomic-design-components-ui-design/)

**Design Tokens Architecture (MEDIUM confidence):**
- [The Developer's Guide to Design Tokens and CSS Variables - Penpot](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
- [Design Tokens Explained - Contentful](https://www.contentful.com/blog/design-token-system/)
- [CSS Variables as Design Tokens - Plain English](https://javascript.plainenglish.io/css-variables-as-design-tokens-your-frontends-best-friend-and-why-you-ll-wonder-how-you-lived-5cbc68dd6de8)

**Theming Implementation (MEDIUM confidence):**
- [Creating Dark and Light Themes with CSS Variables - Medium](https://medium.com/@antonio.hg/creating-dark-and-light-themes-with-css-variables-respecting-user-preferences-and-adding-a-toggle-0ce1f96e592b)
- [Dark Mode and CSS Variables - Better Programming](https://betterprogramming.pub/dark-mode-and-css-variables-ed6dc250232c)

**Migration Strategy (MEDIUM confidence):**
- [Refactoring Your Way to a Design System - 24 Ways](https://24ways.org/2017/refactoring-your-way-to-a-design-system/)
- [How Teams Incrementally Modernize Large Frontend Codebases - AlterSquare](https://altersquare.io/how-teams-incrementally-modernize-large-frontend-codebases/)
- [Lessons from Migrating to a Design System - DEV](https://dev.to/victorandcode/lessons-from-migrating-a-web-application-to-a-design-system-2701)

**React Component Structure (MEDIUM confidence):**
- [Component Folder Pattern - Styled Components](https://medium.com/styled-components/component-folder-pattern-ee42df37ec68)
- [React File Structure - Josh W. Comeau](https://www.joshwcomeau.com/react/file-structure/)
- [React Folder Structure - Robin Wieruch](https://www.robinwieruch.de/react-folder-structure/)

---
*Architecture research for: CGM Dashboard Design System Integration*
*Researched: 2026-05-07*
