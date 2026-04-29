export type MillLine = "Premix" | "Excel" | "CGM";

export type ProductionState = "Completed" | "Mixing" | "Blocked" | "Pending";

export interface ProductionOrder {
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
