import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { errorMessageOrValue } from '@/lib/error';

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
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Supabase Çekme Hatası:", errorMessageOrValue(error));
          setIsPro(false);
        } else if (data?.status) {
          setIsPro(["active", "trialing"].includes(String(data.status)));
        } else {
          setIsPro(false);
        }
      } catch (error) {
        console.error("Supabase Çekme Hatası:", errorMessageOrValue(error));
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  return { isPro, loading };
};
