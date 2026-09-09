import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Guide from "./pages/Guide";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import TopDown from "./pages/TopDown";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/top-down" component={TopDown} />
      <Route path="/guide" component={Guide} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
