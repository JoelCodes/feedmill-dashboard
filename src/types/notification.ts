export type NotificationType = "order_status" | "alert" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  // Note: Read state is managed in localStorage, not in this type
  relatedOrderId?: string;
}
