import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ message: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
    const storeId = Deno.env.get("LEMONSQUEEZY_STORE_ID");
    const monthlyVariantId = Deno.env.get("LEMONSQUEEZY_VARIANT_ID_MONTHLY");
    const yearlyVariantId = Deno.env.get("LEMONSQUEEZY_VARIANT_ID_YEARLY");

    if (!apiKey || !storeId || !monthlyVariantId || !yearlyVariantId) {
      console.error("Missing required env vars for Lemon Squeezy checkout");
      throw new Error("Missing server configuration.");
    }

    const body = await req.json();
    const userId = body?.user_id ? String(body.user_id) : null;
    const billingCycleRaw = body?.billing_cycle ?? body?.plan ?? "monthly";
    const billingCycle = billingCycleRaw === "yearly" ? "yearly" : "monthly";

    const variantId = billingCycle === "yearly" ? yearlyVariantId : monthlyVariantId

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              user_id: userId ?? undefined,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Lemon Squeezy API Error:", data);
        const errorMessage = data.errors?.[0]?.detail || "Lemon Squeezy API Error";
        throw new Error(errorMessage);
    }

    const checkoutUrl = data?.data?.attributes?.url ?? null;

    return new Response(JSON.stringify({ checkoutUrl, data }), {
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
