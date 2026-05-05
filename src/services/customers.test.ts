import { getCustomers, getCustomerById } from "./customers";

describe("customers service", () => {
  describe("getCustomers", () => {
    it("returns array with length 18 (all customers)", async () => {
      const customers = await getCustomers();
      expect(customers).toHaveLength(18);
    });

    it("first customer has id property", async () => {
      const customers = await getCustomers();
      expect(customers[0]).toHaveProperty("id");
    });

    it("first customer has stats object with totalOrders property", async () => {
      const customers = await getCustomers();
      expect(customers[0]).toHaveProperty("stats");
      expect(customers[0].stats).toHaveProperty("totalOrders");
    });

    it("customer with orders has totalOrders > 0", async () => {
      const customers = await getCustomers();
      // CUST-001 (Greenfield Farms) has order ORD-2847
      const greenfield = customers.find((c) => c.id === "CUST-001");
      expect(greenfield).toBeDefined();
      expect(greenfield!.stats.totalOrders).toBeGreaterThan(0);
    });

    it("customer with completed orders has completedOrders > 0", async () => {
      const customers = await getCustomers();
      // CUST-016 (Golden Acres Farm) has order ORD-2862 with status "Complete"
      const goldenAcres = customers.find((c) => c.id === "CUST-016");
      expect(goldenAcres).toBeDefined();
      expect(goldenAcres!.stats.completedOrders).toBeGreaterThan(0);
    });

    it("customer with bin at critical level has binAlertLevel 'critical'", async () => {
      const customers = await getCustomers();
      // CUST-001 (Greenfield Farms) has BIN-002 with fillPercentage 15 (<20%) = critical
      const greenfield = customers.find((c) => c.id === "CUST-001");
      expect(greenfield).toBeDefined();
      expect(greenfield!.stats.binAlertLevel).toBe("critical");
    });

    it("customer stats has correct activeOrders count", async () => {
      const customers = await getCustomers();
      // CUST-001 has 1 order (ORD-2847) with status "Pending" (not Complete)
      const greenfield = customers.find((c) => c.id === "CUST-001");
      expect(greenfield).toBeDefined();
      expect(greenfield!.stats.activeOrders).toBe(1);
    });

    it("customer with order changes has hasChanges true", async () => {
      const customers = await getCustomers();
      // CUST-002 (Valley Ranch Operations) has ORD-2848 with hasChanges: true
      const valleyRanch = customers.find((c) => c.id === "CUST-002");
      expect(valleyRanch).toBeDefined();
      expect(valleyRanch!.stats.hasChanges).toBe(true);
    });
  });

  describe("getCustomerById", () => {
    it("returns customer with id 'CUST-001'", async () => {
      const customer = await getCustomerById("CUST-001");
      expect(customer).not.toBeNull();
      expect(customer!.id).toBe("CUST-001");
    });

    it("returns null for invalid id", async () => {
      const customer = await getCustomerById("INVALID");
      expect(customer).toBeNull();
    });

    it("returns customer with stats computed", async () => {
      const customer = await getCustomerById("CUST-001");
      expect(customer).not.toBeNull();
      expect(customer!.stats).toBeDefined();
      expect(customer!.stats.totalOrders).toBeGreaterThanOrEqual(0);
      expect(customer!.stats.activeOrders).toBeGreaterThanOrEqual(0);
      expect(customer!.stats.completedOrders).toBeGreaterThanOrEqual(0);
      expect(typeof customer!.stats.hasChanges).toBe("boolean");
      expect(["none", "low", "critical"]).toContain(customer!.stats.binAlertLevel);
    });
  });
});
