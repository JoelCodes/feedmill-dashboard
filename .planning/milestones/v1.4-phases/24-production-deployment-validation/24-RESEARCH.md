# Phase 24: Production Deployment Validation - Research

**Researched:** 2026-05-10
**Domain:** Production deployment validation, Vercel environment configuration, Clerk production keys
**Confidence:** HIGH

## Summary

Phase 24 validates that Clerk authentication works correctly in production with live keys and proper domain configuration. This is a configuration and validation phase, not an implementation phase — all authentication code is complete from Phases 20-23. The core challenge is configuring Vercel environment variables correctly across production/preview scopes, associating the Vercel subdomain with Clerk's production instance, and verifying authentication flows work with live keys before end users access the application.

The standard approach uses Vercel's per-environment variable scoping (Production uses `pk_live_`/`sk_live_`, Preview uses `pk_test_`/`sk_test_`), Clerk's domain verification via Dashboard configuration, and automated smoke tests via Playwright with GitHub Actions Deployment Checks. This prevents production deployments from being aliased to custom domains until authentication validation passes. The primary risk is misconfigured environment variables causing "Invalid publishable key" errors in production, which is mitigated by careful scoping and verification before aliasing to domains.

**Primary recommendation:** Configure Vercel environment variables via Dashboard with explicit Production/Preview scoping, add Vercel subdomain to Clerk allowed origins in production instance settings, create dedicated test user with `+clerk_test` email pattern for automated smoke tests, and implement GitHub Actions post-deployment validation with Deployment Checks to gate production promotion until authentication is verified working.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Environment variable management | Hosting Platform (Vercel) | — | Vercel stores encrypted env vars, manages per-environment scoping, injects at build/runtime |
| Domain verification | Identity Provider (Clerk) | — | Clerk verifies domain ownership for production instance, manages allowed origins for CORS |
| Production deployment gating | CI/CD (GitHub Actions) | Hosting Platform (Vercel Deployment Checks) | GitHub Actions runs validation tests, Vercel Deployment Checks prevent aliasing until checks pass |
| Authentication smoke testing | E2E Test Framework (Playwright) | — | Playwright executes headless browser tests against production URL with real auth flows |
| Audit logging & monitoring | Identity Provider (Clerk) | — | Clerk logs authentication events in Dashboard, provides filtering by event type and actor |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Deployment Target (D-01 through D-03):**
- Deploy to Vercel. Personal account with existing project. Native Next.js support, automatic env var management per environment.
- Project already deployed but no Clerk env vars configured yet. Need to add all Clerk variables for production and preview environments.
- Using default Vercel subdomain (*.vercel.app) for now. Custom domain deferred to future milestone.

**Environment Setup (D-04 through D-06):**
- Use same Clerk application with both key types. One Clerk app, dev keys (pk_test_/sk_test_) for preview, live keys (pk_live_/sk_live_) for production. Shared user pool.
- Vercel per-environment configuration: Production uses pk_live_/sk_live_, preview and development use pk_test_/sk_test_. Best practice separation.
- Live Clerk keys already generated. Ready to configure in Vercel.

**Domain Verification (D-07 through D-08):**
- Associate Vercel subdomain only with Clerk production instance. Custom domain can be added later when acquired.
- Self-hosted sign-in pages on Vercel domain. Requires adding Vercel domain to Clerk's allowed origins in production instance settings.

**Validation Scope (D-09 through D-11):**
- Both manual and automated validation. Manual smoke test first, then set up automated E2E for ongoing monitoring.
- Create dedicated test user for automated tests. Isolates test activity from real user data.
- Run automated prod tests in CI on deploy via GitHub Actions. Catches regressions automatically after each production deployment.

### Claude's Discretion

None — all areas received explicit user decisions.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vercel Platform | N/A | Hosting & deployment | Native Next.js integration, automatic environment variable management, Deployment Checks for production gating |
| Clerk Dashboard | N/A | Production instance config | Domain verification, live key management, allowed origins configuration, authentication event logs |
| @playwright/test | 1.59.1 | Production smoke testing | Official Microsoft E2E framework, existing project infrastructure, baseURL environment configuration |
| @clerk/testing | 2.0.27 | Test user management | Official Clerk testing helpers for creating authenticated sessions in E2E tests |

**Installation:**
```bash
# Already installed in project (verified via package.json)
npm list @playwright/test @clerk/testing
```

