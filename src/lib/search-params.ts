/**
 * Shared search-parameter parsers for the production dashboard URL state.
 *
 * D-04: `?status=` — comma-separated array of valid ProductionState literals;
 *   unknown values are silently dropped by parseAsStringLiteral(STATE_ORDER).
 * D-05: `?q=` — plain string search term, default empty. Trimming/lowercasing
 *   is a render-time concern; the URL preserves the original casing so that
 *   back/forward navigation feels natural.
 * D-06: `?order=<id>` — single string that, when present, opens the right-side
 *   details drawer for that order. Cleared on close.
 *
 * Filter-pill display order is determined by the renderer per UI-SPEC §1.
 * Parsing uses set-semantics so the order of values in the URL is irrelevant.
 */
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsStringLiteral,
  parseAsString,
} from 'nuqs/server';
import type { ProductionState } from '@/db/schema/orders';

/**
 * Canonical ordering of production states for filter pills and grouping.
 *
 * Source of truth: matches visual ordering in `MillProductionUI.tsx` lines 11-16
 * (Phase 28 visual prior art). Phase 34 reuses the same ordering to keep the
 * filter strip visually consistent with the demo board.
 *
 * D-04: the four valid literals are 'Pending' | 'Mixing' | 'Completed' | 'Blocked'.
 * UI-SPEC §1 dictates that filter pill display order follows STATE_ORDER.
 * Since parseAsArrayOf is set-semantics, the order in the URL string does not
 * affect which values survive parsing — all valid literals are kept, all unknown
 * literals are dropped silently.
 */
export const STATE_ORDER = ['Pending', 'Mixing', 'Completed', 'Blocked'] as const satisfies readonly ProductionState[];

/**
 * Shared parser cache for `/?status=&q=&order=`.
 *
 * Consumed by:
 *   - `src/app/page.tsx` (RSC) — `searchParamsCache.parse(searchParams)`
 *   - `src/components/ProductionDashboard.tsx` (client) — same parsers via `useQueryStates`
 */
export const searchParamsCache = createSearchParamsCache({
  status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]),
  q:      parseAsString.withDefault(''),
  order:  parseAsString.withDefault(''),
});
