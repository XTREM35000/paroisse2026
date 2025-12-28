/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    metadata?: Record<string, string>
  ) => Promise<unknown>;
  signInWithProvider: (provider: "google" | "github") => Promise<void>;
  signOut: () => Promise<void>;
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
      await supabase.auth.signInWithPassword({ email, password });
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
      const res = await supabase.auth.signUp({ email, password, options: { data: metadata } });
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextValue = { user, loading, login, register, signInWithProvider, signOut };

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
