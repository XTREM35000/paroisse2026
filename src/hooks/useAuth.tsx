/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  register: (
    email: string,
    password: string,
    metadata?: Record<string, string>
  ) => Promise<unknown>;
  signInWithProvider: (provider: "google" | "github" | "facebook") => Promise<unknown>;
  signOut: () => Promise<unknown>;
  resetPassword: (email: string) => Promise<unknown>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(res.data?.user ?? null);
      } catch (e) {
        console.error("getUser error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      
      // Invalider le cache du profil quand l'authentification change
      try {
        localStorage.removeItem('ff_profile_cache');
      } catch (e) {
        console.error('Failed to invalidate profile cache:', e);
      }
      
      // After auth state changes, ensure roles consistency (first user = admin)
      if (session?.user) {
        (async () => {
          try {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, role')
              .order('created_at', { ascending: true });

            if (profiles && profiles.length > 0) {
              const first = profiles[0];
              if (first.role !== 'admin') {
                await supabase
                  .from('profiles')
                  .update({ role: 'admin' })
                  .eq('id', first.id);
              }
            }
          } catch (err) {
            console.error('Erreur lors de la vérification des rôles:', err);
          }
        })();
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) {
        throw res.error;
      }
      setUser(res.data?.user ?? null);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    metadata?: Record<string, string>
  ) => {
    setLoading(true);
    try {
      const res = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          data: metadata,
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
        } 
      });
      if (res.error) throw res.error;
      setUser(res.data?.user ?? null);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "github" | "facebook") => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  const resetPassword = async (email: string) => {
    const res = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (res.error) throw res.error;
    return res;
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const res = await supabase.auth.signOut();
      if (res.error) {
        console.error('Sign out error', res.error);
      }
      setUser(null);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextValue = { user, loading, login, register, signInWithProvider, signOut, resetPassword };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
