/**
 * Hook pour gérer les paramètres globaux des documents
 * Logo, signature autorité, nom paroisse, etc.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getDocumentSettings,
  upsertDocumentSettings,
} from '../services/documentService';
import type { DocumentSettings, DocumentSettingsFormData } from '../types/documents';

interface UseDocumentSettingsState {
  settings: DocumentSettings | null;
  loading: boolean;
  error: string | null;
}

interface UseDocumentSettingsActions {
  fetch: () => Promise<void>;
  save: (formData: DocumentSettingsFormData) => Promise<void>;
  resetError: () => void;
}

export function useDocumentSettings(): UseDocumentSettingsState & UseDocumentSettingsActions {
  const [state, setState] = useState<UseDocumentSettingsState>({
    settings: null,
    loading: true,
    error: null,
  });

  // Fetch initial
  useEffect(() => {
    fetch();
  }, []);

  // Fetch paramètres
  const fetch = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const settings = await getDocumentSettings();
      setState((prev) => ({
        ...prev,
        settings,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      console.error('[useDocumentSettings] fetch error:', err);
    }
  }, []);

  // Sauvegarder les paramètres
  const save = useCallback(async (formData: DocumentSettingsFormData) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const updated = await upsertDocumentSettings(formData);
      setState((prev) => ({
        ...prev,
        settings: updated,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      console.error('[useDocumentSettings] save error:', err);
      throw err;
    }
  }, []);

  // Réinitialiser l'erreur
  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetch,
    save,
    resetError,
  };
}

export default useDocumentSettings;
