import { sortCustomersByRecentActivity } from "./customerSort";
import { CustomerWithStats } from "@/types/customer";

describe("sortCustomersByRecentActivity", () => {
  // Helper to create test customers
  const createCustomer = (id: string, name: string): CustomerWithStats => ({
    id,
    name,
    location: "Test Location",
    createdAt: new Date(),
    updatedAt: new Date(),
    stats: {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      hasChanges: false,
      binAlertLevel: "none",
      activeBins: 0,
    },
  });

  it("should sort customers by most recent delivery date (descending)", () => {
    // CUST-001 has delivery 2026-03-12
    // CUST-002 has delivery 2026-03-13
    // CUST-003 has delivery 2026-03-14
    const customers = [
      createCustomer("CUST-001", "Greenfield Farms"),
      createCustomer("CUST-003", "Sunrise Poultry Corporation"),
      createCustomer("CUST-002", "Valley Ranch Operations"),
    ];

    const sorted = sortCustomersByRecentActivity(customers);

    // Most recent first: CUST-003 (Mar 14) > CUST-002 (Mar 13) > CUST-001 (Mar 12)
    expect(sorted[0].id).toBe("CUST-003");
    expect(sorted[1].id).toBe("CUST-002");
    expect(sorted[2].id).toBe("CUST-001");
  });

  it("should place customers with no orders at the end", () => {
    const customers = [
      createCustomer("CUST-001", "Greenfield Farms"), // Has orders
      createCustomer("CUST-999", "No Orders Customer"), // No orders
      createCustomer("CUST-003", "Sunrise Poultry Corporation"), // Has orders
    ];

    const sorted = sortCustomersByRecentActivity(customers);

    // Customer with no orders should be last
    expect(sorted[2].id).toBe("CUST-999");
    // Customers with orders should be first (sorted by delivery date)
    expect(sorted[0].id).toBe("CUST-003"); // Mar 14
    expect(sorted[1].id).toBe("CUST-001"); // Mar 12
  });

  it("should preserve stable order for customers with no orders", () => {
    const customers = [
      createCustomer("CUST-999", "No Orders A"),
      createCustomer("CUST-998", "No Orders B"),
      createCustomer("CUST-997", "No Orders C"),
    ];

    const sorted = sortCustomersByRecentActivity(customers);

    // Should maintain original order
    expect(sorted[0].id).toBe("CUST-999");
    expect(sorted[1].id).toBe("CUST-998");
    expect(sorted[2].id).toBe("CUST-997");
  });

  it("should handle empty array", () => {
    const sorted = sortCustomersByRecentActivity([]);
    expect(sorted).toEqual([]);
  });

  it("should handle single customer", () => {
    const customers = [createCustomer("CUST-001", "Greenfield Farms")];
    const sorted = sortCustomersByRecentActivity(customers);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("CUST-001");
  });

  it("should sort by exact datetime not just date", () => {
    // CUST-001: Mar 12 08:00, CUST-005: Mar 12 14:00
    // Even though same day, CUST-005 is later in the day so should come first
    const customers = [
      createCustomer("CUST-001", "Greenfield Farms"),
      createCustomer("CUST-005", "Lakeside Aqua"),
    ];

    const sorted = sortCustomersByRecentActivity(customers);

    // CUST-005 has later time on same day (14:00 vs 08:00)
    expect(sorted).toHaveLength(2);
    expect(sorted[0].id).toBe("CUST-005"); // Mar 12 14:00
    expect(sorted[1].id).toBe("CUST-001"); // Mar 12 08:00
  });

  it("should not mutate the input array", () => {
    const customers = [
      createCustomer("CUST-003", "Sunrise Poultry Corporation"),
      createCustomer("CUST-001", "Greenfield Farms"),
    ];

    const original = [...customers];
    sortCustomersByRecentActivity(customers);

    // Original array should be unchanged
    expect(customers).toEqual(original);
  });
});
