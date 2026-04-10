import type { RequestHandler } from "express";
import { z } from "zod";
import type {
  KeyValidationResponse,
  SnipeCategory,
  SnipeFeedResponse,
  SnipeItem,
} from "@shared/api";

const KEY_TTL_MS = 1000 * 60 * 60 * 12;
const FEED_CACHE_TTL_MS = 1000 * 60 * 30; // Cache feed for 30 minutes
const MARKET_SCAN_LIMIT = 18;

const keySchema = z.object({
  key: z.string().trim().min(1).max(64),
});

type CatalogSearchResponse = {
  data?: CatalogSearchItem[];
};

type CatalogSearchItem = {
  id: number;
  name: string;
  itemType?: string;
  creatorName?: string;
  lowestPrice?: number | null;
  price?: number | null;
  assetType?: number | null;
  updated?: string;
  itemRestrictions?: string[];
};

type ThumbnailResponse = {
  data?: Array<{
    targetId: number;
    imageUrl?: string;
  }>;
};

type ResaleDataResponse = {
  recentAveragePrice?: number;
  priceDataPoints?: Array<{
    value?: number;
    date?: string;
  }>;
};

type FeedCache = {
  generatedAt: number;
  payload: SnipeFeedResponse;
};

const DEFAULT_KEYS = [
  ["SNIPEZ-ALPHA", "Founders key"],
  ["LIMITED-HUNTER", "Operator key"],
  ["UGC-PREMIUM", "Premium access"],
  ["8F2-91KL-7XP4-3MZ0-QC6", "Custom access"],
] as const;

let feedCache: FeedCache | null = null;
let lastLiveSearchAttempt = 0;
const LIVE_SEARCH_RETRY_DELAY = 1000 * 60 * 5; // Only retry live search every 5 minutes

let proxyList: string[] = [];
let currentProxyIndex = 0;
let lastProxyRefresh = 0;
const PROXY_REFRESH_INTERVAL = 1000 * 60 * 10; // Refresh proxy list every 10 minutes

export const handleValidateKey: RequestHandler = (req, res) => {
  const parsed = keySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Enter a valid access key.",
    } satisfies KeyValidationResponse);
    return;
  }

  const normalizedKey = normalizeKey(parsed.data.key);
  const validKeys = getValidKeys();
  const accessLabel = validKeys.get(normalizedKey);

  if (!accessLabel) {
    res.status(401).json({
      success: false,
      message: "Key not recognized. Check the code and try again.",
    } satisfies KeyValidationResponse);
    return;
  }

  res.status(200).json({
    success: true,
    message: "Access granted. Scanner unlocked.",
    accessLabel,
    unlockedAt: new Date(Date.now() + KEY_TTL_MS).toISOString(),
  } satisfies KeyValidationResponse);
};

export const handleSnipeFeed: RequestHandler = async (_req, res) => {
  const now = Date.now();

  if (feedCache && now - feedCache.generatedAt < FEED_CACHE_TTL_MS) {
    res.status(200).json(feedCache.payload);
    return;
  }

  const payload = await buildFeed();
  feedCache = {
    generatedAt: now,
    payload,
  };

  res.status(200).json(payload);
};

async function buildFeed(): Promise<SnipeFeedResponse> {
  const now = Date.now();
  const shouldRetryLiveSearch = now - lastLiveSearchAttempt > LIVE_SEARCH_RETRY_DELAY;

  if (shouldRetryLiveSearch) {
    try {
      lastLiveSearchAttempt = now;
      const liveItems = await attemptLiveScan();

      if (liveItems.length > 0) {
        return createFeedResponse(
          liveItems,
          "live",
          "Live Roblox scan • refreshed from public marketplace APIs.",
        );
      }
    } catch (error) {
      console.error("Live scan failed:", error instanceof Error ? error.message : String(error));
    }
  }

  const fallbackItems = await buildFallbackDeals();
  return createFeedResponse(
    fallbackItems,
    "fallback",
    "Seeded market snapshot • live marketplace scan is ready for future provider upgrades.",
  );
}

