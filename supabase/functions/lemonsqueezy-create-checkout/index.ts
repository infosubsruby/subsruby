import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Environment Variable Kontrolü
    const apiKey = Deno.env.get('LEMONSQUEEZY_API_KEY');
    const storeId = Deno.env.get('LEMONSQUEEZY_STORE_ID');
    const variantId = Deno.env.get('LEMONSQUEEZY_VARIANT_ID');

    if (!apiKey || !storeId || !variantId) {
      console.error("❌ EKSİK ENV VARS:", { apiKey: !!apiKey, storeId: !!storeId, variantId: !!variantId });
      throw new Error("Sunucu tarafında API anahtarları eksik tanımlanmış.");
    }

    // 2. Body Parsing (User ID from request)
    // Eğer request body boşsa veya geçersiz JSON ise hata verebilir, bunu da try-catch yakalar.
    const body = await req.json();
    const { user_id } = body;

    // user_id zorunlu olmalı mı? Genelde evet.
    // Ancak checkout oluştururken user_id opsiyonel olabilir, fakat bizim senaryoda muhtemelen zorunlu.
    // Şimdilik sadece loglayalım.

    // 3. Loglama
    console.log("Checkout oluşturuluyor...", { storeId, variantId, user_id });

    // 4. Lemon Squeezy API Call
    // Not: Lemon Squeezy API'si checkout oluşturmak için belirli bir payload bekler.
    // Eğer user_id varsa custom data olarak ekliyoruz.
    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              user_id: user_id ? String(user_id) : undefined
            }
          }
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId
            }
          },
          variant: {
            data: {
              type: "variants",
              id: variantId
            }
          }
        }
      }
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Lemon Squeezy API Error:", data);
        // Hata detayını fırlat
        const errorMessage = data.errors?.[0]?.detail || "Lemon Squeezy API Error";
        throw new Error(errorMessage);
    }

    // Başarılı yanıt
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Checkout Function Error:", error);
    return new Response(
      JSON.stringify({ 
        message: error.message || "Internal Server Error",
        error: String(error)
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
