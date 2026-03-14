import React, { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

import type { Profile } from '@/types/database';
import { AuthContext } from './auth-context-def';

/** Raw profile row from DB (select *), may include role and nullable fields */
interface RawProfileRow {
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

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
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
        const mergedProfile: Profile | null = row
          ? {
              id: session.user.id,
              email: session.user.email ?? null,
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
            }
          : null;

        setProfile(mergedProfile);
        setRole(row?.role ?? session.user.user_metadata?.role ?? null);

        try {
          localStorage.setItem('ff_profile_cache', JSON.stringify({ data, cachedAt: Date.now() }));
        } catch {
          // ignore cache errors
        }
        setLoading(false);
      } else {
        setProfile(null);
        setRole(null);
        try { localStorage.removeItem('ff_profile_cache'); } catch { /* ignore */ }
        setLoading(false);
      }
    };
    loadSession();
    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, signOut, login }}>
      {children}
    </AuthContext.Provider>
  );
};

// AuthContext and AuthState are exported from ./auth-context-def for react-refresh
