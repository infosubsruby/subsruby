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

        const { data: subscriptionRow, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!subscriptionError) {
          const status = subscriptionRow?.status ? String(subscriptionRow.status) : null;
          setIsPro(status === "active" || status === "trialing");
          return;
        }

        console.error("Supabase Çekme Hatası:", errorMessageOrValue(subscriptionError));
        setIsPro(false);
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
