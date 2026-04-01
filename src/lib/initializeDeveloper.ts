import { supabase } from "@/integrations/supabase/client";
import type { DeveloperSyncResponse } from "@/types/developer";

const SYNC_STORAGE_KEY = "ff_developer_sync_session_v1";

interface DeveloperSyncCache {
  fingerprint: string;
  syncedAt: number;
}

const getSessionFingerprint = (userId: string, expiresAt?: number | null) =>
  `${userId}:${expiresAt ?? "no-exp"}`;

const readSyncCache = (): DeveloperSyncCache | null => {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeveloperSyncCache>;
    if (!parsed?.fingerprint || typeof parsed.syncedAt !== "number") return null;
    return { fingerprint: parsed.fingerprint, syncedAt: parsed.syncedAt };
  } catch (error) {
    console.warn("[DeveloperSync] Impossible de lire le cache localStorage:", error);
    return null;
  }
};

const writeSyncCache = (cache: DeveloperSyncCache) => {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("[DeveloperSync] Impossible d'écrire le cache localStorage:", error);
  }
};

export type SyncDeveloperAccessOptions = {
  /**
   * Si vrai (ex. première installation : aucune paroisse / aucun super_admin), appelle quand même
   * la RPC `ensure_developer_account()` (SECURITY DEFINER, grants anon) pour réaligner paroisse SYSTEM
   * et profil developer après migration — sans edge function.
   */
  allowWithoutSession?: boolean;
};

export const syncDeveloperAccess = async (
  options?: SyncDeveloperAccessOptions,
): Promise<DeveloperSyncResponse> => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[DeveloperSync] Erreur getSession:", sessionError);
      return {
        success: false,
        message: "Session introuvable pour synchroniser le developer",
        error: sessionError.message,
      };
    }

    const allowBootstrap = options?.allowWithoutSession === true;

    if (!session?.user) {
      if (!allowBootstrap) {
        console.info("[DeveloperSync] Aucun utilisateur connecté, sync ignorée.");
        return {
          success: false,
          message: "Utilisateur non authentifié",
        };
      }
      console.info(
        "[DeveloperSync] Bootstrap première installation (sans session) → ensure_developer_account…",
      );
    } else {
      const fingerprint = getSessionFingerprint(session.user.id, session.expires_at);
      const cache = readSyncCache();

      if (cache?.fingerprint === fingerprint) {
        console.debug("[DeveloperSync] Synchronisation déjà effectuée pour cette session.");
        return {
          success: true,
          message: "Synchronisation déjà effectuée pour cette session",
        };
      }
    }

    console.info("[DeveloperSync] Appel RPC ensure_developer_account…");
    const { error: rpcError } = await supabase.rpc("ensure_developer_account");

    if (rpcError) {
      console.error("[DeveloperSync] Erreur RPC ensure_developer_account:", rpcError);
      return {
        success: false,
        message: "Échec ensure_developer_account",
        error: rpcError.message,
      };
    }

    const result: DeveloperSyncResponse = {
      success: true,
      message: "ensure_developer_account OK",
    };

    if (session?.user) {
      const fingerprint = getSessionFingerprint(session.user.id, session.expires_at);
      writeSyncCache({ fingerprint, syncedAt: Date.now() });
    }
    console.info("[DeveloperSync] Synchronisation réussie:", result);
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[DeveloperSync] Exception inattendue:", error);
    return {
      success: false,
      message: "Exception durant la synchronisation du developer",
      error: message,
    };
  }
};
