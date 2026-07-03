import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';
import type { AuthContextValue } from '@/types/auth.types';

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // All setState calls inside this effect are updating React state in response
  // to Supabase auth events (an external system) — this is the intended pattern.

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw new Error(error.message);
  }

  async function signOut(): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async function signInWithGoogle(): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
  }

  async function resetPassword(email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${globalThis.location.origin}/auth/callback`,
    });
    if (error) throw new Error(error.message);
  }

  async function updatePassword(newPassword: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  function clearRecoveryMode() {
    setIsRecoveryMode(false);
  }

  const value: AuthContextValue = {
    user,
    session,
    isAuthenticated: user !== null,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    isRecoveryMode,
    clearRecoveryMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
