/**
 * Contract test for the reusable Clerk auth + next/navigation test fixture.
 *
 * Proves the consumer pattern downstream Phase 28 plans (28-02..28-05) will use:
 *   1. Import the factories: `import { clerkAuthMockFactory, nextNavigationMockFactory } from './clerkAuth';`
 *   2. Pass them as the second arg to `jest.mock(...)` at module top (Jest allows
 *      referencing imports from ESM-style mock factories — the import is hoisted
 *      with the mock).
 *   3. Import the helpers (`mockAuth`, `mockDemoSession`, etc.) and call them
 *      inside `beforeEach` / individual tests to control the session.
 *
 * The redirect mock uses a sentinel-throw shape so callers of `redirect()`
 * do NOT continue executing past the redirect call — mirroring real Next.js
 * runtime behavior where `redirect()` throws `NEXT_REDIRECT` internally
 * (canonical pattern from `src/lib/auth.test.ts` lines 1-16).
 */
import {
  clerkAuthMockFactory,
  nextNavigationMockFactory,
} from './clerkAuth';

jest.mock('@clerk/nextjs/server', () => clerkAuthMockFactory());
jest.mock('next/navigation', () => nextNavigationMockFactory());

import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import {
  mockAuth,
  mockDemoSession,
  mockNonDemoSession,
  mockUnauthenticatedSession,
} from './clerkAuth';

beforeEach(() => {
  mockAuth.mockReset();
});

describe('clerkAuth fixture', () => {
  it('mockDemoSession resolves mockAuth with roles containing demo', async () => {
    mockDemoSession();
    const result = await mockAuth();
    expect(result.userId).toBe('u1');
    expect(result.sessionClaims.metadata.roles).toContain('demo');
  });

  it('mockNonDemoSession defaults to roles containing user', async () => {
    mockNonDemoSession();
    const result = await mockAuth();
    expect(result.userId).toBe('u1');
    expect(result.sessionClaims.metadata.roles).toContain('user');
  });

  it('mockNonDemoSession accepts an explicit non-demo role (admin)', async () => {
    mockNonDemoSession('admin');
    const result = await mockAuth();
    expect(result.userId).toBe('u1');
    expect(result.sessionClaims.metadata.roles).toContain('admin');
  });

  it('mockUnauthenticatedSession resolves with null userId and null claims', async () => {
    mockUnauthenticatedSession();
    await expect(mockAuth()).resolves.toEqual({
      userId: null,
      sessionClaims: null,
    });
  });

  it('redirect mock throws NEXT_REDIRECT with the /sign-in url', () => {
    let caught: unknown;
    try {
      redirect('/sign-in');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toMatchObject({ message: 'NEXT_REDIRECT', url: '/sign-in' });
  });

  it('redirect mock throws NEXT_REDIRECT with the / url', () => {
    let caught: unknown;
    try {
      redirect('/');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toMatchObject({ url: '/' });
  });

  it('notFound mock throws an error whose digest matches real Next.js (;404 suffix)', () => {
    let caught: unknown;
    try {
      notFound();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    // Real Next.js 16 emits `digest: 'NEXT_HTTP_ERROR_FALLBACK;404'`; the
    // fixture mirrors that shape so future error-boundary code paths that
    // branch on `.digest` will be tested against the production shape.
    expect(caught).toMatchObject({ digest: expect.stringContaining(';404') });
  });

  it('clerkAuthMockFactory.auth() invokes the exported mockAuth fn (closure proof)', async () => {
    mockAuth.mockResolvedValue({ marker: true });
    await expect(auth()).resolves.toEqual({ marker: true });
  });
});
