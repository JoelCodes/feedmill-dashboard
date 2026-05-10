# Pitfalls Research

**Domain:** Adding Clerk Authentication to Next.js 15 App Router
**Researched:** 2026-05-09
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Missing clerkMiddleware() Configuration

**What goes wrong:**
The error "auth() was called but Clerk can't detect usage of clerkMiddleware()" appears, blocking authentication checks. This commonly occurs when requests hit routes not covered by the middleware matcher, especially on 404 pages or static asset routes.

**Why it happens:**
Developers either forget to create the middleware.ts file entirely, or configure the matcher to exclude routes where auth() is called. The middleware matcher defaults exclude static files, but if auth() is used in a layout or component that renders on 404 pages, the middleware never runs to establish auth context.

**How to avoid:**
1. Create `middleware.ts` at project root (not `proxy.ts` — naming matters for Next.js ≤15)
2. Use the recommended matcher configuration that excludes static files but includes all dynamic routes:
```tsx
export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
```
3. Wrap root layout with `<ClerkProvider>` before calling `auth()` anywhere
4. Enable debug mode during development: `clerkMiddleware((auth, req) => { /* ... */ }, { debug: true })`

**Warning signs:**
- Console error: "auth() was called but Clerk can't detect usage of clerkMiddleware()"
- Auth works on some pages but fails on others (inconsistent behavior)
- 404 pages or error boundaries throw Clerk-related errors
- Link prefetch requests to protected pages show 401 errors in console

**Phase to address:**
Phase 1 (Foundation Setup) — Middleware configuration must be correct from the start, as fixing it later requires testing every route.

---

### Pitfall 2: Default Public Routes (Not Protected)

**What goes wrong:**
After adding Clerk, all routes remain publicly accessible. Developers assume installing Clerk automatically protects routes, but `clerkMiddleware()` makes all routes public by default — protection is opt-in.

**Why it happens:**
The mental model changed from `authMiddleware()` (v4, protected by default) to `clerkMiddleware()` (v5+, public by default). Documentation emphasizes the new approach, but developers migrating or following older tutorials expect automatic protection.

**How to avoid:**
1. Explicitly protect routes using `createRouteMatcher` and `auth.protect()`:
```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})
```
2. Define protected routes, not public routes (inverted logic from v4)
3. Test unauthenticated access to every major route before deployment
4. Use route matchers for patterns: `['/dashboard(.*)', '/api/private(.*)']`

**Warning signs:**
- Can access /dashboard, /settings, or other sensitive pages without signing in
- No redirect to sign-in page when unauthenticated
- API routes return data without authentication
- Manual testing shows no auth enforcement

**Phase to address:**
Phase 2 (Route Protection) — After foundation is stable, systematically protect all routes with explicit verification.

---

### Pitfall 3: Async auth() Breaking Changes Not Applied

**What goes wrong:**
TypeScript errors or runtime failures when calling `auth()` without `await`. Code crashes or auth state is undefined. Existing code using synchronous `auth()` from @clerk/nextjs v5 breaks after upgrading to v6.

**Why it happens:**
To support Next.js 15's async dynamic APIs, Clerk made `auth()` asynchronous in v6. Developers upgrading from v5 or following v5 documentation use `const { userId } = auth()` instead of `const { userId } = await auth()`. The API changed from `auth().protect()` to `await auth.protect()`.

**How to avoid:**
1. Run Clerk's automated codemod: `@clerk/upgrade` CLI scans codebase and produces migration list
2. Update all `auth()` calls to `await auth()`
3. Mark functions using `auth()` as `async`
4. Change `auth().protect()` to `await auth.protect()`
5. Update Server Components and Route Handlers to be async
6. Test all auth-dependent code paths after migration

**Warning signs:**
- TypeScript error: "Property 'userId' does not exist on type 'Promise<...>'"
- Runtime error: "Cannot read property 'userId' of undefined"
- ESLint warnings about promises not being awaited
- Auth checks fail silently or return unexpected values
- Build fails with async/await-related errors

**Phase to address:**
Phase 1 (Foundation Setup) — Must be correct before building features, as retrofitting async throughout the codebase is disruptive.

---

### Pitfall 4: Environment Variables Missing or Misconfigured

**What goes wrong:**
Clerk loads silently on the client but refuses every request on the server. Authentication appears to work in browser DevTools but fails server-side. Production deployment breaks despite working locally.

