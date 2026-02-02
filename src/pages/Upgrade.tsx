import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const CHECKOUT_URL = "https://losruby.lemonsqueezy.com/checkout/buy/e4258038-8074-43b1-8ba3-6b767044ea04";

export default function Upgrade() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Lütfen önce giriş yapın.");
        return;
      }
      // Kullanıcı ID'sini linke ekleyip yönlendiriyoruz
      const finalUrl = `${CHECKOUT_URL}?checkout[custom][user_id]=${user.id}`;
      window.location.href = finalUrl;
    } catch (error) {
      console.error(error);
      alert("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Pro Üyelik</h1>
        <p className="text-gray-500 mb-6">Tüm özelliklere erişmek için yükseltin.</p>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Hemen Yükselt"}
        </button>
      </div>
    </div>
  );
}
