-- ============================================
-- LEMON SQUEEZY SUBSCRIPTION TABLE SETUP
-- ============================================

-- Not: Mevcut 'subscriptions' tablosu kullanıcıların kendi eklediği abonelikleri (Netflix vb.) tuttuğu için
-- bu tablonun adını 'user_subscriptions' veya 'app_subscriptions' olarak belirledik.
-- Bu tablo, kullanıcının PRO üyelik durumunu takip eder.

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lemon Squeezy IDs
  lemon_squeezy_customer_id TEXT,
  lemon_squeezy_subscription_id TEXT UNIQUE,
  lemon_squeezy_variant_id TEXT,
  
  -- Abonelik Durumu
  status TEXT NOT NULL, -- 'active', 'past_due', 'unpaid', 'cancelled', 'expired', 'on_trial'
  
  -- Tarihler
  renews_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Politikaları (Güvenlik)
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 1. Kullanıcılar kendi abonelik durumlarını görebilir
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Sadece Service Role (Backend) abonelikleri oluşturabilir ve güncelleyebilir
-- (Kullanıcılar doğrudan bu tabloya yazamaz, webhook veya backend function yazar)
CREATE POLICY "Service role can manage all subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (auth.role() = 'service_role');

-- İndeksler (Performans için)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_ls_customer_id ON public.user_subscriptions(lemon_squeezy_customer_id);
