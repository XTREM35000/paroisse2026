import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_SELECTED_PAROISSE } from '@/lib/paroisseStorage';

export interface Paroisse {
  id: string;
  nom: string;
  slug: string;
  logo_url?: string;
  couleur_principale?: string;
}

interface ParoisseContextType {
  paroisse: Paroisse | null;
  setParoisse: (paroisse: Paroisse) => void;
  isLoading: boolean;
  paroissesList: Paroisse[];
  isSelectorOpen: boolean;
  setSelectorOpen: (open: boolean) => void;
}

const ParoisseContext = createContext<ParoisseContextType | undefined>(undefined);

export const ParoisseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paroisse, setParoisseState] = useState<Paroisse | null>(null);
  const [paroissesList, setParoissesList] = useState<Paroisse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const loadParoisses = async () => {
    try {
      const { data, error } = await supabase
        .from('paroisses')
        .select('*')
        .eq('is_active', true)
        .order('nom');

      if (error) throw error;
      setParoissesList((data || []) as Paroisse[]);

      // Restore user's last selection (if any)
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SELECTED_PAROISSE) : null;
      if (saved && data) {
        const found = (data as Paroisse[]).find((p) => p.id === saved);
        if (found) {
          setParoisseState(found);
        } else {
          // ID plus dans la liste (paroisse désactivée / supprimée) → éviter un état « connecté sans paroisse » silencieux
          try {
            localStorage.removeItem(STORAGE_SELECTED_PAROISSE);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement paroisses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetParoisse = (p: Paroisse) => {
    setParoisseState(p);
    try {
      localStorage.setItem(STORAGE_SELECTED_PAROISSE, p.id);
    } catch {
      // ignore storage errors (privacy mode, etc.)
    }
  };

  useEffect(() => {
    void loadParoisses();
  }, []);

  return (
    <ParoisseContext.Provider
      value={{
        paroisse,
        setParoisse: handleSetParoisse,
        isLoading,
        paroissesList,
        isSelectorOpen,
        setSelectorOpen: setIsSelectorOpen,
      }}
    >
      {children}
    </ParoisseContext.Provider>
  );
};

export const useParoisse = () => {
  const context = useContext(ParoisseContext);
  if (context === undefined) throw new Error('useParoisse must be used within ParoisseProvider');
  return context;
};

