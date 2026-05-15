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

// WR-06: STATE_ORDER lives in @/lib/state-order (no 'nuqs/server' imports)
// so MillColumn.tsx and production-derivations.ts can share the same source
// of truth without pulling server-only code into pure modules. Imported here
// for the parser definition AND re-exported for backward compatibility with
// existing call sites that import STATE_ORDER from '@/lib/search-params'.
import { STATE_ORDER } from '@/lib/state-order';
export { STATE_ORDER };

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
