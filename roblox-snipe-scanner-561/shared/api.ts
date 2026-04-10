export type SnipeCategory =
  | "All"
  | "Hat"
  | "Hair"
  | "Face"
  | "Neck"
  | "Shoulder"
  | "Front"
  | "Back"
  | "Waist"
  | "Accessory";

export type SnipeSort =
  | "best-profit"
  | "highest-margin"
  | "lowest-price"
  | "recently-listed";

export type ScannerSource = "live" | "fallback";

export interface KeyValidationRequest {
  key: string;
}

export interface KeyValidationResponse {
  success: boolean;
  message: string;
  accessLabel?: string;
  unlockedAt?: string;
}

export interface SnipeItem {
  id: number;
  name: string;
  category: Exclude<SnipeCategory, "All">;
  thumbnailUrl: string | null;
  itemLink: string;
  currentPrice: number;
  resaleValue: number;
  recentResalePrice: number;
  rap: number | null;
  profit: number;
  profitMargin: number;
  dealScore: number;
  listedAt: string;
  highValue: boolean;
  isHot: boolean;
  source: ScannerSource;
}

export interface SnipeFeedStats {
  totalPotentialProfit: number;
  hotDeals: number;
  averageMargin: number;
  averageDealScore: number;
}

export interface SnipeFeedResponse {
  items: SnipeItem[];
  stats: SnipeFeedStats;
  source: ScannerSource;
  feedStatus: string;
  refreshedAt: string;
  nextRefreshInMs: number;
}
