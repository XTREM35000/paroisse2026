/**
 * Stockage navigateur pour la sélection de paroisse.
 * - `selectedParoisse` : id UUID de la paroisse choisie (restaurée au chargement).
 *
 * Les helpers `ff_paroisse_welcome_seen` / `isParoisseAutoPromptDone` / `markParoisseAutoPromptDone`
 * ne sont plus utilisés pour l’ouverture du modal (évite de bloquer le sélecteur au rechargement).
 * Ils restent exportés pour compatibilité ou nettoyage manuel du localStorage si besoin.
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

/** Supprime l’ancien flag « prompt vu » (utile si le modal ne s’ouvrait plus à cause d’une vieille valeur). */
export function clearParoisseAutoPromptDone(): void {
  try {
    localStorage.removeItem(STORAGE_PAROISSE_PROMPT_DONE);
  } catch {
    /* ignore */
  }
}
