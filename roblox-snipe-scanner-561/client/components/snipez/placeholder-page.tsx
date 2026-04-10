import { ArrowRight, BellRing, BookmarkCheck, Webhook } from "lucide-react";
import { Link } from "react-router-dom";

const roadmapIcons = [BellRing, BookmarkCheck, Webhook];

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-glow backdrop-blur-xl sm:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_14px_40px_rgba(31,227,145,0.25)] transition-transform hover:-translate-y-0.5"
          >
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="inline-flex h-12 items-center rounded-2xl border border-white/10 bg-background/70 px-5 text-sm text-muted-foreground">
            Continue prompting to flesh this page out later
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {[
          {
            title: "Saved watchlists",
            description: "Pin collectibles you want to revisit and compare over time.",
          },
          {
            title: "Instant alerts",
            description: "Surface new snipes through toasts, email, or Discord webhook automations.",
          },
          {
            title: "Operator settings",
            description: "Tune cache cadence, access keys, and future account-level preferences.",
          },
        ].map((item, index) => {
          const Icon = roadmapIcons[index];

          return (
            <article
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-card/75 p-6 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
