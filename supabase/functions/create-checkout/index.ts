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

    const apiKey = Deno.env.get("LEMON_SQUEEZY_API_KEY");
    const storeId = Deno.env.get("LEMON_SQUEEZY_STORE_ID");
    const variantId = Deno.env.get("LEMON_SQUEEZY_VARIANT_ID");

    if (!apiKey || !storeId || !variantId) {
      throw new Error("Missing server configuration.");
    }

    const body = await req.json();
    const userId = body?.user_id ? String(body.user_id) : null;

    if (!userId) {
      return new Response(JSON.stringify({ message: "Missing user_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const shouldRedirect =
      body?.redirect === true ||
      (typeof body?.redirect === "string" && body.redirect === "true");

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              user_id: userId,
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
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.errors?.[0]?.detail || "Lemon Squeezy API Error";
      throw new Error(errorMessage);
    }

    const checkoutUrl = data?.data?.attributes?.url ?? null;

    if (shouldRedirect && checkoutUrl) {
      return new Response(null, {
        status: 303,
        headers: {
          ...corsHeaders,
          Location: String(checkoutUrl),
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ checkoutUrl, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Internal Server Error",
        error: String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
