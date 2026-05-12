# Phase 29: ROUTE-01 Cleanup — Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 14 in-scope files (all MODIFY-EXISTING or DELETE — zero new files)
**Analogs found:** 14 / 14 (every file is its own analog — executor reads the file, makes the targeted edit)

---

## File Classification

| File | Role | Data Flow | Action | Analog / Pattern Source |
|------|------|-----------|--------|------------------------|
| `src/components/ui/Timeline.tsx` | UI component | request-response (Link render) | MODIFY (D-05: one-line href) | itself |
| `src/components/ui/Timeline.test.tsx` | test (component) | — | MODIFY (D-06: one assertion update) | itself |
| `src/components/Header.tsx` | UI component | request-response (pathname routing) | MODIFY (D-11: delete 4 lines) | itself |
| `src/components/__tests__/Header.test.tsx` | test (component) | — | MODIFY (D-11 TDD: add title-text assertion) | itself + `Timeline.test.tsx` for assertion shape |
| `src/app/settings/page.tsx` | page / layout | request-response (SSR shell) | MODIFY (D-07: swap layout wrapper) | `src/components/DashboardLayout.tsx` for target import |
| `src/components/DashboardLayout.tsx` | layout component | — | READ-ONLY reference | itself |
| `src/lib/auth.ts` | service / utility | — | MODIFY (D-12: delete `checkRole` + JSDoc, lines 17–41) | itself |
| `src/lib/auth.test.ts` | test (unit) | — | MODIFY (D-12: delete `describe('checkRole')` block + import name, lines 18 & 24–64) | itself |
| `.planning/REQUIREMENTS.md` | docs | — | MODIFY (D-13: one-line text edit) | itself |
| `e2e/route-protection.spec.ts` | E2E spec | — | MODIFY (D-10: 3 path string updates) | itself |
| `e2e/production-smoke.spec.ts` | E2E spec | — | DELETE (D-09) | — |
| `playwright.config.ts` | config | — | MODIFY (D-09 companion + D-16: remove `production-smoke` project block; add `baseURL` to `demo-user` / `norole-user`) | itself |
| `jest.config.ts` | config | — | MODIFY (D-14: add `testPathIgnorePatterns`) | itself |
| `src/app/globals.css` | config / CSS | — | VERIFY / MODIFY (D-17: confirm `@source not` path) | itself |
| `src/__tests__/design-system/tokens.test.ts` | test (design-system) | — | MODIFY (D-15: rewrite 3 regex instances, lines 93, 99, 105) | itself |
| `src/__tests__/design-system/theme.test.tsx` | test (design-system) | — | MODIFY (D-15: add non-null assertion `!`, 7 instances) | itself |
| `src/components/__tests__/OrderDetails.test.tsx` | test (component) | — | MODIFY (D-15: add `customerId` field to `mockOrder`, line 13 region) | itself |
| `src/utils/customerSort.test.ts` | test (utility) | — | MODIFY (D-15: add `activeBins` field to `stats` object in `createCustomer`) | itself |

---

## Pattern Assignments

### `src/components/ui/Timeline.tsx` — D-05: href fix

**Action:** Single string change on line 123.

**Current state** (lines 122–127, VERIFIED):
```tsx
<Link
  href={`/orders?selected=${event.orderId}`}
  className="mt-1 inline-block leading-[1.5] font-normal text-[var(--fs-10)] text-[var(--primary)] underline"
>
  View Order Details
</Link>
```

**Target state** (only the `href` attribute value changes):
```tsx
<Link
  href={`/demo/orders?selected=${event.orderId}`}
  className="mt-1 inline-block leading-[1.5] font-normal text-[var(--fs-10)] text-[var(--primary)] underline"
>
  View Order Details
</Link>
```

**Change:** `/orders` → `/demo/orders` inside the template literal. One character group: add `/demo` prefix.

---

### `src/components/ui/Timeline.test.tsx` — D-06: stale assertion update

**Action:** Update the `href` expectation on line 82. This is NOT a new file — it already exists with a full test suite.

**Current state of the target test** (lines 76–83, VERIFIED):
```typescript
it('shows View Order Details link when expanded', async () => {
  const user = userEvent.setup();
  render(<Timeline events={mockEvents} />);
  const orderEvent = screen.getByRole('button', { name: 'Order Placed' });
  await user.click(orderEvent);
  const link = screen.getByRole('link', { name: /View Order Details/i });
  expect(link).toHaveAttribute('href', '/orders?selected=order-1');  // <-- STALE
});
```

