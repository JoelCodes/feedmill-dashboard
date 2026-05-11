# Phase 24: Production Deployment Validation - Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 3 files (2 new, 1 modified)
**Analogs found:** 2 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.github/workflows/production-smoke-tests.yml` | CI/CD workflow | event-driven | N/A - no existing workflows | no-analog |
| `e2e/production-smoke.spec.ts` | E2E test | request-response | `e2e/route-protection.spec.ts` | exact |
| `playwright.config.ts` | config | N/A | `playwright.config.ts` (self-modification) | exact |

## Pattern Assignments

### `.github/workflows/production-smoke-tests.yml` (CI/CD workflow, event-driven)

**Analog:** No existing GitHub Actions workflows in project

**Pattern source:** RESEARCH.md Pattern 2 (lines 207-253) provides canonical GitHub Actions workflow pattern for Vercel Deployment Checks

**Workflow trigger pattern** (RESEARCH.md lines 218-220):
```yaml
on:
  repository_dispatch:
    types: [vercel.deployment.ready]
```

**Environment scoping pattern** (RESEARCH.md lines 225-226):
```yaml
# Only run for production deployments, not preview
if: github.event.client_payload.deployment.environment == 'production'
```

**Test execution pattern** (RESEARCH.md lines 532-539):
```yaml
- name: Run smoke tests
  env:
    # Extract deployment URL from Vercel webhook payload
    PLAYWRIGHT_BASE_URL: ${{ github.event.client_payload.deployment.url }}
    # Test user credentials from GitHub Secrets
    CLERK_TEST_USER_EMAIL: ${{ secrets.CLERK_TEST_USER_EMAIL }}
    CLERK_TEST_USER_PASSWORD: ${{ secrets.CLERK_TEST_USER_PASSWORD }}
  run: npx playwright test --project=production-smoke
```

**Vercel notification pattern** (RESEARCH.md lines 541-546):
```yaml
- name: Notify Vercel of check status
  if: always()
  uses: vercel/repository-dispatch/actions/status@v1
  with:
    name: "Production Smoke Tests"
    # Status automatically set based on previous step success/failure
```

**Standard workflow steps** (RESEARCH.md lines 517-530):
```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'

  - name: Install dependencies
    run: npm ci

  - name: Install Playwright browsers
    run: npx playwright install --with-deps chromium
```

---

### `e2e/production-smoke.spec.ts` (E2E test, request-response)

**Analog:** `e2e/route-protection.spec.ts`

**Imports pattern** (lines 1-1):
```typescript
import { test, expect } from '@playwright/test';
```

**Test structure pattern** (lines 20-31):
```typescript
test.describe('Route Protection', () => {
  test.describe('PROT-01: Unauthenticated redirect to sign-in', () => {
    for (const route of protectedRoutes) {
      test(`unauthenticated user accessing ${route} redirects to sign-in`, async ({ page }) => {
        // Navigate to protected route without authentication
        await page.goto(route);

        // Verify redirect to sign-in page (regex handles query params)
        await expect(page).toHaveURL(/\/sign-in/);
      });
    }
  });
});
```

**Documentation header pattern** (lines 3-11):
```typescript
/**
 * Route Protection E2E Tests
 *
 * Verifies PROT-01: Unauthenticated users are redirected to sign-in page
 * Verifies PROT-02: All dashboard pages require authentication
 *
 * Test scope (per D-04, D-05): Unauthenticated redirect behavior only,
 * success criteria routes only (/orders, /customers, /mill-production, /settings)
 */
```

**Environment variable access pattern** (inferred from RESEARCH.md lines 570-571):
```typescript
// Test user credentials from environment (set by GitHub Actions)
const email = process.env.CLERK_TEST_USER_EMAIL!;
const password = process.env.CLERK_TEST_USER_PASSWORD!;
```

**Navigation and assertion pattern** (lines 24-28):
```typescript
// Navigate to protected route without authentication
await page.goto(route);

// Verify redirect to sign-in page (regex handles query params)
await expect(page).toHaveURL(/\/sign-in/);
```

**Core authentication flow pattern** (RESEARCH.md lines 573-592):
```typescript
// Navigate to sign-in page
await page.goto('/sign-in');

// Fill and submit sign-in form
await page.fill('input[name="identifier"]', email);
await page.click('button:has-text("Continue")');
await page.fill('input[name="password"]', password);
await page.click('button:has-text("Continue")');

// Verify redirect to dashboard after successful sign-in
await expect(page).toHaveURL('/');