async function attemptLiveScan(): Promise<SnipeItem[]> {
  try {
    console.log("Attempting live scan from Roblox API...");

    // Try various search terms that might be less rate limited
    const searchTerms = ["accessory", "ugc", "limited"];
    let response: CatalogSearchResponse | null = null;

    for (const keyword of searchTerms) {
      try {
        console.log(`Trying search with keyword: ${keyword}`);
        response = await fetchJson<CatalogSearchResponse>(
          `https://catalog.roblox.com/v1/search/items/details?keyword=${keyword}&limit=30&sortType=3`
        );

        if (response.data && response.data.length > 0) {
          console.log(`Success with keyword "${keyword}"`);
          break;
        }
      } catch (err) {
        console.log(`Search with "${keyword}" failed: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    }

    if (!response) {
      console.log("All search attempts failed");
      return [];
    }

    const candidates = response.data ?? [];
    console.log(`Got ${candidates.length} candidates from successful search`);

    if (candidates.length === 0) {
      return [];
    }

    const collectibleCandidates = candidates
      .filter((item) => {
        const restrictions = item.itemRestrictions ?? [];
        const isCollectible = restrictions.length === 0 || restrictions.includes("Collectible") || restrictions.includes("Limited");
        const isLikelyUgcCreator = Boolean(item.creatorName && item.creatorName.toLowerCase() !== "roblox");
        const hasPrice = Number(item.lowestPrice ?? item.price ?? 0) > 0;
        return isCollectible && isLikelyUgcCreator && hasPrice;
      })
      .slice(0, MARKET_SCAN_LIMIT);

    console.log(`Filtered down to ${collectibleCandidates.length} collectible candidates`);

    if (collectibleCandidates.length === 0) {
      return [];
    }

    const enrichedItems = [];
    for (let i = 0; i < collectibleCandidates.length; i++) {
      const item = collectibleCandidates[i];
      try {
        console.log(`Fetching resale data for item ${item.id} (${i + 1}/${collectibleCandidates.length})...`);

        const resale = await fetchJson<ResaleDataResponse>(
          `https://economy.roblox.com/v1/assets/${item.id}/resale-data`,
        );

        const currentPrice = roundCurrency(item.lowestPrice ?? item.price ?? 0);
        const rap = roundCurrency(resale.recentAveragePrice ?? 0);
        const recentResalePrice = roundCurrency(getRecentResale(resale));
        const resaleValue = roundCurrency(Math.max(rap, recentResalePrice));

        if (currentPrice <= 0 || resaleValue <= currentPrice) {
          console.log(`Item ${item.id} not profitable (current: ${currentPrice}, resale: ${resaleValue}), skipping`);
          enrichedItems.push(null);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        const enrichedItem = decorateItem({
          id: item.id,
          name: item.name,
          category: getCategory(item.assetType),
          thumbnailUrl: null,
          itemLink: `https://www.roblox.com/catalog/${item.id}`,
          currentPrice,
          resaleValue,
          recentResalePrice,
          rap: rap > 0 ? rap : null,
          listedAt: item.updated ?? new Date().toISOString(),
          source: "live",
        });

        console.log(`Item ${item.id} is profitable: profit=${enrichedItem.profit}, margin=${enrichedItem.profitMargin}%`);
        enrichedItems.push(enrichedItem);

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`Resale data fetch failed for item ${item.id}: ${error instanceof Error ? error.message : String(error)}, continuing...`);
        enrichedItems.push(null);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const filteredItems = enrichedItems
      .filter((item): item is SnipeItem => Boolean(item))
      .sort((left, right) => right.dealScore - left.dealScore)
      .slice(0, MARKET_SCAN_LIMIT);

    // Fetch and attach thumbnails
    if (filteredItems.length > 0) {
      try {
        console.log(`Fetching thumbnails for ${filteredItems.length} items...`);
        const assetIds = filteredItems.map((item) => item.id);
        const thumbnailMap = await fetchThumbnailMap(assetIds);

        const results = filteredItems.map((item) => ({
          ...item,
          thumbnailUrl: thumbnailMap.get(item.id) ?? null,
        }));

        console.log(`Live scan complete: found ${results.length} profitable items with thumbnails`);
        return results;
      } catch (error) {
        console.log(`Thumbnail fetch failed: ${error instanceof Error ? error.message : String(error)}, continuing without thumbnails`);
        console.log(`Live scan complete: found ${filteredItems.length} profitable items without thumbnails`);
        return filteredItems;
      }
    }

    console.log(`Live scan complete: found ${filteredItems.length} profitable items`);
    return filteredItems;
  } catch (error) {
    console.error("Live scan search failed:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

async function buildFallbackDeals(): Promise<SnipeItem[]> {
  const now = Date.now();

  // Use a seed based on the date to get consistent but varied results
  const daySeed = Math.floor(now / (1000 * 60 * 60 * 24));

  const allDemos = [
    {
      id: 1365767,
      name: "Vortex Halo Visor",
      category: "Hat" as const,
      currentPrice: 95,
      resaleValue: 2990,
      recentResalePrice: 2865,
      rap: 2740,
      minutesAgo: 4,
    },
    {
      id: 1579122,
      name: "Chrome Phantom Horns",
      category: "Accessory" as const,
      currentPrice: 320,
      resaleValue: 1840,
      recentResalePrice: 1750,
      rap: 1695,
      minutesAgo: 11,
    },
    {
      id: 1506434,
      name: "Aurora Signal Headset",
      category: "Hair" as const,
      currentPrice: 210,
      resaleValue: 1285,
      recentResalePrice: 1200,
      rap: 1140,
      minutesAgo: 16,
    },
    {
      id: 1381154,
      name: "Biohazard Pulse Mask",
      category: "Face" as const,
      currentPrice: 480,
      resaleValue: 1680,
      recentResalePrice: 1595,
      rap: 1540,
      minutesAgo: 21,
    },
    {
      id: 1589549,
      name: "Nebula Shoulder Drone",
      category: "Shoulder" as const,
      currentPrice: 150,
      resaleValue: 920,
      recentResalePrice: 880,
      rap: 835,
      minutesAgo: 29,
    },
    {
      id: 1579134,
      name: "Shadow Arc Back Gear",
      category: "Back" as const,
      currentPrice: 650,
      resaleValue: 1940,
      recentResalePrice: 1870,
      rap: 1805,
      minutesAgo: 33,
    },
    {
      id: 1506282,
      name: "Iridescent Waist Chain",
      category: "Waist" as const,
      currentPrice: 125,
      resaleValue: 760,
      recentResalePrice: 725,
      rap: 690,
      minutesAgo: 39,
    },
    {
      id: 1589552,
      name: "Flux Front Reactor",
      category: "Front" as const,
      currentPrice: 275,
      resaleValue: 1230,
      recentResalePrice: 1180,
      rap: 1125,
      minutesAgo: 46,
    },
    {
      id: 1365800,
      name: "Crystalline Tiara",
      category: "Hat" as const,
      currentPrice: 45,
      resaleValue: 850,
      recentResalePrice: 820,
      rap: 795,
      minutesAgo: 2,
    },
    {
      id: 1506445,
      name: "Digital Aura Wings",
      category: "Back" as const,
      currentPrice: 380,
      resaleValue: 1520,
      recentResalePrice: 1480,
      rap: 1450,
      minutesAgo: 8,
    },
    {
      id: 1579145,
      name: "Prism Face Mark",
      category: "Face" as const,
      currentPrice: 290,
      resaleValue: 1420,
      recentResalePrice: 1350,
      rap: 1300,
      minutesAgo: 14,
    },
    {
      id: 1381200,
      name: "Celestial Pendant",
      category: "Neck" as const,
      currentPrice: 165,
      resaleValue: 890,
      recentResalePrice: 850,
      rap: 820,
      minutesAgo: 19,
    },
  ];

  // Use seed to rotate which items are shown
  const rotatedItems = allDemos
    .sort((a, b) => (daySeed + a.id) - (daySeed + b.id))
    .slice(0, 8);

  const decoratedItems = rotatedItems.map(item => decorateItem({
    id: item.id,
    name: item.name,
    category: item.category,
    thumbnailUrl: null,
    itemLink: `https://www.roblox.com/catalog/${item.id}`,
    currentPrice: item.currentPrice,
    resaleValue: item.resaleValue,
    recentResalePrice: item.recentResalePrice,
    rap: item.rap,
    listedAt: new Date(now - 1000 * 60 * item.minutesAgo).toISOString(),
    source: "fallback",
  }));

  // Fetch and attach thumbnails
  try {
    console.log(`Fetching thumbnails for ${decoratedItems.length} fallback items...`);
    const assetIds = decoratedItems.map((item) => item.id);
    const thumbnailMap = await fetchThumbnailMap(assetIds);

    return decoratedItems.map((item) => ({
      ...item,
      thumbnailUrl: thumbnailMap.get(item.id) ?? null,
    }));
  } catch (error) {
    console.log(`Thumbnail fetch failed for fallback items: ${error instanceof Error ? error.message : String(error)}, continuing without thumbnails`);
    return decoratedItems;
  }
}

function createFeedResponse(
  items: SnipeItem[],
  source: SnipeFeedResponse["source"],
  feedStatus: string,
): SnipeFeedResponse {
  const stats = {
    totalPotentialProfit: roundCurrency(
      items.reduce((total, item) => total + item.profit, 0),
    ),
    hotDeals: items.filter((item) => item.isHot).length,
    averageMargin: roundNumber(
      items.reduce((total, item) => total + item.profitMargin, 0) / Math.max(items.length, 1),
    ),
    averageDealScore: roundNumber(
      items.reduce((total, item) => total + item.dealScore, 0) / Math.max(items.length, 1),
    ),
  };

  return {
    items,
    stats,
    source,
    feedStatus,
    refreshedAt: new Date().toISOString(),
    nextRefreshInMs: FEED_CACHE_TTL_MS,
  };
}

function decorateItem(
  item: Omit<SnipeItem, "profit" | "profitMargin" | "dealScore" | "highValue" | "isHot">,
): SnipeItem {
  const profit = roundCurrency(item.resaleValue - item.currentPrice);
  const profitMargin = roundNumber((profit / Math.max(item.currentPrice, 1)) * 100);
  const rapBoost = item.rap ? ((item.rap - item.currentPrice) / item.rap) * 100 : 0;
  const dealScore = roundNumber(
    Math.max(0, Math.min(999, profit * 0.045 + profitMargin * 0.7 + rapBoost * 0.45)),
  );

  return {
    ...item,
    profit,
    profitMargin,
    dealScore,
    highValue: profit >= 1000 || profitMargin >= 250,
    isHot: profit >= 1800 || profitMargin >= 500,
  };
}

async function fetchThumbnailMap(assetIds: number[]): Promise<Map<number, string>> {
  if (assetIds.length === 0) {
    return new Map();
  }

  const response = await fetchJson<ThumbnailResponse>(
    `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(",")}&size=420x420&format=Png&isCircular=false`,
  );

  return new Map(
    (response.data ?? [])
      .filter((item): item is { targetId: number; imageUrl: string } => Boolean(item.imageUrl))
      .map((item) => [item.targetId, item.imageUrl]),
  );
}

async function refreshProxyList(): Promise<void> {
  const now = Date.now();
  if (proxyList.length > 0 && now - lastProxyRefresh < PROXY_REFRESH_INTERVAL) {
    return; // Use cached list
  }

  try {
    console.log("Refreshing proxy list...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("https://www.proxy-list.download/api/v1/get?type=http", {
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json() as { data?: { proxy: string }[] };
        if (data.data && Array.isArray(data.data)) {
          proxyList = data.data.slice(0, 50).map(p => p.proxy);
          lastProxyRefresh = now;
          currentProxyIndex = 0;
          console.log(`Loaded ${proxyList.length} proxies`);
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.log(`Failed to fetch proxy list: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getNextProxy(): string | null {
  if (proxyList.length === 0) {
    return null;
  }
  const proxy = proxyList[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
  return proxy;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    // Array of free CORS proxy services to rotate through
    // No need to refresh - these are always available
    const proxyServices = [
      (proxyUrl: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(proxyUrl)}`,
      (proxyUrl: string) => `https://jsonp.afeld.me/?url=${encodeURIComponent(proxyUrl)}`,
      (proxyUrl: string) => `https://cors.bridged.cc/${proxyUrl}`,
      (proxyUrl: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(proxyUrl)}`,
    ];

    // Try each proxy service
    for (let i = 0; i < proxyServices.length; i++) {
      try {
        const proxyService = proxyServices[(currentProxyIndex + i) % proxyServices.length];
        const proxyUrl = proxyService(url);
        console.log(`Attempting proxy service ${(currentProxyIndex + i) % proxyServices.length + 1}...`);

        const response = await fetch(proxyUrl, {
          headers: {
            "Accept": "application/json",
          },
          signal: controller.signal,
        });

        if (response.ok) {
          console.log(`✓ Proxy service succeeded`);
          currentProxyIndex = (currentProxyIndex + 1) % proxyServices.length;
          return (await response.json()) as T;
        }
      } catch (error) {
        console.log(`Proxy service failed: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
    }

    // Fallback to direct request
    console.log(`All proxies failed, trying direct request...`);
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.roblox.com/",
        "Origin": "https://www.roblox.com",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function getRecentResale(resale: ResaleDataResponse): number {
  const prices = (resale.priceDataPoints ?? [])
    .map((point) => point.value ?? 0)
    .filter((value) => value > 0);

  if (prices.length === 0) {
    return resale.recentAveragePrice ?? 0;
  }

  const recentPoints = prices.slice(-5);
  return recentPoints.reduce((total, value) => total + value, 0) / recentPoints.length;
}

function getCategory(assetType?: number | null): Exclude<SnipeCategory, "All"> {
  switch (assetType) {
    case 8:
      return "Hat";
    case 41:
      return "Hair";
    case 42:
      return "Face";
    case 43:
      return "Neck";
    case 44:
      return "Shoulder";
    case 45:
      return "Front";
    case 46:
      return "Back";
    case 47:
      return "Waist";
    default:
      return "Accessory";
  }
}

function getValidKeys(): Map<string, string> {
  const envKeys = process.env.SNIPEZ_KEYS?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [key, label] = entry.split(":");
      return [normalizeKey(key), label?.trim() || "Custom access"] as const;
    });

  const sourceKeys = envKeys && envKeys.length > 0 ? envKeys : DEFAULT_KEYS;
  return new Map(sourceKeys.map(([key, label]) => [normalizeKey(key), label]));
}

function normalizeKey(key: string): string {
  return key.trim().toUpperCase();
}

function mergeUniqueCatalogItems(
  existing: CatalogSearchItem[],
  incoming: CatalogSearchItem[],
): CatalogSearchItem[] {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];

  for (const item of incoming) {
    if (seen.has(item.id)) {
      continue;
    }

    merged.push(item);
    seen.add(item.id);
  }

  return merged;
}

function roundCurrency(value: number): number {
  return Math.max(0, Math.round(value));
}

function roundNumber(value: number): number {
  return Math.round(value * 10) / 10;
}
