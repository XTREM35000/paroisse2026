import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const stripe = new Stripe(
 Deno.env.get("STRIPE_SECRET_KEY")!,
 { apiVersion:"2023-10-16" }
)

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

Deno.serve(async (req)=>{

const body = await req.text()

const signature = req.headers.get("stripe-signature")!

let event

try {

event = stripe.webhooks.constructEvent(
 body,
 signature,
 endpointSecret
)

} catch(err){

return new Response(`Webhook error: ${err.message}`,{status:400})

}

if(event.type==="checkout.session.completed"){

const session = event.data.object

const donationId = session.metadata.donation_id

const supabase = createClient(
 Deno.env.get("SUPABASE_URL")!,
 Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

await supabase
.from("donations")
.update({
 payment_status:"paid"
})
.eq("id",donationId)

await sendReceipt(
 session.customer_email,
 session.amount_total/100
)

}

return new Response("ok")

})