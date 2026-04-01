// supabase/functions/create-developer/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
}


Deno.serve(async (req) => {
  // Gestion des requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders })
  }

  try {
    /** Réaligner mot de passe auth uniquement si c’est bien une première install. */
    let isFirstInstall = false

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const devEmail = 'dibothierrygogo@gmail.com'
    const devUsername = 'thierry_gogo'
    const devFullName = 'Thierry Gogo'
    // Alignement avec le SetupWizard (SYSTEM modal) qui tente de se connecter avec ce mot de passe.
    // Single source of truth for dev login; override with DEV_PASSWORD in Edge Function secrets.
    const devPassword = Deno.env.get('DEV_PASSWORD') || 'P2024Mano"'

    const systemParishId = '00000000-0000-0000-0000-000000000001'
    const fixedDevUserId = '11111111-1111-1111-1111-111111111111'

    // 🔥 DETECTION DE LA PREMIERE INSTALLATION (base initiale vide)
    try {
      const { count: profilesCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: parishesCount } = await supabaseAdmin
        .from('paroisses')
        .select('*', { count: 'exact', head: true })

      isFirstInstall = (profilesCount === 0 && parishesCount === 0)
      console.log('[create-developer] isFirstInstall:', isFirstInstall)
    } catch (e) {
      console.warn('[create-developer] Impossible de déterminer isFirstInstall:', e)
    }

    console.log('[create-developer] 🔍 Vérification du compte developer...')

    // 0) Assurer la paroisse SYSTEM (important après un reset complet).
    try {
      const { error } = await supabaseAdmin.rpc('ensure_system_parish')
      if (error) console.warn('[create-developer] ensure_system_parish RPC failed:', error)
    } catch (e) {
      console.warn('[create-developer] ensure_system_parish RPC not available:', e)
    }

    // Fallback: insertion directe si le RPC n'existe pas / échoue.
    // (évite un cas où la membership sync ne trouve aucune paroisse)
    try {
      const { error: sysInsertErr } = await supabaseAdmin
        .from('paroisses')
        .upsert(
          {
            id: systemParishId,
            nom: 'SYSTEM',
            slug: 'system',
            description: 'Compte système pour maintenance',
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )

      if (sysInsertErr) {
        console.warn('[create-developer] Fallback system parish upsert failed:', sysInsertErr)
      }
    } catch (e) {
      console.warn('[create-developer] Fallback system parish upsert threw:', e)
    }

    // 1) Récupérer le developer existant dans profiles (role=developer)
    let developerId: string | null = null
    let developerEmail: string | null = null
    let devProfileRole: string | null = null

    const { data: devProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'developer')
      .limit(1)
      .maybeSingle()

    if (profileError) {
      throw new Error(`Erreur lors de la recherche du developer: ${profileError.message}`)
    }

    if (devProfile?.id) {
      developerId = devProfile.id
      developerEmail = devProfile.email
      devProfileRole = devProfile.role
      console.log('[create-developer] ✅ Developer profile trouvé:', developerId)

      // Vérifier que l'utilisateur existe aussi dans auth.users.
      try {
        const { data: authUser, error: authUserError } = await (supabaseAdmin.auth.admin as any).getUserById(developerId)
        if (authUserError || !authUser?.user) {
          console.warn('[create-developer] auth user introuvable pour ce profile developer, création / ré-initialisation...')
          const { data: newUser, error: createError } = await (supabaseAdmin.auth.admin as any).createUser({
            id: developerId,
            email: developerEmail ?? devEmail,
            password: devPassword,
            email_confirm: true,
            user_metadata: {
              full_name: devFullName,
              username: devUsername,
              role: 'developer',
            },
          })
          if (createError) {
            console.warn('[create-developer] Échec création user auth ré-essai:', createError)
          } else {
            console.log('[create-developer] auth user developer re-créé:', newUser.user.id)
          }
        }
      } catch (e) {
        console.warn('[create-developer] Erreur vérification auth user developer:', e)
      }
    }

    // 1b) Si absent: vérifier dans auth.users ou créer auth.users + profile (idempotent)
    if (!developerId) {
      console.log('[create-developer] ⚠️ Aucun developer profile trouvé, vérification auth et création en cours...')

      let existingUserId: string | null = null
      try {
        const response = await (supabaseAdmin.auth.admin as any).getUserByEmail(devEmail)
        existingUserId = response?.data?.user?.id ?? null
      } catch (e) {
        console.warn('[create-developer] getUserByEmail failed, création user prévue:', e)
      }

      if (!existingUserId) {
        // On aligne sur le script SQL : UUID fixe pour que les politiques RLS reconnaissent le developer.
        const { data: newUser, error: createError } = await (supabaseAdmin.auth.admin as any).createUser({
          id: fixedDevUserId,
          email: devEmail,
          password: devPassword,
          email_confirm: true,
          user_metadata: {
            full_name: devFullName,
            username: devUsername,
            role: 'developer',
          },
        })

        if (createError) throw createError
        existingUserId = newUser.user.id
      }

      developerId = existingUserId
      developerEmail = devEmail
    }
      console.log('[create-developer] ⚠️ Aucun developer trouvé, création en cours...')

      let existingUserId: string | null = null
      try {
        const { data: existingUser } = await (supabaseAdmin.auth.admin as any).getUserByEmail(devEmail)
        existingUserId = existingUser?.user?.id ?? null
      } catch (e) {
        console.warn('[create-developer] getUserByEmail failed, fallback create:', e)
      }

      if (!existingUserId) {
        // On aligne sur le script SQL : UUID fixe pour que les politiques RLS reconnaissent le developer.
        const { data: newUser, error: createError } = await (supabaseAdmin.auth.admin as any).createUser({
          id: fixedDevUserId,
          email: devEmail,
          password: devPassword,
          email_confirm: true,
          user_metadata: {
            full_name: devFullName,
            username: devUsername,
            role: 'developer',
          },
        })

        if (createError) throw createError
        existingUserId = newUser.user.id
      }

      developerId = existingUserId
      developerEmail = devEmail

      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: existingUserId,
            username: devUsername,
            email: devEmail,
            full_name: devFullName,
            role: 'developer',
            paroisse_id: systemParishId,
            is_active: true,
          },
          { onConflict: 'id' },
        )

      if (upsertError) throw upsertError

      devProfileRole = 'developer'
      console.log('[create-developer] ✅ Developer créé/upsert:', developerId)
    }

    /* Profil parfois resté « membre » (trigger / conflit) alors que JWT porte role developer. */
    if (developerId) {
      const { error: fixProfileErr } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: developerId,
            email: (developerEmail ?? devEmail).trim(),
            username: devUsername,
            full_name: devFullName,
            role: 'developer',
            paroisse_id: systemParishId,
            is_active: true,
          },
          { onConflict: 'id' },
        )
      if (fixProfileErr) {
        console.warn('[create-developer] Upsert developer profiles:', fixProfileErr)
      }

      // Assurer que la paroisse SYSTEM existe et que le developer y est membre.
      try {
        const { data: existingMembership, error: membershipError } = await supabaseAdmin
          .from('parish_members')
          .select('parish_id')
          .eq('user_id', developerId)
          .eq('parish_id', systemParishId)
          .limit(1)
          .maybeSingle()

        if (membershipError) {
          console.warn('[create-developer] Parish membership check failed:', membershipError)
        } else if (!existingMembership) {
          const { error: insertMembershipErr } = await supabaseAdmin
            .from('parish_members')
            .insert({ parish_id: systemParishId, user_id: developerId, role: 'developer' })

          if (insertMembershipErr) {
            console.warn('[create-developer] Parish membership insert failed:', insertMembershipErr)
          } else {
            console.log('[create-developer] ✅ Developer ajouté à la paroisse SYSTEM')
          }
        }
      } catch (e) {
        console.warn('[create-developer] Impossible de vérifier/ajouter la membership SYSTEM:', e)
      }
    }

    // Aligner auth uniquement à la première installation : évite de réinitialiser le mot de passe
    // du developer à chaque visite d’un utilisateur connecté (create-developer est invoqué souvent).
    if (developerId && isFirstInstall) {
      const { error: authAlignErr } = await supabaseAdmin.auth.admin.updateUserById(developerId, {
        email: developerEmail ?? devEmail,
        password: devPassword,
        email_confirm: true,
        user_metadata: {
          full_name: devFullName,
          username: devUsername,
          role: 'developer',
        },
      })
      if (authAlignErr) {
        console.warn('[create-developer] Alignement auth (première installation) ignoré:', authAlignErr)
      }
    }

    // Best-effort: marquer le developer comme certifié si les colonnes existent.
    try {
      const { error: certErr } = await supabaseAdmin
        .from('profiles')
        .update({ is_certified: true, is_cerfied: true })
        .eq('id', developerId)
      if (certErr) {
        // Ignore si les colonnes n'existent pas (ou si les types diffèrent).
        console.warn('[create-developer] Certification field update not applied:', certErr)
      }
    } catch (e) {
      console.warn('[create-developer] Certification field update threw:', e)
    }

    // 2) Synchroniser ses accès aux paroisses (toutes: inclut SYSTEM même si is_active=false)
    console.log('[create-developer] 🔄 Synchronisation membership pour:', developerId)

    const { data: parishes, error: parishesError } = await supabaseAdmin
      .from('paroisses')
      .select('id')

    if (parishesError) {
      throw new Error(`Erreur lors de la récupération des paroisses: ${parishesError.message}`)
    }

    if (!parishes || parishes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No parishes to sync',
          developer_id: developerId,
          developer_email: developerEmail,
          total_parishes: 0,
          added_to: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les membreships existantes
    const { data: existingMemberships, error: membershipsError } = await supabaseAdmin
      .from('parish_members')
      .select('parish_id')
      .eq('user_id', developerId)

    if (membershipsError) {
      throw new Error(`Erreur lors de la récupération des memberships: ${membershipsError.message}`)
    }

    const existingIds = new Set((existingMemberships || []).map(m => m.parish_id))
    const missingParishes = parishes.filter(p => !existingIds.has(p.id))

    let insertedCount = 0

    if (missingParishes.length > 0) {
      const payload = missingParishes.map(p => ({
        parish_id: p.id,
        user_id: developerId,
        role: 'developer'
      }))

      const { error: insertError } = await supabaseAdmin
        .from('parish_members')
        .upsert(payload, { onConflict: 'parish_id,user_id' })

      if (insertError) {
        throw new Error(`Erreur lors de l'ajout du developer: ${insertError.message}`)
      }

      insertedCount = payload.length
      console.log(`[create-developer] ✅ Developer ajouté à ${insertedCount} nouvelles paroisses`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: insertedCount > 0 
          ? `Developer synchronized to ${insertedCount} new parishes` 
          : 'Developer already has access to all parishes',
        developer_id: developerId,
        developer_email: developerEmail,
        total_parishes: parishes.length,
        added_to: insertedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[create-developer] ❌ Erreur:', message)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error during developer synchronization',
        error: message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})