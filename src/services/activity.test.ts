import { getActivityEvents } from "./activity";

describe("activity service", () => {
  describe("getActivityEvents", () => {
    it("returns empty array for non-existent customer", async () => {
      const events = await getActivityEvents("INVALID-ID");
      expect(events).toHaveLength(0);
    });

    it("returns events sorted by timestamp descending (newest first)", async () => {
      const events = await getActivityEvents("CUST-001");
      expect(events.length).toBeGreaterThan(0);

      // Verify descending order
      for (let i = 0; i < events.length - 1; i++) {
        expect(events[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          events[i + 1].timestamp.getTime()
        );
      }
    });

    it("order events include order_placed type with correct fields", async () => {
      const events = await getActivityEvents("CUST-001");

      const orderPlacedEvents = events.filter((e) => e.type === "order_placed");
      expect(orderPlacedEvents.length).toBeGreaterThan(0);

      const firstOrderEvent = orderPlacedEvents[0];
      expect(firstOrderEvent).toHaveProperty("orderId");
      expect(firstOrderEvent).toHaveProperty("orderQuantity");
      expect(firstOrderEvent).toHaveProperty("orderProduct");
      expect(firstOrderEvent).toHaveProperty("orderStatus");
      expect(firstOrderEvent.customerId).toBe("CUST-001");
    });

    it("bin alert events are generated for bins with alertLevel !== 'none'", async () => {
      // CUST-001 has BIN-002 with fillPercentage 15 (critical)
      const events = await getActivityEvents("CUST-001");

      const binAlertEvents = events.filter((e) =>
        e.type === "bin_alert_low" || e.type === "bin_alert_critical"
      );
      expect(binAlertEvents.length).toBeGreaterThan(0);

      const criticalAlert = binAlertEvents.find((e) => e.type === "bin_alert_critical");
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert!).toHaveProperty("binId");
      expect(criticalAlert!).toHaveProperty("binLocationCode");
      expect(criticalAlert!).toHaveProperty("binFillPercentage");
    });

    it("events include correct title and description per UI-SPEC copywriting contract", async () => {
      const events = await getActivityEvents("CUST-001");

      // Test order_placed title format
      const orderPlacedEvent = events.find((e) => e.type === "order_placed");
      if (orderPlacedEvent) {
        expect(orderPlacedEvent.title).toMatch(/^Order #\d+ Placed$/);
        expect(orderPlacedEvent.description).toMatch(/^\d+(\.\d+)? tons .+ ordered for delivery$/);
      }

      // Test bin alert title format
      const binAlertEvent = events.find((e) =>
        e.type === "bin_alert_low" || e.type === "bin_alert_critical"
      );
      if (binAlertEvent) {
        expect(binAlertEvent.title).toMatch(/(Low|Critical) Feed Alert - Bin .+/);
        expect(binAlertEvent.description).toMatch(/.+ level dropped below (30|15)%/);
      }
    });

    it("delivery events (delivered type) are generated for Complete orders", async () => {
      // CUST-016 (Golden Acres Farm) has ORD-2862 with status "Complete"
      const events = await getActivityEvents("CUST-016");

      const deliveredEvents = events.filter((e) => e.type === "delivered");
      expect(deliveredEvents.length).toBeGreaterThan(0);

      const deliveredEvent = deliveredEvents[0];
      expect(deliveredEvent.title).toMatch(/^Order #\d+ Delivered$/);
      expect(deliveredEvent.description).toMatch(/^Delivered to .+$/);
    });

    it("production_started events are generated for Producing status orders", async () => {
      // CUST-005 (Lakeside Aqua) has ORD-2851 with status "Producing"
      const events = await getActivityEvents("CUST-005");

      const productionEvents = events.filter((e) => e.type === "production_started");
      expect(productionEvents.length).toBeGreaterThan(0);

      const productionEvent = productionEvents[0];
      expect(productionEvent.title).toMatch(/^Production Started - Order #\d+$/);
      expect(productionEvent.description).toMatch(/^Producing \d+(\.\d+)? tons .+$/);
    });

    it("ready events are generated for Ready status orders", async () => {
      // CUST-009 (Westfield Farms) has ORD-2855 with status "Ready"
      const events = await getActivityEvents("CUST-009");

      const readyEvents = events.filter((e) => e.type === "ready");
      expect(readyEvents.length).toBeGreaterThan(0);

      const readyEvent = readyEvents[0];
      expect(readyEvent.title).toMatch(/^Order #\d+ Ready for Pickup$/);
      expect(readyEvent.description).toBe("Order ready for shipment");
    });

    it("out_for_delivery events are generated for In Transit status orders", async () => {
      // CUST-012 (Meadowbrook Dairy) has ORD-2858 with status "In Transit"
      const events = await getActivityEvents("CUST-012");

      const transitEvents = events.filter((e) => e.type === "out_for_delivery");
      expect(transitEvents.length).toBeGreaterThan(0);

      const transitEvent = transitEvents[0];
      expect(transitEvent.title).toMatch(/^Order #\d+ Out for Delivery$/);
      expect(transitEvent.description).toMatch(/^Shipment departed for .+$/);
    });
  });
});
