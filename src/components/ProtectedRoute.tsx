import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check for onboarding completion
  const onboardingKey = `hasCompletedOnboarding:${session.user.id}`;
  const localCompleted = localStorage.getItem(onboardingKey) === "true";
  const hasCompletedOnboarding =
    typeof profile.has_completed_onboarding === "boolean" ? profile.has_completed_onboarding : localCompleted;

  localStorage.setItem(onboardingKey, hasCompletedOnboarding ? "true" : "false");
  
  if (!hasCompletedOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (hasCompletedOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/control" replace />;
  }

  return <>{children}</>;
};