**Version verification:** Performed 2026-05-10
- @playwright/test: 1.59.1 (npm registry latest: 1.59.1) ✓ Current
- @clerk/testing: 2.0.27 (verified as installed)

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vercel/repository-dispatch/actions/status | v1 | GitHub Actions check status | Required when using repository_dispatch trigger to notify Vercel of Deployment Check results |
| GitHub Actions | N/A | CI/CD automation | Triggered on push to main branch, runs post-deployment smoke tests after Vercel deployment ready |
| dotenv | (if needed) | Environment variable loading | For loading production URL into Playwright config via .env file (optional, can use process.env directly) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GitHub Actions Deployment Checks | Manual promotion via Vercel Dashboard | Manual approach eliminates automation but requires human verification before each production release |
| Playwright smoke tests | Manual QA checklist | Reduces setup complexity but loses continuous validation and regression detection |
| Dedicated test user | Real user account for testing | Avoids test user management but pollutes production user data with test activity |
| Vercel subdomain | Custom domain immediately | Custom domain provides branding but requires DNS configuration and domain purchase (deferred per D-03) |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. Code Push (Developer)
   │
   ├─→ [GitHub Repository (main branch)]
   │
   ├─→ [Vercel Build System]
   │   ├─ Injects Production env vars (pk_live_, sk_live_)
   │   ├─ Builds Next.js app
   │   └─ Creates production deployment
   │
   ├─→ [Deployment Created - NOT yet aliased to domains]
   │   │
   │   ├─→ [GitHub Actions: repository_dispatch event]
   │   │   ├─ Runs Playwright smoke tests against deployment URL
   │   │   ├─ Tests: Sign-in flow, protected route access, session persistence
   │   │   └─ Reports status to Vercel Deployment Checks
   │   │
   │   └─→ [Vercel Deployment Checks: Wait for GitHub Actions]
   │
   ├─→ [All Checks Pass ✓]
   │   ├─ GitHub Actions smoke tests: ✓
   │   ├─ Clerk authentication verified: ✓
   │   └─ Deployment promoted automatically
   │
   └─→ [Production Domain Aliased]
       └─ https://cgm-dashboard.vercel.app (live to users)

┌─────────────────────────────────────────────────────────────────┐
│                  Authentication Data Flow                        │
└─────────────────────────────────────────────────────────────────┘

User Request → Vercel Edge
   │
   ├─→ [Next.js Middleware (src/middleware.ts)]
   │   ├─ Reads CLERK_SECRET_KEY from env (pk_live_*)
   │   ├─ Verifies session token with Clerk API
   │   └─ Redirects to /sign-in if unauthenticated
   │
   ├─→ [Sign-in Page (src/app/sign-in/[[...sign-in]]/page.tsx)]
   │   ├─ Clerk SignIn component uses NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   │   ├─ Validates domain against allowed origins (Clerk Dashboard)
   │   └─ Creates session on successful authentication
   │
   └─→ [Protected Pages (/, /orders, /customers, etc.)]
       └─ Render with authenticated user context
