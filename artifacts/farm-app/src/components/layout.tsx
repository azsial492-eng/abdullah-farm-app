import { Link, useLocation } from "wouter";
import { LayoutDashboard, Bird, Egg, Package, Stethoscope, CircleDollarSign, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/flock", label: "Flock Management", icon: Bird },
  { href: "/eggs", label: "Egg Production", icon: Egg },
  { href: "/inventory", label: "Inventory & Feed", icon: Package },
  { href: "/health", label: "Health & Vaccination", icon: Stethoscope },
  { href: "/finance", label: "Finance", icon: CircleDollarSign },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between bg-sidebar p-4 text-sidebar-foreground">
        <div className="font-bold text-lg flex items-center gap-2">
          <Egg className="w-5 h-5 text-accent" />
          ABDULLAH PROTIEN FARM
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:text-white/80 hover:bg-white/10">
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-sidebar-border">
          <Egg className="w-8 h-8 text-accent" />
          <h1 className="font-bold text-xl leading-tight">ABDULLAH<br/>PROTIEN FARM</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group
                  ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}
                `} data-testid={`nav-${item.label.toLowerCase().replace(/ /g, "-")}`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
