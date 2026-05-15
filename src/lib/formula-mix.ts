/**
 * Formula mix texture bucketing helper.
 *
 * No React, no Next.js, no database — this file is intentionally free of
 * browser/server APIs so it can be imported from both RSC and client contexts.
 *
 * D-11: Implements the locked texture-bucketing rule. The 5 known canonical
 * uppercase DB forms are mapped to 3 display buckets. This is the JS-side
 * parallel of the SQL CASE expression in kpis.ts — their agreement is enforced
 * by a unit test in Plan 35-04.
 *
 * CRITICAL: Comparisons are case-sensitive on the canonical uppercase DB form.
 * Do NOT add .toUpperCase() / .toLowerCase() / .trim() — pre-processing would
 * silently absorb data-quality issues that should surface as null and be
 * reported via the KPI-05 "N uncategorized" footnote (D-12).
 *
 * D-12: NULL and unrecognized values return null. KPI-05 SQL excludes null
 * from both numerator AND denominator so percentages always sum to 100% over
 * the categorized population. Unknown future raw values also return null until
 * the mapping is updated explicitly.
 */

/** The three display buckets for formula mix (KPI-05). */
export type FormulaBucket = 'Pellet' | 'Mash' | 'Crumble';

/**
 * Maps a raw texture_type string (from the DB) to one of 3 display buckets,
 * or null for NULL / unrecognized inputs.
 *
 * @param raw - The canonical uppercase texture_type value from the DB, or null.
 * @returns The display bucket, or null if the input is null or unrecognized.
 */
export function bucketTexture(raw: string | null): FormulaBucket | null {
  switch (raw) {
    case 'PELLET':
    case 'SH PELLET':
      return 'Pellet';
    case 'MASH':
      return 'Mash';
    case 'FINE CR':
    case 'C. CRUMBLE':
      return 'Crumble';
    default:
      return null;
  }
}