```

**Entry point:** GitHub push to main branch triggers Vercel deployment
**Gating mechanism:** Vercel Deployment Checks prevent domain aliasing until smoke tests pass
**Validation flow:** Playwright tests authenticate as test user, verify protected routes accessible
**Audit trail:** Clerk Dashboard logs all authentication events with timestamp, user ID, event type

### Component Responsibilities

**Configuration Components (Vercel Dashboard):**
- Environment Variables page: Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_*` for Production scope only
- Environment Variables page: Set `CLERK_SECRET_KEY=sk_live_*` for Production scope only
- Environment Variables page: Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_*` for Preview scope only
- Environment Variables page: Set `CLERK_SECRET_KEY=sk_test_*` for Preview scope only
- Deployment Checks settings: Link GitHub Actions workflow as required check before production promotion

**Configuration Components (Clerk Dashboard):**
- Production Instance → Domains page: Add Vercel subdomain (e.g., `cgm-dashboard.vercel.app`) to allowed domains
- Production Instance → API Keys page: Copy `pk_live_*` and `sk_live_*` keys to Vercel environment variables
- Production Instance → Logs page: Monitor authentication events after deployment (filter by `sign_in.*`, `session.*`)

**Testing Components (GitHub Actions):**
- `.github/workflows/production-smoke-tests.yml`: Workflow triggered by Vercel `repository_dispatch` event
- Workflow step: Checkout code, setup Node.js, install dependencies
- Workflow step: Run Playwright tests with `PLAYWRIGHT_BASE_URL` set to deployment URL (from event payload)
- Workflow step: Report status to Vercel using `vercel/repository-dispatch/actions/status@v1`

**Testing Components (Playwright):**
- `e2e/production-smoke.spec.ts`: Smoke tests for sign-in flow, protected route access, session persistence
- `playwright.config.ts`: Production project with `baseURL: process.env.PLAYWRIGHT_BASE_URL` and retries: 0
- Test user credentials: Store in GitHub Secrets as `CLERK_TEST_USER_EMAIL` and `CLERK_TEST_USER_PASSWORD`

### Pattern 1: Per-Environment Variable Scoping

**What:** Vercel allows assigning different values to the same environment variable name based on deployment environment (Production, Preview, Development).

**When to use:** When the same codebase needs different API keys, secrets, or configuration values depending on whether it's running in production vs. preview vs. local development.

**Example:**
```typescript
// In Vercel Dashboard → Project Settings → Environment Variables:
//
// Variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
// - Production: pk_live_xxxxxxxxxxx (checked ✓)
// - Preview: pk_test_yyyyyyyyyyy (checked ✓)
// - Development: (unchecked) — uses .env.local instead
//
// Variable: CLERK_SECRET_KEY
// - Production: sk_live_xxxxxxxxxxx (checked ✓)
// - Preview: sk_test_yyyyyyyyyyy (checked ✓)
// - Development: (unchecked) — uses .env.local instead

// Code reads environment variable the same way regardless of environment:
// middleware.ts automatically uses correct key based on where it's deployed
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
```
**Source:** [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)

### Pattern 2: Deployment Checks with GitHub Actions

**What:** Vercel Deployment Checks gate production domain aliasing until required GitHub Actions workflows pass. Production deployments are created but not made live to users until validation completes.

**When to use:** When you need to run automated tests against a production deployment before exposing it to end users. Prevents broken deployments from being aliased to production domains.

**Example:**
```yaml
# .github/workflows/production-smoke-tests.yml
name: Production Smoke Tests

on:
  repository_dispatch:
    types: [vercel.deployment.ready]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    # Only run for production deployments
    if: github.event.client_payload.deployment.environment == 'production'

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run smoke tests against deployment URL
        env:
          PLAYWRIGHT_BASE_URL: ${{ github.event.client_payload.deployment.url }}
          CLERK_TEST_USER_EMAIL: ${{ secrets.CLERK_TEST_USER_EMAIL }}
          CLERK_TEST_USER_PASSWORD: ${{ secrets.CLERK_TEST_USER_PASSWORD }}
        run: npx playwright test --project=production-smoke

      - name: Notify Vercel of check status
        uses: vercel/repository-dispatch/actions/status@v1
        with:
          name: "Production Smoke Tests"
