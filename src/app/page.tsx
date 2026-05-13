import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import MillReadOnlyStub from '@/components/MillReadOnlyStub';

/**
 * Phase 31 homepage (`/`) — async server component.
 *
 * Behavior (CONTEXT.md D-01..D-03):
 *   1. D-02: authentication gate only. Sign-in redirect happens when the
 *      session has no userId. No page-level role gate is applied.
 *   2. D-03: the canEdit flag is computed server-side and passed as a
 *      serializable boolean prop to the client stub. The browser never
 *      re-checks the role; the server-only enforcement boundary lives
 *      at the RSC layer.
 *   3. D-01: any authenticated user reaches the page. Non-operator users
 *      see read-only mode; operator users see edit affordances
 *      (placeholder text in this phase; real UI lands in Phase 34).
 */
export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in'); // D-02: auth gate ONLY (no role gate)
  }

  const canEdit = await checkRole('mill_operator'); // D-03

  return (
    <DashboardLayout>
      <MillReadOnlyStub canEdit={canEdit} />
    </DashboardLayout>
  );
}
