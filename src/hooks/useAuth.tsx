

// This file intentionally re-exports the context-based `useAuth` hook
// so that imports from '@/hooks/useAuth' resolve to the AuthContext hook
// used across the app (login, signOut, etc.).

export { useAuth } from './useAuthHook';

