/**
 * Server-only role utilities (ACCESS-02).
 *
 * These helpers read the role claim from the verified session JWT via
 * `auth().sessionClaims?.metadata?.role` — no Clerk Backend API call.
 *
 * SERVER-ONLY: never import this module into a client component. `auth()`
 * from `@clerk/nextjs/server` is server-only and will throw when invoked
 * from the client. Role checks done in the browser are not a security
 * boundary — middleware + these server utilities are the enforcement
 * points (REQUIREMENTS.md "Out of Scope: client-side role checking").
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Role } from '@/types/clerk';

/**
 * Returns `true` iff the current session has the given role.
 *
 * Reads `auth().sessionClaims?.metadata?.role` (verified JWT claim) — does
 * NOT call the Clerk Backend API. Returns `false` for every missing-data
 * path: no session, no `sessionClaims`, no `metadata.role`, or mismatched
 * role. Never throws.
 *
 * @param role - The Role to check against the current session.
 * @returns `true` if the session role matches `role`; `false` otherwise.
 */
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
}

/**
 * Server-component guard: redirects unless the current session has `role`.
 *
 * Branches (in order):
 *   1. No `userId` → `redirect('/sign-in')`
 *   2. `sessionClaims.metadata.role !== role` → `redirect('/')`
 *   3. Otherwise resolves with `undefined`.
 *
 * `next/navigation`'s `redirect()` throws `NEXT_REDIRECT` internally — it
 * never returns. Callers do NOT need to `return` after `await requireRole(...)`.
 *
 * @param role - The Role the caller requires.
 * @returns `Promise<void>` that resolves on success; otherwise the call
 *   never resolves (redirect throws).
 */
export async function requireRole(role: Role): Promise<void> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  if (sessionClaims?.metadata?.role !== role) {
    redirect('/');
  }
}