**Target state** (line 82 only):
```typescript
  expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
```

**TDD order:** Update this assertion first (test goes RED) → then fix `Timeline.tsx` line 123 (test goes GREEN).

**Existing mock pattern** (lines 7–14, do not modify):
```typescript
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});
```
The mock renders `next/link` as a plain `<a>` — that is why `toHaveAttribute('href', …)` works directly on the DOM element.

---

### `src/components/Header.tsx` — D-11: dead branch deletion

**Action:** Delete lines 33–36 (the `// Legacy routes (404 fallback)` comment and 3 `if` branches). No replacement needed.

**Current state** (lines 23–39, VERIFIED):
```typescript
const getPageTitle = (path: string): string => {
  // Demo routes (check first - more specific)
  if (path.startsWith('/demo/orders')) return 'Orders';
  if (path.startsWith('/demo/customers')) return 'Customers';
  if (path.startsWith('/demo/mill-production')) return 'Mill Production';

  // Production routes
  if (path === '/') return 'Coming Soon';
  if (path.startsWith('/settings')) return 'Settings';

  // Legacy routes (404 fallback)
  if (path.startsWith('/orders')) return 'Orders';
  if (path.startsWith('/mill-production')) return 'Production';
  if (path.startsWith('/customers')) return 'Customers';

  return 'Dashboard';
};
```

**Target state** (lines 33–36 deleted):
```typescript
const getPageTitle = (path: string): string => {
  // Demo routes (check first - more specific)
  if (path.startsWith('/demo/orders')) return 'Orders';
  if (path.startsWith('/demo/customers')) return 'Customers';
  if (path.startsWith('/demo/mill-production')) return 'Mill Production';

  // Production routes
  if (path === '/') return 'Coming Soon';
  if (path.startsWith('/settings')) return 'Settings';

  return 'Dashboard';
};
```

**Behavior change:** `getPageTitle('/orders')` returns `'Dashboard'` (was `'Orders'`). Same for `/customers` and `/mill-production`.

**Page title is rendered at** (lines 101–103):
```tsx
<div className="text-text-secondary flex items-center gap-1 text-xs">
  <span>Pages</span>
  <span>/</span>
  <span className="text-text-primary">{title}</span>
</div>
<h1 className="text-text-primary text-sm font-bold">{title}</h1>
```
The new `Header.test.tsx` assertion for D-11 TDD must target one of these: either the `<h1>` (testable via `screen.getByRole('heading')`) or the breadcrumb `<span>`.

---

### `src/components/__tests__/Header.test.tsx` — D-11 TDD: add title-text assertion

**Action:** Add a new `it(…)` inside the existing `describe("Header - UserButton Integration", …)` block (or a new `describe` block) that mocks `usePathname` returning `'/orders'` and asserts the page title is `'Dashboard'`.

**Existing mock to leverage** (lines 51–56, VERIFIED — `usePathname` already mocked to `'/orders'`):
```typescript
jest.mock("next/navigation", () => ({
  usePathname: () => "/orders",
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
```

The existing mock already returns `'/orders'` — the new assertion can be added inside the existing describe block without touching the mock at all. The executor just needs to add a new `it(…)` that queries the heading:

```typescript
it("shows 'Dashboard' title for legacy /orders path (dead branch removed)", () => {
  render(<Header />);
  // After D-11, getPageTitle('/orders') returns 'Dashboard' (falls to default)
  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
});
```

**TDD order:** Add this test first (goes RED because dead branch returns `'Orders'`) → delete the dead branches from `Header.tsx` → test goes GREEN.

**Existing test assertion shape used for reference** (lines 81–84):
```typescript
const userButton = screen.getByTestId("clerk-userbutton");
expect(loadedContent).toContainElement(userButton);
```
Pattern: `screen.getByTestId / getByRole` + `toBeInTheDocument()` / `toContainElement()`.

---

### `src/app/settings/page.tsx` — D-07: DashboardLayout swap

**Action:** Replace the outer layout shell (lines 55–139) with `<DashboardLayout>`. Drop `Sidebar` and `Header` imports, add `DashboardLayout` import.

**Current imports** (lines 3–6, VERIFIED):
```typescript
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
```

**Target imports** (drop those two, add):
```typescript
import DashboardLayout from "@/components/DashboardLayout";
```

