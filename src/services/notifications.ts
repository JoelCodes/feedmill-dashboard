import { Notification } from "@/types/notification";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockNotifications: Notification[] = [
  {
    id: "NOTIF-001",
    type: "order_status",
    title: "Order Ready",
    message: "Order ORD-2847 is now Ready for pickup",
    timestamp: new Date("2026-04-28T18:30:00Z"),
    relatedOrderId: "ORD-2847",
  },
  {
    id: "NOTIF-002",
    type: "order_status",
    title: "Order Dispatched",
    message: "Order ORD-2858 is now In Transit to Meadowbrook Dairy",
    timestamp: new Date("2026-04-28T16:15:00Z"),
    relatedOrderId: "ORD-2858",
  },
  {
    id: "NOTIF-003",
    type: "alert",
    title: "Low Inventory Alert",
    message: "Inventory for Bin 3A is running low - restock recommended",
    timestamp: new Date("2026-04-28T14:00:00Z"),
  },
  {
    id: "NOTIF-004",
    type: "order_status",
    title: "Order Completed",
    message: "Order ORD-2862 has been delivered to Golden Acres Farm",
    timestamp: new Date("2026-04-28T12:45:00Z"),
    relatedOrderId: "ORD-2862",
  },
  {
    id: "NOTIF-005",
    type: "system",
    title: "System Maintenance Scheduled",
    message: "Scheduled maintenance window: Sunday 2AM-4AM EST",
    timestamp: new Date("2026-04-28T10:00:00Z"),
  },
  {
    id: "NOTIF-006",
    type: "alert",
    title: "Production Delay",
    message: "Equipment maintenance in progress - production delayed by 30 minutes",
    timestamp: new Date("2026-04-28T08:30:00Z"),
  },
  {
    id: "NOTIF-007",
    type: "system",
    title: "New Feature Available",
    message: "Real-time order tracking is now available in the Orders view",
    timestamp: new Date("2026-04-27T22:00:00Z"),
  },
];

export async function getNotifications(): Promise<Notification[]> {
  await delay(200);
  // When connecting to real API, deserialize timestamp strings:
  // const response = await fetch('/api/notifications');
  // const data = await response.json();
  // return data.map((n: Record<string, unknown>) => ({
  //   ...n,
  //   timestamp: new Date(n.timestamp as string)
  // }));
  return mockNotifications;
}

export { mockNotifications };
