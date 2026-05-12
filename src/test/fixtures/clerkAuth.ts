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
 * Factory for `jest.mock('next/navigation', () => nextNavigationMockFactory())`.
 *
 * Returns:
 *   - `redirect(url)` — throws `Object.assign(new Error('NEXT_REDIRECT'), { url })`,
 *     mirroring real Next.js runtime so callers do not continue past the
 *     redirect call.
 *   - `notFound()` — throws `Object.assign(new Error('NEXT_NOT_FOUND'), {})`,
 *     same sentinel-throw shape so `customers/[id]` 404 tests work uniformly.
 *   - `usePathname`, `useRouter`, `useSearchParams` — `jest.fn()` placeholders
 *     with safe defaults so consumer tests that render client children
 *     (Header, DashboardLayout, OrdersTable's deep-link sub-component, etc.)
 *     don't trip on undefined navigation hooks.
 */
export function nextNavigationMockFactory() {
  return {
    redirect: (url: string) => {
      throw Object.assign(new Error('NEXT_REDIRECT'), { url });
    },
    notFound: () => {
      throw Object.assign(new Error('NEXT_NOT_FOUND'), {});
    },
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    })),
    useSearchParams: jest.fn(() => ({
      get: jest.fn(() => null),
    })),
  };
}

/**
 * Seed `mockAuth` to resolve with a session whose role is `'demo'`.
 * Use in tests that exercise the happy path of a `/demo/*` RSC page.
 */
export function mockDemoSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { role: 'demo' } },
  });
}

/**
 * Seed `mockAuth` to resolve with a session whose role is a non-demo role.
 * Defaults to `'user'`; pass `'admin'` to exercise the admin path. Use in
 * tests that assert `requireRole('demo')` triggers `redirect('/')`.
 */
export function mockNonDemoSession(role: Exclude<Role, 'demo'> = 'user'): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { role } },
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
