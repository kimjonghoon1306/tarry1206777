import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import KeywordResearch from "./pages/KeywordResearch";
import ContentGenerator from "./pages/ContentGenerator";
import ImageGenerator from "./pages/ImageGenerator";
import DeploymentPage from "./pages/DeploymentPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyPage from "./pages/MyPage";
import SuperAdminPage from "./pages/SuperAdminPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/keywords" component={KeywordResearch} />
      <Route path="/content" component={ContentGenerator} />
      <Route path="/images" component={ImageGenerator} />
      <Route path="/deploy" component={DeploymentPage} />
      <Route path="/admin" component={MyPage} />
      <Route path="/mypage" component={MyPage} />
      <Route path="/superadmin" component={SuperAdminPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
