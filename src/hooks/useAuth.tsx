/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";import { ensureProfileExists } from '@/utils/ensureProfileExists';import type { User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  userRole: string | null; // Nouveau : exposer le rôle directement
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
  const [userRole, setUserRole] = useState<string | null>(null); // Nouveau : stocker le rôle
  const [loading, setLoading] = useState<boolean>(true);
  
  // Ref pour tracker si on a déjà fait la redirection/setup au login
  const hasPerformedInitialRedirectRef = React.useRef(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(res.data?.user ?? null);
        
        // Si user existe, charger son rôle
        if (res.data?.user?.id) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', res.data.user.id)
              .maybeSingle();
            
            const role = profileData?.role || null;
            setUserRole(role);
          } catch (err) {
            console.error('Error fetching user role:', err);
          }
        }
      } catch (e) {
        console.error("getUser error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);

      // Invalider le cache du profil
      try {
        localStorage.removeItem('ff_profile_cache');
      } catch (e) {
        console.error('Failed to invalidate profile cache:', e);
      }

      // Setup rôles et redirection SEULEMENT au SIGNED_IN (login)
      if (session?.user && _event === 'SIGNED_IN') {
        (async () => {
          try {
            // Vérifier que le premier utilisateur est admin
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

            // Créer le profil s'il n'existe pas
            await ensureProfileExists(session.user.id);

            // Récupérer et stocker le rôle
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();

            const role = profileData?.role || null;
            setUserRole(role);

            // Fermer modal auth si besoin
            try {
              if (typeof window !== 'undefined' && window.location.hash.includes('#auth')) {
                window.location.hash = '';
              }
            } catch (e) { /* ignore */ }

            // REDIRECTION SEULEMENT AU LOGIN INITIAL (pas au retour d'onglet)
            if (!hasPerformedInitialRedirectRef.current) {
              hasPerformedInitialRedirectRef.current = true;

              const desiredPath = role?.toLowerCase().includes('admin') ? '/admin' : '/dashboard';
              const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
              
              // Pages publiques/auth - ne pas rediriger
              const publicAuthPages = [
                '/reset-password',
                '/email-confirmed',
                '/auth',
                '/forgot-password',
              ];
              
              const isOnPublicAuthPage = publicAuthPages.some(page => currentPath === page || currentPath.startsWith(page));

              if (!isOnPublicAuthPage && (currentPath === '/' || !currentPath.startsWith(desiredPath))) {
                console.debug('[AuthProvider] Performing initial redirect to', desiredPath);
                try {
                  window.dispatchEvent(new CustomEvent('ff:auth-redirect', { detail: { path: desiredPath } }));
                } catch (e) {
                  window.location.replace(desiredPath);
                }
              }
            }
          } catch (err) {
            console.error('[AuthProvider] SIGNED_IN handler error:', err);
          }
        })();
      } 
      // Au SIGNED_OUT : réinitialiser
      else if (_event === 'SIGNED_OUT') {
        setUserRole(null);
        hasPerformedInitialRedirectRef.current = false;
        console.debug('[AuthProvider] User signed out');
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
      try {
        console.log('[useAuth.login] signInWithPassword called with email:', email, 'origin:', typeof window !== 'undefined' ? window.location.origin : 'no-window');
      } catch (e) { /* ignore logging errors */ }
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) {
        console.log('[useAuth.login] signInWithPassword response error:', res.error);
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
    // FIX: Nettoyage forcé de la session avant OAuth pour éviter les jetons corrompus
    console.log(`[${provider} OAuth] Nettoyage de session en cours...`);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn(`[${provider} OAuth] Avertissement lors du signOut:`, e);
      // On continue même si le signOut échoue
    }
    
    // CORRECTION: Construire le redirectTo avec la vraie URL dynamiquement
    // En cas de doute, utiliser une URL absolue plutôt que relative
    let redirectTo = '';
    
    if (typeof window !== 'undefined') {
      // Construire l'URL du callback
      redirectTo = new URL('/auth/callback', window.location.origin).toString();
      console.log(`[OAuth] Redirection configurée pour ${provider}:`, redirectTo);
    } else {
      // Fallback en SSR
      redirectTo = 'https://nd-compassion.ci/auth/callback';
    }
    
    // For Facebook, explicitly request the email and public_profile scopes so Supabase receives the user's email
    if (provider === 'facebook') {
      console.log('[Facebook OAuth] Appel signInWithOAuth avec redirectTo:', redirectTo);
      return await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: 'email,public_profile',
        },
      });
    }

    // Default behavior for other providers (Google, GitHub, etc.)
    console.log(`[${provider} OAuth] Appel signInWithOAuth avec redirectTo:`, redirectTo);
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });
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

  const value: AuthContextValue = { user, userRole, loading, login, register, signInWithProvider, signOut, resetPassword };

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
