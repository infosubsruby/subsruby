import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const videoPlans = [
  // NETFLIX (US, TR, GBP, EUR, BRL)
  { "service_name": "Netflix", "plan_name": "Standard with Ads", "price": 6.99, "currency": "USD" },
  { "service_name": "Netflix", "plan_name": "Standard", "price": 15.49, "currency": "USD" },
  { "service_name": "Netflix", "plan_name": "Premium", "price": 22.99, "currency": "USD" },
  { "service_name": "Netflix", "plan_name": "Temel", "price": 149.99, "currency": "TRY" },
  { "service_name": "Netflix", "plan_name": "Standart", "price": 229.99, "currency": "TRY" },
  { "service_name": "Netflix", "plan_name": "Özel", "price": 299.99, "currency": "TRY" },
  { "service_name": "Netflix", "plan_name": "Standard", "price": 10.99, "currency": "GBP" },
  { "service_name": "Netflix", "plan_name": "Standard", "price": 13.99, "currency": "EUR" },
  { "service_name": "Netflix", "plan_name": "Padrão", "price": 44.90, "currency": "BRL" },

  // YOUTUBE (US, TR, GBP, EUR, AUD, JPY)
  { "service_name": "YouTube", "plan_name": "Premium", "price": 13.99, "currency": "USD" },
  { "service_name": "YouTube", "plan_name": "Family", "price": 22.99, "currency": "USD" },
  { "service_name": "YouTube", "plan_name": "Premium", "price": 57.99, "currency": "TRY" },
  { "service_name": "YouTube", "plan_name": "Aile", "price": 115.99, "currency": "TRY" },
  { "service_name": "YouTube", "plan_name": "Premium", "price": 12.99, "currency": "GBP" },
  { "service_name": "YouTube", "plan_name": "Premium", "price": 12.99, "currency": "EUR" },
  { "service_name": "YouTube", "plan_name": "Premium", "price": 1280, "currency": "JPY" },

  // DISNEY+ (US, TR, GBP, EUR, BRL)
  { "service_name": "Disney+", "plan_name": "Basic (Ads)", "price": 9.99, "currency": "USD" },
  { "service_name": "Disney+", "plan_name": "Premium", "price": 15.99, "currency": "USD" },
  { "service_name": "Disney+", "plan_name": "Standart", "price": 134.99, "currency": "TRY" },
  { "service_name": "Disney+", "plan_name": "Standard", "price": 7.99, "currency": "GBP" },
  { "service_name": "Disney+", "plan_name": "Standard", "price": 8.99, "currency": "EUR" },
  { "service_name": "Disney+", "plan_name": "Padrão", "price": 27.90, "currency": "BRL" },

  // AMAZON PRIME (US, TR, GBP, EUR, BRL, INR, JPY)
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 14.99, "currency": "USD" },
  { "service_name": "Amazon Prime", "plan_name": "Aylık", "price": 39.00, "currency": "TRY" },
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 8.99, "currency": "GBP" },
  { "service_name": "Amazon Prime", "plan_name": "Mensal", "price": 19.90, "currency": "BRL" },
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 299, "currency": "INR" },
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 600, "currency": "JPY" }
]

const otherPlans = [
  // SPOTIFY (US, TR, GBP, EUR, MXN, BRL, AUD)
  { "service_name": "Spotify", "plan_name": "Individual", "price": 11.99, "currency": "USD" },
  { "service_name": "Spotify", "plan_name": "Duo", "price": 16.99, "currency": "USD" },
  { "service_name": "Spotify", "plan_name": "Family", "price": 19.99, "currency": "USD" },
  { "service_name": "Spotify", "plan_name": "Bireysel", "price": 59.99, "currency": "TRY" },
  { "service_name": "Spotify", "plan_name": "Öğrenci", "price": 32.99, "currency": "TRY" },
  { "service_name": "Spotify", "plan_name": "Aile", "price": 99.99, "currency": "TRY" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 11.99, "currency": "GBP" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 10.99, "currency": "EUR" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 139.00, "currency": "MXN" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 23.90, "currency": "BRL" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 15.99, "currency": "AUD" },

  // APPLE MUSIC
  { "service_name": "Apple Music", "plan_name": "Individual", "price": 10.99, "currency": "USD" },
  { "service_name": "Apple Music", "plan_name": "Individual", "price": 10.99, "currency": "GBP" },
  { "service_name": "Apple Music", "plan_name": "Bireysel", "price": 39.99, "currency": "TRY" },

  // ADOBE CREATIVE CLOUD
  { "service_name": "Adobe Creative Cloud", "plan_name": "All Apps", "price": 59.99, "currency": "USD" },
  { "service_name": "Adobe Creative Cloud", "plan_name": "All Apps", "price": 51.98, "currency": "GBP" },

  // CANVA
  { "service_name": "Canva", "plan_name": "Pro", "price": 15.00, "currency": "USD" },
  { "service_name": "Canva", "plan_name": "Pro", "price": 13.00, "currency": "GBP" },
  { "service_name": "Canva", "plan_name": "Pro", "price": 99.99, "currency": "TRY" },

  // X PREMIUM
  { "service_name": "X Premium", "plan_name": "Basic", "price": 3.00, "currency": "USD" },
  { "service_name": "X Premium", "plan_name": "Premium", "price": 8.00, "currency": "USD" },
  { "service_name": "X Premium", "plan_name": "Premium", "price": 150.00, "currency": "TRY" },

  // PROTON VPN
  { "service_name": "Proton VPN", "plan_name": "Plus", "price": 9.99, "currency": "USD" },
  { "service_name": "Proton VPN", "plan_name": "Plus", "price": 9.99, "currency": "EUR" }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const allPlans = [...videoPlans, ...otherPlans]
    const results = { success: 0, failed: 0, errors: [] }

    for (const plan of allPlans) {
      const fullName = `${plan.service_name} - ${plan.plan_name}`

      // Check if plan exists
      const { data: existingPlans, error: searchError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', fullName)
        .eq('currency', plan.currency)
        .maybeSingle()

      if (searchError) {
        console.error(`Error searching ${fullName}:`, searchError)
        results.failed++
        results.errors.push({ plan: fullName, currency: plan.currency, error: searchError.message })
        continue
      }

      if (existingPlans) {
        // Update
        const { error: updateError } = await supabase
          .from('subscription_plans')
          .update({ price: plan.price })
          .eq('id', existingPlans.id)

        if (updateError) {
          console.error(`Error updating ${fullName}:`, updateError)
          results.failed++
          results.errors.push({ plan: fullName, currency: plan.currency, error: updateError.message })
        } else {
          results.success++
        }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('subscription_plans')
          .insert({
            name: fullName,
            price: plan.price,
            currency: plan.currency
          })

        if (insertError) {
          console.error(`Error inserting ${fullName}:`, insertError)
          results.failed++
          results.errors.push({ plan: fullName, currency: plan.currency, error: insertError.message })
        } else {
          results.success++
        }
      }
    }

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
