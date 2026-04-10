import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Flame, Sparkles, Heart } from "lucide-react";
import type { SnipeItem } from "@shared/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const compactCurrency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const percentageFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function SnipeCard({ item }: { item: SnipeItem }) {
  const [isWishlisted, setIsWishlisted] = useState(() => {
    const watchlist = JSON.parse(localStorage.getItem("snipez-watchlist") || "[]") as number[];
    return watchlist.includes(item.id);
  });

  const handleToggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem("snipez-watchlist") || "[]") as number[];
    let newWatchlist: number[];

    if (isWishlisted) {
      newWatchlist = watchlist.filter((id) => id !== item.id);
      toast.success("Removed from watchlist");
    } else {
      newWatchlist = [...watchlist, item.id];
      toast.success("Added to watchlist");
    }

    localStorage.setItem("snipez-watchlist", JSON.stringify(newWatchlist));
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-white/10 bg-card/85 p-5 shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-glow",
        item.highValue && "ring-1 ring-primary/20",
      )}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-60" />
      <motion.div
        className="absolute -right-10 top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 100 }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative flex items-start gap-4">
        <motion.div
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.3 }}
        >
          {item.thumbnailUrl ? (
            <motion.img
              src={item.thumbnailUrl}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(31,227,145,0.2),_transparent_52%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] font-display text-2xl font-semibold text-foreground/85">
              {item.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </motion.div>

        <motion.div
          className="min-w-0 flex-1"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <motion.div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              {item.category}
            </span>
            {item.highValue ? (
              <motion.span
                className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                High value
              </motion.span>
            ) : null}
            {item.isHot ? (
              <motion.span
                className="rounded-full border border-[#ff8e42]/30 bg-[#ff8e42]/15 px-3 py-1 text-xs text-[#ffb173]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <Flame className="mr-1 inline h-3.5 w-3.5" />
                Hot
              </motion.span>
            ) : null}
          </motion.div>

          <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold text-foreground">
            {item.name}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Deal score {percentageFormat.format(item.dealScore)} • listed {formatRelative(item.listedAt)}
          </p>
        </motion.div>
      </div>

      <motion.div
        className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Metric label="Price" value={`R$${compactCurrency.format(item.currentPrice)}`} />
        <Metric label="Resale" value={`R$${compactCurrency.format(item.resaleValue)}`} />
        <Metric label="Profit" value={`R$${compactCurrency.format(item.profit)}`} positive />
        <Metric
          label="Margin"
          value={`${percentageFormat.format(item.profitMargin)}%`}
          positive
        />
      </motion.div>

      <motion.div
        className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-background/60 px-4 py-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">RAP</p>
          <p className="mt-1 text-sm text-foreground">
            {item.rap ? `R$${compactCurrency.format(item.rap)}` : "Unavailable"}
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={handleToggleWatchlist}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200",
              isWishlisted
                ? "bg-primary/20 text-primary"
                : "bg-white/10 text-muted-foreground hover:bg-white/20"
            )}
            title={isWishlisted ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
          </motion.button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              className="h-11 rounded-2xl bg-white text-slate-950 transition-transform duration-200 hover:bg-white/90"
            >
              <a href={item.itemLink} target="_blank" rel="noreferrer">
                View Item
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.article>
  );
}

function Metric({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-lg font-semibold text-foreground", positive && "text-primary")}>
        {value}
      </p>
    </div>
  );
}

function formatRelative(value: string) {
  const deltaMinutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const hours = Math.round(deltaMinutes / 60);
  return `${hours}h ago`;
}
