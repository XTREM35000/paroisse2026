import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] 🚀 send-sms-otp appelée`);

  try {
    // 1. Vérification méthode
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Méthode non autorisée" }),
        { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 2. Récupération du body
    const { phoneNumber, code } = await req.json();
    
    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: "phoneNumber et code requis" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 3. Récupération des secrets
    const authHeader = Deno.env.get("ORANGE_AUTHORIZATION_HEADER");
    const senderAddress = Deno.env.get("ORANGE_SENDER_ADDRESS");

    if (!authHeader || !senderAddress) {
      console.error(`[${requestId}] ❌ Configuration Orange manquante`);
      return new Response(
        JSON.stringify({ error: "Configuration Orange SMS incomplète" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 4. Obtention du token OAuth
    console.log(`[${requestId}] 🔑 Obtention du token...`);
    const tokenResponse = await fetch("https://api.orange.com/oauth/v3/token", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(8000)
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`[${requestId}] ❌ Échec token:`, errorText);
      return new Response(
        JSON.stringify({ error: "Impossible d'obtenir un token" }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // 5. Envoi du SMS
    console.log(`[${requestId}] 📱 Envoi SMS à ${phoneNumber}...`);
    const encodedSender = encodeURIComponent(senderAddress);
    const smsResponse = await fetch(
      `https://api.orange.com/smsmessaging/v1/outbound/${encodedSender}/requests`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: `tel:${phoneNumber}`,
            senderAddress: senderAddress,
            outboundSMSTextMessage: {
              message: `Votre code OTP Paroisse NDC: ${code}`
            }
          }
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text();
      console.error(`[${requestId}] ❌ Échec envoi:`, errorText);
      return new Response(
        JSON.stringify({ error: "Échec de l'envoi du SMS" }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 6. Succès
    return new Response(
      JSON.stringify({ success: true, requestId }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[${requestId}] ❌ Erreur:`, error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur", details: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
