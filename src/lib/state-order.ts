/**
 * Canonical orderings for ProductionState literals.
 *
 * WR-06 (deep review 2026-05-14): three constants previously encoded the same
 * canonical state set with subtly different orderings:
 *   - search-params.ts STATE_ORDER (parsing/filter order)
 *   - production-derivations.ts STATE_ORDER (grouping/seed order)
 *   - MillColumn.tsx COLUMN_STATE_ORDER (visual column section order)
 *
 * All three were duplicated to avoid pulling 'nuqs/server' into pure modules
 * (production-derivations is meant to be import-clean for both RSC and client
 * contexts). The risk: TypeScript catches missing literals at compile time but
 * does NOT warn if the ORDER drifts in one file but not the others.
 *
 * Centralise both tuples here — this module has zero 'server-only' imports
 * and zero React imports, so it can be imported from any layer (RSC, client,
 * pure derivations, server actions, search params).
 */
import type { ProductionState } from '@/db/schema/orders';

/**
 * Canonical parsing/filter/grouping order.
 *
 * Used by:
 *   - search-params.ts → parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))
 *     URL parameter validation (any value not in this tuple is silently dropped)
 *   - production-derivations.ts → groupOrdersByState reduce-seed order
 *   - ProductionDashboard.tsx → filter pill display order (UI-SPEC §1)
 *
 * Ordering: Pending → Mixing → Completed → Blocked. This is NOT the same as
 * the visual column ordering — see COLUMN_STATE_ORDER below.
 */
export const STATE_ORDER = [
  'Pending',
  'Mixing',
  'Completed',
  'Blocked',
] as const satisfies readonly ProductionState[];

/**
 * Visual column section order (UI-SPEC §3).
 *
 * Used by MillColumn.tsx to render state sections within each mill column:
 * Completed → Mixing → Blocked → Pending. Intentionally different from
 * STATE_ORDER above — visual prominence is a separate concern from
 * parsing/filter order.
 */
export const COLUMN_STATE_ORDER = [
  'Completed',
  'Mixing',
  'Blocked',
  'Pending',
] as const satisfies readonly ProductionState[];
