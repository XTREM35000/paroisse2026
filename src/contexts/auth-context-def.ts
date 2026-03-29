import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

/** Métadonnées utilisateur envoyées à Supabase lors du signUp (user_metadata) */
export interface AuthRegisterMetadata {
  full_name?: string;
  phone?: string;
  role?: string;
  /** Pseudo unique (minuscules), stocké en profiles.username via trigger */
  username?: string;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  register: (
    email: string,
    password: string,
    metadata?: AuthRegisterMetadata
  ) => Promise<{ data: { user: User | null; session: Session | null } }>;
  /** Inscription : l’email est envoyé tel quel à Supabase (aucun domaine forcé). */
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: AuthRegisterMetadata
  ) => Promise<{ data: { user: User | null; session: Session | null } }>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);
