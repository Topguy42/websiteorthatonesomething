import { Compass, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-card/80 p-10 text-center shadow-glow backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.28em] text-muted-foreground">404</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-foreground">
          Route not found
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          The page you tried to open is outside the current Snipez build. Use the dashboard
          route to get back into the scanner.
        </p>
        <Link
          to="/"
          className="mx-auto mt-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_14px_40px_rgba(31,227,145,0.25)] transition-transform hover:-translate-y-0.5"
        >
          <Home className="h-4 w-4" />
          Return home
        </Link>
      </div>
    </section>
  );
}
