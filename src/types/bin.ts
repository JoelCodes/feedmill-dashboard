export type BinAlertLevel = "none" | "low" | "critical";

export interface Bin {
  id: string;
  customerId: string;
  locationCode: string;
  feedType: string;
  capacityTons: number;
  currentFillTons: number;
  fillPercentage: number;
  alertLevel: BinAlertLevel;
  lastUpdated: Date;
}
