import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for onboarding completion
  const onboardingKey = `hasCompletedOnboarding:${session.user.id}`;
  const hasCompletedOnboarding = localStorage.getItem(onboardingKey) === "true";
  
  if (!hasCompletedOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (hasCompletedOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/control" replace />;
  }

  return <>{children}</>;
};
