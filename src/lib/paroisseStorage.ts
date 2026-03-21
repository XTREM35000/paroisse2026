/**
 * Stockage navigateur pour la sélection de paroisse (équivalent « cookie » côté app).
 * - selectedParoisse : id persisté après choix
 * - ff_paroisse_welcome_seen : une fois à 1, on ne rouvre plus le modal automatiquement au chargement
 */

export const STORAGE_SELECTED_PAROISSE = 'selectedParoisse';
export const STORAGE_PAROISSE_PROMPT_DONE = 'ff_paroisse_welcome_seen';

export function getStoredParoisseId(): string | null {
  try {
    return localStorage.getItem(STORAGE_SELECTED_PAROISSE);
  } catch {
    return null;
  }
}

export function isParoisseAutoPromptDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_PAROISSE_PROMPT_DONE) === '1';
  } catch {
    // Stockage bloqué (mode privé, etc.) : ne pas empêcher l'affichage du modal
    return false;
  }
}

export function markParoisseAutoPromptDone(): void {
  try {
    localStorage.setItem(STORAGE_PAROISSE_PROMPT_DONE, '1');
  } catch {
    /* ignore */
  }
}
