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

        // 'as any' ekleyerek TypeScript hatasını çözüyoruz
        const { data, error } = await supabase
          .from('user_subscriptions' as any)
          .select('status')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          setIsPro(false);
        } else if (data) {
          setIsPro(true);
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
