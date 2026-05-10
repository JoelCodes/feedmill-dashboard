# Phase 21: Route Protection - Research

**Researched:** 2026-05-09
**Domain:** Next.js App Router E2E testing with Playwright and Clerk
**Confidence:** HIGH

## Summary

This phase verifies that the Clerk middleware configured in Phase 20 correctly protects dashboard routes by redirecting unauthenticated users to the sign-in page. Research shows the standard approach uses Playwright for E2E testing with automated test scenarios that verify redirect behavior and return URL preservation. The recommended pattern tests unauthenticated access to protected routes without requiring actual authentication — Phase 21 tests the redirect-to-sign-in flow only, not authenticated access.

Playwright provides first-class support for Next.js testing with built-in navigation assertions (toHaveURL) that verify redirect behavior. The testing pattern is straightforward: navigate to a protected route as an unauthenticated user, assert redirect to /sign-in, verify returnBackUrl parameter is preserved. The Clerk middleware automatically handles these redirects via auth.protect() when routes are not in the public matcher list.

**Primary recommendation:** Use Playwright E2E tests to verify unauthenticated redirect flows for success criteria routes only (/orders, /customers, /mill-production, /settings). Include one test for return URL verification. Tests run in CI via GitHub Actions to catch middleware regressions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**D-01:** Root path (`/`) stays as the dashboard home page — protected like all other routes.

**D-02:** After sign-in with no specific page requested, user lands on `/` (root dashboard home).

**D-03:** Use automated E2E tests with Playwright to verify route protection.

**D-04:** Test scope: unauthenticated redirect behavior only — no authenticated access tests in this phase.

**D-05:** Test coverage: only success criteria routes from roadmap (`/orders`, `/customers`, `/mill-production`, `/settings`).

**D-06:** Include return URL verification — test that after sign-in, user is redirected back to originally requested page.

### Claude's Discretion
None — all areas received explicit user decisions.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROT-01 | Unauthenticated users are redirected to sign-in page | Playwright toHaveURL assertion verifies redirect to /sign-in when accessing protected routes |
| PROT-02 | All dashboard pages require authentication (orders, customers, mill production, settings) | Playwright tests iterate over success criteria routes to verify each redirects when unauthenticated |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route protection enforcement | Middleware (Edge) | — | Clerk middleware runs at edge before page render, checks session cookies, redirects unauthenticated users |
| Redirect behavior verification | E2E Test Layer | — | Playwright tests run in headless browser, verify actual HTTP redirects and URL changes |
| Return URL preservation | Middleware (Edge) | Sign-in Page (Frontend Server) | Middleware sets returnBackUrl param, SignIn component reads it for post-auth redirect |
| Test execution orchestration | CI/CD (GitHub Actions) | Local Dev Environment | Tests run on every PR in CI, developers can run locally for debugging |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.59.1 | E2E testing framework | Industry standard for Next.js E2E testing, first-class browser automation, built-in assertions for navigation/redirects |
| playwright | 1.59.1 | Browser automation library | Peer dependency of @playwright/test, provides Chromium/Firefox/WebKit drivers |
| @clerk/testing | 2.0.27 | Clerk integration helpers | Official Clerk testing utilities for bypassing bot detection and programmatic auth (future phases) |

**Version verification:**
```bash
# Verified 2026-05-09
npm view @playwright/test version  # 1.59.1 (published 2026-05-02)
npm view playwright version        # 1.59.1 (published 2026-05-02)
npm view @clerk/testing version    # 2.0.27 (published 2026-04-22)
```

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | 20.x | Node.js type definitions | Already installed, needed for path module in test setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cypress | Cypress has Clerk integration too, but Playwright is faster (no electron overhead), better TypeScript support, and simpler setup for Next.js |
| E2E tests | Jest unit tests with mocks | Unit tests can't verify actual middleware redirect behavior (HTTP redirects, browser navigation) |
| Manual testing | No automated tests | Manual testing doesn't catch regressions on every commit, prone to human error |

**Installation:**
```bash
npm install -D @playwright/test playwright @clerk/testing
npx playwright install chromium  # Install browser binaries
```

## Architecture Patterns

### System Architecture Diagram

