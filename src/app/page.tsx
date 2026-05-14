import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

/**
 * Phase 34 transitional homepage (`/`) — async server component.
 *
 * Behavior (CONTEXT.md D-01..D-03):
 *   1. D-02: authentication gate only. Sign-in redirect happens when the
 *      session has no userId. No page-level role gate is applied.
 *   2. D-03: the canEdit flag is computed server-side and passed as a
 *      serializable boolean prop. The browser never re-checks the role;
 *      the server-only enforcement boundary lives at the RSC layer.
 *   3. D-01: any authenticated user reaches the page. Non-operator users
 *      see read-only mode; operator users see edit affordances.
 *
 * The full ProductionDashboard wiring lands in plan 07.
 * This transitional stub keeps the build green between Wave 1 and Wave 4.
 */
export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in'); // D-02: auth gate ONLY (no role gate)
  }

  const canEdit = await checkRole('mill_operator'); // D-03

  return (
    <DashboardLayout>
      <main className="flex flex-1 items-center justify-center" data-testid="dashboard-placeholder">
        <p className="text-sm text-[var(--text-secondary)]" data-can-edit={canEdit}>
          Dashboard placeholder — wired in plan 07
        </p>
      </main>
    </DashboardLayout>
  );
}
