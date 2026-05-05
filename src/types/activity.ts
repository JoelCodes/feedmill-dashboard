export type ActivityEventType =
  | 'order_placed'
  | 'production_started'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_completed'
  | 'bin_alert_low'
  | 'bin_alert_critical';

export interface ActivityEvent {
  id: string;
  customerId: string;
  type: ActivityEventType;
  timestamp: Date;
  title: string;
  description: string;
  // Order-specific fields (optional)
  orderId?: string;
  orderQuantity?: number;
  orderProduct?: string;
  orderStatus?: string;
  // Bin-specific fields (optional)
  binId?: string;
  binLocationCode?: string;
  binFillPercentage?: number;
}
