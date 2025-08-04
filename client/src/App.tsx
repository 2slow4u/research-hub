import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Workspaces from "@/pages/Workspaces";
import WorkspaceDetail from "@/pages/WorkspaceDetail";
import SummaryEditor from "@/pages/SummaryEditor";
import AdminPanel from "@/pages/AdminPanel";
import TelegramIntegration from "@/pages/TelegramIntegration";
import AiModelConfig from "@/pages/AiModelConfig";
import ArticleReader from "@/pages/ArticleReader";
import Search from "@/pages/Search";
import Summaries from "@/pages/Summaries";
import Settings from "@/pages/Settings";
import Layout from "@/components/Layout/Layout";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/workspaces" component={Workspaces} />
          <Route path="/workspace/:id" component={WorkspaceDetail} />
          <Route path="/summary/:id" component={SummaryEditor} />
          <Route path="/search" component={Search} />
          <Route path="/summaries" component={Summaries} />
          <Route path="/settings" component={Settings} />
          <Route path="/settings/telegram" component={TelegramIntegration} />
          <Route path="/settings/ai-models" component={AiModelConfig} />
          <Route path="/reader/:id" component={ArticleReader} />
          <Route path="/admin" component={AdminPanel} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
