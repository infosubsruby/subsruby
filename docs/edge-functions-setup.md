# Edge Functions Kurulum Rehberi

## Mevcut Edge Functions

### 1) community-suggestions

Bu fonksiyon, kullanıcıların abonelik eklerken topluluk verilerinden fiyat ve URL önerileri almasını sağlar.

**Dosya:** `supabase/functions/community-suggestions/index.ts`

**Özellikler:**
- JWT authentication
- CORS headers
- Input validation
- Currency whitelist
- Mode calculation (en sık kullanılan değer)

### 2) get-exchange-rates

Frankfurter API tabanlı döviz kurlarını getirir; veritabanında cache’ler (ör. 6 saat TTL).

**Dosya:** `supabase/functions/get-exchange-rates/index.ts`

**Özellikler:**
- Frankfurter API ile EUR tabanlı kur çekimi
- `exchange_rates` tablosuna yazma (Service Role anahtarı ile)
- Cache kontrolü ve güncel veri döndürme

### 3) update-regional-plans

Global video ve diğer servis planlarını (USD/EUR vb.) `subscription_plans` tablosuna upsert eder.

**Dosya:** `supabase/functions/update-regional-plans/index.ts`

**Özellikler:**
- Video ve diğer planların birleştirilmesi
- `subscription_plans` için manuel upsert (varsa update, yoksa insert)
- Birden fazla para birimini kapsayan genişletilebilir yapı

## Supabase CLI Kurulumu

```bash
# Supabase CLI kurulumu
npm install -g supabase

# Projeye login
supabase login

# Projeyi bağla
supabase link --project-ref YOUR_PROJECT_ID
```

## Edge Function Deployment

```bash
# Tek fonksiyon deploy (JWT doğrulamayı kapatmak için önerilen)
supabase functions deploy community-suggestions --no-verify-jwt
supabase functions deploy get-exchange-rates --no-verify-jwt
supabase functions deploy update-regional-plans --no-verify-jwt

# Tüm fonksiyonları deploy
supabase functions deploy
```

## Secrets Ayarlama

Edge functions için gerekli secret'lar:

```bash
# Zorunlu secret'lar
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Local Development

```bash
# Edge functions'ı local'de çalıştır
supabase functions serve

# Belirli bir fonksiyonu çalıştır
supabase functions serve community-suggestions
supabase functions serve get-exchange-rates
supabase functions serve update-regional-plans
```

## Config.toml

`supabase/config.toml` dosyası:

```toml
project_id = "YOUR_PROJECT_ID"

[functions.community-suggestions]
verify_jwt = false

[functions.get-exchange-rates]
verify_jwt = false

[functions.update-regional-plans]
verify_jwt = false
```

**Not:** `verify_jwt = false` çünkü JWT doğrulaması kod içinde manuel yapılıyor (getClaims kullanarak).

## Edge Function Çağırma (Frontend)

```typescript
import { supabase } from "@/integrations/supabase/client";

// Authenticated request
const { data: session } = await supabase.auth.getSession();

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-suggestions`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.session?.access_token}`,
    },
    body: JSON.stringify({
      name: 'Netflix',
      currency: 'USD',
    }),
  }
);

const data = await response.json();
```

Alternatif olarak Supabase JS client ile:

```typescript
// Kur oranlarını almak için
const { data: rates } = await supabase.functions.invoke("get-exchange-rates");

// Bölgesel planları güncellemek/deploy sonrası tetiklemek için
const { data: updated } = await supabase.functions.invoke("update-regional-plans");
```

## CORS Headers

Her edge function'da şu CORS headers olmalı:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// OPTIONS handler
if (req.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
}
```

## JWT Authentication Pattern

```typescript
// Auth header kontrolü
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Token doğrulama
const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});

const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);

if (claimsError || !claimsData?.claims) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Kullanıcı ID'si
const userId = claimsData.claims.sub;
```

## Yeni Edge Function Ekleme

1. Klasör oluştur: `supabase/functions/my-function/`
2. `index.ts` dosyası oluştur
3. `config.toml`'a ekle:
   ```toml
   [functions.my-function]
   verify_jwt = false
   ```
4. Deploy: `supabase functions deploy my-function`
