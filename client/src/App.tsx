import { Switch, Route } from "wouter";
import { ImageTest } from "./components/ImageTest";
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
import { VoiceSetup } from "@/pages/VoiceSetup";
import LessonSkeleton from "@/pages/LessonSkeleton";
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
      <Route path="/voice-setup" component={VoiceSetup} />
      <Route path="/lesson-skeleton" component={LessonSkeleton} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ImageTest />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
