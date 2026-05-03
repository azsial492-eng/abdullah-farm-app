import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { FarmProvider } from "@/lib/farm-context";

// Pages
import Dashboard from "@/pages/dashboard";
import FlockManagement from "@/pages/flock";
import EggProduction from "@/pages/eggs";
import Inventory from "@/pages/inventory";
import Health from "@/pages/health";
import Finance from "@/pages/finance";

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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FarmProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </FarmProvider>
    </QueryClientProvider>
  );
}

export default App;
