// Auth context — wraps Better Auth session into a React context
// Provides session state, sign-in helpers, and sign-out to all children

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient, type AuthUser } from '../lib/auth-client';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const navigate = useNavigate();

  const signInWithGoogle = useCallback(async () => {
    setIsSocialLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin + '/hub',
      });
    } finally {
      setIsSocialLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isLoading: isPending || isSocialLoading,
        isAuthenticated: !!session?.user,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