**Current JSX shell** (lines 54–59 and 138–140, VERIFIED):
```tsx
return (
  <div className="bg-bg-page flex h-screen">
    <Sidebar />
    <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
      <Header />

      <div className="mx-auto w-full max-w-2xl">
        {/* … page content … */}
      </div>
    </main>
  </div>
);
```

**Target JSX shell:**
```tsx
return (
  <DashboardLayout>
    <div className="mx-auto w-full max-w-2xl">
      {/* … page content unchanged … */}
    </div>
  </DashboardLayout>
);
```

**DashboardLayout contract** (from `src/components/DashboardLayout.tsx`, lines 16–30, VERIFIED):
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        {children}
      </main>
    </div>
  );
}
```
Children-only — no additional props needed. The visual output is identical; DashboardLayout renders the same `div > Sidebar + main > Header + children` shell.

---

### `src/lib/auth.ts` — D-12: delete `checkRole`

**Action:** Delete lines 17–41 (the `checkRole` JSDoc + function body). Keep everything else intact.

**Lines to delete** (17–41, VERIFIED):
```typescript
/**
 * Returns `true` iff the current session has the given role.
 * … (JSDoc block lines 17–36) …
 */
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
}
```

**Lines to keep** (1–16 imports/JSDoc and 43–75 `requireRole`):
- Lines 1–16: module-level JSDoc and imports (`auth`, `redirect`, `Role`)
- Lines 43+ (renumbered after deletion): `requireRole` export

**Verification after deletion:** `grep 'export.*checkRole' src/lib/auth.ts` → 0 matches.

---

### `src/lib/auth.test.ts` — D-12: delete `checkRole` describe block

**Action:** Delete lines 18 (import name) and 24–64 (`describe('checkRole', …)` block, 5 tests). Keep lines 1–17 (mock setup), 18's `requireRole` import, and lines 66–90 (`describe('requireRole', …)`).

**Import line to update** (line 18, VERIFIED):
```typescript
// Before:
import { checkRole, requireRole } from './auth';
// After:
import { requireRole } from './auth';
```

**Entire block to delete** (lines 24–64, VERIFIED):
```typescript
describe('checkRole', () => {
  it('returns true when claim matches', async () => { … });
  it('returns false when claim does not match', async () => { … });
  it('returns false when sessionClaims is undefined', async () => { … });
  it('returns false when metadata.role is missing', async () => { … });
  it('returns false when userId is null (unauthenticated)', async () => { … });
});
```
**Confirmed count:** 5 tests in `describe('checkRole')`. The CONTEXT.md's "8" counts all tests in the file; only 5 are deleted.

**Lines to keep** (66–90, VERIFIED):
```typescript
describe('requireRole', () => {
  it('redirects to /sign-in when userId is missing', …);
  it('redirects to / when role does not match', …);
  it('resolves without throwing when role matches', …);
});
```

---

### `.planning/REQUIREMENTS.md` — D-13: ACCESS-02 text edit

**Current state** (line 23, VERIFIED):
```markdown
- [x] **ACCESS-02**: Role utility functions (`checkRole()`, `requireRole()`) available for server components
```

**Target state:**
```markdown
- [x] **ACCESS-02**: Role utility functions (`requireRole()`) available for server components
```

**Keep:** The `[x]` Complete status. Drop only `checkRole(), ` from the function list.

**Verification:** `grep 'checkRole' .planning/REQUIREMENTS.md` → 0 matches.

---

### `e2e/route-protection.spec.ts` — D-10: path updates

**Action:** Update 3 path references in 2 locations.

**Location 1 — `protectedRoutes` constant** (lines 13–18, VERIFIED):
```typescript
// Before:
const protectedRoutes = [
  '/orders',
  '/customers',
  '/mill-production',
  '/settings',
] as const;

// After:
const protectedRoutes = [
  '/demo/orders',
  '/demo/customers',
  '/demo/mill-production',
  '/settings',
] as const;
```

**Location 2 — PROT-02 test body** (lines 34–48, VERIFIED — 2 hardcoded path references):
```typescript
// Before (line 35):
await page.goto('/orders');
// After:
await page.goto('/demo/orders');

