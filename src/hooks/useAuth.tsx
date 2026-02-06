/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";import { ensureProfileExists } from '@/utils/ensureProfileExists';import type { User } from "@supabase/supabase-js";

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

        // Close auth modal if it was opened via the '#auth' fragment
        try {
          if (typeof window !== 'undefined' && window.location.hash.includes('#auth')) {
            // Setting hash to empty triggers hashchange events which Header listens to
            window.location.hash = '';
          }
        } catch (e) { /* ignore */ }

        // Ensure profile exists before deciding redirect to avoid race conditions
        (async () => {
          try {
            // Create profile if missing so role lookup is reliable
            await ensureProfileExists(session.user.id);

            const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
            const role = (profileData as any)?.role as string | null ?? null;
            console.debug('[AuthProvider] redirect decision', { userId: session.user.id, role });

            const desiredPath = role?.toLowerCase().includes('admin') ? '/admin' : '/dashboard';
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            const lastRedirect = typeof window !== 'undefined' ? Number(sessionStorage.getItem('ff_last_redirect') || '0') : 0;
            const now = Date.now();

            // Avoid redirect if we're already on the correct page
            if (currentPath === desiredPath || currentPath.startsWith(desiredPath)) {
              console.debug('[AuthProvider] already on desired path, skipping redirect', { currentPath, desiredPath });
              return;
            }

            // Prevent redirect storms by ensuring we don't redirect more often than every 5s
            if (now - lastRedirect < 5000) {
              console.debug('[AuthProvider] recent redirect detected, skipping to avoid loop', { lastRedirect, now });
              return;
            }

            console.debug('[AuthProvider] redirecting to', desiredPath, 'for user', session.user.id);
            try { sessionStorage.setItem('ff_last_redirect', String(now)); } catch (e) { /* ignore */ }

            // Use SPA-safe redirect: store pending path and dispatch an event for a Router-aware handler to pick up
            try {
              try { sessionStorage.setItem('ff_pending_redirect', desiredPath); } catch (e) { /* ignore */ }
              try {
                window.dispatchEvent(new CustomEvent('ff:auth-redirect', { detail: { path: desiredPath } }));
                console.debug('[AuthProvider] dispatched ff:auth-redirect event', desiredPath);
              } catch (evtErr) {
                console.warn('[AuthProvider] event dispatch failed, falling back to window.location.replace', evtErr);
                try { window.location.replace(desiredPath); } catch (e) { try { window.location.href = desiredPath; } catch { /* ignore */ } }
              }
            } catch (err) {
              // Final fallback
              try { window.location.replace(desiredPath); } catch (e) { try { window.location.href = desiredPath; } catch { /* ignore */ } }
            }
          } catch (err) {
            // If profile creation or role lookup fails, fallback to main dashboard
            console.error('[AuthProvider] redirect failed, falling back to /dashboard', err);
            try { window.location.replace('/dashboard'); } catch { try { window.location.href = '/dashboard'; } catch { /* ignore */ } }
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
