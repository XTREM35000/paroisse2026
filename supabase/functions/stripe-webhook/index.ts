import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!,
  { apiVersion: "2023-10-16" }
)

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

// En-têtes CORS (même si le webhook est appelé par Stripe, c'est une bonne pratique)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Gérer la pré-vérification OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")!

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook error: ${err.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object
      const donationId = session.metadata?.donation_id
      
      if (!donationId) {
        console.error("No donation_id in metadata")
        return new Response(
          JSON.stringify({ error: "Missing donation_id" }),
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

      // Vérifier l'état actuel du don
      const { data: donation, error: selectError } = await supabase
        .from("donations")
        .select("payment_status")
        .eq("id", donationId)
        .single()

      if (selectError) {
        console.error("Error checking donation:", selectError)
        return new Response(
          JSON.stringify({ error: selectError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      // Si déjà payé, ignorer
      if (donation && donation.payment_status === "paid") {
        return new Response(
          JSON.stringify({ message: "already paid" }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      // Mettre à jour le don
      const { error: updateError } = await supabase
        .from("donations")
        .update({
          payment_status: "paid",
          transaction_id: session.payment_intent || session.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", donationId)

      if (updateError) {
        console.error("Error updating donation:", updateError)
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      console.log(`✅ Donation ${donationId} marked as paid`)
    }

    return new Response(
      JSON.stringify({ message: "ok" }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})