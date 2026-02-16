/**
 * Hook pour gérer les certificats
 * Fetch, créer, mettre à jour, supprimer
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  countCertificates,
} from '../services/documentService';
import type {
  Certificate,
  CertificateFormData,
  CertificateFilter,
} from '../types/documents';

interface UseCertificatesState {
  data: Certificate[];
  loading: boolean;
  error: string | null;
  count: number;
  selectedCertificate: Certificate | null;
}

interface UseCertificatesActions {
  fetchCertificates: (filter?: CertificateFilter) => Promise<void>;
  createCert: (formData: CertificateFormData) => Promise<void>;
  updateCert: (id: string, formData: Partial<CertificateFormData>) => Promise<void>;
  deleteCert: (id: string) => Promise<void>;
  selectCertificate: (cert: Certificate | null) => void;
  resetError: () => void;
}

export function useCertificates(): UseCertificatesState & UseCertificatesActions {
  const [state, setState] = useState<UseCertificatesState>({
    data: [],
    loading: true,
    error: null,
    count: 0,
    selectedCertificate: null,
  });

  // Fetch initial
  useEffect(() => {
    fetchCertificates();
  }, []);

  // Fetch certificats
  const fetchCertificates = useCallback(async (filter?: CertificateFilter) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const [certs, count] = await Promise.all([
        getCertificates(filter),
        countCertificates(),
      ]);
      setState((prev) => ({
        ...prev,
        data: certs,
        count,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      console.error('[useCertificates] fetchCertificates error:', err);
    }
  }, []);

  // Créer un certificat
  const createCert = useCallback(async (formData: CertificateFormData) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const newCert = await createCertificate(formData);
      setState((prev) => ({
        ...prev,
        data: [newCert, ...prev.data],
        count: prev.count + 1,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      console.error('[useCertificates] createCert error:', err);
      throw err;
    }
  }, []);

  // Mettre à jour un certificat
  const updateCert = useCallback(async (id: string, formData: Partial<CertificateFormData>) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const updatedCert = await updateCertificate(id, formData);
      setState((prev) => ({
        ...prev,
        data: prev.data.map((cert) => (cert.id === id ? updatedCert : cert)),
        selectedCertificate:
          prev.selectedCertificate?.id === id ? updatedCert : prev.selectedCertificate,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      console.error('[useCertificates] updateCert error:', err);
      throw err;
    }
  }, []);

  // Supprimer un certificat
  const deleteCert = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await deleteCertificate(id);
      setState((prev) => ({
        ...prev,
        data: prev.data.filter((cert) => cert.id !== id),
        count: prev.count - 1,
        selectedCertificate:
          prev.selectedCertificate?.id === id ? null : prev.selectedCertificate,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      console.error('[useCertificates] deleteCert error:', err);
      throw err;
    }
  }, []);

  // Sélectionner un certificat
  const selectCertificate = useCallback((cert: Certificate | null) => {
    setState((prev) => ({ ...prev, selectedCertificate: cert }));
  }, []);

  // Réinitialiser l'erreur
  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchCertificates,
    createCert,
    updateCert,
    deleteCert,
    selectCertificate,
    resetError,
  };
}

export default useCertificates;
