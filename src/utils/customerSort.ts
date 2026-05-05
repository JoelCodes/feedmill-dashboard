import { CustomerWithStats } from "@/types/customer";
import { mockOrders } from "@/services/mockData";

/**
 * Gets the most recent delivery date for a customer.
 * Returns null if customer has no orders.
 */
function getMostRecentDeliveryDate(customerId: string): Date | null {
  const customerOrders = mockOrders.filter((order) => order.customerId === customerId);

  if (customerOrders.length === 0) {
    return null;
  }

  // Find the order with the maximum delivery date
  const mostRecentOrder = customerOrders.reduce((latest, current) => {
    return current.deliveryDate > latest.deliveryDate ? current : latest;
  });

  return mostRecentOrder.deliveryDate;
}

/**
 * Sorts customers by most recent order delivery date (descending).
 * Customers with no orders appear at the end.
 */
export function sortCustomersByRecentActivity(
  customers: CustomerWithStats[]
): CustomerWithStats[] {
  // Use spread operator to avoid mutating input array
  return [...customers].sort((a, b) => {
    const aDate = getMostRecentDeliveryDate(a.id);
    const bDate = getMostRecentDeliveryDate(b.id);

    // If a has no date, move to end (return positive)
    if (aDate === null) return 1;

    // If b has no date, a stays before (return negative)
    if (bDate === null) return -1;

    // Both have dates - sort descending (most recent first)
    return bDate.getTime() - aDate.getTime();
  });
}
