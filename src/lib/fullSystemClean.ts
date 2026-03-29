import type { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_SELECTED_PAROISSE } from '@/lib/paroisseStorage';
import { SETUP_WIZARD_FINALIZED_SESSION_KEY } from '@/lib/setupSessionFlags';

const LOCAL_KEYS_TO_RESET = [
  STORAGE_SELECTED_PAROISSE,
  'setupCompleted',
  'ff_app_initialized_v1',
  'ff_profile_cache',
  'ff_paroisse_welcome_seen',
  'ff_pending_hero_banners',
  /** Wizard SetupWizardModal.tsx */
  'pending_hero_banners',
  'otpValidated',
] as const;

/**
 * Nettoyage serveur via RPC puis reset du stockage local lié au tenant / setup.
 * Essaie `clean_all_data` (souvent un alias sécurisé), puis `reset_all_data` si la fonction n’existe pas.
 */
export async function runFullSystemClean(
  client: SupabaseClient,
): Promise<{ ok: true; usedRpc: string } | { ok: false; message: string }> {
  const { error: e1 } = await client.rpc('clean_all_data');
  if (!e1) {
    clearLocalAfterClean();
    return { ok: true, usedRpc: 'clean_all_data' };
  }

  const msg = String(e1.message ?? '');
  const notFound =
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    (e1 as { code?: string }).code === '42883';

  if (notFound) {
    const { error: e2 } = await client.rpc('reset_all_data');
    if (!e2) {
      clearLocalAfterClean();
      return { ok: true, usedRpc: 'reset_all_data' };
    }
    return { ok: false, message: e2.message ?? String(e2) };
  }

  return { ok: false, message: msg };
}

export function clearLocalAfterClean() {
  for (const k of LOCAL_KEYS_TO_RESET) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
  try {
    sessionStorage.removeItem(SETUP_WIZARD_FINALIZED_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