```
User (unauthenticated)
    |
    | HTTP GET /orders
    v
Next.js Middleware (Edge)
    |
    | clerkMiddleware() checks session
    | !isPublicRoute() → await auth.protect()
    |
    | No valid session found
    v
HTTP 307 Redirect
    |
    | Location: /sign-in?returnBackUrl=/orders
    v
Sign-in Page
    |
    | SignIn component renders
    | Clerk handles auth flow
    |
    | [Future: User completes sign-in]
    v
HTTP 307 Redirect (post-auth)
    |
    | Location: /orders (from returnBackUrl param)
    v
Protected Page (authenticated)


Playwright Test Flow (Phase 21 scope):
    |
    | page.goto('/orders')
    v
Verify Redirect
    |
    | await expect(page).toHaveURL(/\/sign-in/)
    v
Verify Return URL
    |
    | const url = page.url()
    | expect(url).toContain('returnBackUrl=%2Forders')
    v
Test Complete (PASS)
```

### Recommended Project Structure
```
cgm-dashboard/
├── e2e/                          # E2E test directory
│   ├── route-protection.spec.ts  # Phase 21 tests
│   └── .auth/                    # Future: auth state storage
│       └── user.json             # Future: saved auth session
├── playwright.config.ts          # Playwright configuration
├── .env.example                  # Documents E2E test env vars
├── .gitignore                    # Excludes test-results/, .auth/
└── package.json                  # Test scripts
```

### Pattern 1: Unauthenticated Redirect Test
**What:** Navigate to protected route as unauthenticated user, verify redirect to sign-in with returnBackUrl parameter.
**When to use:** Testing PROT-01 requirement — verify middleware redirects unauthenticated users.
**Example:**
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

### Pattern 2: Iterating Over Protected Routes
**What:** Test multiple routes with single parameterized test to avoid duplication.
**When to use:** Testing PROT-02 requirement — verify all success criteria routes are protected.
**Example:**
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

### Pattern 3: Playwright Configuration for Next.js
**What:** Configure Playwright to test against local Next.js dev server with proper base URL and test directory.
**When to use:** Initial Playwright setup in Wave 0.
**Example:**
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

### Anti-Patterns to Avoid
- **Testing authenticated flows without saved state:** Phase 21 only tests unauthenticated redirects. Authenticated access tests belong in future phases using storageState pattern.
- **Hardcoding base URL in tests:** Use `page.goto('/orders')` not `page.goto('http://localhost:3000/orders')` — playwright.config.ts sets baseURL.
- **Testing every route in the app:** User specified success criteria routes only — don't test /inventory, /shipments, /customers/[id] in Phase 21.
- **Checking redirect with string equality:** Use regex `toHaveURL(/\/sign-in/)` not `toHaveURL('http://localhost:3000/sign-in')` — handles query params and baseURL variations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser automation | Custom Puppeteer scripts, Selenium wrappers | Playwright @playwright/test | Playwright has auto-wait, better error messages, built-in assertions, simpler setup than Puppeteer/Selenium |
| Auth state management | Manual cookie manipulation, localStorage injection | @clerk/testing helpers (future) | Clerk testing package bypasses verification steps, handles session tokens correctly, avoids flaky tests from cookie expiration |
| Redirect verification | Manual URL parsing, waitForNavigation hacks | expect(page).toHaveURL() | Built-in Playwright assertion auto-retries until redirect completes, handles multiple redirect hops |
| Test server management | Custom Next.js server scripts | Playwright webServer config | Playwright starts/stops dev server automatically, waits for readiness, reuses existing server in dev |

**Key insight:** E2E testing has mature tooling (Playwright) with official Next.js integration and Clerk testing utilities. Custom solutions introduce flakiness from timing issues (redirects, navigation) that framework-provided auto-wait eliminates.

## Common Pitfalls

### Pitfall 1: Testing Against Development Server Without Production Behavior
**What goes wrong:** Tests pass in dev but fail in production because Next.js dev server has different redirect behavior, hot reloading, and debug middleware.
**Why it happens:** Developers run `npm run dev` for speed, don't verify production build matches test expectations.
**How to avoid:** Run Playwright tests against production build (`npm run build && npm start`) in CI. Use webServer command in playwright.config.ts for local dev convenience.
**Warning signs:** Tests pass locally but fail in CI/production, redirect behavior differs between environments.

### Pitfall 2: Flaky Tests from Timing Issues
**What goes wrong:** Tests randomly fail with "Expected URL to be /sign-in but got /orders" because redirect hasn't completed when assertion runs.
**Why it happens:** Using waitForURL() with short timeout or polling page.url() manually instead of Playwright's built-in auto-wait.
**How to avoid:** Use `await expect(page).toHaveURL(/\/sign-in/)` — Playwright automatically retries until redirect completes or timeout (default 5 seconds).
**Warning signs:** Tests fail intermittently, pass on retry, "timeout exceeded" errors.