// Verify protected route is accessible (not redirected to sign-in)
await page.goto('/orders');
await expect(page).toHaveURL('/orders');

// Verify session persists after browser refresh
await page.reload();
await expect(page).toHaveURL('/orders'); // Still authenticated
```

**Console error monitoring pattern** (RESEARCH.md lines 600-614):
```typescript
test('no invalid publishable key errors in logs', async ({ page }) => {
  // Monitor console for Clerk errors during authentication
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Clerk')) {
      errors.push(msg.text());
    }
  });

  await page.goto('/sign-in');

  // Verify no Clerk-related console errors
  expect(errors).toEqual([]);
});
```

---

### `playwright.config.ts` (config, N/A)

**Analog:** `playwright.config.ts` (self-modification)

**Existing structure** (lines 1-26):
```typescript
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
    url: 'http://localhost:3000/sign-in',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for dev server startup
  },
});
```

**Production smoke project pattern** (RESEARCH.md lines 643-654):
```typescript
// NEW: Production smoke tests (separate project)
{
  name: 'production-smoke',
  testMatch: '**/production-smoke.spec.ts',
  use: {
    ...devices['Desktop Chrome'],
    // baseURL from environment — set by GitHub Actions
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  },
  retries: 0, // No retries in production validation
  timeout: 30000, // 30s max per test
},
```

**Conditional webServer pattern** (RESEARCH.md lines 658-663):
```typescript
// Only run local dev server for non-production tests
webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
  command: 'npm run dev',
  url: 'http://localhost:3000/sign-in',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
},
```

**Integration approach:** Add new production-smoke project to existing projects array, modify webServer to be conditional on PLAYWRIGHT_BASE_URL environment variable.

---

## Shared Patterns

### Environment Variable Conventions

**Source:** `.env.local` and `.env.example`
**Apply to:** All configuration and test files

**Clerk environment variables pattern** (.env.local lines 1-12):
```bash
# Clerk Authentication Keys
# Get these from https://dashboard.clerk.com
# Development keys start with pk_test_ and sk_test_
# Production keys start with pk_live_ and sk_live_

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cHJvdWQtcmFtLTU0LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_MG74S6uQaDHbcWHHwsdRBGzNzsIjnNVkho95QSaxyL

# Clerk custom page URLs (required for custom sign-in/sign-up pages)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**Key naming convention:**
- Client-side keys use `NEXT_PUBLIC_` prefix (Next.js convention)
- Server-side keys have no prefix
- Test environment uses `pk_test_` and `sk_test_` prefixes
- Production environment uses `pk_live_` and `sk_live_` prefixes

### Documentation Comment Style

**Source:** `e2e/route-protection.spec.ts` and `src/__tests__/design-system/tokens.test.ts`
**Apply to:** Test files

**Block comment pattern** (route-protection.spec.ts lines 3-11):
```typescript
/**
 * [Test Suite Name]
 *
 * Verifies [REQUIREMENT-ID]: [requirement description]
 * Verifies [REQUIREMENT-ID]: [requirement description]
 *
 * Test scope (per [DECISION-IDs]): [scope boundaries],
 * [additional scope constraints]
 */
```

**Inline comment pattern** (route-protection.spec.ts lines 24-28):
```typescript
// [Action description] - imperative voice
await page.goto(route);

// [Assertion description] - present tense, explains what we're verifying
await expect(page).toHaveURL(/\/sign-in/);
```

### Test Organization

**Source:** `e2e/route-protection.spec.ts`
**Apply to:** E2E test files

**Nested describe blocks pattern** (lines 20-32):
```typescript
test.describe('[Top-level category]', () => {
  test.describe('[Requirement ID]: [requirement name]', () => {
    test('[specific behavior being tested]', async ({ page }) => {
      // Test implementation
    });
  });
});
```

**Parameterized test pattern** (lines 22-30):
```typescript
const protectedRoutes = [
  '/orders',
  '/customers',
  '/mill-production',
  '/settings',
] as const;

for (const route of protectedRoutes) {
  test(`[behavior] ${route} [expected outcome]`, async ({ page }) => {
    // Test implementation using route variable
  });
}
```

### Middleware Authentication Pattern

**Source:** `src/middleware.ts`
**Apply to:** Understanding of current auth implementation for smoke tests

**Route protection pattern** (lines 1-17):
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
```

**Matcher configuration pattern** (lines 24-31):
```typescript
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

