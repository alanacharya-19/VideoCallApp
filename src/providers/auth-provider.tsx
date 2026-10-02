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

type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'photoUrl'>>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

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
    setStatus('signed-in');
  }, []);

  const signOut = useCallback(async () => {
    await backend.signOut();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Pick<User, 'name'>>) => {
    setUser(await backend.updateProfile(patch));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signUp, signOut, updateProfile }),
    [status, user, signIn, signUp, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value == null) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
