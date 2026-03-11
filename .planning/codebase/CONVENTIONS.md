# Coding Conventions

**Analysis Date:** 2026-03-11

## Naming Patterns

**Files:**
- Pascal case for component files: `KPICard.tsx`, `OrdersTable.tsx`, `Header.tsx`
- Lowercase for type/utility files: `globals.css`, `layout.tsx` (for app layout files)
- Components are typically one per file

**Functions:**
- Functional components use Pascal case: `KPICards()`, `OrdersTable()`, `Header()`
- Internal helper components use Pascal case: `KPICard()`, `FilterPill()`, `StatusBadge()`
- Handler functions use camelCase: `NavItem()`, `TimelineItem()`, `StatCard()`

**Variables:**
- Constants use camelCase: `orders`, `statusCounts`, `kpiData`, `navItems`, `settingsItems`
- State and runtime values use camelCase: `label`, `value`, `change`, `changeType`
- Type aliases and interfaces use Pascal case: `OrderStatus`, `Order`, `KPICardProps`, `TimelineStep`

**Types:**
- Interface names are Pascal case with `Props` suffix for component props: `KPICardProps`
- Type unions use Pascal case: `OrderStatus = "shipped" | "loading" | "mixing" | "pending"`
- Color/config mapping objects use camelCase: `statusConfig`, `colorMap`, `statusCounts`

## Code Style

**Formatting:**
- ESLint configured via `eslint.config.mjs` with Next.js specific rules
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- TypeScript strict mode enabled (`"strict": true` in tsconfig.json)
- 2-space indentation (default from Next.js)

**Linting:**
- Framework: ESLint 9.x
- Config: `eslint.config.mjs`
- Key rules: Enforces Next.js core web vitals and TypeScript best practices
- Run command: `npm run lint` (via package.json scripts)
- No Prettier configuration found; Prettier not in dependencies

**Whitespace:**
- Trailing commas used in objects and arrays: `{ icon: Wheat, }`
- Newlines between logical sections (example in `Sidebar.tsx` between nav sections)

## Import Organization

**Order:**
1. External libraries (React, Next.js, third-party): `import { Wheat, ClipboardList } from "lucide-react"`
2. Local types/interfaces defined after imports: `interface KPICardProps`
3. Local constants defined in file: `const kpiData: KPICardProps[]`
4. Component definitions follow

**Path Aliases:**
- Configured in tsconfig.json: `"@/*": ["./src/*"]`
- Used throughout for imports: `import Sidebar from "@/components/Sidebar"`
- Prevents relative path hell in nested structures

**Import Style:**
- Named imports for specific utilities: `import { Wheat, ClipboardList, Truck } from "lucide-react"`
- Default imports for components: `import Sidebar from "@/components/Sidebar"`
- Type imports using `import type` for metadata/types: `import type { Metadata } from "next"`

## Error Handling

**Patterns:**
- No explicit error handling found in UI components (not applicable for presentational components)
- Null checks used inline with ternary operators: `{order.hasAlert && <div>...</div>}`
- Optional chaining in prop access is implicit through TypeScript types

**Type Safety:**
- All props are typed via interfaces
- Component props marked as `Readonly` where appropriate: `children: React.ReactNode`
- Union types used for constrained values: `changeType: "positive" | "negative" | "neutral"`

## Logging

**Framework:** Not used in current codebase

**Patterns:**
- No logging framework detected
- Console methods not found in source files
- For debugging: Use browser DevTools console if needed (to be added in future)

## Comments

**When to Comment:**
- Minimal comments in codebase
- Section dividers used in JSX: `{/* Sidebar */}`, `{/* Header */}`, `{/* Status Filters */}`
- Complex logic receives comment explanations (none present in current code)

**JSDoc/TSDoc:**
- Not used for component or function documentation
- Type annotations are relied upon instead

## Function Design

**Size:**
- Small focused functions preferred
- Helper components extracted to separate functions in same file
- Example: `FilterPill()` and `StatusBadge()` extracted from `OrdersTable()`

**Parameters:**
- Props passed as destructured object: `function KPICard({ label, value, change, changeType, icon: Icon }: KPICardProps)`
- Optional props marked with `?`: `hasAlert?: boolean`, `unit?: string`
- Renamed destructured props for clarity: `icon: Icon` renames icon prop to Icon for use

**Return Values:**
- Components return JSX elements only
- Ternary operators for conditional rendering: `{active ? <div>...</div> : <div>...</div>}`
- Template literals used for dynamic className values: `className={`flex items-center gap-3 px-4 py-3 rounded-[15px] w-full ${active ? "..." : "..."}`}`

## Module Design

**Exports:**
- Default export for main component: `export default function Dashboard() {}`
- Named functions for internal helpers (not exported): `function KPICard({...}) {}`
- Single export per file (components) is standard

**Component Organization:**
- Main component defined as `export default function ComponentName()`
- Helper/sub-components defined below main component in same file
- Props interface defined at top of file before component

**Data Structure:**
- Configuration objects defined at module level: `const statusConfig: Record<OrderStatus, {...}> = {...}`
- Type-safe mappings using `Record<KeyType, ValueType>` syntax
- Array constants typed explicitly: `const orders: Order[] = [...]`

## Styling Conventions

**Framework:** Tailwind CSS 4 with PostCSS

**Class Organization:**
- Utility classes applied directly to JSX elements: `className="flex gap-6 w-full"`
- Multiple utilities chained: `className="flex items-center justify-between w-full"`
- Conditional classes with template literals: `className={`text-xs font-bold ${changeColor}`}`
- Inline color variables: `className="bg-[var(--primary)]"` (CSS custom properties)

**Design Tokens:**
- Defined in `src/app/globals.css` as CSS custom properties
- Colors: `--primary`, `--success`, `--error`, `--warning`, `--info`
- Text colors: `--text-primary`, `--text-secondary`
- Background colors: `--bg-page`, `--bg-card`, `--bg-sidebar`
- Spacing and shadows: `--divider`, `--shadow-sm`, `--shadow-card`

**Responsive Design:**
- No explicit responsive breakpoints found in current components
- All layouts use flex with gap for spacing
- Grid-like layouts built with flex: `flex gap-6 flex-1`

---

*Convention analysis: 2026-03-11*
