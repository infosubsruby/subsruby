import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("subscription_status")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          setIsPro(false);
        } else if (data?.subscription_status) {
          setIsPro(["active", "trialing"].includes(String(data.subscription_status)));
        } else {
          setIsPro(false);
        }
      } catch (error) {
        console.error(error);
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  return { isPro, loading };
};