```
**Source:** [Vercel Deployment Checks Documentation](https://vercel.com/docs/deployment-checks)

### Pattern 3: Playwright Production Project Configuration

**What:** Separate Playwright project configuration for production smoke tests with strict requirements (no retries, production baseURL from environment variable).

**When to use:** When running E2E tests against production deployments where failures should immediately fail the deployment (no retry logic that might mask intermittent issues).

**Example:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  projects: [
    // Existing development tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
      retries: process.env.CI ? 2 : 0,
    },

    // Production smoke tests (new)
    {
      name: 'production-smoke',
      testMatch: '**/production-smoke.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_BASE_URL, // Set by GitHub Actions
      },
      retries: 0, // No retries in production — failures should block deployment
      timeout: 30000, // 30s max per test
    },
  ],
});
```
**Source:** [Playwright Projects Documentation](https://playwright.dev/docs/test-projects)

### Pattern 4: Clerk Test User with +clerk_test Email Pattern

**What:** Clerk recognizes email addresses containing `+clerk_test` as test accounts and suppresses all email delivery (verification codes, sign-in notifications).

**When to use:** For automated testing in production environments where you need real authentication flows but don't want to trigger email spam or require manual email verification.

**Example:**
```typescript
// e2e/production-smoke.spec.ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test.describe('Production Authentication Smoke Tests', () => {
  test('user can sign in and access protected routes', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in');

    // Test user email with +clerk_test pattern suppresses email delivery
    await page.fill('input[name="identifier"]', process.env.CLERK_TEST_USER_EMAIL!);
    await page.fill('input[name="password"]', process.env.CLERK_TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard after successful sign-in
    await expect(page).toHaveURL('/');

    // Verify protected route is accessible
    await page.goto('/orders');
    await expect(page).toHaveURL('/orders');

    // Verify session persists after refresh
    await page.reload();
    await expect(page).toHaveURL('/orders'); // Still logged in
  });
});
```
**Source:** [Clerk Testing with Playwright Documentation](https://clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows)

### Anti-Patterns to Avoid

- **Using development keys in production**: Always verify `pk_live_*` and `sk_live_*` format for production environment variables. Using `pk_test_*` in production causes "Invalid publishable key" errors.
- **Not scoping environment variables to specific environments**: Setting variables for "All" environments causes preview deployments to use production keys, polluting production user data with test activity.
- **Manual promotion without automated validation**: Promoting deployments to production without smoke tests risks releasing broken authentication to end users.
- **Hardcoding production URLs in tests**: Use `process.env.PLAYWRIGHT_BASE_URL` instead of hardcoding URLs. Allows same tests to run against any deployment URL.
- **Skipping domain verification in Clerk Dashboard**: Clerk rejects authentication requests from domains not in allowed origins list. Must add Vercel subdomain before deployment goes live.
- **Using real user accounts for testing**: Test activity appears in production logs and analytics. Always create dedicated test users with `+clerk_test` email pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Environment variable encryption | Custom secret management system | Vercel environment variables | Vercel encrypts at rest, manages access control, integrates with deployment scoping. Building custom secrets management risks security vulnerabilities. |
| Deployment promotion gating | Custom deployment approval workflow | Vercel Deployment Checks | Native integration with GitHub Actions, automatic aliasing after checks pass, built-in rollback. Custom workflows are fragile and don't integrate with Vercel's deployment lifecycle. |
| Production smoke tests | Manual QA checklist before each deploy | Playwright automated tests via GitHub Actions | Manual testing is slow, error-prone, and doesn't scale. Automated tests run on every deployment and catch regressions immediately. |
| Session token management for tests | Scraping Clerk cookies or manual login per test | @clerk/testing with +clerk_test email pattern | Clerk testing helpers provide stable API for authenticated test sessions. Scraping cookies breaks when Clerk changes token format. |
| Authentication event monitoring | Custom logging infrastructure | Clerk Dashboard Logs page | Clerk logs all authentication events with filtering, search, and export. Building custom logging duplicates functionality and adds maintenance burden. |

**Key insight:** Production deployment validation is primarily configuration orchestration, not feature development. The value is in correctly wiring existing tools (Vercel, Clerk, GitHub Actions, Playwright) rather than building custom solutions. Every custom solution adds maintenance burden and potential security vulnerabilities.

## Common Pitfalls

### Pitfall 1: Environment Variable Scope Misconfiguration

**What goes wrong:** Setting Clerk environment variables to "All" environments causes preview deployments to use production keys (`pk_live_*`), polluting production user database with test signups and development activity.

**Why it happens:** Vercel defaults to "All" environments when adding variables via Dashboard. Developers don't explicitly uncheck scopes, assuming "Production" means "production only."

**How to avoid:**
- When adding environment variables in Vercel Dashboard, explicitly select **only** the intended environment scope
- Production keys: Check **only** "Production" ✓ (uncheck Preview and Development)
- Preview/dev keys: Check **only** "Preview" ✓ (uncheck Production and Development)
- Verify scoping in Dashboard after saving — review "Applied To" column shows correct environments
- Redeploy after adding variables — env var changes only apply to new deployments

**Warning signs:**
- Preview deployments show production user data in Clerk Dashboard
- Clerk Dashboard Logs show authentication events from Vercel preview URLs (e.g., `cgm-dashboard-git-feature-xyz.vercel.app`)
- Preview deployment signups appear in production user list

**Source:** [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables) — "For each Environment Variable, you can select one or more Environments to apply the Variable to"

### Pitfall 2: Missing Domain in Clerk Allowed Origins

**What goes wrong:** Production deployment fails with CORS errors or "Invalid domain" errors when users attempt to sign in. Clerk rejects authentication requests from domains not explicitly added to allowed origins in production instance settings.

**Why it happens:** Developers configure environment variables but forget to add the Vercel subdomain (e.g., `cgm-dashboard.vercel.app`) to Clerk's production instance allowed origins. Clerk uses strict origin checking for security — unapproved domains are blocked.

**How to avoid:**
1. Navigate to Clerk Dashboard → Production Instance → Domains
2. Click "Add Domain" and enter full Vercel subdomain (e.g., `cgm-dashboard.vercel.app`)
3. Clerk performs DNS verification — may show "Pending verification" initially
4. For Vercel subdomains (*.vercel.app), verification typically succeeds immediately (no DNS changes needed)
5. Verify domain shows "Active" status before deploying to production
6. Note: Self-hosted sign-in pages require domain in allowed origins; Clerk hosted pages do not

**Warning signs:**
- Console errors: "Clerk: Invalid publishable key"
- Console errors: "Clerk: Domain not allowed"
- CORS errors when loading Clerk components
- Sign-in page loads but authentication requests fail with 403 errors

**Source:** [Clerk Production Deployment Guide](https://clerk.com/docs/guides/development/deployment/production) — "Configure DNS records via the Domains page in Clerk Dashboard"

### Pitfall 3: Deployment Checks Not Linked to GitHub Actions

**What goes wrong:** Production deployments are immediately aliased to custom domains without waiting for smoke tests to complete. Broken authentication reaches end users before validation catches the issue.

**Why it happens:** Developers set up GitHub Actions workflow but don't configure Vercel Deployment Checks to require the workflow. Vercel has no way to know it should wait for GitHub Actions.

**How to avoid:**
1. Create GitHub Actions workflow with `repository_dispatch` trigger (event type: `vercel.deployment.ready`)
2. In Vercel Dashboard → Project Settings → Deployment Checks, click "Add Checks"
3. Select "GitHub" as provider
4. Search for and select the GitHub Actions check name (must match workflow job name or `vercel/repository-dispatch/actions/status` name parameter)
5. Save settings — Vercel now waits for this check before aliasing production deployments
6. Verify by triggering deployment and checking Deployment Checks section shows "Waiting for checks..."

**Warning signs:**
- Production deployments alias to domains immediately after build completes
- GitHub Actions workflow runs but doesn't block deployment promotion
- Vercel Deployment Checks section empty or not showing GitHub Actions check
- No "Waiting for checks" status on production deployments

**Source:** [Vercel Deployment Checks Documentation](https://vercel.com/docs/deployment-checks) — "Visit your project's Deployment Checks settings and select Add Checks, then choose GitHub as the provider"

### Pitfall 4: Test User Credentials Not Stored in GitHub Secrets

**What goes wrong:** GitHub Actions workflow fails because `CLERK_TEST_USER_EMAIL` and `CLERK_TEST_USER_PASSWORD` environment variables are undefined. Tests cannot authenticate, smoke tests fail, deployment is blocked.

**Why it happens:** Developers hardcode test credentials in workflow file (security risk) or forget to add them to GitHub Secrets before running workflow.

**How to avoid:**
1. Create dedicated test user in Clerk production instance with `+clerk_test` email pattern (e.g., `e2e+clerk_test@cgm-dashboard.app`)
2. In GitHub repository → Settings → Secrets and variables → Actions → Repository secrets
3. Click "New repository secret"
4. Add `CLERK_TEST_USER_EMAIL` with test user email
5. Add `CLERK_TEST_USER_PASSWORD` with test user password
6. Reference in workflow: `${{ secrets.CLERK_TEST_USER_EMAIL }}`
7. Never commit credentials to version control

**Warning signs:**
- GitHub Actions logs show: "CLERK_TEST_USER_EMAIL is not set"
- Playwright tests fail with "Cannot read property 'CLERK_TEST_USER_EMAIL' of undefined"
- Tests attempt to fill sign-in form with empty strings
- Authentication fails with "Invalid credentials" despite correct test user setup in Clerk

**Source:** [GitHub Actions: Authentication in Playwright](https://playwright.dev/docs/auth) — "Tests requiring authentication tokens or credentials should never be hardcoded - instead, use GitHub Secrets"

### Pitfall 5: Production Smoke Tests Use Development Config

**What goes wrong:** Smoke tests run against `localhost:3000` instead of production deployment URL. Tests pass (local dev server works) but production deployment is broken. Deployment is promoted despite authentication not working in production.

**Why it happens:** Playwright config defaults to `baseURL: 'http://localhost:3000'` for development. Developers create production smoke test project but forget to override baseURL with `process.env.PLAYWRIGHT_BASE_URL` from GitHub Actions event payload.

**How to avoid:**
- Create separate Playwright project for production smoke tests with `testMatch: '**/production-smoke.spec.ts'`
- Set `baseURL: process.env.PLAYWRIGHT_BASE_URL` for production smoke project
- In GitHub Actions workflow, extract deployment URL from `repository_dispatch` event payload
- Pass as environment variable: `PLAYWRIGHT_BASE_URL: ${{ github.event.client_payload.deployment.url }}`
- Verify in workflow logs that Playwright baseURL shows production URL (e.g., `https://cgm-dashboard-abc123.vercel.app`)

**Warning signs:**
- GitHub Actions logs show Playwright connecting to `http://localhost:3000`
- Workflow fails with "Error: connect ECONNREFUSED 127.0.0.1:3000"
- Tests pass in CI but production deployment has broken authentication
- Clerk Dashboard logs show no authentication events from production URLs

**Source:** [Playwright Environment Configuration Guide](https://playwright.dev/docs/test-configuration) — "Playwright can read environment variables in the configuration file and set the baseURL based on them"

## Code Examples

Verified patterns from official sources:

### Vercel Environment Variable Configuration (via Dashboard)

**Source:** [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)

Configuration workflow (manual, via Vercel Dashboard UI):

1. Navigate to: Project Settings → Environment Variables
2. Add production publishable key:
   - Key: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Value: `pk_live_xxxxxxxxxxx` (from Clerk Dashboard)
   - Environments: ✓ Production only (uncheck Preview, Development)
3. Add production secret key:
   - Key: `CLERK_SECRET_KEY`
   - Value: `sk_live_xxxxxxxxxxx` (from Clerk Dashboard)
   - Environments: ✓ Production only
4. Add preview publishable key:
   - Key: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Value: `pk_test_yyyyyyyyyyy` (from Clerk Dashboard)
   - Environments: ✓ Preview only
5. Add preview secret key:
   - Key: `CLERK_SECRET_KEY`
   - Value: `sk_test_yyyyyyyyyyy` (from Clerk Dashboard)
   - Environments: ✓ Preview only
6. Add custom page URL variables (both Production and Preview):
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - Environments: ✓ Production, ✓ Preview
7. Redeploy for changes to take effect

### GitHub Actions Workflow with Deployment Checks

**Source:** [Vercel Deployment Checks Documentation](https://vercel.com/docs/deployment-checks)

```yaml
# .github/workflows/production-smoke-tests.yml
name: Production Smoke Tests

on:
  repository_dispatch:
    types: [vercel.deployment.ready]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest

    # Only run for production deployments, not preview
    if: github.event.client_payload.deployment.environment == 'production'

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

      - name: Run smoke tests
        env:
          # Extract deployment URL from Vercel webhook payload
          PLAYWRIGHT_BASE_URL: ${{ github.event.client_payload.deployment.url }}
          # Test user credentials from GitHub Secrets
          CLERK_TEST_USER_EMAIL: ${{ secrets.CLERK_TEST_USER_EMAIL }}
          CLERK_TEST_USER_PASSWORD: ${{ secrets.CLERK_TEST_USER_PASSWORD }}
        run: npx playwright test --project=production-smoke

      - name: Notify Vercel of check status
        if: always()
        uses: vercel/repository-dispatch/actions/status@v1
        with:
          name: "Production Smoke Tests"
          # Status automatically set based on previous step success/failure
```

### Production Smoke Tests with Playwright

**Source:** [Clerk Testing with Playwright](https://clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows)

```typescript
// e2e/production-smoke.spec.ts
import { test, expect } from '@playwright/test';

/**
 * Production Smoke Tests
 *
 * Validates authentication works in production with live Clerk keys.
 * Runs against actual Vercel deployment URL before aliasing to domain.
 *
 * Test user: Uses +clerk_test email pattern to suppress email delivery.
 * Scope: Critical auth flows only — full E2E suite runs separately.
 */

test.describe('Production Authentication Smoke Tests', () => {
  test('user can sign in and access protected routes', async ({ page }) => {
    // Test user credentials from environment (set by GitHub Actions)
    const email = process.env.CLERK_TEST_USER_EMAIL!;
    const password = process.env.CLERK_TEST_USER_PASSWORD!;

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
  });

  test('Clerk dashboard shows authentication events', async () => {
    // Manual verification step documented in VERIFICATION.md
    // Automated check not feasible without Clerk API integration
    test.skip(true, 'Manual verification: Check Clerk Dashboard → Logs for sign_in.created events from production domain');
  });

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
});
```

### Playwright Config for Production Project

**Source:** [Playwright Projects Documentation](https://playwright.dev/docs/test-projects)

```typescript
// playwright.config.ts (additions to existing config)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  projects: [
    // Existing development tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },

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
  ],

  // Only run local dev server for non-production tests
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000/sign-in',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual environment variable configuration per deployment | Vercel per-environment scoping with automatic injection | Vercel launched environment scoping 2021 | Eliminates manual key swapping between dev/prod, reduces risk of using wrong keys |
| Promote to production immediately after build | Deployment Checks gate promotion until validation passes | Vercel Deployment Checks GA 2024 | Prevents broken deployments from reaching users, separates build from release |
| Manual QA checklist before production deploy | Automated smoke tests via GitHub Actions | Industry shift to CI/CD automation 2018+ | Catches regressions immediately, scales with deployment frequency |
| Clerk hosted sign-in pages (clerk.com redirects) | Self-hosted sign-in pages on own domain | Clerk introduced custom pages v3.0 (2022) | Better UX (no redirect to external domain), full theming control, domain consistency |
| Separate dev and production Clerk applications | Single Clerk application with test/live key types | Clerk key type separation introduced 2021 | Shared user pool across environments, simpler configuration, one dashboard |

**Deprecated/outdated:**
- **Clerk v4 `authMiddleware()`**: Replaced by `clerkMiddleware()` in v5+ (async-first, Next.js 15 compatibility)
- **Manual .env file deployment**: Vercel environment variables eliminate need to manually copy .env files to server
- **GitHub Actions `deployment_status` webhook**: Vercel recommends `repository_dispatch` events with `vercel.deployment.ready` type for richer deployment context

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vercel Account | Production hosting | ✓ | N/A | — (per D-01: existing account confirmed) |
| Vercel Project | Deployment target | ✓ | N/A | — (per D-02: project already deployed) |
| Clerk Production Instance | Live key generation | ✓ | N/A | — (per D-06: live keys already generated) |
| GitHub Repository | CI/CD automation | ✓ | N/A | — (inferred from project context) |
| GitHub Actions | Smoke test execution | ✓ | N/A | Manual QA checklist (loses automation) |
| Playwright | E2E testing framework | ✓ | 1.59.1 | — (verified via package.json) |
| @clerk/testing | Test user management | ✓ | 2.0.27 | Manual test user creation (slower) |
| npm/Node.js | Package management | ✓ | 20+ | — (existing project infrastructure) |

**Missing dependencies with no fallback:**
- None — all required infrastructure is available

**Missing dependencies with fallback:**
- None — all optional tooling is installed

**Note:** No external tool installation required. Phase is purely configuration and workflow orchestration using existing project dependencies.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm run test:e2e -- --project=production-smoke` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements → Test Map

No formal requirements mapped to Phase 24 (validation phase per REQUIREMENTS.md line 87). However, success criteria define observable truths:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-01 | Production deployment uses live Clerk keys (pk_live_, sk_live_) | manual | N/A — verify in Vercel Dashboard env vars | N/A |
| SC-02 | Production domain associated with Clerk production instance | manual | N/A — verify in Clerk Dashboard domains | N/A |
| SC-03 | Test user can successfully sign in on production URL | e2e | `npx playwright test e2e/production-smoke.spec.ts::test_user_can_sign_in -x` | ❌ Wave 0 |
| SC-04 | Clerk dashboard shows authentication events from production domain | manual | N/A — verify in Clerk Dashboard logs | N/A |
| SC-05 | No "Invalid publishable key" errors in production logs | e2e | `npx playwright test e2e/production-smoke.spec.ts::no_invalid_key_errors -x` | ❌ Wave 0 |

**Note:** Phase 24 is configuration-heavy with manual verification steps (Vercel/Clerk Dashboard checks). Automated tests validate auth flows work but cannot verify Dashboard configuration directly without API integration.

### Sampling Rate

- **Per task commit:** N/A (no code changes, only configuration)
- **Per wave merge:** `npm run test:e2e -- --project=production-smoke` (after GitHub Actions workflow created)
- **Phase gate:** Manual verification of Vercel/Clerk Dashboard configuration + automated smoke tests green

### Wave 0 Gaps

- [ ] `.github/workflows/production-smoke-tests.yml` — GitHub Actions workflow with repository_dispatch trigger
- [ ] `e2e/production-smoke.spec.ts` — Playwright smoke tests for production authentication flows
- [ ] Playwright config: Add `production-smoke` project with `baseURL: process.env.PLAYWRIGHT_BASE_URL`
- [ ] GitHub Secrets: `CLERK_TEST_USER_EMAIL` and `CLERK_TEST_USER_PASSWORD` (manual setup via GitHub UI)
- [ ] Vercel Deployment Checks: Link GitHub Actions workflow (manual setup via Vercel Dashboard)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Clerk production keys with domain verification — validates production auth flows work with live keys |
| V3 Session Management | yes | Smoke tests verify session persistence across page refresh — catches token expiration issues |
| V4 Access Control | yes | Smoke tests verify protected routes remain protected in production — middleware with live keys enforces auth |
| V5 Input Validation | no | Phase is configuration/validation only, no new input handling |
| V6 Cryptography | yes | Clerk live keys use production-grade encryption — separate from development keys for security isolation |

### Known Threat Patterns for Production Deployment

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Environment variable exposure via logs | Information Disclosure | Vercel automatically redacts sensitive env vars in build logs; never log CLERK_SECRET_KEY |
| Using development keys in production | Elevation of Privilege | Vercel per-environment scoping ensures pk_test_/sk_test_ only in Preview, pk_live_/sk_live_ only in Production |
| Unauthorized domain access to Clerk API | Spoofing | Clerk allowed origins whitelist blocks requests from non-verified domains |
| Deploying broken auth to production | Denial of Service | Vercel Deployment Checks gate domain aliasing until smoke tests pass |
| Test credentials leaked in version control | Information Disclosure | GitHub Secrets for test user credentials, never commit to repo |
| Production deployment without audit trail | Repudiation | Clerk Dashboard Logs record all authentication events with timestamp, actor, event type |

## Sources

### Primary (HIGH confidence)

- [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables) — Per-environment scoping, size limits, configuration methods
- [Vercel Deployment Checks Documentation](https://vercel.com/docs/deployment-checks) — GitHub Actions integration, repository_dispatch events, promotion gating
- [Clerk Production Deployment Guide](https://clerk.com/docs/guides/development/deployment/production) — Live keys, domain verification, DNS records, production checklist
- [Clerk Testing with Playwright](https://clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows) — Test user patterns, +clerk_test email suppression, authenticated sessions
- [Playwright Environment Configuration](https://playwright.dev/docs/test-configuration) — baseURL configuration, environment variables, projects
- npm registry verification (2026-05-10):
  - `@playwright/test@1.59.1` (latest)
  - `@clerk/testing@2.0.27` (verified installed)

### Secondary (MEDIUM confidence)

- [Vercel for GitHub Documentation](https://vercel.com/docs/git/vercel-for-github) — repository_dispatch events, deployment status webhooks
- [Playwright Projects Documentation](https://playwright.dev/docs/test-projects) — Multiple project configuration, test filtering
- [GitHub Actions repository_dispatch](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#repository_dispatch) — Event payload structure, client_payload access
- [Testing Staging and Production Environments in Playwright](https://dev.to/playwright/testing-staging-and-production-environments-in-playwright-3p8b) — DEV Community article on environment-specific Playwright configuration
- [Clerk Production Checklist Skill](https://playbooks.com/skills/jeremylongshore/claude-code-plugins-plus-skills/clerk-prod-checklist) — Community checklist for Clerk production deployment
- [Vercel Default Production Domain](https://vercel.com/blog/default-production-domain) — Blog post on Vercel subdomain behavior

### Tertiary (LOW confidence)

- WebSearch results on Vercel subdomain staging environments — community discussions on custom environments vs. branch-specific URLs
- Medium articles on Playwright environment variable management — general patterns, not Vercel-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Vercel and Clerk documentation, verified package versions
- Architecture: HIGH - Official integration guides, repository_dispatch event specification
- Pitfalls: MEDIUM-HIGH - Mix of official documentation (env var scoping, domain verification) and inferred common mistakes (not explicitly documented as "pitfalls")

**Research date:** 2026-05-10
**Valid until:** ~30 days (Vercel Deployment Checks feature is stable GA, Clerk production patterns mature)
