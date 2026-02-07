import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const videoPlans = [
  // --- NETFLIX (Tüm Kurlar) ---
  { "service_name": "Netflix", "plan_name": "Standard", "price": 15.49, "currency": "USD" },
  { "service_name": "Netflix", "plan_name": "Standart", "price": 229.99, "currency": "TRY" },
  { "service_name": "Netflix", "plan_name": "Standard", "price": 13.99, "currency": "EUR" },
  { "service_name": "Netflix", "plan_name": "Standard", "price": 10.99, "currency": "GBP" },
  { "service_name": "Netflix", "plan_name": "Standard", "price": 16.49, "currency": "CAD" }, // Kanada
  { "service_name": "Netflix", "plan_name": "Estándar", "price": 219.00, "currency": "MXN" }, // Meksika
  { "service_name": "Netflix", "plan_name": "Standard", "price": 16.99, "currency": "AUD" }, // Avustralya
  { "service_name": "Netflix", "plan_name": "Standard", "price": 1490, "currency": "JPY" }, // Japonya
  { "service_name": "Netflix", "plan_name": "Standard", "price": 499, "currency": "INR" },  // Hindistan
  { "service_name": "Netflix", "plan_name": "Padrão", "price": 44.90, "currency": "BRL" },  // Brezilya

  // --- YOUTUBE PREMIUM (Tüm Kurlar) ---
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 13.99, "currency": "USD" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 57.99, "currency": "TRY" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 12.99, "currency": "EUR" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 12.99, "currency": "GBP" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 12.99, "currency": "CAD" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 139.00, "currency": "MXN" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 16.99, "currency": "AUD" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 1280, "currency": "JPY" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 129.00, "currency": "INR" },
  { "service_name": "YouTube Premium", "plan_name": "Premium", "price": 24.90, "currency": "BRL" },

  // --- DISNEY+ (Seçili Kurlar) ---
  { "service_name": "Disney+", "plan_name": "Premium", "price": 13.99, "currency": "USD" },
  { "service_name": "Disney+", "plan_name": "Standart", "price": 134.99, "currency": "TRY" },
  { "service_name": "Disney+", "plan_name": "Standard", "price": 8.99, "currency": "EUR" },
  { "service_name": "Disney+", "plan_name": "Standard", "price": 7.99, "currency": "GBP" },
  { "service_name": "Disney+", "plan_name": "Standard", "price": 11.99, "currency": "CAD" },
  { "service_name": "Disney+", "plan_name": "Standard", "price": 13.99, "currency": "AUD" },

  // --- AMAZON PRIME (Tüm Kurlar) ---
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 14.99, "currency": "USD" },
  { "service_name": "Amazon Prime", "plan_name": "Aylık", "price": 39.00, "currency": "TRY" },
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 8.99, "currency": "EUR" }, // DE/FR Ort.
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 8.99, "currency": "GBP" },
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 9.99, "currency": "CAD" },
  { "service_name": "Amazon Prime", "plan_name": "Mensual", "price": 99.00, "currency": "MXN" },
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 9.99, "currency": "AUD" },
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 600, "currency": "JPY" },
  { "service_name": "Amazon Prime", "plan_name": "Monthly", "price": 299, "currency": "INR" },
  { "service_name": "Amazon Prime", "plan_name": "Mensal", "price": 19.90, "currency": "BRL" }
]

const otherPlans = [
  // --- SPOTIFY (Tüm Kurlar) ---
  { "service_name": "Spotify", "plan_name": "Individual", "price": 11.99, "currency": "USD" },
  { "service_name": "Spotify", "plan_name": "Bireysel", "price": 59.99, "currency": "TRY" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 10.99, "currency": "EUR" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 11.99, "currency": "GBP" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 10.99, "currency": "CAD" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 129.00, "currency": "MXN" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 13.99, "currency": "AUD" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 980, "currency": "JPY" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 119.00, "currency": "INR" },
  { "service_name": "Spotify", "plan_name": "Individual", "price": 21.90, "currency": "BRL" },
  // --- APPLE MUSIC ---
  { "service_name": "Apple Music", "plan_name": "Individual", "price": 10.99, "currency": "USD" },
  { "service_name": "Apple Music", "plan_name": "Bireysel", "price": 39.99, "currency": "TRY" },
  { "service_name": "Apple Music", "plan_name": "Individual", "price": 10.99, "currency": "GBP" },
  { "service_name": "Apple Music", "plan_name": "Individual", "price": 10.99, "currency": "EUR" },
  { "service_name": "Apple Music", "plan_name": "Individual", "price": 10.99, "currency": "CAD" },
  { "service_name": "Apple Music", "plan_name": "Individual", "price": 99.00, "currency": "INR" },
  // --- CANVA / ADOBE / X ---
  { "service_name": "Canva", "plan_name": "Pro", "price": 15.00, "currency": "USD" },
  { "service_name": "Canva", "plan_name": "Pro", "price": 99.99, "currency": "TRY" },
  { "service_name": "Adobe Creative Cloud", "plan_name": "All Apps", "price": 59.99, "currency": "USD" },
  { "service_name": "X Premium", "plan_name": "Basic", "price": 3.00, "currency": "USD" },
  { "service_name": "X Premium", "plan_name": "Premium", "price": 150.00, "currency": "TRY" }
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
      // Check if plan exists
      const { data: existingPlans, error: searchError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('service_name', plan.service_name)
        .eq('plan_name', plan.plan_name)
        .eq('currency', plan.currency)
        .maybeSingle()

      if (searchError) {
        console.error(`Error searching ${plan.service_name} - ${plan.plan_name}:`, searchError)
        results.failed++
        results.errors.push({ plan: `${plan.service_name} - ${plan.plan_name}`, currency: plan.currency, error: searchError.message })
        continue
      }

      if (existingPlans) {
        // Update
        const { error: updateError } = await supabase
          .from('subscription_plans')
          .update({ price: plan.price })
          .eq('id', existingPlans.id)

        if (updateError) {
          console.error(`Error updating ${plan.service_name} - ${plan.plan_name}:`, updateError)
          results.failed++
          results.errors.push({ plan: `${plan.service_name} - ${plan.plan_name}`, currency: plan.currency, error: updateError.message })
        } else {
          results.success++
        }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('subscription_plans')
          .insert({
            service_name: plan.service_name,
            plan_name: plan.plan_name,
            price: plan.price,
            currency: plan.currency
          })

        if (insertError) {
          console.error(`Error inserting ${plan.service_name} - ${plan.plan_name}:`, insertError)
          results.failed++
          results.errors.push({ plan: `${plan.service_name} - ${plan.plan_name}`, currency: plan.currency, error: insertError.message })
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
