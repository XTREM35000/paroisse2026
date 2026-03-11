import { serve } from "https://deno.land/x/sift/mod.ts";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { verifyCinetPayWebhook } from "../../../src/lib/payments/cinetpay.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2022-11-15" });

serve(async (req) => {
  try {
    const event = await req.json();
    let donationId: string;
    let provider: string;
    let status: string;
    let transactionId: string | null = null;

    if (event.provider === "stripe") {
      donationId = event.metadata.donationId;
      transactionId = event.id;
      status = event.payment_status === "paid" ? "completed" : "failed";
      provider = "stripe";
    } else if (event.provider === "cinetpay") {
      if (!verifyCinetPayWebhook(event)) return new Response("Invalid signature", { status: 400 });
      donationId = event.donationId;
      transactionId = event.transactionId;
      status = event.status === "success" ? "completed" : "failed";
      provider = "cinetpay";
    } else if (event.provider === "manual") {
      donationId = event.donationId;
      status = "completed_manual";
      provider = "manual";
    } else {
      return new Response("Unknown provider", { status: 400 });
    }

    await supabase
      .from("donations")
      .update({
        status,
        transaction_id: transactionId,
        paid_at: status.includes("completed") ? new Date() : null,
        payment_provider: provider,
      })
      .eq("id", donationId);

    await supabase.from("payment_logs").insert({
      donation_id: donationId,
      provider,
      transaction_id: transactionId,
      method: provider,
      status,
      payload: event,
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal error", { status: 500 });
  }
});

serve(async (req: Request) => {
  try {
    const payload = await req.json();

    // Example payload handling - adapt to provider docs
    console.log('Payment webhook received', payload);

    // TODO: Verify provider signature
    // TODO: Update donation status in Supabase using service role key

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook error', err);
    return new Response('Invalid payload', { status: 400 });
  }
});
