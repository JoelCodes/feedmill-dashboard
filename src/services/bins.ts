import { Bin } from "@/types/bin";
import { mockBins } from "./mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBins(): Promise<Bin[]> {
  await delay(300);
  return mockBins;
}

export async function getBinsByCustomerId(customerId: string): Promise<Bin[]> {
  await delay(250);
  return mockBins.filter((bin) => bin.customerId === customerId);
}
