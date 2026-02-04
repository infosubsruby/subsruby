import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Client (Service Role for Admin Access)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Check Database for existing rates
    const { data: existingRates, error: dbError } = await supabase
      .from("exchange_rates")
      .select("*");

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    // Check freshness (6 hours = 6 * 60 * 60 * 1000 ms)
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const now = new Date().getTime();
    let isStale = true;

    if (existingRates && existingRates.length > 0) {
      // Assuming all rates are updated together, checking one is enough
      const lastUpdated = new Date(existingRates[0].last_updated).getTime();
      if (now - lastUpdated < SIX_HOURS) {
        isStale = false;
      }
    }

    // 3. Return cached data if fresh
    if (!isStale && existingRates.length > 0) {
      console.log("Returning cached rates from database");
      return new Response(JSON.stringify(existingRates), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 4. Fetch new data from Frankfurter API if stale
    console.log("Rates are stale or missing. Fetching from API...");
    const apiResponse = await fetch("https://api.frankfurter.app/latest"); // Defaults to Base: EUR
    
    if (!apiResponse.ok) {
      throw new Error(`Frankfurter API error: ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();
    const rates = apiData.rates; // { "USD": 1.08, "TRY": 34.5, ... }

    // Prepare data for upsert
    // Note: 'rates' from API is an object, we need to convert it to array of rows
    const upsertData = Object.entries(rates).map(([currency, rate]) => ({
      currency_code: currency,
      rate: rate,
      last_updated: new Date().toISOString(),
    }));

    // Add EUR itself (1 EUR = 1 EUR) as it is the base
    upsertData.push({
      currency_code: "EUR",
      rate: 1,
      last_updated: new Date().toISOString(),
    });

    // 5. Update Database
    const { error: upsertError } = await supabase
      .from("exchange_rates")
      .upsert(upsertData);

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      throw upsertError;
    }

    console.log(`Updated ${upsertData.length} exchange rates.`);

    // 6. Return new data
    return new Response(JSON.stringify(upsertData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-exchange-rates:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
