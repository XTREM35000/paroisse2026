/**
 * Hook pour gérer les cartes de membres
 * Fetch, créer, mettre à jour, supprimer
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getMemberCards,
  createMemberCard,
  updateMemberCard,
  deleteMemberCard,
  countMemberCards,
} from '../services/documentService';
import type {
  MemberCard,
  MemberCardFormData,
  MemberCardFilter,
} from '../types/documents';

interface UseMemberCardsState {
  data: MemberCard[];
  loading: boolean;
  error: string | null;
  count: number;
  selectedCard: MemberCard | null;
}

interface UseMemberCardsActions {
  fetchCards: (filter?: MemberCardFilter) => Promise<void>;
  createCard: (formData: MemberCardFormData) => Promise<void>;
  updateCard: (id: string, formData: Partial<MemberCardFormData>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  selectCard: (card: MemberCard | null) => void;
  resetError: () => void;
}

export function useMemberCards(): UseMemberCardsState & UseMemberCardsActions {
  const [state, setState] = useState<UseMemberCardsState>({
    data: [],
    loading: true,
    error: null,
    count: 0,
    selectedCard: null,
  });

  // Fetch initial
  useEffect(() => {
    fetchCards();
  }, []);

  // Fetch cartes de membres
  const fetchCards = useCallback(async (filter?: MemberCardFilter) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const [cards, count] = await Promise.all([
        getMemberCards(filter),
        countMemberCards(),
      ]);
      setState((prev) => ({
        ...prev,
        data: cards,
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
      console.error('[useMemberCards] fetchCards error:', err);
    }
  }, []);

  // Créer une carte
  const createCard = useCallback(async (formData: MemberCardFormData) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const newCard = await createMemberCard(formData);
      setState((prev) => ({
        ...prev,
        data: [newCard, ...prev.data],
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
      console.error('[useMemberCards] createCard error:', err);
      throw err;
    }
  }, []);

  // Mettre à jour une carte
  const updateCard = useCallback(
    async (id: string, formData: Partial<MemberCardFormData>) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const updatedCard = await updateMemberCard(id, formData);
        setState((prev) => ({
          ...prev,
          data: prev.data.map((card) => (card.id === id ? updatedCard : card)),
          selectedCard: prev.selectedCard?.id === id ? updatedCard : prev.selectedCard,
          loading: false,
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        console.error('[useMemberCards] updateCard error:', err);
        throw err;
      }
    },
    []
  );

  // Supprimer une carte
  const deleteCard = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await deleteMemberCard(id);
      setState((prev) => ({
        ...prev,
        data: prev.data.filter((card) => card.id !== id),
        count: prev.count - 1,
        selectedCard: prev.selectedCard?.id === id ? null : prev.selectedCard,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      console.error('[useMemberCards] deleteCard error:', err);
      throw err;
    }
  }, []);

  // Sélectionner une carte
  const selectCard = useCallback((card: MemberCard | null) => {
    setState((prev) => ({ ...prev, selectedCard: card }));
  }, []);

  // Réinitialiser l'erreur
  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchCards,
    createCard,
    updateCard,
    deleteCard,
    selectCard,
    resetError,
  };
}

export default useMemberCards;
