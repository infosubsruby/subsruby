import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CommunityData {
  suggestedPrice: number | null;
  suggestedUrl: string | null;
  priceCount: number;
  urlCount: number;
  totalMatches: number;
}

interface UseCommunityDataReturn {
  communityData: CommunityData | null;
  isLoading: boolean;
  error: string | null;
  fetchCommunityData: (name: string, currency: string) => Promise<CommunityData | null>;
  clearCommunityData: () => void;
}

export const useCommunityData = (): UseCommunityDataReturn => {
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunityData = useCallback(async (name: string, currency: string): Promise<CommunityData | null> => {
    if (!name.trim() || name.length < 2) {
      setCommunityData(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.warn("No authenticated session for community suggestions");
        setCommunityData(null);
        return null;
      }

      const { data, error: fnError } = await supabase.functions.invoke("community-suggestions", {
        body: { name, currency },
      });

      if (fnError) {
        console.error("Community suggestions error:", fnError);
        // Don't show error to user - just silently fail for unauthenticated requests
        setCommunityData(null);
        return null;
      }

      // Check if the response contains an error (401 unauthorized)
      if (data?.error) {
        console.warn("Community suggestions auth error:", data.error);
        setCommunityData(null);
        return null;
      }

      const result = data as CommunityData;
      
      // Only return if we have meaningful data (at least 1 match)
      if (result.totalMatches > 0) {
        setCommunityData(result);
        return result;
      } else {
        setCommunityData(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching community data:", err);
      setError("Failed to fetch community data");
      setCommunityData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCommunityData = useCallback(() => {
    setCommunityData(null);
    setError(null);
  }, []);

  return {
    communityData,
    isLoading,
    error,
    fetchCommunityData,
    clearCommunityData,
  };
};
