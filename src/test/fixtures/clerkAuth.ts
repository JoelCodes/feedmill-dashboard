/**
 * Test-only Clerk auth + next/navigation mock fixtures.
 *
 * Import the factories into a page test file's `jest.mock(...)` calls at the
 * top of the file (Jest hoisting compatible — the factory imports are hoisted
 * with the mock):
 *
 *   import {
 *     clerkAuthMockFactory,
 *     nextNavigationMockFactory,
 *     mockAuth,
 *     mockDemoSession,
 *   } from '@/test/fixtures/clerkAuth';
 *
 *   jest.mock('@clerk/nextjs/server', () => clerkAuthMockFactory());
 *   jest.mock('next/navigation', () => nextNavigationMockFactory());
 *
 *   beforeEach(() => mockAuth.mockReset());
 *
 *   it('redirects non-demo users', async () => {
 *     mockNonDemoSession();
 *     await expect(Page()).rejects.toMatchObject({ url: '/' });
 *   });
 *
 * SERVER-AUTH BOUNDARY (D-04, threat T-28-01-02):
 *   This fixture stubs only the inner page-level `requireRole` (and the
 *   `next/navigation` redirect sentinel). Production middleware demo-role
 *   enforcement (Phase 25 ACCESS-01) remains the outer guard and is covered
 *   by Phase 27 Playwright tests against real Clerk — this fixture is a
 *   unit-test convenience, not a security boundary.
 *
 * NEVER import this module from production code (anything under `src/app/`,
 * `src/components/`, `src/lib/`, `src/services/`). It is referenced only by
 * `*.test.ts(x)` files. See `src/test/fixtures/clerkAuth.test.ts` for the
 * consumer pattern.
 */
import type { Role } from '@/types/clerk';

/**
 * The single `jest.fn()` that `clerkAuthMockFactory()` closes over. Tests call
 * helper functions (`mockDemoSession`, etc.) to set its resolved value, or
 * call `mockAuth.mockReset()` in `beforeEach` to start clean. Consumer pages
 * receive its return value via `auth()` in the production code path.
 */
export const mockAuth = jest.fn();

/**
 * Factory for `jest.mock('@clerk/nextjs/server', () => clerkAuthMockFactory())`.
 *
 * Returns `{ auth: () => mockAuth() }` — note the deferred invocation: `auth`
 * is a function that calls `mockAuth` at consumer call time, NOT the
 * pre-resolved value of `mockAuth()`. This matches the canonical pattern in
 * `src/lib/auth.test.ts` lines 8-10 and is required so per-test
 * `mockAuth.mockResolvedValue(...)` calls take effect.
 */
export function clerkAuthMockFactory() {
  return {
    auth: () => mockAuth(),
  };
}

/**
 * Digest emitted by real Next.js `notFound()` (see
 * `node_modules/next/dist/client/components/not-found.js` — the installed
 * Next 16 throws an Error whose message AND `digest` property both equal
 * `'NEXT_HTTP_ERROR_FALLBACK;404'`). Mirroring this in the fixture means
 * consumer tests can assert against the real shape (`{ digest:
 * expect.stringContaining(';404') }`), and a future error-boundary that
 * distinguishes 404 throws via `error.digest?.startsWith(
 * 'NEXT_HTTP_ERROR_FALLBACK;404')` will be tested against the same shape
 * production sees.
 */
const NOT_FOUND_DIGEST = 'NEXT_HTTP_ERROR_FALLBACK;404';

/**
 * Per-test mock state for `useSearchParams().get(key)` (IN-03). Consumer
 * tests call `setMockSearchParam('selected', 'ORD-001')` to exercise
 * deep-link code paths; the default `null` mirrors a no-query URL.
 *
 * Stored in a module-scoped `Map` so a single shared backing store is
 * reachable from BOTH the factory closure (which constructs the
 * `searchParamsObj` returned by `useSearchParams`) AND the `setMockSearchParam`
 * / `resetMockSearchParams` helpers exported below.
 */
const _mockSearchParamsState = new Map<string, string | null>();

