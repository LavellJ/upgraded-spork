import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Learning from "@/pages/Learning";
import ChildOnboarding from "@/pages/ChildOnboarding";
import { ProgressShowcase } from "@/pages/ProgressShowcase";
import ParentAuth from "@/pages/ParentAuth";
import ParentDashboard from "@/pages/ParentDashboard";
import AddChild from "@/pages/AddChild";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={ChildOnboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/learning" component={Learning} />
      <Route path="/progress" component={ProgressShowcase} />
      <Route path="/parent/auth" component={ParentAuth} />
      <Route path="/parent/dashboard" component={ParentDashboard} />
      <Route path="/parent/add-child" component={AddChild} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
