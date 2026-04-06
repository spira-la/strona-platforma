import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

/**
 * Extended user type combining the Supabase auth user with optional
 * profile data stored in the database.
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'user' | 'coach' | 'admin';
  createdAt: string;
}

export type User = SupabaseUser;

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
