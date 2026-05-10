# Phase 21: Route Protection - Pattern Map

**Mapped:** 2026-05-09
**Files analyzed:** 4 new files to create (config + tests + updates)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `playwright.config.ts` | config | N/A | `jest.config.ts` | role-match |
| `e2e/route-protection.spec.ts` | test | request-response | `src/app/sign-in/__tests__/page.test.tsx` | partial |
| `package.json` (scripts) | config | N/A | `package.json` (existing) | exact |
| `.gitignore` (updates) | config | N/A | `.gitignore` (existing) | exact |

## Pattern Assignments

### `playwright.config.ts` (config)

**Analog:** `jest.config.ts`

**Config structure pattern** (lines 1-21):
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
```

**Key patterns to copy:**
- Import config type from test framework
- Use framework-specific Next.js integration helper
- Export config with TypeScript typing
- Set testDir/testEnvironment appropriately
- Configure module path aliases (Playwright uses baseURL instead)

**Playwright equivalent from RESEARCH.md** (lines 209-237):
```typescript
// Source: Next.js Playwright testing guide
// https://nextjs.org/docs/pages/guides/testing/playwright

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### `e2e/route-protection.spec.ts` (test, request-response)

**Analog:** `src/app/sign-in/__tests__/page.test.tsx`

**Test file structure pattern** (lines 1-5, 32-39):
```typescript
import React from "react";
import { render, screen } from "@testing-library/react";
import SignInPage from "../[[...sign-in]]/page";
import "@testing-library/jest-dom";

// ...

describe("SignInPage", () => {
  it("renders sign-in page with CGM Dashboard branding", () => {
    render(<SignInPage />);

    // Verify branding text is present
    expect(screen.getByText("CGM DASHBOARD")).toBeInTheDocument();
  });
```

**Key patterns to copy:**
- Import test framework and assertions at top
- Use describe blocks for test organization
- Use descriptive test names with it() blocks
- Clear comments explaining what is being verified
- Arrange-Act-Assert pattern in tests

**Playwright equivalent from RESEARCH.md** (lines 158-178):
```typescript
// Source: Clerk testing docs + Playwright navigation assertions
// https://clerk.com/docs/guides/development/testing/playwright
// https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url

import { test, expect } from '@playwright/test';

test.describe('Route Protection', () => {
  test('unauthenticated user accessing /orders redirects to sign-in', async ({ page }) => {
    // Navigate to protected route without authentication
    await page.goto('/orders');

    // Verify redirect to sign-in page
    await expect(page).toHaveURL(/\/sign-in/);

    // Verify returnBackUrl parameter is preserved for post-auth redirect
    const url = page.url();
    expect(url).toContain('returnBackUrl=%2Forders');
  });
});
```

**Mock pattern from analog** (lines 7-25):
```typescript
// Mock Clerk components
interface MockSignInProps {
  appearance?: unknown;
  routing?: string;
  path?: string;
  signUpUrl?: string;
  fallbackRedirectUrl?: string;
}

jest.mock("@clerk/nextjs", () => ({
  SignIn: ({ appearance, routing, path, signUpUrl, fallbackRedirectUrl }: MockSignInProps) => (
    <div data-testid="clerk-signin">
      <div data-testid="appearance">{JSON.stringify(appearance !== undefined)}</div>
      <div data-testid="routing">{routing}</div>
      <div data-testid="path">{path}</div>
      <div data-testid="signup-url">{signUpUrl}</div>
      <div data-testid="fallback-redirect">{fallbackRedirectUrl}</div>
    </div>
  ),
}));
```

**Note:** Playwright E2E tests don't need mocks — they test real middleware behavior. Jest unit tests mock dependencies, Playwright tests run against real server.

**Parameterized test pattern from RESEARCH.md** (lines 184-203):
```typescript
// Source: Playwright parameterized tests pattern
// https://playwright.dev/docs/test-parameterize

import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/orders',
  '/customers',
  '/mill-production',
  '/settings',
];

for (const route of protectedRoutes) {
  test(`unauthenticated user accessing ${route} redirects to sign-in`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/sign-in/);
  });
}
```

---

### `package.json` scripts (config)

**Analog:** `package.json` (existing scripts, lines 5-12)

**Existing scripts pattern:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "NODE_OPTIONS='--disable-warning=ExperimentalWarning' jest",
  "test:watch": "NODE_OPTIONS='--disable-warning=ExperimentalWarning' jest --watch"
}
```

**Key patterns to copy:**
- Namespace related scripts with colons (test:watch, test:e2e)
- Use NODE_OPTIONS for suppressing warnings consistently
- Keep commands simple and readable
- Follow existing naming conventions

**Playwright scripts from RESEARCH.md** (lines 334-345):
```json
// Source: Playwright installation guide
// https://playwright.dev/docs/intro

