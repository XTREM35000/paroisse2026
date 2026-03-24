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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405);

    const { email, code } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") return jsonResponse({ error: "email requis" }, 400);
    if (!code || typeof code !== "string" || !/^\d{4}$/.test(code.trim())) {
      return jsonResponse({ error: "code invalide" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const normalizedEmail = email.toLowerCase().trim();

    const { data: row, error: selectError } = await supabaseAdmin
      .from("email_otp_codes")
      .select("id, email, user_id, code, expires_at, attempts, used")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error(`[${requestId}] email_otp_codes select error`, selectError);
      return jsonResponse({ error: "Impossible de vérifier le code" }, 500);
    }
    if (!row) return jsonResponse({ success: false, error: "Code expiré ou introuvable" }, 400);

    const attempts = Number(row.attempts ?? 0);
    if (attempts >= 5) return jsonResponse({ success: false, error: "Trop de tentatives. Regénérez un code." }, 429);

    const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
    if (!expiresAt || Date.now() > expiresAt) {
      await supabaseAdmin.from("email_otp_codes").update({ used: true }).eq("id", row.id);
      return jsonResponse({ success: false, error: "Code expiré. Regénérez un code." }, 400);
    }

    if (code.trim() !== row.code) {
      await supabaseAdmin
        .from("email_otp_codes")
        .update({ attempts: attempts + 1 })
        .eq("id", row.id);
      return jsonResponse({ success: false, error: "Code incorrect" }, 400);
    }

    await supabaseAdmin.from("email_otp_codes").update({ used: true }).eq("id", row.id);

    if (row.user_id) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
        email_confirm: true,
      });
      if (confirmError) {
        console.error(`[${requestId}] confirm user error`, confirmError);
        return jsonResponse({ success: false, error: "Code valide, mais confirmation impossible" }, 500);
      }
    }

    return jsonResponse({ success: true, requestId });
  } catch (error: any) {
    console.error(`[${requestId}] verify-email-otp error`, error);
    return jsonResponse({ error: "Erreur serveur", details: error?.message }, 500);
  }
});

