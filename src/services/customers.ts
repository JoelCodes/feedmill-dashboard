import { CustomerStats, CustomerWithStats } from "@/types/customer";
import { Bin, BinAlertLevel } from "@/types/bin";
import { mockCustomers, mockOrders, mockBins } from "./mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate the highest bin alert level from a list of bins.
 * Priority: critical > low > none
 */
function calculateBinAlertLevel(bins: Bin[]): BinAlertLevel {
  if (bins.some((bin) => bin.alertLevel === "critical")) {
    return "critical";
  }
  if (bins.some((bin) => bin.alertLevel === "low")) {
    return "low";
  }
  return "none";
}

/**
 * Calculate stats for a customer based on their orders and bins.
 */
function calculateCustomerStats(customerId: string): CustomerStats {
  // Get all orders for this customer
  const customerOrders = mockOrders.filter(
    (order) => order.customerId === customerId
  );

  // Get all bins for this customer
  const customerBins = mockBins.filter((bin) => bin.customerId === customerId);

  // Calculate order counts
  const totalOrders = customerOrders.length;
  const completedOrders = customerOrders.filter(
    (order) => order.status === "Complete"
  ).length;
  const activeOrders = totalOrders - completedOrders;

  // Check if any order has changes
  const hasChanges = customerOrders.some((order) => order.hasChanges);

  // Calculate bin alert level
  const binAlertLevel = calculateBinAlertLevel(customerBins);

  return {
    totalOrders,
    activeOrders,
    completedOrders,
    hasChanges,
    binAlertLevel,
  };
}

/**
 * Get all customers with computed stats.
 */
export async function getCustomers(): Promise<CustomerWithStats[]> {
  await delay(300);

  return mockCustomers.map((customer) => ({
    ...customer,
    stats: calculateCustomerStats(customer.id),
  }));
}

/**
 * Get a single customer by ID with computed stats.
 * Returns null if customer not found.
 */
export async function getCustomerById(
  id: string
): Promise<CustomerWithStats | null> {
  await delay(200);

  const customer = mockCustomers.find((c) => c.id === id);
  if (!customer) {
    return null;
  }

  return {
    ...customer,
    stats: calculateCustomerStats(customer.id),
  };
}