{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

**Combined pattern:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "NODE_OPTIONS='--disable-warning=ExperimentalWarning' jest",
  "test:watch": "NODE_OPTIONS='--disable-warning=ExperimentalWarning' jest --watch",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

---

### `.gitignore` updates (config)

**Analog:** `.gitignore` (existing, lines 1-44)

**Existing structure pattern:**
```gitignore
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

/example-data/
```

**Key patterns to copy:**
- Group related patterns with comments
- Use section headers matching the existing pattern
- Place new test artifacts under "# testing" section
- Use / prefix for directories, * for glob patterns

**Additions needed from RESEARCH.md Pitfall #5 (lines 283-287):**
```gitignore
# testing
/coverage
/test-results/
/playwright-report/
/playwright/.auth/
```

---

## Shared Patterns

### Test Setup and Configuration
**Source:** `jest.config.ts` + `jest.setup.ts`
**Apply to:** Playwright config and setup

**Jest setup pattern** (jest.setup.ts, lines 1-5):
```typescript
import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'

// Extend Jest expect with jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations)
```

**Key pattern:** Project uses setup files to extend test framework capabilities. Playwright equivalent would be test fixtures or global setup if needed for auth in future phases.

### Environment Variable Configuration
**Source:** `.env.example` (lines 1-10)
**Apply to:** Playwright tests

**Existing pattern:**
```bash
# Clerk Authentication Keys
# Copy this file to .env.local and fill in your keys from https://dashboard.clerk.com

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Clerk custom page URLs (required for custom sign-in/sign-up pages)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**Key pattern:** Clear section headers with comments, test keys (pk_test_, sk_test_) for development/testing, live keys for production. Playwright tests will use same env vars.

### TypeScript Configuration
**Source:** Project uses TypeScript throughout

**Key patterns:**
- Type imports: `import type { Config } from 'jest'`
- Explicit typing: `const config: Config = { ... }`
- Type-safe mocks: Interface definitions for mock props

**Apply to:** Playwright config should use TypeScript with proper type imports from `@playwright/test`

### Code Organization
**Source:** Existing test files in `__tests__` directories

**Key pattern from `src/app/orders/__tests__/page.test.tsx` (lines 54-105):**
```typescript
describe("OrdersPage - MIG-01 Design System Migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getOrders as jest.Mock).mockResolvedValue(mockOrders);
  });

  describe("Suspense skeleton uses design tokens", () => {
    // Nested describe for logical grouping
    it("skeleton does not use hardcoded rounded-[15px]", () => {
      // Test implementation
    });

    it("skeleton does not use hardcoded bg-gray-100", () => {
      // Test implementation
    });
  });

  describe("Page renders correctly", () => {
    // Another logical group
    it("renders orders page with sidebar and header", async () => {
      // Test implementation
    });
  });
});
```

**Key patterns:**
- Nested describe blocks for logical grouping
- beforeEach for setup/cleanup
- Clear test descriptions tied to requirements (e.g., "MIG-01")
- Tests organized by concern (design tokens, rendering, behavior)

**Apply to:** Playwright tests should use test.describe for grouping, clear test names tied to requirements (PROT-01, PROT-02)

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | — | — | All files have acceptable analogs or are updates to existing files |

**Note:** While `e2e/route-protection.spec.ts` is a partial match (Jest unit test vs Playwright E2E test), the testing patterns from Jest tests provide valuable structure (describe blocks, clear test names, comments). The RESEARCH.md provides the Playwright-specific patterns (page.goto, toHaveURL assertions).

---

## Metadata

**Analog search scope:**
- Root directory config files (jest.config.ts, package.json, .gitignore, .env.example)
- Test files in `src/app/*/__tests__/` directories
- Test setup in `jest.setup.ts`

**Files scanned:** 8 files read (jest.config.ts, 2 test files, jest.setup.ts, package.json, .gitignore, .env.example, middleware.ts)

**Pattern extraction date:** 2026-05-09

**Key insights:**
1. Project has strong testing conventions already (Jest + Testing Library)
2. TypeScript typing is used throughout config and tests
3. Clear separation of concerns: unit tests in `__tests__` directories, E2E tests will go in `e2e/` directory
4. Test scripts use namespace pattern (test:watch, future test:e2e)
5. Environment variables already configured for Clerk — tests can reuse same keys
6. No existing Playwright setup — this phase establishes new E2E testing capability alongside existing Jest unit tests
