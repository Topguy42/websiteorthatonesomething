import { Activity, LogOut, Radar, Settings2, SlidersHorizontal } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSnipezAccess } from "./access-provider";

const navItems = [
  { to: "/", label: "Dashboard", icon: Radar },
  { to: "/filters", label: "Filters", icon: SlidersHorizontal },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

export function AppLayout() {
  const { isUnlocked, accessLabel, logout } = useSnipezAccess();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid-white/[0.06]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(31,227,145,0.18),_transparent_48%),radial-gradient(circle_at_20%_20%,_rgba(102,87,255,0.16),_transparent_34%)]" />
      <div className="pointer-events-none absolute left-1/2 top-32 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-8 rounded-3xl border border-white/10 bg-card/75 px-4 py-4 shadow-glow backdrop-blur-xl sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_24px_rgba(31,227,145,0.24)]">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold tracking-wide">Snipez</p>
                  <p className="text-xs text-muted-foreground">
                    Limited UGC opportunity scanner
                  </p>
                </div>
              </Link>

              <div className="hidden rounded-full border border-white/10 bg-background/80 px-3 py-1 text-xs text-muted-foreground sm:flex sm:items-center sm:gap-2">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(31,227,145,0.85)]" />
                {isUnlocked ? accessLabel ?? "Access unlocked" : "Awaiting access key"}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1 lg:justify-end">
              <nav className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-background/80 p-1 backdrop-blur">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition-all duration-200",
                        isActive && "bg-white/8 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </nav>

              {isUnlocked ? (
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-white/10 bg-white/5 px-4 text-foreground hover:bg-white/10"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Lock
                </Button>
              ) : (
                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                  Enter a valid key to unlock the scanner.
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
