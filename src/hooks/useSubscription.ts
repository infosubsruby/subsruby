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

        // Tablo adı: user_subscriptions (SQL'de belirlediğimiz isim) 
        const { data, error } = await supabase 
          .from('user_subscriptions') 
          .select('status') 
          .eq('user_id', user.id) 
          .in('status', ['active', 'trialing']) 
          .single(); 

        if (error || !data) { 
          setIsPro(false); 
        } else { 
          setIsPro(true); 
        } 
      } catch (error) { 
        console.error('Error checking subscription:', error); 
        setIsPro(false); 
      } finally { 
        setLoading(false); 
      } 
    }; 

    checkSubscription(); 
  }, []); 

  return { isPro, loading }; 
};
