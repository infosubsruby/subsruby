import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  has_lifetime_access: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isUnlimited: boolean;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; phone?: string }
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  trialDaysLeft: number;
  isTrialActive: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate trial days
  const calculateTrialDays = (): number => {
    if (!profile?.created_at) return 7;
    const createdDate = new Date(profile.created_at);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - diffDays);
  };

  const trialDaysLeft = calculateTrialDays();
  
  // User is unlimited if they have lifetime access OR are an admin
  const isUnlimited = Boolean(profile?.has_lifetime_access) || isAdmin;
  
  // Trial is only active for non-unlimited users
  const isTrialActive = !isUnlimited && trialDaysLeft > 0;

  // Fetch profile data and sync OAuth info if needed
  const fetchProfile = async (userId: string, currentSession?: Session | null) => {
    const sessionToUse = currentSession || session;
    
    // First check if profile exists
    let { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    // If user signed in with Google and we have user metadata, sync it
    if (sessionToUse?.user) {
      const userMeta = sessionToUse.user.user_metadata;
      const userEmail = sessionToUse.user.email;
      
      // Update profile with OAuth data if available
      if (profileData && (userMeta?.avatar_url || userMeta?.full_name || userEmail)) {
        const updates: Partial<Profile> = {};
        
        if (userEmail && !profileData.email) {
          updates.email = userEmail;
        }
        if (userMeta?.avatar_url && !profileData.avatar_url) {
          updates.avatar_url = userMeta.avatar_url;
        }
        if (userMeta?.full_name && !profileData.first_name) {
          updates.first_name = userMeta.full_name;
        }
        
        if (Object.keys(updates).length > 0) {
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", userId)
            .select()
            .maybeSingle();
          
          if (updatedProfile) {
            profileData = updatedProfile;
          }
        }
      }
    }
    
    if (profileData) {
      setProfile(profileData);
    }

    // Check admin status
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!roleData);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, session);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user.id, session), 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; phone?: string }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/control`,
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isUnlimited,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        trialDaysLeft,
        isTrialActive,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
