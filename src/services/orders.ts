import { Order, OrderStatus } from "@/types/order";
import { mockOrders } from "./mockData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getOrders(): Promise<Order[]> {
  await delay(300);
  return mockOrders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  await delay(200);
  return mockOrders.find(order => order.id === id) || null;
}

export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  await delay(250);
  return mockOrders.filter(order => order.status === status);
}

export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
  await delay(200);
  return mockOrders.filter(order => order.customerId === customerId);
}
