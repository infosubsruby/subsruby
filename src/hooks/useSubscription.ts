import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { errorMessageOrValue } from '@/lib/error';

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [customerPortalUrl, setCustomerPortalUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUserId = sessionData.session?.user?.id ?? null;
        console.log("1. Aktif Kullanıcı ID:", user?.id || sessionUserId);

        const { data: subscriptionRow, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("status, customer_portal_url")
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("2. Supabase Veri:", subscriptionRow, "3. Supabase Hata:", subscriptionError);
        if (subscriptionError) console.log("3b. Supabase Hata Obj:", subscriptionError);

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
  }, []);

  return { isPro, status, customerPortalUrl, loading };
};
