/**
 * Server-only role utilities (ACCESS-02).
 *
 * These helpers read the role claim from the verified session JWT via
 * `auth().sessionClaims?.metadata?.roles` — no Clerk Backend API call.
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
 * Server-component guard: redirects unless the current session has `role`.
 *
 * Branches (in order):
 *   1. No `userId` → `redirect('/sign-in')`
 *   2. `!sessionClaims.metadata.roles?.includes(role)` → `redirect('/')`
 *   3. Otherwise resolves with `undefined`.
 *
 * `next/navigation`'s `redirect()` throws `NEXT_REDIRECT` internally — it
 * never returns. Callers do NOT need to `return` after `await requireRole(...)`.
 *
 * @param role - The {@link Role} the caller requires.
 * @returns `Promise<void>` that resolves on success; otherwise the call
 *   never resolves (redirect throws).
 *
 * @example
 * // Guard a server-component page so only demo users reach the content:
 * import { requireRole } from '@/lib/auth';
 *
 * export default async function DemoOnlyPage() {
 *   await requireRole('demo'); // throws NEXT_REDIRECT if not 'demo'
 *   return <main>Demo-only content</main>;
 * }
 */
export async function requireRole(role: Role): Promise<void> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  if (!sessionClaims?.metadata?.roles?.includes(role)) {
    redirect('/');
  }
}

/**
 * Returns whether the current session has `role`. Server-only.
 *
 * Use when a page needs to branch on role membership without a redirect —
 * e.g., to compute a `canEdit` prop for a client component that hides or
 * shows edit affordances based on role (CONTEXT.md D-03, Phase 31).
 *
 * This is the read-only counterpart to {@link requireRole}: same JWT-claim
 * read path (`sessionClaims.metadata.roles.includes(role)`), but it returns
 * a boolean instead of calling `redirect()`. Both are server-only — `auth()`
 * from `@clerk/nextjs/server` is server-only and will throw when invoked
 * from the client. Role checks done in the browser are not a security
 * boundary; the enforcement points are middleware + server actions
 * (`requireRole` inside the action body).
 *
 * Branches (in order):
 *   1. No `sessionClaims` or no `metadata` or no `roles` → returns `false`.
 *   2. `roles` array does not contain `role` → returns `false`.
 *   3. `roles` array contains `role` → returns `true`.
 *
 * @param role - The {@link Role} to check for membership.
 * @returns `Promise<boolean>` — `true` iff the session has `role`.
 *
 * @example
 * // src/app/page.tsx — Phase 34 dashboard (D-03 canEdit pattern)
 * import { checkRole } from '@/lib/auth';
 *
 * export default async function HomePage() {
 *   const canEdit = await checkRole('mill_operator');
 *   return <ProductionDashboard canEdit={canEdit} />;
 * }
 */
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.roles?.includes(role) ?? false;
}
