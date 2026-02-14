import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Whiteboard from "./pages/Whiteboard";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Matching from "./pages/Matching";
import Partnerships from "./pages/Partnerships";
import LearningRooms from "./pages/LearningRooms";
import Sessions from "./pages/Sessions";
import Resources from "./pages/Resources";
import Achievements from "./pages/Achievements";
import Subscription from "./pages/Subscription";
import HomeRedesign from "./pages/HomeRedesign";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <DashboardLayout><HomeRedesign /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/chat">
        {isAuthenticated ? <Chat /> : <Landing />}
      </Route>
      <Route path="/whiteboard">
        {isAuthenticated ? <Whiteboard /> : <Landing />}
      </Route>
      <Route path="/profile">
        {isAuthenticated ? <DashboardLayout><Profile /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/discover">
        {isAuthenticated ? <DashboardLayout><Discover /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/matching">
        {isAuthenticated ? <DashboardLayout><Matching /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/partnerships">
        {isAuthenticated ? <DashboardLayout><Partnerships /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/rooms">
        {isAuthenticated ? <DashboardLayout><LearningRooms /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/sessions">
        {isAuthenticated ? <DashboardLayout><Sessions /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/resources">
        {isAuthenticated ? <DashboardLayout><Resources /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/achievements">
        {isAuthenticated ? <DashboardLayout><Achievements /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/subscription">
        {isAuthenticated ? <DashboardLayout><Subscription /></DashboardLayout> : <Landing />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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

export default App;
