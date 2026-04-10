import { useState } from "react";
import { ShieldCheck, Sparkles, TimerReset, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSnipezAccess } from "./access-provider";

const previewStats = [
  { label: "Tracked deals", value: "120+" },
  { label: "Refresh cadence", value: "45s" },
  { label: "High-value alerts", value: "Live" },
];

const featureCards = [
  {
    title: "Underpriced collectibles",
    description: "Spot limited UGC listings where price is far below recent resale activity.",
    icon: TrendingUp,
  },
  {
    title: "Key-gated dashboard",
    description: "Unlock private deal filters, ranked scorecards, and a dedicated operator view.",
    icon: ShieldCheck,
  },
  {
    title: "Timed refresh cycle",
    description: "Keep scans efficient with cached refreshes instead of noisy request spam.",
    icon: TimerReset,
  },
];

export function KeyAccessScreen({ isCheckingSession }: { isCheckingSession: boolean }) {
  const { validateKey } = useSnipezAccess();
  const [key, setKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await validateKey(key);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      toast.success("Snipez unlocked", {
        description: result.accessLabel ?? "Dashboard access granted",
      });
    } catch {
      setErrorMessage("Could not validate the key right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-card/80 p-7 shadow-glow backdrop-blur-xl sm:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
            <Sparkles className="h-4 w-4" />
            Private limited UGC terminal
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1">
            Live dashboard on unlock
          </span>
        </div>

        <div className="mt-8 max-w-2xl space-y-5">
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl xl:text-6xl">
            Hunt Roblox limited UGC deals before the rest of the market reacts.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Snipez ranks collectible listings by potential profit, margin, RAP alignment,
            and resale spread so you can focus on the deals worth acting on.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {previewStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {featureCards.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="rounded-3xl border border-white/10 bg-background/70 p-5 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-medium text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-card/75 p-7 shadow-glow backdrop-blur-xl sm:p-8">
        <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-brand-violet/20 blur-3xl" />

        <div className="relative">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Access required
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-foreground">
            Enter your Snipez key
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The scanner is protected behind a server-validated key so paid keys, saved
            watchlists, and alert channels can be layered in later.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">Access key</span>
              <Input
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder="Enter access code"
                className="h-14 rounded-2xl border-white/10 bg-background/80 px-4 text-base placeholder:text-muted-foreground/70"
                autoComplete="off"
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting || isCheckingSession}
              className="h-14 w-full rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_40px_rgba(31,227,145,0.25)] transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
            >
              {isCheckingSession
                ? "Checking saved access..."
                : isSubmitting
                  ? "Unlocking scanner..."
                  : "Unlock dashboard"}
            </Button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-background/70 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              What unlock includes
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>• Ranked snipes by profit, deal score, and percentage gain</li>
              <li>• Budget and category filtering for fast decision-making</li>
              <li>• Cached refresh cycles built for future alert automation</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
