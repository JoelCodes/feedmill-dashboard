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
}