/**
 * Override the value returned by `useSearchParams().get(key)` in tests
 * that exercise URL-driven code paths. Pair with `resetMockSearchParams()`
 * in `afterEach` to keep tests isolated.
 *
 * Example:
 *
 *   beforeEach(resetMockSearchParams);
 *   it('selects the deep-linked order on mount', () => {
 *     setMockSearchParam('selected', 'ORD-001');
 *     // ...render and assert ORD-001 is the selected row
 *   });
 */
export function setMockSearchParam(key: string, value: string | null): void {
  _mockSearchParamsState.set(key, value);
}

/**
 * Clear all per-test overrides registered via `setMockSearchParam`. Call
 * in `afterEach` (or `beforeEach`) to isolate tests.
 */
export function resetMockSearchParams(): void {
  _mockSearchParamsState.clear();
}

/**
 * Factory for `jest.mock('next/navigation', () => nextNavigationMockFactory())`.
 *
 * Returns:
 *   - `redirect(url)` — throws `Object.assign(new Error('NEXT_REDIRECT'), { url })`,
 *     mirroring real Next.js runtime so callers do not continue past the
 *     redirect call.
 *   - `notFound()` — throws an Error whose message and `digest` property are
 *     both `'NEXT_HTTP_ERROR_FALLBACK;404'`, matching the real Next.js 16
 *     runtime so `customers/[id]` 404 tests assert against the production shape.
 *   - `usePathname`, `useRouter`, `useSearchParams` — `jest.fn()` placeholders
 *     with safe defaults so consumer tests that render client children
 *     (Header, DashboardLayout, OrdersTable's deep-link sub-component, etc.)
 *     don't trip on undefined navigation hooks.
 *
 * WR-05/IN-03: `searchParamsObj` and `routerObj` are constructed ONCE per
 * factory invocation (i.e., once per `jest.mock` setup), not once per
 * `useSearchParams()` / `useRouter()` call. This matches real Next.js
 * navigation hooks (stable reference per navigation), letting consumer
 * `useEffect([searchParams])` deps work correctly under the fixture.
 * Previously each call returned a fresh `{ get: ... }` reference, causing
 * the effect to re-run every render — benign while `get` returns null but
 * primed for an infinite `setState` loop the moment a test overrode `get`.
 */
export function nextNavigationMockFactory() {
  const searchParamsObj = {
    get: (key: string) => _mockSearchParamsState.get(key) ?? null,
  };
  const routerObj = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };
  return {
    redirect: (url: string) => {
      throw Object.assign(new Error('NEXT_REDIRECT'), { url });
    },
    notFound: () => {
      throw Object.assign(new Error(NOT_FOUND_DIGEST), {
        digest: NOT_FOUND_DIGEST,
      });
    },
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => routerObj),
    useSearchParams: jest.fn(() => searchParamsObj),
  };
}

/**
 * Seed `mockAuth` to resolve with a session whose roles array contains `'demo'`.
 * Use in tests that exercise the happy path of a `/demo/*` RSC page.
 */
export function mockDemoSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: ['demo'] } },
  });
}

/**
 * Seed `mockAuth` to resolve with a session whose roles array contains a non-demo role.
 * Defaults to `'user'`; pass `'admin'` to exercise the admin path. Use in
 * tests that assert `requireRole('demo')` triggers `redirect('/')`.
 *
 * Example session shape: `{ userId: 'u1', sessionClaims: { metadata: { roles: ['user'] } } }`
 */
export function mockNonDemoSession(role: Exclude<Role, 'demo'> = 'user'): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: [role] } },
  });
}

/**
 * Seed `mockAuth` to resolve with an unauthenticated session. Use in tests
 * that assert `requireRole('demo')` triggers `redirect('/sign-in')`.
 */
export function mockUnauthenticatedSession(): void {
  mockAuth.mockResolvedValue({
    userId: null,
    sessionClaims: null,
  });
}

export function mockMillOperatorSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: ['mill_operator'] } },
  });
}

export function mockDualRoleSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: ['demo', 'mill_operator'] } },
  });
}
