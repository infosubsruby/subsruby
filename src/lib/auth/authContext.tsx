import type { ReactNode } from "react";
import { AuthProvider as LegacyAuthProvider } from "@/hooks/useAuth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <LegacyAuthProvider>{children}</LegacyAuthProvider>;
};

