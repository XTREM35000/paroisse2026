import React, { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getAuthCallbackUrl, supabase } from '@/integrations/supabase/client';

import type { Profile } from '@/types/database';
import { mergeEffectiveRole } from '@/utils/rolePermissions';
import { syncDeveloperAccess } from '@/lib/initializeDeveloper';
import { AuthContext } from './auth-context-def';

/** Raw profile row from DB (select *), may include role and nullable fields */
interface RawProfileRow {
  username?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  date_of_birth?: string | null;
  is_active?: boolean;
  notification_preferences?: Profile['notification_preferences'];
  role?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user || null);
    if (session?.user) {
      // Toujours récupérer le profil le plus à jour depuis Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('AuthContext: error fetching profile', error);
      }

      const row = data as RawProfileRow | null;
      const effectiveRole = mergeEffectiveRole(row?.role ?? null, session.user);

      const mergedProfile: Profile | null = row
        ? {
            id: session.user.id,
            email: session.user.email ?? null,
            username: row.username ?? null,
            full_name: row.full_name ?? null,
            display_name: row.display_name ?? row.full_name ?? '',
            avatar_url: row.avatar_url ?? null,
            bio: row.bio ?? null,
            phone: row.phone ?? null,
            location: row.location ?? '',
            date_of_birth: row.date_of_birth ?? '',
            is_active: typeof row.is_active === 'boolean' ? row.is_active : true,
            notification_preferences: row.notification_preferences ?? { email: true, push: false, sms: false },
            created_at: row.created_at ?? new Date().toISOString(),
            updated_at: row.updated_at ?? new Date().toISOString(),
            role: effectiveRole,
          }
        : null;

      setProfile(mergedProfile);
      setRole(effectiveRole);

      try {
        localStorage.setItem('ff_profile_cache', JSON.stringify({ data, cachedAt: Date.now() }));
      } catch {
        // ignore cache errors
      }
      if (!silent) setLoading(false);
    } else {
      setProfile(null);
      setRole(null);
      try { localStorage.removeItem('ff_profile_cache'); } catch { /* ignore */ }
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((event) => {
      const silent = event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED';
      void loadSession({ silent });
    });
    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    await loadSession({ silent: true });
  };

  // Fonction signOut à exposer dans le contexte
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole(null);
      try { localStorage.removeItem('ff_profile_cache'); } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  // Fonction login à exposer dans le contexte
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      setSession(res.data.session ?? null);
      setUser(res.data.user ?? null);
      await syncDeveloperAccess();
      await loadSession({ silent: true });
    } finally {
      setLoading(false);
    }
  };

  /** Inscription : email brut transmis à Supabase (pas de suffixe / domaine imposé côté client). */
  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; phone?: string; role?: string }
  ) => {
    setLoading(true);
    try {
      const redirect = getAuthCallbackUrl();
      const emailRedirectTo = redirect && /^https?:\/\//i.test(redirect) ? redirect : undefined;

      const userMeta: Record<string, string> = {};
      if (metadata?.full_name?.trim()) userMeta.full_name = metadata.full_name.trim();
      if (metadata?.phone?.trim()) userMeta.phone = metadata.phone.trim();
      if (metadata?.role?.trim()) userMeta.role = metadata.role.trim();
      if (metadata?.username?.trim()) userMeta.username = metadata.username.trim().toLowerCase();

      if (import.meta.env.DEV) {
        console.debug('[AuthContext] signUp request', {
          email: email.trim(),
          emailRedirectTo,
          userMetaKeys: Object.keys(userMeta),
        });
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
          ...(Object.keys(userMeta).length > 0 ? { data: userMeta } : {}),
        },
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[AuthContext] signUp error', {
            message: error.message,
            name: error.name,
            status: (error as { status?: number }).status,
            code: (error as { code?: string }).code,
          });
        }
        throw error;
      }
      // Session présente seulement si la confirmation email est désactivée côté projet
      if (data.session) {
        setSession(data.session);
        setUser(data.user ?? null);
      }
      return { data };
    } finally {
      setLoading(false);
    }
  };

  const register = signUpWithEmail;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        loading,
        signOut,
        login,
        refreshProfile,
        register,
        signUpWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// AuthContext and AuthState are exported from ./auth-context-def for react-refresh
