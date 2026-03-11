# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Next.js Server-Side Rendered (SSR) Component-Based Architecture with Client-Side Interactivity

**Key Characteristics:**
- Page-based routing via Next.js App Router (`src/app/`)
- Presentational component composition with static data
- Tailwind CSS with CSS variables for theming
- Lucide React icons for consistent UI iconography
- Zero backend API integration (currently static UI only)

## Layers

**Presentation Layer:**
- Purpose: Render UI components and handle all visual presentation
- Location: `src/components/`
- Contains: React functional components with Tailwind CSS styling
- Depends on: Lucide React icons, TypeScript types, CSS variables
- Used by: Page component (`src/app/page.tsx`)

**Page Layer:**
- Purpose: Define application routes and orchestrate component composition
- Location: `src/app/`
- Contains: Root layout (`layout.tsx`) and page components (`page.tsx`)
- Depends on: Presentation components, Next.js metadata
- Used by: Next.js routing system

**Styling Layer:**
- Purpose: Define theme variables, colors, spacing, and global styles
- Location: `src/app/globals.css`
- Contains: CSS custom properties (variables) and Tailwind CSS imports
- Depends on: Tailwind CSS v4
- Used by: All components via class names

## Data Flow

**Dashboard View Initialization:**

1. User navigates to root `/` route
2. Next.js loads `src/app/layout.tsx` (RootLayout)
3. RootLayout wraps children in `<html>` and applies global styles
4. Next.js renders `src/app/page.tsx` (Dashboard component)
5. Dashboard component composes layout structure:
   - Sidebar component renders static navigation
   - Main content area renders Header, KPI cards, Orders table, Order details
6. Child components render with inline mock data (arrays defined in-component)
7. Lucide React icons render within components
8. Tailwind CSS classes apply styling using CSS variables for theming

**State Management:**
- Currently: No state management. All data is static/mocked within components.
- UI interactivity: Limited to CSS hover/active states. No onClick handlers implemented.
- Future consideration: Client state likely needed for filtering, search, and order details updates.

## Key Abstractions

**KPICard Component:**
- Purpose: Display key performance indicators with metric, value, change, and icon
- Examples: `src/components/KPICard.tsx` (contains KPICard and KPICards wrapper)
- Pattern: Parent component (KPICards) maps over data array, child component (KPICard) renders individual items
- Props-based composition with TypeScript interface `KPICardProps`

**OrdersTable Component:**
- Purpose: Display tabular order data with status filtering and alerts
- Examples: `src/components/OrdersTable.tsx`
- Pattern: Master component manages table structure, header, filters; sub-components (FilterPill, StatusBadge) handle filtering UI and status visualization
- Data-driven rendering with hardcoded `orders` array and `statusConfig` object for status styling

**OrderDetails Component:**
- Purpose: Display detailed timeline and statistics for a selected order
- Examples: `src/components/OrderDetails.tsx`
- Pattern: Container component with nested sub-components (StatCard, TimelineItem, TimelineConnector)
- Uses `timelineSteps` array and `colorMap` object for timeline visualization

**Sidebar Navigation:**
- Purpose: Provide main navigation structure and app branding
- Examples: `src/components/Sidebar.tsx` (contains Sidebar and NavItem sub-component)
- Pattern: Parent maps over static `navItems` and `settingsItems` arrays; sub-component (NavItem) renders individual nav items with active state styling

## Entry Points

**Application Root:**
- Location: `src/app/layout.tsx`
- Triggers: Page load on any route
- Responsibilities: Set page metadata, define HTML structure, wrap children in root element, import global styles

**Dashboard Page:**
- Location: `src/app/page.tsx`
- Triggers: User navigates to `/` route
- Responsibilities: Compose dashboard layout, instantiate all dashboard components, manage overall page structure with flexbox layout

**Component Exports:**
- All components in `src/components/` are default exports
- Imported by page component using path alias `@/components/`

## Error Handling

**Strategy:** No error handling currently implemented

**Patterns:**
- Components render static data; no error states defined
- No try-catch blocks
- No error boundaries
- No fallback UI for failed operations

**Future Consideration:** Error states needed for async API calls, data loading states, and validation errors once backend integration occurs.

## Cross-Cutting Concerns

**Logging:** Not implemented. No console logging visible in components.

**Validation:** TypeScript interfaces provide compile-time validation:
- `KPICardProps` interface in `src/components/KPICard.tsx`
- `Order` interface in `src/components/OrdersTable.tsx`
- `TimelineStep` interface in `src/components/OrderDetails.tsx`
- No runtime validation framework (e.g., Zod, Yup)

**Authentication:** Not implemented. No user login or permission system. Dashboard loads publicly without authentication.

**Styling:** CSS variables (custom properties) in `src/app/globals.css` provide:
- Color theming (primary, success, error, warning, info)
- Spacing/sizing (shadow, radius variables)
- Text color inheritance based on semantic role (primary, secondary)
- All components reference variables via `var(--*-*-*)` syntax in Tailwind classes

---

*Architecture analysis: 2026-03-11*
