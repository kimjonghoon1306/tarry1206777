import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { syncAdminSettingsToLocal } from "./lib/user-storage";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import KeywordResearch from "./pages/KeywordResearch";
import ContentGenerator from "./pages/ContentGenerator";
import ImageGenerator from "./pages/ImageGenerator";
import DeploymentPage from "./pages/DeploymentPage";
import SettingsPage from "./pages/SettingsPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyPage from "./pages/MyPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import AdminPage from "./pages/AdminPage";

// ── 로그인 필요한 페이지 보호 컴포넌트 ──────────────────
function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const isLoggedIn = !!localStorage.getItem("ba_token");
  // SuperAdmin 비밀번호 게이트 통과한 경우도 허용
  const isSuperAdmin = !!sessionStorage.getItem("bap_admin_auth");

  if (!isLoggedIn && !isSuperAdmin) {
    const currentPath = window.location.pathname;
    setTimeout(() => navigate(`/login?redirect=${encodeURIComponent(currentPath)}`), 0);
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* 공개 페이지 */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/superadmin" component={SuperAdminPage} />

      {/* 로그인 필요 페이지 */}
      <Route path="/dashboard" component={() => <PrivateRoute component={Dashboard} />} />
      <Route path="/keywords" component={() => <PrivateRoute component={KeywordResearch} />} />
      <Route path="/content" component={() => <PrivateRoute component={ContentGenerator} />} />
      <Route path="/images" component={() => <PrivateRoute component={ImageGenerator} />} />
      <Route path="/deploy" component={() => <PrivateRoute component={DeploymentPage} />} />
      <Route path="/settings" component={() => <PrivateRoute component={SettingsPage} />} />
      <Route path="/admin" component={() => <PrivateRoute component={MyPage} />} />
      <Route path="/mypage" component={() => <PrivateRoute component={MyPage} />} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    syncAdminSettingsToLocal();
  }, []);

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
