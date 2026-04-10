import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SnipeCategory, SnipeItem, SnipeSort } from "@shared/api";
import {
  Activity,
  BadgeDollarSign,
  Filter,
  Flame,
  LayoutGrid,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSnipeFeed } from "@/hooks/use-snipe-feed";
import { cn } from "@/lib/utils";
import { SnipeCard } from "./snipe-card";

const categories: SnipeCategory[] = [
  "All",
  "Hat",
  "Hair",
  "Face",
  "Neck",
  "Shoulder",
  "Front",
  "Back",
  "Waist",
  "Accessory",
];

const sortOptions: Array<{ value: SnipeSort; label: string }> = [
  { value: "best-profit", label: "Best profit" },
  { value: "highest-margin", label: "Highest %" },
  { value: "lowest-price", label: "Lowest price" },
  { value: "recently-listed", label: "Recently listed" },
];

const compactCurrency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const wholeNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function Dashboard() {
  const { data, error, isLoading, isFetching, refetch } = useSnipeFeed();
  const [minMargin, setMinMargin] = useState(80);
  const [maxPrice, setMaxPrice] = useState(1200);
  const [category, setCategory] = useState<SnipeCategory>("All");
  const [sortBy, setSortBy] = useState<SnipeSort>("best-profit");
  const previousIds = useRef<string>("");

  useEffect(() => {
    if (!data) {
      return;
    }

    const ids = data.items.map((item) => item.id).join(",");

    if (previousIds.current && previousIds.current !== ids) {
      const previousSet = new Set(previousIds.current.split(",").filter(Boolean));
      const newDeals = data.items.filter((item) => !previousSet.has(String(item.id)));

      if (newDeals.length > 0) {
        toast("New snipes detected", {
          description: `${newDeals.length} fresh deals entered the board.`,
        });
      }
    }

    previousIds.current = ids;
  }, [data]);

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];

    return [...items]
      .filter((item) => item.profitMargin >= minMargin)
      .filter((item) => item.currentPrice <= maxPrice)
      .filter((item) => category === "All" || item.category === category)
      .sort((left, right) => sortItems(left, right, sortBy));
  }, [category, data?.items, maxPrice, minMargin, sortBy]);

  const filteredProfit = useMemo(
    () => filteredItems.reduce((total, item) => total + item.profit, 0),
    [filteredItems],
  );

  if (error) {
    return (
      <section className="rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">Scanner status</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">Feed unavailable</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          The marketplace feed could not be loaded. Try refreshing the scan or wait for the
          next cache cycle.
        </p>
        <Button
          className="mt-6 h-12 rounded-2xl bg-primary text-primary-foreground"
          onClick={() => refetch()}
        >
          Retry feed
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-card/80 p-7 shadow-glow backdrop-blur-xl sm:p-8">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-brand-violet/25 blur-3xl" />
          <div className="absolute right-0 top-8 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
              <Activity className="h-4 w-4" />
              {data?.source === "live" ? "Live scan" : "Seeded snapshot"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Cached refresh every 45 seconds
            </span>
          </div>

          <div className="relative mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
                Surface the best Roblox limited UGC snipes in one live command center.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Compare listing price, resale value, RAP, and margin in a single ranked feed.
                Tight filters keep the board focused on profitable listings that fit your budget.
              </p>
            </div>

            <Button
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-background/70 px-5 text-foreground hover:bg-white/10"
              onClick={() => refetch()}
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Refresh scan
            </Button>
          </div>

          <div className="relative mt-8 rounded-[28px] border border-white/10 bg-background/65 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
                  Total potential profit
                </p>
                <p className="mt-3 font-display text-4xl font-semibold text-primary sm:text-5xl">
                  R${compactCurrency.format((filteredProfit || data?.stats.totalPotentialProfit) ?? 0)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{data?.feedStatus ?? "Preparing scanner"}</p>
                <p className="mt-1">
                  Refreshed {data ? formatRefreshTime(data.refreshedAt) : "just now"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <StatCard
            icon={BadgeDollarSign}
            label="Average margin"
            value={`${wholeNumber.format(data?.stats.averageMargin ?? minMargin)}%`}
            hint="Across visible snipes"
          />
          <StatCard
            icon={Flame}
            label="Hot deals"
            value={String(data?.stats.hotDeals ?? 0)}
            hint="Extreme spread or margin"
          />
          <StatCard
            icon={Wallet}
            label="Budget cap"
            value={`R$${wholeNumber.format(maxPrice)}`}
            hint="Maximum current price"
          />
          <StatCard
            icon={Sparkles}
            label="Deal score avg"
            value={wholeNumber.format(data?.stats.averageDealScore ?? 0)}
            hint="Weighted by spread + RAP"
          />
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-card/80 p-6 shadow-card backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-muted-foreground">
              <Filter className="h-4 w-4" />
              Deal filters
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold">Shape the live board</h2>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
            <LayoutGrid className="h-4 w-4 text-primary" />
            {filteredItems.length} deals visible
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_1fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-background/60 p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Minimum profit margin</span>
              <span>{wholeNumber.format(minMargin)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={minMargin}
              onChange={(event) => setMinMargin(Number(event.target.value))}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>500%</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-background/60 p-5">
            <label className="block text-sm text-muted-foreground">
              Maximum listing price
              <input
                type="number"
                min={25}
                max={10000}
                step={25}
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value || 0))}
                className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-foreground outline-none transition focus:border-primary/40"
              />
            </label>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-background/60 p-5">
            <label className="block text-sm text-muted-foreground">
              Sort by
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SnipeSort)}
                className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-foreground outline-none transition focus:border-primary/40"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-all duration-200",
                category === value
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <SlidersHorizontal className="mr-2 inline h-3.5 w-3.5" />
              {value}
            </button>
          ))}
        </div>
      </section>

      {isLoading && !data ? (
        <>
          <DashboardHeaderSkeleton />
          <DashboardFilterSkeleton />
          <DashboardSkeleton />
        </>
      ) : null}

      {!isLoading && filteredItems.length === 0 ? (
        <section className="rounded-[32px] border border-dashed border-white/10 bg-card/70 p-10 text-center shadow-card">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">No matches</p>
          <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
            No snipes fit the current filter stack.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Lower the minimum margin, increase the budget cap, or switch categories to widen
            the board.
          </p>
        </section>
      ) : null}

      {!isLoading && filteredItems.length > 0 ? (
        <motion.section layout className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <SnipeCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.section>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-card/80 p-6 shadow-card backdrop-blur-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function DashboardHeaderSkeleton() {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr] animate-pulse">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-card/80 p-7 shadow-glow backdrop-blur-xl sm:p-8">
        <div className="space-y-6">
          <div className="h-4 w-32 rounded-full bg-white/10" />
          <div className="space-y-3">
            <div className="h-12 w-3/4 rounded-full bg-white/10" />
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-2/3 rounded-full bg-white/10" />
          </div>
          <div className="rounded-[28px] border border-white/10 bg-background/65 p-6">
            <div className="space-y-4">
              <div className="h-4 w-32 rounded-full bg-white/10" />
              <div className="h-10 w-48 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[28px] border border-white/10 bg-card/80 p-6 shadow-card"
          >
            <div className="h-12 w-12 rounded-2xl bg-white/10" />
            <div className="mt-5 space-y-3">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="h-6 w-16 rounded-full bg-white/10" />
              <div className="h-3 w-32 rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardFilterSkeleton() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-card/80 p-6 shadow-card backdrop-blur-xl sm:p-7 animate-pulse">
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-full bg-white/10" />
        <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr_0.95fr]">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-[28px] border border-white/10 bg-background/60 p-5">
              <div className="h-4 w-32 rounded-full bg-white/10" />
              <div className="mt-4 space-y-3">
                <div className="h-2 w-full rounded-full bg-white/10" />
                <div className="h-3 w-16 rounded-full bg-white/10" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-10 w-20 rounded-full bg-white/10" />
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[28px] border border-white/10 bg-card/80 p-5 shadow-card animate-pulse"
        >
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-3xl bg-white/10" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-20 rounded-full bg-white/10" />
              <div className="h-6 w-4/5 rounded-full bg-white/10" />
              <div className="h-4 w-1/2 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((__, metricIndex) => (
              <div key={metricIndex} className="h-20 rounded-3xl bg-white/10" />
            ))}
          </div>
          <div className="mt-5 h-14 rounded-3xl bg-white/10" />
        </div>
      ))}
    </section>
  );
}

function sortItems(left: SnipeItem, right: SnipeItem, sortBy: SnipeSort) {
  switch (sortBy) {
    case "highest-margin":
      return right.profitMargin - left.profitMargin;
    case "lowest-price":
      return left.currentPrice - right.currentPrice;
    case "recently-listed":
      return new Date(right.listedAt).getTime() - new Date(left.listedAt).getTime();
    case "best-profit":
    default:
      return right.profit - left.profit;
  }
}

function formatRefreshTime(value: string) {
  const deltaSeconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  return `${Math.round(deltaSeconds / 60)}m ago`;
}