### Pitfall 3: Missing Environment Variables in CI
**What goes wrong:** Tests fail in CI with "Clerk publishable key not found" even though middleware works locally.
**Why it happens:** .env.local is gitignored, CI doesn't have NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY configured.
**How to avoid:** Document required env vars in .env.example, configure GitHub Actions secrets, use test keys (pk_test_/sk_test_) for CI.
**Warning signs:** Tests pass locally but fail in CI with Clerk initialization errors.

### Pitfall 4: Testing Too Many Routes (Scope Creep)
**What goes wrong:** Tests cover /inventory, /shipments, /customers/[id] even though user specified only success criteria routes.
**Why it happens:** Developer assumes "all dashboard pages" means every route in src/app/, not just the four success criteria routes.
**How to avoid:** Re-read CONTEXT.md D-05 — only test /orders, /customers, /mill-production, /settings. Resist urge to add more.
**Warning signs:** Test suite takes longer than 30 seconds, more than 5 redirect tests exist.

### Pitfall 5: Not Excluding Test Files from Git
**What goes wrong:** Playwright screenshots, videos, trace files bloat git history, cause merge conflicts.
**Why it happens:** .gitignore doesn't exclude test-results/, playwright-report/, or .auth/ directories created by Playwright.
**How to avoid:** Add test artifacts to .gitignore before first commit. Playwright's default outputDir is test-results/.
**Warning signs:** Large binary files in git status, PR diffs include HTML reports or PNG screenshots.

## Code Examples

Verified patterns from official sources:

### Navigate and Assert Redirect
```typescript
// Source: Playwright Page Assertions
// https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url

import { test, expect } from '@playwright/test';

test('redirect verification', async ({ page }) => {
  await page.goto('/protected-route');

  // Regex match for flexibility (handles query params, trailing slashes)
  await expect(page).toHaveURL(/\/sign-in/);

  // Exact match if needed
  await expect(page).toHaveURL('http://localhost:3000/sign-in');

  // Predicate function for complex conditions (e.g., query param verification)
  await expect(page).toHaveURL(url => {
    return url.pathname === '/sign-in' &&
           url.searchParams.has('returnBackUrl');
  });
});
```

### Return URL Parameter Verification
```typescript
// Source: Community pattern from Next.js + Playwright testing guides
// Verified approach for testing redirect return URL preservation

test('return URL is preserved after redirect', async ({ page }) => {
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/sign-in/);

  // Verify returnBackUrl query parameter
  const url = new URL(page.url());
  const returnBackUrl = url.searchParams.get('returnBackUrl');
  expect(returnBackUrl).toBe('/orders');
});
```

### Playwright Test Script in package.json
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

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Selenium WebDriver | Playwright | ~2020 | Faster execution (no Selenium grid), simpler setup (no Java/drivers), better TypeScript support |
| Cypress (default) | Playwright (preference) | ~2023 | Playwright faster for simple redirect tests (no Electron overhead), better for multi-tab flows |
| Global setup for auth | Project dependencies with setup | Playwright v1.30 (2022) | More explicit dependencies, better parallelization, setup.ts pattern clearer than globalSetup |
| waitForNavigation | toHaveURL assertion | Playwright v1.20 (2022) | Auto-retry built into assertion, less flaky, more readable |

