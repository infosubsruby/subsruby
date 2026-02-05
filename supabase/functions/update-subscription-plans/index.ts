import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simulated data source (Mocking a scraped dataset)
const MOCK_SUBSCRIPTION_PRICES = [
  { name: 'Netflix - Basic', price: 9.99, currency: 'USD' },
  { name: 'Netflix - Standard', price: 15.49, currency: 'USD' },
  { name: 'Netflix - Premium', price: 19.99, currency: 'USD' },
  { name: 'Spotify - Individual', price: 10.99, currency: 'USD' },
  { name: 'Spotify - Duo', price: 14.99, currency: 'USD' },
  { name: 'Spotify - Family', price: 16.99, currency: 'USD' },
  { name: 'YouTube Premium', price: 13.99, currency: 'USD' },
  { name: 'Disney+ - Basic', price: 7.99, currency: 'USD' },
  { name: 'Disney+ - Premium', price: 13.99, currency: 'USD' },
  { name: 'Amazon Prime', price: 14.99, currency: 'USD' },
  { name: 'Apple Music', price: 10.99, currency: 'USD' },
  { name: 'Hulu (No Ads)', price: 17.99, currency: 'USD' },
  { name: 'HBO Max (Ad-Free)', price: 15.99, currency: 'USD' },
]

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - Env var automatically injected by Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase Anon Key - Env var automatically injected by Supabase
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Optional: Scrape logic would go here
    // Example: const response = await fetch('https://some-price-tracker.com');
    // const html = await response.text();
    // const prices = parseHtml(html); 
    // For now, we use MOCK_SUBSCRIPTION_PRICES

    const results = []
    const errors = []

    // Process each plan
    for (const plan of MOCK_SUBSCRIPTION_PRICES) {
      // Check if plan exists by name
      const { data: existingPlans } = await supabaseClient
        .from('subscription_plans')
        .select('id')
        .eq('name', plan.name)
        .limit(1)

      let result;
      
      if (existingPlans && existingPlans.length > 0) {
        // Update existing
        const { data, error } = await supabaseClient
          .from('subscription_plans')
          .update({ 
            price: plan.price,
            currency: plan.currency,
            // updated_at: new Date().toISOString() // If you have this column
          })
          .eq('id', existingPlans[0].id)
          .select()
        
        if (error) errors.push({ name: plan.name, error })
        else results.push({ action: 'updated', plan: data[0] })
      } else {
        // Insert new
        const { data, error } = await supabaseClient
          .from('subscription_plans')
          .insert({
            name: plan.name,
            price: plan.price,
            currency: plan.currency
          })
          .select()

        if (error) errors.push({ name: plan.name, error })
        else results.push({ action: 'inserted', plan: data[0] })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Sync completed', 
        stats: {
          processed: MOCK_SUBSCRIPTION_PRICES.length,
          success: results.length,
          failed: errors.length
        },
        details: results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
