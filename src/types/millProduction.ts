// MillLine and ProductionState are now canonical from src/db/schema/orders.ts (D-04).
// Re-exported here for backward compat during transition.
export type { MillLine, ProductionState } from '@/db/schema/orders';

import type { MillLine, ProductionState } from '@/db/schema/orders';

/**
 * UI-consumer shape for production orders.
 *
 * CR-01 boundary note:
 * --------------------
 * `weightLbs` is `number` here even though the canonical DB shape
 * (`ProductionOrder` in `@/db/schema/orders`) types it as `string` —
 * Drizzle infers `numeric(10, 2)` as `string` to preserve decimal
 * precision. The UI deliberately wants `number` so call sites can use
 * `Number.prototype.toLocaleString()` for comma grouping and arithmetic
 * sums (`reduce((sum, o) => sum + o.weightLbs, 0)`).
 *
 * A service-boundary adapter (Phase 33+) MUST translate
 * `ProductionOrder[]` → `DemoOrder[]` by parsing `weightLbs` via
 * `Number(r.weightLbs)` before reaching this type. Assigning DB rows
 * directly to `DemoOrder[]` (e.g. via `as DemoOrder[]`) produces silent
 * string-concatenation bugs in `MillProductionUI` reduce / format calls.
 *
 * See `src/db/schema/orders.ts` ProductionOrder JSDoc for the full
 * contract description.
 */
export interface DemoOrder {
  id: string;
  orderNumber: string;
  customer: string;
  product: string;
  weightLbs: number;
  deliveryTime: string;
  state: ProductionState;
  millLine: MillLine;
  textureType?: string;  // MASH, PELLET, C. CRUMBLE, SH PELLET, FINE CR
  lineCode?: string;     // Numeric code from example data (33161, 22563, etc.)
}
