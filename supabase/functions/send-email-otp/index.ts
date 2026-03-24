import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function generateOtp4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405);

    const { email, user_id } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") return jsonResponse({ error: "email requis" }, 400);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const normalizedEmail = email.toLowerCase().trim();
    const otp = generateOtp4();
    const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Keep one active code per email
    const { error: cleanError } = await supabaseAdmin
      .from("email_otp_codes")
      .delete()
      .eq("email", normalizedEmail)
      .eq("used", false);
    if (cleanError) {
      console.error(`[${requestId}] email_otp_codes cleanup error`, cleanError);
      return jsonResponse({ error: "Impossible de générer le code" }, 500);
    }

    const { error: insertError } = await supabaseAdmin.from("email_otp_codes").insert({
      email: normalizedEmail,
      code: otp,
      user_id: typeof user_id === "string" ? user_id : null,
      expires_at,
      used: false,
      attempts: 0,
    });
    if (insertError) {
      console.error(`[${requestId}] email_otp_codes insert error`, insertError);
      return jsonResponse({ error: "Impossible de générer le code" }, 500);
    }

    const { error: sendError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: {
        redirectTo: Deno.env.get("OTP_REDIRECT_TO") ?? "https://www.nd-compassion.ci/auth/callback",
        data: {
          otp_code: otp,
          otp_expires_at: expires_at,
        },
      },
    });

    if (sendError) {
      console.error(`[${requestId}] supabase auth generateLink error`, sendError);
      return jsonResponse({ error: "Échec de l'envoi de l'email" }, 502);
    }

    return jsonResponse({ success: true, requestId });
  } catch (error: any) {
    console.error(`[${requestId}] send-email-otp error`, error);
    return jsonResponse({ error: "Erreur serveur", details: error?.message }, 500);
  }
});

