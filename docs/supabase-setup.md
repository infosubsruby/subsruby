# Supabase Kurulum Rehberi - Trae AI için

Bu rehber, projeyi Trae AI'da Supabase ile kullanmak için gereken tüm adımları içerir.

## 1. Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. Yeni proje oluşturun
3. Project URL ve Anon Key'i not edin

## 2. Environment Variables

Proje kök dizininde `.env` dosyası oluşturun:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

## 3. Supabase Client Yapılandırması

`src/integrations/supabase/client.ts` dosyası zaten mevcut:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## 4. Veritabanı Şeması

SQL Editor'da `docs/supabase-schema.sql` dosyasındaki tüm SQL komutlarını çalıştırın.

## 5. Authentication Ayarları

Supabase Dashboard → Authentication → Settings:

1. **Email Auth**: Etkin
2. **Confirm Email**: Etkin (kullanıcılar email doğrulaması yapmalı)
3. **Site URL**: `http://localhost:5173` (development için)
4. **Redirect URLs**: 
   - `http://localhost:5173`
   - `https://your-production-domain.com`

## 6. Edge Functions

Edge functions `supabase/functions/` dizininde bulunur.

### Deployment:
```bash
supabase functions deploy community-suggestions
```

### Edge Function Secrets:
```bash
supabase secrets set SUPABASE_URL=your_url
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 7. RLS Politikaları

Tüm tablolarda Row Level Security (RLS) aktiftir:

| Tablo | Politika |
|-------|----------|
| profiles | Kullanıcılar kendi profilini okur/günceller, Adminler herkesi okur |
| subscriptions | Kullanıcılar kendi aboneliklerini yönetir, Adminler hepsini okur/günceller |
| transactions | Kullanıcılar kendi işlemlerini yönetir |
| budgets | Kullanıcılar kendi bütçelerini yönetir |
| feedbacks | Kullanıcılar kendi geri bildirimlerini oluşturur/okur, Adminler hepsini yönetir |
| user_roles | Adminler tüm rolleri yönetir, Kullanıcılar kendi rolünü okur |

## 8. Admin Hesabı Oluşturma

1. Normal kullanıcı olarak kayıt olun
2. SQL Editor'da:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'admin@example.com';
```

## 9. Test Etme

1. Uygulamayı başlatın: `npm run dev`
2. Signup sayfasından yeni hesap oluşturun
3. Email doğrulaması yapın
4. Login yapın ve dashboard'a erişin

## Sorun Giderme

### RLS Hatası
Eğer "new row violates row-level security policy" hatası alırsanız:
- Kullanıcının giriş yapmış olduğundan emin olun
- Insert işlemlerinde `user_id` alanının `auth.uid()` ile eşleştiğini kontrol edin

### CORS Hatası
Edge function'larda CORS headers'ın doğru ayarlandığından emin olun.
