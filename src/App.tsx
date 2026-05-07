import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { SettingsProvider } from "@/hooks/useSettings";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import Onboarding from "./pages/Onboarding";
import Admin from "./pages/Admin";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import Success from "./pages/Success";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import AIInsights from "./pages/AIInsights";
import Goals from "./pages/Goals";
import AnalyticsPage from "./pages/AnalyticsPage";
import Wallets from "./pages/Wallets";
import RubyAI from "./pages/RubyAI";
import MonthlyReport from "./pages/MonthlyReport";
import SmartBudgetPlanner from "./pages/SmartBudgetPlanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SettingsProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/control"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/dashboard" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/transactions" element={<Navigate to="/finance?tab=transactions" replace />} />
                  <Route path="/subscriptions" element={<Navigate to="/dashboard#subscriptions" replace />} />
                  <Route path="/ai-insights" element={<AIInsights />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/wallets" element={<Wallets />} />
                  <Route path="/ruby-ai" element={<RubyAI />} />
                  <Route path="/monthly-report" element={<MonthlyReport />} />
                  <Route path="/smart-budget-planner" element={<SmartBudgetPlanner />} />
                  <Route path="/classic-finance" element={<Finance />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                </Route>
                <Route
                  path="/upgrade"
                  element={
                    <ProtectedRoute>
                      <Upgrade />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/success"
                  element={
                    <ProtectedRoute>
                      <Success />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-cancel"
                  element={
                    <ProtectedRoute>
                      <PaymentCancel />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </SettingsProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