// Before (line 47):
expect(returnBackUrl).toContain('/orders');
// After:
expect(returnBackUrl).toContain('/demo/orders');
```

**Warning (Pitfall 5):** CONTEXT.md D-10 only mentions the `protectedRoutes` constant, but the PROT-02 test body has 2 additional hardcoded `/orders` references that must also be updated. Leaving them stale causes a false-passing E2E test against deleted routes.

---

### `e2e/production-smoke.spec.ts` — D-09: delete file

**Action:** Delete file entirely. No partial edits.

**Companion action (Pitfall 2):** Remove the orphaned `production-smoke` project block from `playwright.config.ts` (lines 32–40, VERIFIED):
```typescript
// Delete this entire block from playwright.config.ts:
{
  name: 'production-smoke',
  testMatch: '**/production-smoke.spec.ts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  },
  retries: 0,
  timeout: 30000,
},
```

**Verification:** `grep 'production-smoke' playwright.config.ts` → 0 matches after deletion.

---

### `playwright.config.ts` — D-16: baseURL override for demo-user / norole-user projects

**Context:** The global `use.baseURL` (line 16) reads `process.env.PLAYWRIGHT_BASE_URL` from `.env.local`. The `demo-user` and `norole-user` projects currently have no `baseURL` in their `use:` block, so they inherit the production URL when that env var is set.

**Current `demo-user` project** (lines 46–52, VERIFIED):
```typescript
{
  name: 'demo-user',
  testMatch: /demo-route-protection\.spec\.ts$/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/demo.json',
  },
  dependencies: ['global setup'],
},
```

**Target `demo-user` project** (add `baseURL`):
```typescript
{
  name: 'demo-user',
  testMatch: /demo-route-protection\.spec\.ts$/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/demo.json',
    baseURL: 'http://localhost:3000',
  },
  dependencies: ['global setup'],
},
```

**Current `norole-user` project** (lines 53–60, VERIFIED):
```typescript
{
  name: 'norole-user',
  testMatch: /demo-route-protection\.spec\.ts$/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/norole.json',
  },
  dependencies: ['global setup'],
},
```

**Target `norole-user` project** (add `baseURL`):
```typescript
{
  name: 'norole-user',
  testMatch: /demo-route-protection\.spec\.ts$/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/norole.json',
    baseURL: 'http://localhost:3000',
  },
  dependencies: ['global setup'],
},
```

**Note:** D-09's companion edit (remove `production-smoke` project block) is also in this file — coordinate both edits in the same commit.

---

### `jest.config.ts` — D-14: add `testPathIgnorePatterns`

**Current config object** (lines 10–17, VERIFIED):
```typescript
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

**Target config object** (add `testPathIgnorePatterns` key):
```typescript
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
}
```

**Warning (Pitfall 6):** Do not omit `/node_modules/`. Setting `testPathIgnorePatterns` explicitly replaces Jest's built-in default (which includes `/node_modules/`). The combined array is required.

**Verification:** `npm test -- --listTests | grep e2e` → no output.

---

### `src/app/globals.css` — D-17: @source not verification

**Current state** (line 4, VERIFIED):
```css
@source not "../../.planning";
```

The path `../../.planning` relative to `src/app/globals.css` resolves correctly to `.planning/` at the project root. Tailwind v4 (4.2.1 installed) treats bare directory paths as recursive exclusions per official docs.

**Action:** Verify the directive is functioning. If dev-server startup still shows `.planning/**/*.md` being scanned, change to the explicit glob form:
```css
@source not "../../.planning/**";
```
Otherwise leave unchanged (current value is already correct syntax).

---

### `src/__tests__/design-system/tokens.test.ts` — D-15: regex fix

**Action:** Replace 3 instances of the `/s` (dotAll) flag regex. Touch only these 3 lines; no other changes.

**Lines 93, 99, 105** (VERIFIED — identical pattern each time):
```typescript
// Before (3 instances):
const darkBlock = globalsCss.match(/\.dark\s*\{[^}]+\}/s);

// After (avoids /s flag — compatible with tsconfig target ES2017):
const darkBlock = globalsCss.match(/\.dark\s*\{[\s\S]+?\}/);
```

Semantics: `[\s\S]` matches any character including newlines, replacing the dotAll `/s` behavior. The `+?` (lazy) prevents over-matching if multiple `.dark` blocks exist.

**Warning (Pitfall 4):** Do NOT change `tsconfig.json` target to ES2018. D-15 restricts changes to fixture files only.

---

### `src/__tests__/design-system/theme.test.tsx` — D-15: non-null assertion fix

**Action:** Add `!` non-null assertion to 7 accesses of `capturedProps` (lines 38, 48, 58, 68, 78, 88, 109 approximately — executor should grep for `capturedProps\.` to locate all 7).

