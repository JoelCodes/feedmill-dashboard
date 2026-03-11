export type OrderStatus = "Pending" | "Producing" | "Ready" | "In Transit" | "Complete";

export interface Order {
  id: string;
  documentNumber: string;
  customer: string;
  textureType: string;
  formulaType: string;
  quantity: number;
  location: string;
  deliveryDate: string;
  status: OrderStatus;
  hasChanges: boolean;
  createdAt: string;
  updatedAt: string;
}