**Why it happens:**
Missing `NEXT_PUBLIC_` prefix causes variables to be unavailable client-side. Using development keys (`pk_test_...`) in production. Forgetting to set production keys in Vercel/hosting platform. Copy-pasting `.env.local` entries without updating for staging/production environments.

**How to avoid:**
1. Use exact variable names:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (client-side, must have NEXT_PUBLIC_ prefix)
   - `CLERK_SECRET_KEY` (server-side only, no prefix)
2. Verify key format matches environment:
   - Development: `pk_test_...` / `sk_test_...`
   - Production: `pk_live_...` / `sk_live_...`
3. Configure Vercel environments properly:
   - Development/Preview: Use test keys
   - Production: Use live keys, requires custom domain (not *.vercel.app)
4. Add to .gitignore: `.env*.local`
5. Document required variables in README or .env.example
6. Use `CLERK_ENCRYPTION_KEY` if passing `secretKey` at runtime to `clerkMiddleware()`

**Warning signs:**
- Auth works in development but fails in production
- "Invalid publishable key" errors in console
- Clerk dashboard shows no authentication events from production
- Server-side auth checks always fail while client shows signed-in state
- Deployment logs mention missing environment variables
- Different behavior on Vercel Preview vs Production deployments

**Phase to address:**
Phase 1 (Foundation Setup) and Phase 4 (Production Deployment) — Initial setup must be correct, and production deployment requires separate verification with live keys.

---

### Pitfall 5: Dynamic Rendering Opt-Out Breaking Auth

**What goes wrong:**
`useAuth()` returns `null` or stale data in Client Components. Auth state doesn't update when users sign in/out. Components that work in development fail in production due to static rendering.

**Why it happens:**
Starting with @clerk/nextjs v6, `<ClerkProvider>` no longer opts the entire app into dynamic rendering. Next.js defaults to static rendering for Client Components. `useAuth()` requires dynamic rendering to access request-time auth data, but developers forget to opt in with the `dynamic` prop.

**How to avoid:**
1. Wrap Client Components using `useAuth()` with `<ClerkProvider dynamic>`:
```tsx
<ClerkProvider dynamic>
  <ComponentUsingAuth />
</ClerkProvider>
```
2. Use `auth()` in Server Components instead of `useAuth()` in Client Components when possible
3. Avoid wrapping entire app with `<ClerkProvider dynamic>` — only wrap routes/components that need it
4. For Partial Prerendering (PPR), wrap `<ClerkProvider dynamic>` in `<Suspense>`:
```tsx
<Suspense fallback={<Skeleton />}>
  <ClerkProvider dynamic>{children}</ClerkProvider>
</Suspense>
```
5. Server Components using `auth()` automatically opt into dynamic rendering (no action needed)

**Warning signs:**
- `useAuth()` returns `{ userId: null, isSignedIn: false }` despite being signed in
- Auth state only updates after full page refresh
- Sign-in/sign-out doesn't reflect immediately in UI
- Production build shows different behavior than dev server
- Components flash between signed-in and signed-out states
- Next.js build output shows routes as Static when they should be Dynamic

**Phase to address:**
Phase 3 (Client-Side Auth State) — After server-side protection is working, client components need proper dynamic rendering configuration.

---

### Pitfall 6: CVE-2025-29927 Middleware Bypass Vulnerability

**What goes wrong:**
Attackers bypass all authentication and authorization middleware by adding `x-middleware-subrequest` header to HTTP requests. Protected routes become publicly accessible. Role-based access control (RBAC) is circumvented.

**Why it happens:**
Next.js versions <15.2.3 (and older 12.x, 13.x, 14.x) have a critical security flaw where the `x-middleware-subrequest` header (intended for internal use) is not properly validated. Attackers discovered they can add this header to external requests, making Next.js skip middleware execution entirely.

**How to avoid:**
1. Upgrade Next.js to ≥15.2.3 (or ≥14.2.25 for 14.x, ≥13.5.9 for 13.x)
2. Upgrade @clerk/nextjs to latest version
3. If immediate upgrade impossible, block `x-middleware-subrequest` header at reverse proxy/CDN level
4. Verify fix: Test protected routes with curl:
```bash
curl -H "x-middleware-subrequest: test" https://yourapp.com/protected
# Should return 401/redirect, not 200 OK
```
5. Review audit logs for suspicious access patterns during vulnerability window
6. **Do not rely solely on middleware for security** — implement defense in depth

