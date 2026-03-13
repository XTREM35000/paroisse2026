import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();

  try {
    const { dryRun } = await req.json().catch(() => ({ dryRun: false }));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Récupérer l'utilisateur pour journalisation
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Script SQL de nettoyage profond (tables de contenu uniquement)
    const sql = `
      do $$
      begin
        if to_regclass('public.gallery_images') is not null then
          truncate table public.gallery_images restart identity cascade;
        end if;
        if to_regclass('public.videos') is not null then
          truncate table public.videos restart identity cascade;
        end if;
        if to_regclass('public.events') is not null then
          truncate table public.events restart identity cascade;
        end if;
        if to_regclass('public.donations') is not null then
          truncate table public.donations restart identity cascade;
        end if;
        if to_regclass('public.messages') is not null then
          truncate table public.messages restart identity cascade;
        end if;
        if to_regclass('public.announcements') is not null then
          truncate table public.announcements restart identity cascade;
        end if;
        if to_regclass('public.homilies') is not null then
          truncate table public.homilies restart identity cascade;
        end if;
        if to_regclass('public.prayer_intentions') is not null then
          truncate table public.prayer_intentions restart identity cascade;
        end if;
        if to_regclass('public.notifications') is not null then
          truncate table public.notifications restart identity cascade;
        end if;
        if to_regclass('public.comments') is not null then
          truncate table public.comments restart identity cascade;
        end if;
      end
      $$;
    `;

    if (!dryRun) {
      const { error: sqlError } = await supabase.rpc("exec_sql", { query: sql } as any);
      if (sqlError) {
        console.error("[factory-reset] SQL error", sqlError);
        throw sqlError;
      }
    }

    // TODO: optionnel - nettoyage des buckets de stockage via storage API
    // (par ex. avatars, gallery, video-files, etc.)

    const finishedAt = new Date().toISOString();

    // Journalisation optionnelle dans une table audit_logs si elle existe
    try {
      const { error: auditError } = await supabase
        .from("audit_logs")
        .insert({
          action: "factory_reset",
          performed_by: user?.id ?? null,
          metadata: { dryRun, startedAt, finishedAt },
        } as any);
      if (auditError) {
        console.warn("[factory-reset] audit_logs insert error", auditError);
      }
    } catch (e) {
      console.warn("[factory-reset] audit logging failed", e);
    }

    const responseBody = {
      success: true,
      startedAt,
      finishedAt,
      // Les compteurs détaillés peuvent être implémentés plus tard si besoin
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[factory-reset] Unexpected error", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

