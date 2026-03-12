import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthState } from '@/contexts/AuthContext';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charge la session et l'utilisateur au montage
  useEffect(() => {
    const currentSession = supabase.auth.getSession();
    currentSession.then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    // Écoute les changements de session
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Charge le profil utilisateur depuis la table 'profiles' si connecté
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        setProfile(data ?? null);
        setRole(data?.role ?? null);
        setLoading(false);
      });
  }, [user]);

  const value: AuthState = {
    session,
    user,
    profile,
    role,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
