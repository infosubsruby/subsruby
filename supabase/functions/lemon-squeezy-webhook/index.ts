import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const crypto = globalThis.crypto;

const timingSafeEqualHex = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const secret = Deno.env.get("LEMON_SQUEEZY_WEBHOOK_SECRET");
    if (!secret) {
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

    if (!timingSafeEqualHex(hexSignature, signature)) {
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
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ?? Deno.env.get("MY_SUPABASE_URL") ?? "";
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("MY_SUPABASE_SERVICE_ROLE_KEY") ??
      "";

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration for webhook");
      return new Response("Supabase not configured", { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isSubscriptionEvent =
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_cancelled";

    if (!isSubscriptionEvent) {
      return new Response("Ignored", { status: 200 });
    }

    const attributes = data?.attributes ?? {};
    const lemonCustomerId = attributes?.customer_id ? String(attributes.customer_id) : null;
    const subscriptionId = data?.id ? String(data.id) : null;
    const variantId = attributes?.variant_id ? String(attributes.variant_id) : null;
    const subscriptionStatus = attributes?.status ? String(attributes.status) : null;
    const currentPeriodEnd =
      attributes?.current_period_end ??
      attributes?.renews_at ??
      attributes?.ends_at ??
      null;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        lemon_squeezy_customer_id: lemonCustomerId,
        subscription_id: subscriptionId,
        variant_id: variantId,
        subscription_status: subscriptionStatus,
        current_period_end: currentPeriodEnd,
      })
      .eq("id", userId);

    if (updateError) {
      return new Response("Database error", { status: 500 });
    }

    return new Response("Webhook başarıyla işlendi", { status: 200 });

  } catch (err) {
    console.error("Webhook hatası:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(errorMessage, { status: 500 });
  }
});
