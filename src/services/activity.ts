import { ActivityEvent, ActivityEventType } from "@/types/activity";
import { mockOrders, mockBins } from "./mockData";
import { Order, OrderStatus } from "@/types/order";
import { Bin } from "@/types/bin";

/**
 * Get activity events for a specific customer.
 *
 * Generates timeline events from orders (lifecycle stages) and bins (alert events).
 * Events are sorted by timestamp descending (newest first).
 *
 * @param customerId - The customer ID to retrieve events for
 * @returns Promise resolving to array of activity events, sorted newest first
 */
export async function getActivityEvents(customerId: string): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];

  // Generate events from orders
  const customerOrders = mockOrders.filter((order) => order.customerId === customerId);

  for (const order of customerOrders) {
    events.push(...generateOrderEvents(order));
  }

  // Generate events from bins (only bins with alerts)
  const customerBins = mockBins.filter((bin) => bin.customerId === customerId);

  for (const bin of customerBins) {
    if (bin.alertLevel !== "none") {
      events.push(generateBinAlertEvent(bin));
    }
  }

  // Sort by timestamp descending (newest first)
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return events;
}

/**
 * Generate timeline events for a single order based on its lifecycle stage.
 *
 * Per CONTEXT D-03: One event per order lifecycle stage based on current status.
 * Creates events for all completed stages (e.g., if order is "Ready", creates
 * order_placed, production_started, and ready events).
 *
 * @param order - The order to generate events for
 * @returns Array of activity events representing order lifecycle stages
 */
function generateOrderEvents(order: Order): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const statusProgression: OrderStatus[] = ["Pending", "Producing", "Ready", "In Transit", "Complete"];
  const currentStatusIndex = statusProgression.indexOf(order.status);

  // All orders have order_placed event (use createdAt)
  events.push(createOrderEvent(order, "order_placed", order.createdAt));

  // Add events for each completed lifecycle stage
  if (currentStatusIndex >= 1) {
    // Producing stage reached
    events.push(createOrderEvent(order, "production_started", order.updatedAt));
  }

  if (currentStatusIndex >= 2) {
    // Ready stage reached
    events.push(createOrderEvent(order, "ready", order.updatedAt));
  }

  if (currentStatusIndex >= 3) {
    // In Transit stage reached
    events.push(createOrderEvent(order, "out_for_delivery", order.updatedAt));
  }

  if (currentStatusIndex >= 4) {
    // Complete stage reached
    events.push(createOrderEvent(order, "delivered", order.updatedAt));
  }

  return events;
}

/**
 * Create a single order event with title/description per UI-SPEC copywriting contract.
 *
 * @param order - The order to create event for
 * @param type - The event type (order lifecycle stage)
 * @param timestamp - The timestamp for this event
 * @returns Activity event with formatted title and description
 */
function createOrderEvent(
  order: Order,
  type: Extract<ActivityEventType, 'order_placed' | 'production_started' | 'ready' | 'out_for_delivery' | 'delivered'>,
  timestamp: Date
): ActivityEvent {
  const product = `${order.textureType} ${order.formulaType}`;

  // Title templates per UI-SPEC
  const titles: Record<typeof type, string> = {
    order_placed: `Order #${order.documentNumber} Placed`,
    production_started: `Production Started - Order #${order.documentNumber}`,
    ready: `Order #${order.documentNumber} Ready for Pickup`,
    out_for_delivery: `Order #${order.documentNumber} Out for Delivery`,
    delivered: `Order #${order.documentNumber} Delivered`,
  };

  // Description templates per UI-SPEC
  const descriptions: Record<typeof type, string> = {
    order_placed: `${order.quantity} tons ${product} ordered for delivery`,
    production_started: `Producing ${order.quantity} tons ${product}`,
    ready: "Order ready for shipment",
    out_for_delivery: `Shipment departed for ${order.location}`,
    delivered: `Delivered to ${order.location}`,
  };

  return {
    id: `${order.id}-${type}`,
    customerId: order.customerId,
    type,
    timestamp,
    title: titles[type],
    description: descriptions[type],
    orderId: order.id,
    orderQuantity: order.quantity,
    orderProduct: product,
    orderStatus: order.status,
  };
}

/**
 * Generate bin alert event based on alert level.
 *
 * Creates bin_alert_low or bin_alert_critical event depending on the bin's
 * alertLevel. Only called for bins with alertLevel !== "none".
 *
 * @param bin - The bin to create alert event for
 * @returns Activity event for bin alert
 */
function generateBinAlertEvent(bin: Bin): ActivityEvent {
  const type: ActivityEventType = bin.alertLevel === "critical"
    ? "bin_alert_critical"
    : "bin_alert_low";

  // Title templates per UI-SPEC
  const title = bin.alertLevel === "critical"
    ? `Critical Feed Alert - Bin ${bin.locationCode}`
    : `Low Feed Alert - Bin ${bin.locationCode}`;

  // Description templates per UI-SPEC
  const threshold = bin.alertLevel === "critical" ? "15" : "30";
  const description = `${bin.feedType} level dropped below ${threshold}%`;

  return {
    id: `${bin.id}-${type}`,
    customerId: bin.customerId,
    type,
    timestamp: bin.lastUpdated,
    title,
    description,
    binId: bin.id,
    binLocationCode: bin.locationCode,
    binFillPercentage: bin.fillPercentage,
  };
}
