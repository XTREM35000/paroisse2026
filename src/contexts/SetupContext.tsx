import React, { createContext, useContext, useEffect, useState } from 'react';

type SetupContextValue = {
  setupCompleted: boolean;
  markCompleted: () => void;
};

const SetupContext = createContext<SetupContextValue | undefined>(undefined);

export const SetupProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [setupCompleted, setSetupCompleted] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('setupCompleted');
      return v === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('setupCompleted', setupCompleted ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [setupCompleted]);

  const markCompleted = () => setSetupCompleted(true);

  return (
    <SetupContext.Provider value={{ setupCompleted, markCompleted }}>
      {children}
    </SetupContext.Provider>
  );
};

export function useSetup() {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error('useSetup must be used within SetupProvider');
  return ctx;
}

export default useSetup;
