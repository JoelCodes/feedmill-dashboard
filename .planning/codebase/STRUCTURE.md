# Codebase Structure

**Analysis Date:** 2026-03-11

## Directory Layout

```
cgm-dashboard/
├── src/                    # Source code
│   ├── app/               # Next.js App Router pages and layout
│   │   ├── layout.tsx     # Root HTML layout and metadata
│   │   ├── page.tsx       # Dashboard page (/ route)
│   │   ├── globals.css    # Global styles and CSS variables
│   │   └── favicon.ico    # Browser tab icon
│   └── components/        # Reusable React components
│       ├── Sidebar.tsx    # Left navigation sidebar
│       ├── Header.tsx     # Top header with search and controls
│       ├── KPICard.tsx    # Key performance indicator cards
│       ├── OrdersTable.tsx # Orders table with status filtering
│       └── OrderDetails.tsx # Order timeline and details panel
├── public/                # Static assets served by Next.js
├── .planning/            # GSD planning documentation
│   └── codebase/         # Architecture and structure docs
├── .next/                # Next.js build output (generated)
├── node_modules/         # npm dependencies
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── next.config.ts        # Next.js configuration
├── postcss.config.mjs    # PostCSS configuration for Tailwind
└── .gitignore           # Git ignore rules
```

## Directory Purposes

**`src/`:**
- Purpose: Contains all application source code
- Contains: TypeScript/TSX files organized by feature layers
- Key files: `app/` for routing, `components/` for UI components

**`src/app/`:**
- Purpose: Next.js App Router directory defining routes and layout
- Contains: Page components, layouts, styling, and metadata
- Key files:
  - `layout.tsx`: Root layout wrapping all pages
  - `page.tsx`: Dashboard page served at `/` route
  - `globals.css`: Global styles and CSS variable theme definitions

**`src/components/`:**
- Purpose: Reusable React components for the dashboard UI
- Contains: Presentational components with Tailwind styling
- Key files:
  - `Sidebar.tsx`: Navigation sidebar with menu items
  - `Header.tsx`: Top header bar with search, settings, notifications
  - `KPICard.tsx`: Key performance indicator card display
  - `OrdersTable.tsx`: Order list with status filtering and details
  - `OrderDetails.tsx`: Timeline and stats panel for selected order

**`public/`:**
- Purpose: Static assets served directly by Next.js
- Contains: SVG icons (unused in current implementation)
- Generated: No, manually created

**`.planning/`:**
- Purpose: GSD planning and documentation
- Contains: Architecture and codebase analysis documents
- Generated: No, manually created by GSD agents

**`.next/`:**
- Purpose: Build output directory for Next.js
- Generated: Yes, created during build process
- Committed: No, in `.gitignore`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Application root layout (serves all routes)
- `src/app/page.tsx`: Dashboard page (serves `/` route)
- `src/app/globals.css`: Global theme and Tailwind configuration

**Configuration:**
- `tsconfig.json`: TypeScript compiler options, path aliases (`@/*` → `src/*`)
- `next.config.ts`: Next.js configuration (currently minimal)
- `postcss.config.mjs`: PostCSS plugins for Tailwind CSS v4
- `package.json`: Dependencies, scripts, project metadata

**Core Logic:**
- `src/app/page.tsx`: Dashboard component layout composition
- `src/components/Sidebar.tsx`: Navigation structure
- `src/components/OrdersTable.tsx`: Order data display and filtering
- `src/components/OrderDetails.tsx`: Order timeline visualization

**Styling:**
- `src/app/globals.css`: CSS variable definitions (colors, shadows, spacing)
- Individual components: Inline Tailwind classes using CSS variables

**Testing:**
- Not present in current codebase
- No test files or test configuration found

## Naming Conventions

**Files:**
- PascalCase for component files: `Sidebar.tsx`, `OrdersTable.tsx`, `KPICard.tsx`
- Standard names for configuration: `globals.css`, `layout.tsx`, `page.tsx`
- Standard names for config files: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`

**Directories:**
- kebab-case not used; lowercase directories: `src/`, `app/`, `components/`, `public/`
- Feature-based organization: `components/` groups all presentational components

**Components:**
- Export default function named after file: `export default function Sidebar() { }`
- PascalCase function names matching file names
- Props interfaces: `${ComponentName}Props` pattern
  - Example: `KPICardProps` in `KPICard.tsx`
- Sub-component functions: PascalCase, defined in same file as parent
  - Example: `NavItem`, `FilterPill`, `StatusBadge` in their parent component files

**Variables:**
- Constants: UPPER_SNAKE_CASE (e.g., `kpiData`, `orders`, `navItems`, `statusCounts`)
- React component props: camelCase
- CSS classes: inline Tailwind classes in string literals
- CSS variables: kebab-case prefixed with `--` (e.g., `--primary`, `--text-secondary`)

**Types:**
- TypeScript interfaces: PascalCase ending with `Props` or semantic name
- Type unions: Used for status types (e.g., `type OrderStatus = "shipped" | "loading" | "mixing" | "pending"`)
- Enums: Not used; prefer union types

## Where to Add New Code

**New Feature (Page/Route):**
- Primary code: Create new file in `src/app/` following Next.js conventions
  - Example: `src/app/orders/page.tsx` for `/orders` route
  - Create corresponding layout if needed: `src/app/orders/layout.tsx`
- Tests: Create `*.test.tsx` or `*.spec.tsx` (if testing added)

**New Component/Module:**
- Implementation: Create file in `src/components/` with PascalCase name
  - Example: `src/components/StatusBadge.tsx`
  - Prefer default export with named sub-components for related utilities
- Add TypeScript props interface: `${ComponentName}Props` at top of file
- Use Tailwind classes with CSS variables for colors
- Import icons from `lucide-react` as needed
- Tests: Create adjacent test file (if testing added)

**Utilities/Helpers:**
- Shared helpers: Create `src/utils/` directory if adding utility functions
- Constants: Place in `src/constants/` or at top of component file if component-specific
- Type definitions: Place in `src/types/` or with component if component-specific

**Styling:**
- Global styles: Add to `src/app/globals.css`
- Component styles: Use inline Tailwind classes
- New CSS variables: Define in `:root` in `src/app/globals.css`
- Tailwind v4 syntax: Use `@apply`, `@theme`, and arbitrary values as needed

## Special Directories

**`src/app/`:**
- Purpose: Next.js App Router files (routes, layouts, special files)
- Generated: No, manually created
- Committed: Yes, essential for routing

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes, created during `npm run build` or `npm run dev`
- Committed: No, always in `.gitignore`

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes, created by `npm install`
- Committed: No, in `.gitignore`

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: Yes, created by GSD agents
- Committed: Yes, part of documentation

---

*Structure analysis: 2026-03-11*
