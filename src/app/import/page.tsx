import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';
import { getImportBatches } from '@/db/queries/imports';
import DashboardLayout from '@/components/DashboardLayout';
import ImportFlow from '@/components/ImportFlow';

export const dynamic = 'force-dynamic'; // Always fetch fresh data per request

/**
 * Bulk import page (`/import`) — async RSC.
 *
 * D-15: Bulk import lives at a dedicated /import route (NOT a modal); full-page because
 *   the preview table can have many rows and per-row controls.
 * D-16: ImportHistoryTable shows the 10 most recent imports below the upload flow.
 * D-25: canEdit gates the drop zone; read-only users see history but cannot import.
 *
 * Threat model:
 *   T-34-07-01: auth() redirect before any DB call (unauthenticated = /sign-in).
 *   T-34-07-08: canEdit=false hides drop zone UI; server action enforces requireRole.
 *   T-34-07-CSRF: Next.js 16 server actions enforce same-origin at framework level.
 */
export default async function ImportPage(): Promise<React.JSX.Element> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const canEdit = await checkRole('mill_operator'); // D-25: gates drop zone in ImportFlow
  const batches = await getImportBatches({ limit: 10 }); // D-16

  return (
    <DashboardLayout>
      <ImportFlow batches={batches} canEdit={canEdit} />
    </DashboardLayout>
  );
}
