import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const crypto = globalThis.crypto;

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // 1. Secret Key Kontrolü
    const secret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
    if (!secret) {
      console.error("LEMONSQUEEZY_WEBHOOK_SECRET tanımlanmamış!");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // 2. İmza (Signature) Doğrulama
    const signature = req.headers.get("x-signature");
    if (!signature) {
      return new Response("No signature provided", { status: 401 });
    }

    const rawBody = await req.text();
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );
    
    const hexSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hexSignature !== signature) {
      console.error("Geçersiz imza! Beklenen:", hexSignature, "Gelen:", signature);
      return new Response("Invalid signature", { status: 401 });
    }

    // 3. Payload İşleme
    const payload = JSON.parse(rawBody);
    const { meta, data } = payload;
    const eventName = meta.event_name;
    
    // Custom Data'dan user_id'yi al (Frontend'de gönderdiğimiz checkout[custom][user_id])
    const userId = meta.custom_data?.user_id;

    console.log(`Webhook Event: ${eventName}, User ID: ${userId}`);

    if (!userId) {
       console.log("Custom data içinde user_id bulunamadı.");
       return new Response("No user_id provided", { status: 200 }); 
    }

    // 4. Supabase Bağlantısı
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("MY_SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("MY_SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let error = null;

    // 5. Olaylara Göre İşlem Yapma
    
    // SENARYO A: Tek Seferlik Ödeme (Lifetime Access) -> 'order_created'
    if (eventName === "order_created") {
       const { error: upsertError } = await supabase
         .from("user_subscriptions")
         .upsert({
           user_id: userId,
           customer_id: data.attributes.customer_id.toString(),
           variant_id: data.attributes.first_order_item.variant_id.toString(),
           status: "active", // Ömür boyu erişim 'active' kabul edilir
           renews_at: null,  // Yenilenmez
           ends_at: null     // Bitmez
         }, { onConflict: "user_id" });
       error = upsertError;
    } 
    // SENARYO B: Abonelik Başlatma/Güncelleme -> 'subscription_created', 'subscription_updated'
    else if (eventName === "subscription_created" || eventName === "subscription_updated") {
       const { error: upsertError } = await supabase
         .from("user_subscriptions")
         .upsert({
           user_id: userId,
           customer_id: data.attributes.customer_id.toString(),
           subscription_id: data.id,
           variant_id: data.attributes.variant_id.toString(),
           status: data.attributes.status,
           renews_at: data.attributes.renews_at,
           ends_at: data.attributes.ends_at
         }, { onConflict: "user_id" });
       error = upsertError;
    } 
    // SENARYO C: Abonelik İptali/Bitmesi -> 'subscription_cancelled', 'subscription_expired'
    else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
        const { error: updateError } = await supabase
         .from("user_subscriptions")
         .update({
            status: data.attributes.status,
            ends_at: data.attributes.ends_at
         })
         .eq("subscription_id", data.id);
        error = updateError;
    }

    if (error) {
      console.error("Supabase veritabanı hatası:", error);
      return new Response("Database error", { status: 500 });
    }

    return new Response("Webhook başarıyla işlendi", { status: 200 });

  } catch (err) {
    console.error("Webhook hatası:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
