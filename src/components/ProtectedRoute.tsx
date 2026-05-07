import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Loader2 } from "lucide-react";

export const ProtectedRoute = ({
  children,
  enforceOnboarding = true,
}: {
  children: React.ReactNode;
  enforceOnboarding?: boolean;
}) => {
  const { isAuthenticated, isLoading, onboardingCompleted } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090d]">
        <Loader2 className="h-8 w-8 animate-spin text-red-300" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasCompletedOnboarding = onboardingCompleted;

  if (hasCompletedOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/overview" replace />;
  }

  if (enforceOnboarding && !hasCompletedOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (!enforceOnboarding && location.pathname === "/onboarding" && !hasCompletedOnboarding) {
    return <>{children}</>;
  }

  if (!hasCompletedOnboarding && location.pathname !== "/onboarding" && enforceOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090d] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-zinc-100">
          <Lock className="mx-auto mb-3 h-6 w-6 text-red-300" />
          <h2 className="text-lg font-semibold">Onboarding Required</h2>
          <p className="mt-2 text-sm text-zinc-400">Complete your profile setup to unlock your financial workspace.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
