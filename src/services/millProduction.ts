import { ProductionOrder, MillLine } from "@/types/millProduction";

const mockOrders: ProductionOrder[] = [
  // Premix orders
  {
    id: "1",
    orderNumber: "ORD-255154",
    customer: "Westbridge Farm",
    product: "BROILER BRD 16% OS",
    weightLbs: 6000,
    deliveryTime: "8:30 AM",
    state: "Completed",
    millLine: "Premix",
  },
  {
    id: "2",
    orderNumber: "ORD-255421",
    customer: "Meadowview Poultry",
    product: "BRD PRE-START FINE CR",
    weightLbs: 6000,
    deliveryTime: "9:15 AM",
    state: "Mixing",
    millLine: "Premix",
  },
  {
    id: "3",
    orderNumber: "ORD-255492",
    customer: "Starbird @ Jaedel",
    product: "BROILER BRD LAY 1 T8",
    weightLbs: 12000,
    deliveryTime: "10:00 AM",
    state: "Blocked",
    millLine: "Premix",
  },
  {
    id: "4",
    orderNumber: "ORD-255491",
    customer: "Starbird @ Jaedel",
    product: "BRD DEVELOP PLAIN T8",
    weightLbs: 8000,
    deliveryTime: "11:30 AM",
    state: "Pending",
    millLine: "Premix",
  },

  // Excel orders
  {
    id: "5",
    orderNumber: "ORD-255298",
    customer: "Severinski Farm",
    product: "SEVERINSKI DAIRY MASH",
    weightLbs: 15000,
    deliveryTime: "7:00 AM",
    state: "Completed",
    millLine: "Excel",
  },
  {
    id: "6",
    orderNumber: "ORD-255309",
    customer: "Jireh Farms",
    product: "JIREH COMPUTER PELLET",
    weightLbs: 6000,
    deliveryTime: "7:45 AM",
    state: "Completed",
    millLine: "Excel",
  },
  {
    id: "7",
    orderNumber: "ORD-255300",
    customer: "Corner's Pride Farm",
    product: "CPF ROBOT GRAIN PELLET",
    weightLbs: 18000,
    deliveryTime: "10:30 AM",
    state: "Mixing",
    millLine: "Excel",
  },
  {
    id: "8",
    orderNumber: "ORD-255447",
    customer: "Trilean Makin Bacon",
    product: "FINISHER FEB 2026 WHEY",
    weightLbs: 6000,
    deliveryTime: "1:00 PM",
    state: "Pending",
    millLine: "Excel",
  },

  // CGM orders
  {
    id: "9",
    orderNumber: "ORD-255393",
    customer: "Rockwall @ Peardonville",
    product: "BROILER GROWER I MD",
    weightLbs: 15000,
    deliveryTime: "6:30 AM",
    state: "Completed",
    millLine: "CGM",
  },
  {
    id: "10",
    orderNumber: "ORD-255461",
    customer: "Cedarcroft Poultry",
    product: "BROILER STARTER MD",
    weightLbs: 12000,
    deliveryTime: "9:45 AM",
    state: "Mixing",
    millLine: "CGM",
  },
  {
    id: "11",
    orderNumber: "ORD-255360",
    customer: "Triple H Farms",
    product: "BROIL FINISH 1 PELLET",
    weightLbs: 18000,
    deliveryTime: "11:15 AM",
    state: "Blocked",
    millLine: "CGM",
  },
  {
    id: "12",
    orderNumber: "ORD-255392",
    customer: "Whytebridge Farms",
    product: "BROILER GROWER 2 MD",
    weightLbs: 15000,
    deliveryTime: "2:30 PM",
    state: "Pending",
    millLine: "CGM",
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getProductionOrders(): Promise<ProductionOrder[]> {
  await delay(200 + Math.random() * 100);
  return mockOrders;
}

export async function getOrdersByMillLine(
  millLine: MillLine
): Promise<ProductionOrder[]> {
  await delay(200 + Math.random() * 100);
  return mockOrders.filter((order) => order.millLine === millLine);
}