**Deprecated/outdated:**
- **Selenium WebDriver for Next.js testing**: Playwright is the recommended tool per Next.js official docs (2024+)
- **Manual cookie management for auth**: @clerk/testing helpers replace manual cookie/localStorage manipulation (2023+)
- **waitForNavigation() pattern**: Replaced by expect(page).toHaveURL() with auto-retry (Playwright v1.20+)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 |
| Config file | playwright.config.ts (none — Wave 0 creates it) |
| Quick run command | `npx playwright test --project=chromium` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROT-01 | Unauthenticated users redirected to sign-in | E2E | `npx playwright test e2e/route-protection.spec.ts -g "redirects to sign-in" -x` | ❌ Wave 0 |
| PROT-02 | All dashboard pages require authentication | E2E | `npx playwright test e2e/route-protection.spec.ts -g "protected routes" -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Not applicable (E2E tests created at end of phase)
- **Per wave merge:** `npx playwright test --project=chromium` (run success criteria routes only)
- **Phase gate:** Full suite green (`npx playwright test`) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `playwright.config.ts` — configure baseURL, testDir, webServer
- [ ] `e2e/route-protection.spec.ts` — tests for PROT-01, PROT-02
- [ ] `.gitignore` updates — add test-results/, playwright-report/, playwright/.auth/
- [ ] `package.json` scripts — test:e2e, test:e2e:ui, test:e2e:debug
- [ ] Framework install: `npm install -D @playwright/test playwright @clerk/testing && npx playwright install chromium`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No | Tests verify redirect only, not auth implementation (Phase 20 covered auth) |
| V3 Session Management | No | Tests verify middleware protects routes, not session implementation |
| V4 Access Control | Yes | Route protection is access control — tests verify unauthenticated users cannot access protected routes |
| V5 Input Validation | No | No user input in redirect tests |
| V6 Cryptography | No | No cryptographic operations in redirect tests |

### Known Threat Patterns for Route Protection Testing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated access to protected resources | Information Disclosure | Clerk middleware auth.protect() redirects unauthenticated users (tested by PROT-01, PROT-02) |
| Missing returnBackUrl parameter | Denial of Service (usability) | Clerk middleware automatically sets returnBackUrl (tested by return URL verification) |
| Open redirect via returnBackUrl manipulation | Tampering | Clerk validates returnBackUrl is same-origin (not tested in Phase 21 — assume Clerk handles) |
| Test env vars leaked to production | Information Disclosure | Use pk_test_/sk_test_ keys in tests, pk_live_/sk_live_ in production (documented in .env.example) |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Playwright execution | ✓ | 24.1.0 | — |
| npm | Package installation | ✓ | 11.5.2 | — |
| Playwright CLI | Browser installation | ✗ | — | `npx playwright install` |
| Chromium browser | E2E test execution | ✗ | — | `npx playwright install chromium` |
| Next.js dev server | Test target | ✓ | 16.1.6 (existing) | — |
| Clerk env vars | Middleware functionality | ✓ | .env.local exists | Use test keys from .env.example |

**Missing dependencies with no fallback:**
None — all missing dependencies can be installed via npm/npx.

**Missing dependencies with fallback:**
- Playwright CLI: Install via `npm install -D @playwright/test playwright`
- Chromium browser: Install via `npx playwright install chromium` after @playwright/test installation

## Sources

### Primary (HIGH confidence)
- [Context7: /microsoft/playwright.dev] — Playwright official documentation including installation, test configuration, navigation assertions (toHaveURL), setup projects, authentication patterns, CI configuration
- [Context7: /clerk/clerk-docs] — Clerk testing package documentation, Playwright integration, global setup for auth, test helpers for sign-in/sign-out
- [npm: @playwright/test@1.59.1] — Latest version verified 2026-05-09
- [npm: @clerk/testing@2.0.27] — Latest version verified 2026-05-09
- [Next.js Official Docs: Playwright Testing Guide] — Next.js + Playwright integration patterns

### Secondary (MEDIUM confidence)
- [End-to-End Testing Auth Flows with Playwright and Next.js](https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js) — Real-world auth testing patterns, redirect verification
- [Next.js Playwright Testing: Full Guide | Autonoma AI](https://getautonoma.com/blog/nextjs-playwright-testing-guide) — Next.js 15 App Router testing best practices
- [Playwright E2E Testing for Next.js: Auth Setup, Stripe Checkout, and CI Integration](https://dev.to/whoffagents/playwright-e2e-testing-for-nextjs-auth-setup-stripe-checkout-and-ci-integration-4ndg) — CI/CD integration patterns
- [Testing Login Flows with Playwright: From Form Fill to Redirect](https://medium.com/@12charmi/testing-login-flows-with-playwright-from-form-fill-to-redirect-testingday2-dc7ebb826928) — Redirect testing patterns
- [How to Manage Authentication in Playwright - Checkly Docs](https://www.checklyhq.com/docs/learn/playwright/authentication/) — Auth state management best practices

### Tertiary (LOW confidence)
- Community patterns from GitHub issues, Stack Overflow discussions on Playwright + Next.js testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Official Playwright and Clerk documentation, npm versions verified
- Architecture: HIGH — Next.js official testing guide, Clerk official Playwright integration docs
- Pitfalls: MEDIUM — Common patterns from community sources, verified against official docs

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (30 days — Playwright stable, minor version updates expected)

---
*Research complete. Ready for planning.*
