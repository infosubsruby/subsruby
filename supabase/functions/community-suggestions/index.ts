import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed currencies whitelist
const ALLOWED_CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "BRL",
  "MXN", "KRW", "SGD", "HKD", "NOK", "SEK", "DKK", "NZD", "ZAR", "RUB",
  "TRY", "PLN", "THB", "IDR", "MYR", "PHP", "VND", "CZK", "ILS", "AED"
];

// Max length for name parameter
const MAX_NAME_LENGTH = 200;

interface CommunityData {
  suggestedPrice: number | null;
  suggestedUrl: string | null;
  priceCount: number;
  urlCount: number;
  totalMatches: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token to validate
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

    // Parse request body
    const { name, currency } = await req.json();

    // Validate presence
    if (!name || !currency) {
      return new Response(
        JSON.stringify({ error: "name and currency are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate name type and length
    if (typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "name must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return new Response(
        JSON.stringify({ error: "name cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      return new Response(
        JSON.stringify({ error: `name must be ${MAX_NAME_LENGTH} characters or less` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate currency type and against whitelist
    if (typeof currency !== "string") {
      return new Response(
        JSON.stringify({ error: "currency must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upperCurrency = currency.trim().toUpperCase();
    if (!ALLOWED_CURRENCIES.includes(upperCurrency)) {
      return new Response(
        JSON.stringify({ error: "Invalid currency code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key for querying aggregate data (bypasses RLS for aggregate stats)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize the search name for case-insensitive matching
    const searchName = trimmedName.toLowerCase();

    // Query subscriptions matching the name (case-insensitive) and currency
    // Only fetch price, website_url - no user data for privacy
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("price, website_url")
      .eq("currency", upperCurrency)
      .ilike("name", `%${searchName}%`);

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch community data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      const emptyResult: CommunityData = {
        suggestedPrice: null,
        suggestedUrl: null,
        priceCount: 0,
        urlCount: 0,
        totalMatches: 0,
      };
      return new Response(JSON.stringify(emptyResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate mode (most common value) for price
    const priceFrequency: Record<number, number> = {};
    for (const sub of subscriptions) {
      if (sub.price != null) {
        const priceKey = Number(sub.price);
        priceFrequency[priceKey] = (priceFrequency[priceKey] || 0) + 1;
      }
    }
    
    let suggestedPrice: number | null = null;
    let maxPriceCount = 0;
    for (const [priceStr, count] of Object.entries(priceFrequency)) {
      if (count > maxPriceCount) {
        maxPriceCount = count;
        suggestedPrice = Number(priceStr);
      }
    }

    // Calculate mode for URL
    const urlFrequency: Record<string, number> = {};
    for (const sub of subscriptions) {
      if (sub.website_url) {
        const url = sub.website_url.trim().toLowerCase();
        urlFrequency[url] = (urlFrequency[url] || 0) + 1;
      }
    }

    let suggestedUrl: string | null = null;
    let maxUrlCount = 0;
    for (const [url, count] of Object.entries(urlFrequency)) {
      if (count > maxUrlCount) {
        maxUrlCount = count;
        suggestedUrl = url;
      }
    }

    // Restore original casing for URL if found
    if (suggestedUrl) {
      for (const sub of subscriptions) {
        if (sub.website_url?.trim().toLowerCase() === suggestedUrl) {
          suggestedUrl = sub.website_url;
          break;
        }
      }
    }

    const result: CommunityData = {
      suggestedPrice,
      suggestedUrl,
      priceCount: maxPriceCount,
      urlCount: maxUrlCount,
      totalMatches: subscriptions.length,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
