import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16"
})

// En-têtes CORS pour toutes les réponses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Gérer la pré-vérification OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // Vérifier que c'est bien une requête POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405 
        }
      )
    }

    const { donationId } = await req.json()

    if (!donationId) {
      return new Response(
        JSON.stringify({ error: 'donationId is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Récupérer les infos du don
    const { data: donation, error } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single()

    if (error || !donation) {
      console.error("Donation not found:", error)
      return new Response(
        JSON.stringify({ error: "Donation not found" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: donation.currency.toLowerCase(),
            product_data: {
              name: "Don - Paroisse Compassion",
            },
            unit_amount: Math.round(donation.amount * 100), // En centimes
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

    // Mettre à jour le don avec le stripe_session_id
    const { error: updateError } = await supabase
      .from("donations")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", donationId)

    if (updateError) {
      console.error("Error updating donation with session_id:", updateError)
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error("Error creating payment:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})