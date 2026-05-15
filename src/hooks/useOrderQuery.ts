'use client';

/**
 * useOrderQuery — single source of truth for the `?order=<id>` URL parameter.
 *
 * WR-05 (deep review 2026-05-14): three components (ProductionDashboard,
 * ProductionDrawer, BlockedAlertBand) each independently called
 * useQueryStates({ order }, { shallow: false, history: 'push' }), duplicating
 * both the parser config and the option literals. nuqs reconciles them at
 * runtime against the same URL key, but if a future plan changes the option
 * (e.g. history: 'replace') the developer must edit three files in sync —
 * forgetting one creates asymmetric URL behavior across the dashboard.
 *
 * Centralise the parser + options here so all three components import a single
 * one-liner. Any future change to the URL contract for `?order=` happens in
 * exactly one place.
 *
 * Contract notes (preserved verbatim from prior call sites):
 *   - shallow: false → setting `order` re-runs the page RSC (T10b gap closure)
 *     so getOrderById + getOrderEvents fetch the drawer payload.
 *   - history: 'push' → browser back closes the drawer (deep-link parity).
 *
 * Caller is expected to wrap mutations in startTransition() so the existing
 * <Suspense fallback={<DrawerSkeleton />}> boundary renders during the RSC
 * fetch instead of freezing the previous UI.
 */

import { useQueryStates, parseAsString } from 'nuqs';

const ORDER_PARSERS = { order: parseAsString.withDefault('') } as const;
const ORDER_OPTIONS = { shallow: false as const, history: 'push' as const };

export function useOrderQuery() {
  return useQueryStates(ORDER_PARSERS, ORDER_OPTIONS);
}
