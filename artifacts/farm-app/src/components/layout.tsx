import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Bird, Egg, Package, Stethoscope,
  CircleDollarSign, Menu, BarChart2, Users, Loader2,
  AlertTriangle, ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFarmData } from "@/lib/farm-context";

const navItems = [
  { href: "/",            label: "Dashboard",         icon: LayoutDashboard },
  { href: "/flock",       label: "Flock Management",  icon: Bird            },
  { href: "/eggs",        label: "Egg Production",    icon: Egg             },
  { href: "/inventory",   label: "Inventory & Feed",  icon: Package         },
  { href: "/health",      label: "Health & Vaccination", icon: Stethoscope  },
  { href: "/finance",     label: "Finance",            icon: CircleDollarSign},
  { href: "/performance", label: "Batch Performance",  icon: BarChart2       },
  { href: "/labor",       label: "Labor & Attendance", icon: Users           },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading, dbError, configured } = useFarmData();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between bg-sidebar p-4 text-sidebar-foreground">
        <div className="font-bold text-lg flex items-center gap-2">
          <Egg className="w-5 h-5 text-accent" />
          ABDULLAH PROTIEN FARM
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white hover:text-white/80 hover:bg-white/10"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground
        transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-sidebar-border">
          <Egg className="w-8 h-8 text-accent" />
          <h1 className="font-bold text-xl leading-tight">ABDULLAH<br />PROTIEN FARM</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
                    transition-all duration-200 group
                    ${isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}
                  `}
                  data-testid={`nav-${item.label.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* DB status indicator in sidebar footer */}
        <div className="p-4 border-t border-sidebar-border">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
              <Loader2 className="w-3 h-3 animate-spin" />
              Connecting to database…
            </div>
          ) : dbError && dbError !== "SETUP_REQUIRED" ? (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              DB connection error
            </div>
          ) : !configured ? (
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              DB not configured
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              Supabase connected
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          <div className="max-w-6xl mx-auto">

            {/* ── Setup required banner ── */}
            {!configured && !loading && (
              <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-2 min-w-0">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                    Supabase not configured — running in offline mode
                  </p>
                  <p className="text-sm text-muted-foreground">
                    To enable persistent storage, add <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_URL</code> and{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_ANON_KEY</code> as environment variables, then run the SQL schema in your Supabase dashboard.
                  </p>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 underline underline-offset-2 hover:opacity-80"
                  >
                    Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* ── DB error banner ── */}
            {dbError && dbError !== "SETUP_REQUIRED" && (
              <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-5 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Database error</p>
                  <p className="text-sm text-muted-foreground mt-1">{dbError}</p>
                </div>
              </div>
            )}

            {/* ── Global loading overlay ── */}
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Egg className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Loading farm data…</p>
                  <p className="text-sm text-muted-foreground mt-1">Fetching from Supabase</p>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
