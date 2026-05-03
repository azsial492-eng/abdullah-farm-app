import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { FarmProvider } from "@/lib/farm-context";
import SplashScreen from "@/components/SplashScreen";
import { useEffect, useState } from "react";

// Pages
import Dashboard from "@/pages/dashboard";
import FlockManagement from "@/pages/flock";
import EggProduction from "@/pages/eggs";
import Inventory from "@/pages/inventory";
import Health from "@/pages/health";
import Finance from "@/pages/finance";
import Performance from "@/pages/performance";
import Labor from "@/pages/labor";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/flock" component={FlockManagement} />
        <Route path="/eggs" component={EggProduction} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/health" component={Health} />
        <Route path="/finance" component={Finance} />
        <Route path="/performance" component={Performance} />
        <Route path="/labor" component={Labor} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FarmProvider>
        <TooltipProvider>
          <div className="relative min-h-screen">
            <div className={`transition-opacity duration-700 ${showSplash ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
            </div>
            {showSplash && <SplashScreen />}
          </div>
          <Toaster />
        </TooltipProvider>
      </FarmProvider>
    </QueryClientProvider>
  );
}

export default App;