**Warning signs:**
- Next.js version <15.2.3 in package.json
- Security scanning tools flagging CVE-2025-29927
- Unusual access patterns in logs (protected routes accessed without auth tokens)
- Failed authentication attempts that still reach protected resources
- Dependency audit warnings: `npm audit` or `yarn audit`

**Phase to address:**
Phase 1 (Foundation Setup) — Must use safe Next.js version from day one. Cannot ship to production with vulnerable version.

---

### Pitfall 7: Deprecated afterSignIn/afterSignUp Props

**What goes wrong:**
Sign-in/sign-up redirects don't work as expected. Users land on wrong pages after authentication. Redirects fail silently, leaving users confused about where to go next.

**Why it happens:**
`afterSignIn`, `afterSignUp`, and `redirectUrl` props are deprecated in favor of `fallbackRedirectUrl` and `signInFallbackRedirectUrl`/`signUpFallbackRedirectUrl`. Developers using older documentation or migrating from v4 continue using deprecated props. The new props have different logic: fallback props only apply if no `redirect_url` query parameter exists.

**How to avoid:**
1. Replace deprecated props with new equivalents:
   - `afterSignIn` → `fallbackRedirectUrl`
   - `afterSignUp` → `fallbackRedirectUrl`
   - For cross-component links: `signInFallbackRedirectUrl`, `signUpFallbackRedirectUrl`
2. Use environment variables for global defaults:
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding`
3. Understand fallback vs force behavior:
   - Fallback: Only used if no `redirect_url` in URL
   - Force: Always redirects, overrides `redirect_url`
4. Pass `signInForceRedirectUrl` or `signUpForceRedirectUrl` if you need to always redirect regardless of `redirect_url`
5. Test sign-in flow from multiple entry points (direct navigation, protected route redirect, email link)

**Warning signs:**
- Users redirected to unexpected pages after sign-in
- Redirect works in some flows but not others
- TypeScript deprecation warnings for `afterSignIn`/`afterSignUp`
- Documentation examples don't match your code
- Redirect behavior differs between development and production

**Phase to address:**
Phase 3 (Sign-In/Sign-Up Flow) — Set up correct redirect configuration when implementing auth components.

---

### Pitfall 8: Testing Without Clerk Mocks

**What goes wrong:**
Tests fail with "Cannot read property 'userId' of undefined". Tests make real requests to Clerk API, causing rate limiting. Tests require network access and Clerk account setup, breaking in CI/CD. Test suite is slow and flaky.

**Why it happens:**
Developers don't mock Clerk hooks and components in Jest/Vitest tests. Tests import real `@clerk/nextjs` which attempts API calls. No `@clerk/testing` package installed for proper test utilities. Unit tests accidentally become integration tests.

**How to avoid:**
1. Install testing package: `npm install @clerk/testing --save-dev`
2. Mock Clerk in test setup (Jest example):
```tsx
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({ userId: null, isSignedIn: false })),
  auth: jest.fn(() => Promise.resolve({ userId: null })),
  ClerkProvider: ({ children }) => <div>{children}</div>,
  SignIn: () => <div data-testid="clerk-sign-in">Sign In</div>,
}))
```
3. Vitest with `vi.hoisted()` for flexible mocking:
```tsx
const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({ userId: 'test-user', isSignedIn: true }))
}))
vi.mock('@clerk/nextjs', () => ({ useAuth: mocks.useAuth }))
```
4. Create test utilities that toggle auth state:
```tsx
const TestProviders = ({ isLoggedIn = false, children }) => {
  (useAuth as jest.Mock).mockReturnValue({
    userId: isLoggedIn ? 'user-id' : null,
    isSignedIn: isLoggedIn
  })
  return <>{children}</>
}
```
5. For E2E tests (Playwright/Cypress), use `setupClerkTestingToken()` to bypass bot detection
6. Reserve E2E tests for critical flows; unit/integration tests should mock Clerk

**Warning signs:**
- Test failures: "useAuth is not defined"
- Tests make network requests (visible in logs)
- Rate limiting errors from Clerk API during test runs
- Tests require `.env.test` with real Clerk keys
- CI/CD tests fail with network/timeout errors
- Test suite runtime >30 seconds for small apps

**Phase to address:**
Phase 5 (Testing Setup) — Set up test infrastructure early, before accumulating untested auth-dependent code.

---

### Pitfall 9: Hydration Errors from Conditional Auth Rendering

**What goes wrong:**
React hydration mismatch errors: "Text content does not match server-rendered HTML." UI flashes between authenticated and unauthenticated states. Components render differently on server vs client, breaking React's reconciliation.

**Why it happens:**
Server-side rendering produces HTML based on server auth state, but client-side JavaScript uses client auth state that hasn't hydrated yet. Using `useAuth()` directly in render logic causes server/client mismatch. Non-deterministic values (like `Date.now()`) combined with auth checks. Browser extensions modifying DOM before React hydration.

**How to avoid:**
1. Use Server Components with `auth()` for server-side auth checks instead of Client Components with `useAuth()`
2. Defer client-side auth UI to `useEffect()`:
```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return <Skeleton />
```
3. Use `suppressHydrationWarning` sparingly on time-sensitive elements (not auth state)
4. Leverage `<ClerkProvider dynamic>` wrapped in `<Suspense>` for PPR:
```tsx
<Suspense fallback={<AuthSkeleton />}>
  <ClerkProvider dynamic>{children}</ClerkProvider>
