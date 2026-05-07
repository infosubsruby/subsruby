import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { errorMessageOrValue } from '@/lib/error';
import { useAuth } from '@/hooks/useAuth';

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [customerPortalUrl, setCustomerPortalUrl] = useState<string | null>(null);
  const { user, isMockMode, currentPlan } = useAuth();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (isMockMode) {
          setIsPro(currentPlan === "pro");
          setStatus(currentPlan === "pro" ? "active" : "free");
          setCustomerPortalUrl(null);
          setLoading(false);
          return;
        }

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: subscriptionRow, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("status, customer_portal_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!subscriptionError) {
          const status = subscriptionRow?.status ? String(subscriptionRow.status) : null;
          setStatus(status);
          const portalUrlRaw =
            subscriptionRow && typeof subscriptionRow === "object" && "customer_portal_url" in subscriptionRow
              ? (subscriptionRow as { customer_portal_url?: unknown }).customer_portal_url
              : null;
          setCustomerPortalUrl(typeof portalUrlRaw === "string" ? portalUrlRaw : null);
          setIsPro(status === "active" || status === "trialing");
          return;
        }

        console.error("Supabase Çekme Hatası:", errorMessageOrValue(subscriptionError));
        setStatus(null);
        setCustomerPortalUrl(null);
        setIsPro(false);
      } catch (error) {
        console.error("Supabase Çekme Hatası:", errorMessageOrValue(error));
        setStatus(null);
        setCustomerPortalUrl(null);
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [currentPlan, isMockMode, user]);

  return { isPro, status, customerPortalUrl, loading };
};
