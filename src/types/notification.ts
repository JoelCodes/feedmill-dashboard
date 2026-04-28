export type NotificationType = "order_status" | "alert" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  relatedOrderId?: string;
}