**Pattern** (repeated 7 times):
```typescript
// Before:
expect(capturedProps.attribute).toBe("class");
// After:
expect(capturedProps!.attribute).toBe("class");
```

Apply to every `capturedProps.` property access in the file. The non-null assertion `!` tells TypeScript the value is non-null at runtime without adding runtime overhead.

---

### `src/components/__tests__/OrderDetails.test.tsx` — D-15: missing `customerId` field

**Action:** Add `customerId: 'CUST-001'` to the `mockOrder` object on or after line 25 (after `updatedAt`).

**Current `mockOrder`** (lines 13–26, VERIFIED — `customerId` is absent):
```typescript
const mockOrder: Order = {
  id: "ORD-001",
  documentNumber: "12345",
  customer: "Test Farm",
  textureType: "Coarse",
  formulaType: "Grower",
  quantity: 10,
  location: "Springfield, IL",
  deliveryDate: new Date("2026-05-15"),
  status: "Producing",
  hasChanges: false,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
};
```

**Target `mockOrder`** (add `customerId`):
```typescript
const mockOrder: Order = {
  id: "ORD-001",
  documentNumber: "12345",
  customer: "Test Farm",
  customerId: 'CUST-001',    // <-- add this field
  textureType: "Coarse",
  formulaType: "Grower",
  quantity: 10,
  location: "Springfield, IL",
  deliveryDate: new Date("2026-05-15"),
  status: "Producing",
  hasChanges: false,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
};
```

---

### `src/utils/customerSort.test.ts` — D-15: missing `activeBins` field

**Action:** Add `activeBins: 0` to the `stats` object inside `createCustomer` helper.

**Current `stats` object** (lines 12–18, VERIFIED — `activeBins` is absent):
```typescript
stats: {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  hasChanges: false,
  binAlertLevel: "none",
},
```

**Target `stats` object:**
```typescript
stats: {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  hasChanges: false,
  binAlertLevel: "none",
  activeBins: 0,    // <-- add this field
},
```

---

## Shared Patterns

### Test assertion style — all test modifications
**Source:** `src/components/ui/Timeline.test.tsx` lines 76–83 and `src/components/__tests__/Header.test.tsx` lines 73–84

All existing tests in this project follow this shape:
1. `render(<Component props />)` via `@testing-library/react`
2. `screen.getByRole(…)` / `screen.getByTestId(…)` to locate elements
3. `expect(element).toHaveAttribute(…)` / `toBeInTheDocument()` / `toHaveClass(…)` for assertions
4. Async interactions: `const user = userEvent.setup()` + `await user.click(element)`

No new assertion libraries needed. D-06 and D-11 TDD work uses these exact tools.

### Import alias convention — all component files
All source files use `@/` alias for `src/`:
```typescript
import DashboardLayout from "@/components/DashboardLayout";  // D-07 example
import { requireRole } from './auth';                         // D-12 relative (within src/lib)
```
Path aliases are resolved by `moduleNameMapper` in `jest.config.ts` and `tsconfig.json` paths.

### next/link mock pattern — component tests with Link
Used in `Timeline.test.tsx` (lines 8–14). Any future component test for a file that uses `next/link` must include:
```typescript
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});
```
This is already present in `Timeline.test.tsx` — D-06's assertion works against this mock without any changes to the mock itself.

---

## No Analog Found

None — every file in scope is its own best analog. This is a pure cleanup phase with no new file types or patterns.

---

## Files Not In Scope (for executor awareness)

| File | Why excluded |
|------|-------------|
| `src/app/settings/__tests__/page.test.tsx` | D-08: explicitly deferred — 14 pre-existing failures need ClerkProvider rework (Phase 30) |
| `tsconfig.json` | D-15 explicitly prohibits changes to type definitions; regex fix is in fixture files only |
| Any file under `src/app/demo/**` | Not touched in this phase; routes are already correct |

---

## Metadata

**Analog search scope:** `src/components/`, `src/lib/`, `src/app/settings/`, `src/__tests__/`, `src/utils/`, `e2e/`, project root configs
**Files read in this session:** 18 (all in-scope files + DashboardLayout reference)
**Line numbers:** All verified from live codebase read at git HEAD (`main`, commit `e8f4007` — one commit ahead of `5eb6b3a` audit baseline; no drift detected in any file)
**Pattern extraction date:** 2026-05-12
