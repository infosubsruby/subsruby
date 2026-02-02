-- ============================================
-- SUPABASE COMPLETE SCHEMA SETUP
-- Trae AI Integration için hazırlandı
-- ============================================

-- ============================================
-- 1. ENUM TYPES
-- ============================================

-- App role enum (admin, moderator, user)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ============================================
-- 2. TABLES
-- ============================================

-- --------------------------------------
-- PROFILES TABLE
-- Kullanıcı profil bilgileri
-- --------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  has_lifetime_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS aktif et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- --------------------------------------
-- USER_ROLES TABLE
-- Kullanıcı rolleri (admin, moderator, user)
-- --------------------------------------
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- RLS aktif et
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- --------------------------------------
-- SUBSCRIPTIONS TABLE
-- Abonelik kayıtları (Netflix, Spotify vb.)
-- --------------------------------------
CREATE TABLE public.subscriptions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT, -- 'monthly' or 'yearly'
  start_date DATE NOT NULL,
  next_payment_date DATE,
  website_url TEXT,
  card_color TEXT DEFAULT '#E50914',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS aktif et
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------
-- TRANSACTIONS TABLE
-- Gelir/gider işlemleri
-- --------------------------------------
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'income' or 'expense'
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS aktif et
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------
-- BUDGETS TABLE
-- Kategori bazlı bütçe limitleri
-- --------------------------------------
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS aktif et
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- --------------------------------------
-- FEEDBACKS TABLE
-- Kullanıcı geri bildirimleri
-- --------------------------------------
CREATE TABLE public.feedbacks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS aktif et
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- --------------------------------------
-- has_role function
-- Kullanıcının belirli bir role sahip olup olmadığını kontrol eder
-- Security definer ile RLS recursion önlenir
-- --------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- --------------------------------------
-- handle_new_user function
-- Yeni kullanıcı kayıt olduğunda otomatik profil oluşturur
-- --------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name);
  RETURN NEW;
END;
$$;

-- --------------------------------------
-- update_feedback_updated_at function
-- Feedback güncellendiğinde updated_at'i otomatik günceller
-- --------------------------------------
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Yeni kullanıcı kaydı trigger'ı
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Feedback güncelleme trigger'ı
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- --------------------------------------
-- PROFILES RLS POLICIES
-- --------------------------------------

-- Kullanıcılar kendi profilini okuyabilir
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Kullanıcılar kendi profilini ekleyebilir
CREATE POLICY "Users insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Kullanıcılar kendi profilini güncelleyebilir
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Adminler tüm profilleri okuyabilir
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- --------------------------------------
-- USER_ROLES RLS POLICIES
-- --------------------------------------

-- Kullanıcılar kendi rolünü okuyabilir
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Adminler tüm rolleri yönetebilir
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- --------------------------------------
-- SUBSCRIPTIONS RLS POLICIES
-- --------------------------------------

-- Kullanıcılar kendi aboneliklerini yönetebilir (CRUD)
CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adminler tüm abonelikleri görüntüleyebilir
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Adminler tüm abonelikleri güncelleyebilir
CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- --------------------------------------
-- TRANSACTIONS RLS POLICIES
-- --------------------------------------

-- Kullanıcılar kendi işlemlerini yönetebilir (CRUD)
CREATE POLICY "Users manage own transactions"
  ON public.transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------
-- BUDGETS RLS POLICIES
-- --------------------------------------

-- Kullanıcılar kendi bütçelerini yönetebilir (CRUD)
CREATE POLICY "Users manage own budgets"
  ON public.budgets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------
-- FEEDBACKS RLS POLICIES
-- --------------------------------------

-- Kullanıcılar kendi geri bildirimlerini görüntüleyebilir
CREATE POLICY "Users can view own feedback"
  ON public.feedbacks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcılar kendi geri bildirimlerini oluşturabilir
CREATE POLICY "Users can create own feedback"
  ON public.feedbacks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi geri bildirimlerinin rating'ini güncelleyebilir
CREATE POLICY "Users can update own feedback rating"
  ON public.feedbacks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Adminler tüm geri bildirimleri görüntüleyebilir
CREATE POLICY "Admins can view all feedback"
  ON public.feedbacks
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Adminler tüm geri bildirimleri güncelleyebilir
CREATE POLICY "Admins can update all feedback"
  ON public.feedbacks
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 6. INDEXES (Performance)
-- ============================================

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX idx_feedbacks_status ON public.feedbacks(status);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
