import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { importBatches, type ImportBatch } from '@/db/schema/imports';
import { desc } from 'drizzle-orm';

/**
 * Fetch the N most recent import batches.
 *
 * D-16: Import history page shows the 10 most recent imports (operator can see
 * what was uploaded recently and by whom). The caller passes { limit: 10 }.
 *
 * CACHE CONTRACT (D-21):
 * Wrapped in unstable_cache. Cache key and invalidation tag are both the
 * string used in the two calls below. The tag MUST match the revalidateTag
 * call added in src/actions/import.ts commitImportAction (D-21 Phase-33 → Phase-34 contract).
 *
 * Cache key and tag share the same string following the orders.ts convention
 * — this is intentional.
 */
export const getImportBatches = unstable_cache(
  async ({ limit }: { limit: number }): Promise<ImportBatch[]> => {
    return db
      .select()
      .from(importBatches)
      .orderBy(desc(importBatches.importedAt))
      .limit(limit);
  },
  ['import-batches'],
  { tags: ['import-batches'] }
);
