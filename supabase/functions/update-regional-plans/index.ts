import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Real Regional Pricing Data (Estimates as of 2024/2025)
const REGIONAL_PLANS = [
  // --- NETFLIX ---
  { name: 'Netflix - Basic', price: 119.99, currency: 'TRY' },
  { name: 'Netflix - Standard', price: 176.99, currency: 'TRY' },
  { name: 'Netflix - Premium', price: 229.99, currency: 'TRY' },
  { name: 'Netflix - Basic', price: 9.99, currency: 'USD' },
  { name: 'Netflix - Standard', price: 15.49, currency: 'USD' },
  { name: 'Netflix - Premium', price: 22.99, currency: 'USD' },

  // --- SPOTIFY ---
  { name: 'Spotify - Individual', price: 59.99, currency: 'TRY' },
  { name: 'Spotify - Duo', price: 79.99, currency: 'TRY' },
  { name: 'Spotify - Family', price: 99.99, currency: 'TRY' },
  { name: 'Spotify - Student', price: 32.99, currency: 'TRY' },
  { name: 'Spotify - Individual', price: 11.99, currency: 'USD' },
  { name: 'Spotify - Duo', price: 16.99, currency: 'USD' },
  { name: 'Spotify - Family', price: 19.99, currency: 'USD' },
  { name: 'Spotify - Student', price: 5.99, currency: 'USD' },

  // --- YOUTUBE PREMIUM ---
  { name: 'YouTube Premium - Individual', price: 57.99, currency: 'TRY' },
  { name: 'YouTube Premium - Family', price: 115.99, currency: 'TRY' },
  { name: 'YouTube Premium - Student', price: 37.99, currency: 'TRY' },
  { name: 'YouTube Premium - Individual', price: 13.99, currency: 'USD' },
  { name: 'YouTube Premium - Family', price: 22.99, currency: 'USD' },
  { name: 'YouTube Premium - Student', price: 7.99, currency: 'USD' },

  // --- DISNEY+ ---
  { name: 'Disney+ - Standard', price: 134.99, currency: 'TRY' },
  { name: 'Disney+ - Premium', price: 164.99, currency: 'TRY' }, // Hypothetical tiered pricing
  { name: 'Disney+ - Basic (With Ads)', price: 7.99, currency: 'USD' },
  { name: 'Disney+ - Premium (No Ads)', price: 13.99, currency: 'USD' },

  // --- APPLE MUSIC ---
  { name: 'Apple Music - Individual', price: 39.99, currency: 'TRY' },
  { name: 'Apple Music - Family', price: 59.99, currency: 'TRY' },
  { name: 'Apple Music - Student', price: 19.99, currency: 'TRY' },
  { name: 'Apple Music - Individual', price: 10.99, currency: 'USD' },
  { name: 'Apple Music - Family', price: 16.99, currency: 'USD' },
  { name: 'Apple Music - Student', price: 5.99, currency: 'USD' },

  // --- AMAZON PRIME ---
  { name: 'Amazon Prime', price: 39.00, currency: 'TRY' },
  { name: 'Amazon Prime', price: 14.99, currency: 'USD' },

  // --- BLU TV (Local) ---
  { name: 'BluTV - Monthly', price: 99.90, currency: 'TRY' }, // Recent hike
  { name: 'BluTV - Yearly', price: 588.00, currency: 'TRY' },

  // --- EXXEN (Local) ---
  { name: 'Exxen - Reklamlı', price: 99.90, currency: 'TRY' },
  { name: 'Exxen - Reklamsız', price: 139.90, currency: 'TRY' },
  { name: 'ExxenSpor - Reklamlı', price: 229.90, currency: 'TRY' },
  { name: 'ExxenSpor - Reklamsız', price: 269.90, currency: 'TRY' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const results = []
    const errors = []

    for (const plan of REGIONAL_PLANS) {
      // Logic: Check if a plan with this NAME and CURRENCY already exists
      const { data: existingPlans } = await supabaseClient
        .from('subscription_plans')
        .select('id')
        .eq('name', plan.name)
        .eq('currency', plan.currency)
        .limit(1)

      let operationResult;

      if (existingPlans && existingPlans.length > 0) {
        // UPDATE existing record
        const { data, error } = await supabaseClient
          .from('subscription_plans')
          .update({ 
            price: plan.price,
            // updated_at: new Date().toISOString()
          })
          .eq('id', existingPlans[0].id)
          .select()
        
        if (error) {
          errors.push({ plan: `${plan.name} (${plan.currency})`, error })
        } else {
          results.push({ action: 'updated', plan: `${plan.name} (${plan.currency})` })
        }
      } else {
        // INSERT new record
        const { data, error } = await supabaseClient
          .from('subscription_plans')
          .insert({
            name: plan.name,
            price: plan.price,
            currency: plan.currency
          })
          .select()

        if (error) {
          errors.push({ plan: `${plan.name} (${plan.currency})`, error })
        } else {
          results.push({ action: 'inserted', plan: `${plan.name} (${plan.currency})` })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Regional pricing sync completed', 
        stats: {
          total_processed: REGIONAL_PLANS.length,
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