**Key insight:** Middleware uses protect-by-default approach. All routes are protected unless explicitly marked public with createRouteMatcher. Smoke tests must verify this behavior works in production with live keys.

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.github/workflows/production-smoke-tests.yml` | CI/CD workflow | event-driven | No GitHub Actions workflows exist yet in project. Use RESEARCH.md Pattern 2 (Deployment Checks with GitHub Actions). |

---

## Configuration Tasks (Manual)

The following tasks require manual configuration via web dashboards and cannot be automated in code:

### Vercel Dashboard Configuration

**Source:** RESEARCH.md lines 159-178, CONTEXT.md D-04 through D-06

**Environment Variables page** (per-environment scoping pattern):

Production scope (D-05, D-06):
```
Variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_live_xxxxxxxxxxx (from Clerk Dashboard)
Environments: ✓ Production (uncheck Preview, Development)

Variable: CLERK_SECRET_KEY
Value: sk_live_xxxxxxxxxxx (from Clerk Dashboard)
Environments: ✓ Production (uncheck Preview, Development)
```

Preview scope (D-05):
```
Variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_yyyyyyyyyyy (from .env.local)
Environments: ✓ Preview (uncheck Production, Development)

Variable: CLERK_SECRET_KEY
Value: sk_test_yyyyyyyyyyy (from .env.local)
Environments: ✓ Preview (uncheck Production, Development)
```

Both Production and Preview:
```
Variable: NEXT_PUBLIC_CLERK_SIGN_IN_URL
Value: /sign-in
Environments: ✓ Production, ✓ Preview

Variable: NEXT_PUBLIC_CLERK_SIGN_UP_URL
Value: /sign-up
Environments: ✓ Production, ✓ Preview
```

**Deployment Checks settings** (RESEARCH.md lines 405-410):
1. Navigate to Project Settings → Deployment Checks
2. Click "Add Checks"
3. Select "GitHub" as provider
4. Search for and select "Production Smoke Tests" (matches workflow job name)
5. Save settings

### Clerk Dashboard Configuration

**Source:** RESEARCH.md lines 166-169, CONTEXT.md D-07, D-08

**Production Instance → Domains page** (domain verification):
1. Navigate to Clerk Dashboard → Production Instance → Domains
2. Click "Add Domain"
3. Enter Vercel subdomain (e.g., `cgm-dashboard.vercel.app`)
4. Verify domain shows "Active" status (Vercel subdomains auto-verify)

**Production Instance → API Keys page** (key reference):
- Copy `pk_live_*` to Vercel NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (Production)
- Copy `sk_live_*` to Vercel CLERK_SECRET_KEY (Production)

### GitHub Secrets Configuration

**Source:** RESEARCH.md lines 427-433, CONTEXT.md D-10

**Repository → Settings → Secrets and variables → Actions → Repository secrets:**

1. Create test user in Clerk production instance with `+clerk_test` email pattern
   - Example: `e2e-test+clerk_test@cgm-dashboard.app`
2. Add secret: `CLERK_TEST_USER_EMAIL` with test user email
3. Add secret: `CLERK_TEST_USER_PASSWORD` with test user password

**Security note:** Never commit test credentials to version control. Always use GitHub Secrets for CI/CD workflows.

---

## Metadata

**Analog search scope:**
- Root directory for GitHub Actions workflows (`.github/workflows/*.yml`)
- E2E test directory (`e2e/*.spec.ts`)
- Configuration files (`playwright.config.ts`, `.env.*`)
- Middleware implementation (`src/middleware.ts`)
- Unit test examples (`src/__tests__/**/*.ts`)

**Files scanned:** 8 project files
- `e2e/route-protection.spec.ts` (primary E2E analog)
- `playwright.config.ts` (configuration analog)
- `.env.local` (environment variable pattern)
- `.env.example` (environment variable documentation)
- `src/middleware.ts` (current auth implementation)
- `src/__tests__/design-system/tokens.test.ts` (test structure reference)
- `package.json` (available scripts and dependencies)
- No GitHub Actions workflows found (bootstrapping CI/CD)

**Pattern extraction date:** 2026-05-10

**Key insights:**
1. Project has strong E2E test foundation with Playwright but no CI/CD workflows yet
2. Environment variable patterns well-established in .env files
3. Test file documentation style is consistent and references decision IDs
4. Clerk middleware uses protect-by-default pattern (all routes protected unless explicitly public)
5. No retries in existing E2E tests when running locally (CI gets 2 retries)
6. Production smoke tests should have 0 retries to immediately fail broken deployments