</Suspense>
```
5. Avoid conditional rendering based on `isSignedIn` in components that SSR — use routing instead
6. Test with JavaScript disabled to see server-rendered HTML output
7. Use Next.js 15 dev mode which provides detailed hydration error diagnostics

**Warning signs:**
- Console error: "Hydration failed because the initial UI does not match"
- Flash of unauthenticated content (FOUC) before auth state loads
- Different content on initial page load vs subsequent renders
- Layout shift when auth state resolves
- React strict mode exacerbates the errors
- Production builds have hydration errors that dev mode doesn't show

**Phase to address:**
Phase 3 (Client-Side Auth State) — When integrating client components, prevent hydration mismatches from the start.

---

### Pitfall 10: Link Prefetching to Protected Routes

**What goes wrong:**
Console filled with 401 errors during development. Next.js Link components prefetch protected pages, triggering auth failures. Error boundaries catch prefetch failures, showing error UI unnecessarily. Logs polluted with failed requests.

**Why it happens:**
Next.js `<Link>` components prefetch on hover by default. When a public page has links to protected pages, Next.js attempts to prefetch them before the user clicks. Protected pages return 401, causing the prefetch to fail. While this doesn't break functionality (actual navigation works), it creates noise in logs and may trigger error monitoring.

**How to avoid:**
1. Disable prefetch for links to protected routes on public pages:
```tsx
<Link href="/dashboard" prefetch={false}>Dashboard</Link>
```
2. Use route groups to separate public/protected layouts
3. Configure middleware to return 404 instead of 401 for prefetch requests (detect via headers)
4. Filter prefetch failures in error monitoring (Sentry, LogRocket, etc.)
5. For critical auth-dependent navigation, use programmatic routing:
```tsx
const router = useRouter()
const handleClick = () => router.push('/dashboard')
```
6. Consider disabling prefetch globally in next.config.js for auth-heavy apps:
```js
experimental: {
  optimisticClientCache: false,
}
```

**Warning signs:**
- Console shows 401 errors when hovering over links
- Sentry/error monitoring flooded with prefetch failures
- "Failed to fetch" errors in dev tools Network tab
- Error boundaries flash briefly on hover
- Performance monitoring shows failed requests that didn't impact users

**Phase to address:**
Phase 2 (Route Protection) — Configure when setting up protected routes to avoid log pollution during development.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using deprecated `authMiddleware()` instead of `clerkMiddleware()` | Faster migration, matches old docs | Will break in next major version, missing new features | Only during staged migration (not for new projects) |
| Wrapping entire app in `<ClerkProvider dynamic>` | Simpler setup, works everywhere | Opts all routes into dynamic rendering, slower builds, worse performance | Never (use granular opt-in) |
| Hardcoding redirect URLs in components | Quick to implement | Hard to test, brittle across environments | Only in MVP with single-path auth flow |
| Skipping E2E tests for auth flows | Faster test suite | Critical auth bugs reach production | Only if comprehensive integration tests exist |
| Using mock data in tests without `@clerk/testing` | Tests pass without setup | False positives, doesn't test real Clerk integration | Unit tests only (not integration) |
| Disabling TypeScript strict mode for auth code | Resolves async type errors quickly | Loses type safety on critical auth paths | Never (fix the actual async issues) |
| Single environment variable set for dev/staging/prod | Less configuration | Dev keys leak to production, security risk | Never (use environment-specific configs) |
| Ignoring CVE warnings during development | Keeps focus on features | Ships vulnerable code to production | Never (fix before first commit) |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vercel Deployment | Using test keys (`pk_test_`) in production | Set production environment variables with live keys (`pk_live_`), verify domain ownership |
| Database User IDs | Using Clerk user ID as database primary key | Use UUID/auto-increment for primary key, store Clerk ID as `externalId` or `clerk_user_id` with unique constraint |
| API Route Protection | Only protecting pages, leaving API routes public | Apply `clerkMiddleware` to API routes: `'/(api|trpc)(.*)'` matcher, verify auth in handlers |
| Webhooks | Not verifying webhook signatures | Use `@clerk/clerk-sdk-node` to verify `svix` signatures before processing webhook data |
| Role-Based Access Control | Checking roles in client components | Check roles in middleware or server components: `await auth.protect({ role: 'admin' })` |
| Custom Session Claims | Storing sensitive data in JWT claims | JWT claims are client-accessible; store sensitive data server-side, only reference IDs in claims |
| Sign-In Component Styling | Overriding Clerk CSS with `!important` | Use `appearance` prop with proper theme variables and element targeting |
| Multi-Tenant Apps | Single Clerk instance for all tenants | Use organizations feature or separate Clerk instances per tenant for proper isolation |
| Email Templates | Using default templates in production | Customize email templates in Clerk dashboard to match brand, test before launch |
| Development/Production Domains | Using same Clerk instance for dev and prod | Create separate Clerk applications for development and production environments |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `auth()` called in every Server Component | Build time increases, slower SSR | Cache auth result at layout level, pass as prop to children | >50 Server Components |
| No route-level caching for auth checks | Every request hits Clerk API | Use Next.js `unstable_cache` for non-critical auth data | >100 req/sec |
| Client-side org/role checks for every render | Excessive API calls, rate limiting | Fetch once on mount, use context for app-wide state | >1000 DAU |
| Fetching full user object when only ID needed | Unnecessary data transfer, slower responses | Use `auth()` for ID only, fetch full user when needed | >10,000 users |
| Dynamic rendering for static marketing pages | All pages SSR on every request | Use `<ClerkProvider dynamic>` only for app pages, not marketing | >500 req/sec |
| Webhook processing in request handler | Timeout on large batches, blocking requests | Queue webhooks for async processing (BullMQ, Inngest) | >100 webhooks/min |
| Loading entire user list in admin panel | Page freezes, memory issues | Implement pagination, use Clerk's User API with limits | >1000 users |
| Inline org/membership checks in loops | O(n) API calls for list rendering | Batch fetch memberships, cache results | >100 items in list |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting client-side auth state without server verification | Client can manipulate `isSignedIn`, bypass access controls | Always verify auth server-side with `auth()` or API calls |
| Not checking role/permission in server actions | Unauthorized users can execute privileged actions | Use `await auth.protect({ permission: 'org:admin:access' })` in Server Actions |
| Exposing `CLERK_SECRET_KEY` in client bundles | Complete account takeover, all users compromised | Never prefix with `NEXT_PUBLIC_`, audit builds for leaked secrets |
| Using `userId` from URL/body without verification | Impersonation attacks, unauthorized data access | Get `userId` from `auth()`, never trust user input |
| Allowing organization switching without re-auth | Session hijacking in shared-device scenarios | Require re-authentication for sensitive org actions |
| Not validating redirect URLs after sign-in | Open redirect vulnerability, phishing attacks | Whitelist allowed redirect domains, validate on server |
| Relying on middleware alone for API protection | CVE-2025-29927 bypass, middleware can be skipped | Verify auth in API route handlers as defense in depth |
| Storing passwords/secrets in user metadata | Data leaks if metadata accessed, compliance violations | Use Clerk's built-in auth, never store passwords yourself |
| Not rate-limiting sign-in attempts | Brute force attacks, credential stuffing | Enable Clerk's attack protection, add custom rate limiting |
| Using test keys in production | Data leaks to dev dashboard, weak security | Separate Clerk apps for dev/prod, CI/CD validates `pk_live_` prefix |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during sign-in redirect | User sees blank page, thinks app broke | Show loading spinner, "Signing you in..." message |
| Error messages expose technical details | Confusion ("clerkMiddleware not found"), security risk | User-friendly: "Authentication failed. Please try again." |
| Sign-out doesn't redirect automatically | User stuck on dashboard, sees stale data | Auto-redirect to `/` or landing page after sign-out |
| No feedback when session expires | Sudden auth failures, lost work | Show modal: "Your session expired. Please sign in again." |
| Sign-in page accessible when already logged in | User confused, tries to sign in again | Redirect to dashboard if `isSignedIn`, show user info |
| Auth errors don't explain next steps | User frustrated, abandons flow | "Your session expired. [Sign in again] to continue." |
| No remember-me option | Users must sign in repeatedly | Enable Clerk's "Keep me signed in" feature |
| Account deletion has no confirmation | Accidental deletions, support burden | Multi-step confirmation: type username, explain consequences |
| Password reset doesn't confirm email sent | User unsure if request worked | Success message: "Check your email for reset link" |
| Organization switching has no visual feedback | User unsure which org is active | Highlight active org, show loading state during switch |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Middleware:** Configured but not tested with unauthenticated user — verify redirect to sign-in works
- [ ] **Environment Variables:** Set in Vercel but not tested in preview deployment — trigger preview build, verify auth works
- [ ] **Route Protection:** Protecting pages but forgot API routes — test API calls without auth header, should return 401
- [ ] **Redirect Flow:** Sign-in works but sign-out doesn't redirect — test sign-out, verify user lands on public page
- [ ] **Error Handling:** Auth works in happy path but no error boundary for failures — disconnect network, verify graceful degradation
- [ ] **Testing:** Auth works manually but tests fail — run test suite, verify mocks configured correctly
- [ ] **Production Keys:** Using live keys but on staging domain — verify production keys only used with production domain
- [ ] **Webhooks:** Receiving webhooks but not verifying signatures — check webhook handler validates Svix signature
- [ ] **Role Checks:** Checking roles client-side but not server-side — verify API routes check permissions with `auth.protect()`
- [ ] **Session Expiration:** Users stay signed in but don't handle expired sessions — test after session expires (>7 days), verify re-auth required
- [ ] **Security Headers:** Clerk configured but CSP/CORS missing — verify `x-middleware-subrequest` blocked at reverse proxy
- [ ] **Email Configuration:** Auth works but email templates use defaults — check Clerk dashboard, customize templates with brand
- [ ] **User Metadata:** Storing data but not sanitizing on read — verify XSS protection if displaying user metadata
- [ ] **Audit Logs:** Auth working but no logging of auth events — configure Clerk webhooks, log sign-in/sign-up to monitoring

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing clerkMiddleware() | LOW | 1. Create `middleware.ts` with default config, 2. Add matcher, 3. Test all routes, 4. Deploy |
| Default public routes | MEDIUM | 1. Add `createRouteMatcher` and `auth.protect()`, 2. Test all protected routes, 3. Verify redirects, 4. Deploy |
| Async auth() not applied | MEDIUM | 1. Run `@clerk/upgrade` codemod, 2. Manual fixes for edge cases, 3. Update tests, 4. Full regression test |
| Environment variables wrong | LOW | 1. Update Vercel environment variables, 2. Redeploy affected environments, 3. Verify with test user |
| Dynamic rendering missing | MEDIUM | 1. Wrap affected components in `<ClerkProvider dynamic>`, 2. Add Suspense boundaries, 3. Test SSR output |
| CVE-2025-29927 deployed | HIGH | 1. Emergency Next.js upgrade to 15.2.3+, 2. Deploy ASAP, 3. Audit logs for exploitation, 4. Rotate secrets if compromised |
| afterSignIn deprecated | LOW | 1. Replace with `fallbackRedirectUrl`, 2. Test sign-in flow, 3. Deploy |
| Tests not mocked | LOW | 1. Install `@clerk/testing`, 2. Add Jest/Vitest mocks, 3. Update test setup file, 4. Fix failing tests |
| Hydration errors | MEDIUM | 1. Move auth checks to Server Components, 2. Add `useEffect` defer for Client Components, 3. Add Suspense, 4. Test SSR |
| Link prefetch 401s | LOW | 1. Add `prefetch={false}` to protected route links, 2. Filter errors in monitoring, 3. Document pattern |
| Exposed secret key | HIGH | 1. Rotate key immediately in Clerk dashboard, 2. Audit codebase for key references, 3. Add pre-commit hook to detect secrets, 4. Deploy |
| Session hijacking | HIGH | 1. Force sign-out all users via Clerk dashboard, 2. Require re-authentication, 3. Add session re-auth for sensitive actions, 4. Audit access logs |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing clerkMiddleware() | Phase 1: Foundation Setup | `auth()` works without errors, debug mode shows middleware executing |
| Default public routes | Phase 2: Route Protection | Unauthenticated curl requests return 401/redirect, not 200 |
| Async auth() not applied | Phase 1: Foundation Setup | TypeScript compiles without errors, all `auth()` calls awaited |
| Environment variables wrong | Phase 1: Foundation Setup, Phase 4: Production Deployment | Verify sign-in works in each environment, check Clerk dashboard for events |
| Dynamic rendering missing | Phase 3: Client-Side Auth State | `useAuth()` returns current state, Next.js build shows Dynamic routes |
| CVE-2025-29927 | Phase 1: Foundation Setup | `npm ls next` shows ≥15.2.3, security audit clean |
| afterSignIn deprecated | Phase 3: Sign-In/Sign-Up Flow | No TypeScript deprecation warnings, redirects work as expected |
| Tests not mocked | Phase 5: Testing Setup | Tests run without network calls, `npm test` completes <10s |
| Hydration errors | Phase 3: Client-Side Auth State | No hydration warnings in console, SSR output matches client |
| Link prefetch 401s | Phase 2: Route Protection | Console clean during navigation, error monitoring shows no prefetch failures |
| Hardcoded test keys in prod | Phase 4: Production Deployment | CI/CD validates `CLERK_PUBLISHABLE_KEY` starts with `pk_live_` |
| API routes unprotected | Phase 2: Route Protection | API calls without auth header return 401, integration tests verify |
| Webhook signature not verified | Phase 6: Webhook Integration (if needed) | Tampered webhooks rejected, logs show verification success |
| No role checks server-side | Phase 2: Route Protection | Admin-only actions fail for non-admin users in server actions |

## Sources

**Official Clerk Documentation (HIGH confidence):**
- [clerkMiddleware() Reference](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [auth() was called error documentation](https://clerk.com/docs/reference/nextjs/errors/auth-was-called)
- [Next.js Quickstart (App Router)](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Upgrade to @clerk/nextjs v6](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/nextjs-v6)
- [Next.js rendering modes and Clerk](https://clerk.com/docs/guides/development/rendering-modes)
- [Customize redirect URLs](https://clerk.com/docs/guides/development/customize-redirect-urls)
- [Deploying to Vercel](https://clerk.com/docs/guides/development/deployment/vercel)
- [A practical guide to testing Clerk Next.js applications](https://clerk.com/blog/testing-clerk-nextjs)
- [Appearance prop customization](https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/overview)

**Security Advisories (HIGH confidence):**
- [CVE-2025-29927: Next.js Middleware Authorization Bypass](https://clerk.com/blog/cve-2025-29927)
- [CVE-2025-29927 Technical Analysis (ProjectDiscovery)](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass)
- [CVE-2025-29927 Analysis (Datadog Security Labs)](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/)

**Community Resources (MEDIUM confidence):**
- [Update on Clerk Authentication with Next.js: Route Protection Issues](https://medium.com/@extraone033/update-on-clerk-authentication-with-next-js-how-to-resolve-route-protection-issues-0baf38c3f739)
- [Clerk Authentication in Next.js 15 App Router: Full Integration Guide](https://www.buildwithmatija.com/blog/clerk-authentication-nextjs15-app-router)
- [Added @clerk/nextjs and now I get 404s on protected routes (GitHub Discussion)](https://github.com/vercel/next.js/discussions/66037)
- [ClerkProvider Should Not Force All Children to Render Dynamically (Issue #1746)](https://github.com/clerk/javascript/issues/1746)

**Context7 Documentation Lookup (HIGH confidence):**
- Clerk library ID: `/clerk/clerk-docs`
- Middleware configuration snippets
- Route protection patterns
- Environment variable setup
- Dynamic rendering guidance

---
*Pitfalls research for: Adding Clerk Authentication to Next.js 15 App Router*
*Researched: 2026-05-09*
