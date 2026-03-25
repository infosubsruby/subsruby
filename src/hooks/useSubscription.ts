import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { errorMessageOrValue } from '@/lib/error';
import { isProFromStatus, profileSubscriptionStatus } from '@/lib/profile';

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
          setIsPro(isProFromStatus(subscriptionRow?.status ? String(subscriptionRow.status) : null));
          return;
        }

        const message =
          subscriptionError && typeof subscriptionError === "object" && "message" in subscriptionError
            ? String((subscriptionError as { message?: unknown }).message ?? "")
            : "";

        const shouldFallbackToProfiles =
          message.includes("user_subscriptions") &&
          (message.includes("does not exist") || message.includes("not found") || message.includes("Unknown"));

        if (!shouldFallbackToProfiles) {
          console.error("Supabase Çekme Hatası:", errorMessageOrValue(subscriptionError));
          setIsPro(false);
        } else {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Supabase Çekme Hatası:", errorMessageOrValue(profileError));
            setIsPro(false);
            return;
          }

          const status = profileSubscriptionStatus(profileData);
          setIsPro(isProFromStatus(status));
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
