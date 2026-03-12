import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16"
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log("🔵 [create-payment] Function invoked")
  console.log("🔵 Method:", req.method)
  console.log("🔵 URL:", req.url)
  
  // Gérer la pré-vérification OPTIONS
  if (req.method === 'OPTIONS') {
    console.log("🔵 Handling OPTIONS preflight")
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // Vérifier que c'est bien une requête POST
    if (req.method !== 'POST') {
      console.log("🔴 Method not allowed:", req.method)
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405 
        }
      )
    }

    // Lire le body
    const bodyText = await req.text()
    console.log("🔵 Raw body:", bodyText)
    
    let body
    try {
      body = JSON.parse(bodyText)
      console.log("🔵 Parsed body:", body)
    } catch (e) {
      console.log("🔴 Failed to parse JSON:", e)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const { donationId } = body

    if (!donationId) {
      console.log("🔴 Missing donationId")
      return new Response(
        JSON.stringify({ error: 'donationId is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log("🔵 donationId:", donationId)

    // Vérifier les variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")
    
    console.log("🔵 SUPABASE_URL exists:", !!supabaseUrl)
    console.log("🔵 SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseKey)
    console.log("🔵 STRIPE_SECRET_KEY exists:", !!stripeKey)

    if (!supabaseUrl || !supabaseKey) {
      console.log("🔴 Missing Supabase environment variables")
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer les infos du don
    console.log("🔵 Fetching donation from Supabase...")
    const { data: donation, error } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single()

    if (error) {
      console.log("🔴 Supabase error:", error)
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    if (!donation) {
      console.log("🔴 Donation not found")
      return new Response(
        JSON.stringify({ error: "Donation not found" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    console.log("🔵 Donation found:", donation)

    // Vérifier la clé Stripe
    if (!stripeKey) {
      console.log("🔴 Missing Stripe secret key")
      return new Response(
        JSON.stringify({ error: 'Stripe configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Créer la session Stripe
    console.log("🔵 Creating Stripe session...")
    console.log("🔵 Amount:", donation.amount)
    console.log("🔵 Currency:", donation.currency)
    console.log("🔵 Email:", donation.payer_email)

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: donation.currency.toLowerCase(),
              product_data: {
                name: "Don - Paroisse Compassion",
              },
              unit_amount: Math.round(donation.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `https://www.nd-compassion.ci/donation-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://www.nd-compassion.ci/donate`,
        metadata: {
          donation_id: donationId,
        },
        customer_email: donation.payer_email,
      })

      console.log("🔵 Stripe session created:", session.id)
      console.log("🔵 Stripe URL:", session.url)

      // Mettre à jour le don avec le stripe_session_id
      console.log("🔵 Updating donation with session_id...")
      const { error: updateError } = await supabase
        .from("donations")
        .update({
          stripe_session_id: session.id,
        })
        .eq("id", donationId)

      if (updateError) {
        console.log("🔴 Error updating donation:", updateError)
        // On continue malgré l'erreur car la session est créée
      } else {
        console.log("🔵 Donation updated successfully")
      }

      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } catch (stripeError) {
      console.log("🔴 Stripe error:", stripeError)
      return new Response(
        JSON.stringify({ error: `Stripe error: ${stripeError.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
  } catch (error) {
    console.log("🔴 Unexpected error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})