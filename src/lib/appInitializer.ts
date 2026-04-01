import { supabase } from '@/integrations/supabase/client';
import { syncDeveloperAccess } from '@/lib/initializeDeveloper';

const APP_INITIALIZED_KEY = 'ff_app_initialized_v1';

export interface AppInitializationStatus {
  checked: boolean;
  shouldForceSetupWizard: boolean;
  hasParishes: boolean;
  hasSuperAdmins: boolean;
  developerSyncAttempted: boolean;
  developerSyncSucceeded: boolean;
  error?: string;
}

export const markAppInitialized = () => {
  try {
    localStorage.setItem(APP_INITIALIZED_KEY, 'true');
  } catch {
    // ignore storage failures
  }
};

export const isAppInitializedLocally = () => {
  try {
    return localStorage.getItem(APP_INITIALIZED_KEY) === 'true';
  } catch {
    return false;
  }
};

const isMissingRelationError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const maybeError = error as { code?: string; message?: string };
  const code = String(maybeError.code ?? '').toLowerCase();
  const message = String(maybeError.message ?? '').toLowerCase();
  return code.includes('pgrst') || message.includes('relation') || message.includes('does not exist');
};

const countRowsFromFirstExistingTable = async (tableNames: string[]): Promise<number> => {
  let lastError: unknown = null;

  for (const tableName of tableNames) {
    const query = supabase.from(tableName).select('id', { count: 'exact', head: true });
    const res =
      tableName === 'paroisses'
        ? await query.neq('slug', 'system')
        : await query;
    if (!res.error) {
      return res.count ?? 0;
    }

    lastError = res.error;
    if (!isMissingRelationError(res.error)) {
      throw res.error;
    }
  }

  if (lastError) throw lastError;
  return 0;
};

export const runAppInitialization = async (): Promise<AppInitializationStatus> => {
  let developerSyncAttempted = false;
  let developerSyncSucceeded = false;

  try {
    // Step 1: first-launch detection based on parishes + super_admin presence.
    // Supports both schema variants: `parishes` and legacy `paroisses`.
    const [parishCount, superAdminsRes] = await Promise.all([
      countRowsFromFirstExistingTable(['paroisses', 'parishes']),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'super_admin'),
    ]);

    if (superAdminsRes.error) throw superAdminsRes.error;

    const superAdminCount = superAdminsRes.count ?? 0;
    const hasParishes = parishCount > 0;
    const hasSuperAdmins = superAdminCount > 0;
    const shouldForceSetupWizard = !hasParishes && !hasSuperAdmins;

    // Step 2: developer sync should be attempted but must not block the UI.
    developerSyncAttempted = true;
    try {
      // Première installation (Setup Wizard) : pas encore d’utilisateur connecté ; la RPC
      // ensure_developer_account() réaligne developer + SYSTEM (grants anon).
      const syncResult = await syncDeveloperAccess({
        allowWithoutSession: shouldForceSetupWizard,
      });
      developerSyncSucceeded = !!syncResult.success;
      if (!syncResult.success) {
        console.warn('[AppInitializer] ensure_developer_account sync not successful:', syncResult);
      }
    } catch (syncError) {
      console.warn('[AppInitializer] ensure_developer_account sync failed:', syncError);
    }

    if (!shouldForceSetupWizard) {
      markAppInitialized();
    }

    return {
      checked: true,
      shouldForceSetupWizard,
      hasParishes,
      hasSuperAdmins,
      developerSyncAttempted,
      developerSyncSucceeded,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown initialization error';
    console.error('[AppInitializer] Initialization error:', error);
    // Safe fallback: if detection fails, keep setup reachable.
    return {
      checked: true,
      shouldForceSetupWizard: true,
      hasParishes: false,
      hasSuperAdmins: false,
      developerSyncAttempted,
      developerSyncSucceeded,
      error: message,
    };
  }
};
