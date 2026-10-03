import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { backend } from '@/services';
import type { Credentials, SignUpInput, User } from '@/services/types';

type AuthStatus = 'loading' | 'signed-in' | 'signed-out' | 'needs-verification';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'photoUrl'>>) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  pendingEmail: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Restore the persisted session before the first render of the app, so the
  // route guard never flashes the wrong screen.
  useEffect(() => {
    let active = true;

    backend
      .restoreSession()
      .then((session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setStatus(session == null ? 'signed-out' : 'signed-in');
      })
      .catch(() => {
        if (!active) return;
        setStatus('signed-out');
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (credentials: Credentials) => {
    const session = await backend.signIn(credentials);
    setUser(session.user);
    setStatus('signed-in');
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const session = await backend.signUp(input);
    setUser(session.user);
    setPendingEmail(input.email);
    setStatus('needs-verification');
  }, []);

  const signOut = useCallback(async () => {
    await backend.signOut();
    setUser(null);
    setPendingEmail(null);
    setStatus('signed-out');
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Pick<User, 'name' | 'photoUrl'>>) => {
    setUser(await backend.updateProfile(patch));
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    const client = (backend as any).getClient?.();
    if (!client || !pendingEmail) throw new Error('No pending verification');

    const { error } = await client.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: 'signup',
    });

    if (error) throw new Error(error.message);
    setPendingEmail(null);
    setStatus('signed-in');
  }, [pendingEmail]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signUp, signOut, updateProfile, verifyEmail, pendingEmail }),
    [status, user, signIn, signUp, signOut, updateProfile, verifyEmail, pendingEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value == null) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
