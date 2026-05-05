import { BinAlertLevel } from "./bin";

export type { BinAlertLevel };

export interface Customer {
  id: string;
  name: string;
  location: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  hasChanges: boolean;
  binAlertLevel: BinAlertLevel;
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats;
}
