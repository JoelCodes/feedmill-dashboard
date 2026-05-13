// MillLine and ProductionState are now canonical from src/db/schema/orders.ts (D-04).
// Re-exported here for backward compat during transition.
export type { MillLine, ProductionState } from '@/db/schema/orders';

import type { MillLine, ProductionState } from '@/db/schema/orders';

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
