import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { paymentData } = await req.json();

    const apiKey = Deno.env.get("CINETPAY_API_KEY");
    const apiPassword = Deno.env.get("CINETPAY_API_PASSWORD");
    const baseUrl = Deno.env.get("CINETPAY_BASE_URL") || "https://api.cinetpay.com/v1";

    if (!apiKey || !apiPassword) {
      return new Response(
        JSON.stringify({ error: "CinetPay configuration manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authResponse = await fetch(`${baseUrl}/oauth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        api_password: apiPassword,
      }),
    });

    if (!authResponse.ok) {
      const err = await authResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: (err as { message?: string }).message || "Échec authentification CinetPay" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { access_token } = await authResponse.json();

    const paymentResponse = await fetch(`${baseUrl}/payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const result = await paymentResponse.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
