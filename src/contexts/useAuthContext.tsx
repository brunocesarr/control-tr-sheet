'use client';

import type { Models } from 'appwrite';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ID, account } from '@/configs/appwrite';
import { rethrowTranslated } from '@/helpers/appwrite-errors';

/**
 * Auth is a two-step handshake:
 *   1. Appwrite authenticates the credentials (browser SDK).
 *   2. We mint an httpOnly session cookie server-side via
 *      POST /api/v1/auth/session, which re-validates with Appwrite.
 *
 * Every method translates Appwrite errors before re-throwing, so consumers can
 * render `error.message` directly.
 */

const SESSION_ENDPOINT = '/api/v1/auth/session';
/** Our cookie lives 1h; refresh comfortably before that. */
const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export interface AuthContextValue {
  isLoading: boolean;
  loggedInUser: Models.User<Models.Preferences> | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (newPassword: string, oldPassword: string) => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<void>;
  confirmPasswordRecovery: (userId: string, secret: string, password: string) => Promise<void>;
  deactivateAccount: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin = useMemo(() => loggedInUser?.labels?.includes('admin') ?? false, [loggedInUser]);

  /** Exchange a fresh Appwrite JWT for our httpOnly session cookie. */
  const syncServerSession = useCallback(async () => {
    const { jwt } = await account.createJWT();
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt }),
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? 'Não foi possível iniciar a sessão.');
    }
  }, []);

  const clearServerSession = useCallback(async () => {
    await fetch(SESSION_ENDPOINT, { method: 'DELETE', credentials: 'same-origin' }).catch(() => {});
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const user = await account.get();
      await syncServerSession();
      setLoggedInUser(user);
    } catch {
      setLoggedInUser(null);
      await clearServerSession();
    }
  }, [syncServerSession, clearServerSession]);

  /** Bootstrap on mount. */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await account.get();
        await syncServerSession();
        if (!cancelled) setLoggedInUser(user);
      } catch {
        if (!cancelled) setLoggedInUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [syncServerSession]);

  /** Keep the cookie alive while the tab is open. */
  useEffect(() => {
    if (!loggedInUser) {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      refreshTimer.current = null;
      return;
    }

    refreshTimer.current = setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [loggedInUser, refreshSession]);

  /** Only same-origin absolute paths are honoured — blocks open redirects. */
  const resolveRedirect = useCallback(
    (user: Models.User<Models.Preferences>) => {
      const requested = searchParams.get('redirectTo');
      const isSafe = requested?.startsWith('/') && !requested.startsWith('//');
      if (isSafe) return requested;
      return user.labels?.includes('admin') ? '/home' : '/profile';
    },
    [searchParams]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        // A stale session would make createEmailPasswordSession throw 409.
        await account.deleteSession('current').catch(() => {});
        await account.createEmailPasswordSession(email, password);
        await syncServerSession();

        const user = await account.get();
        setLoggedInUser(user);
        const redirectTo = resolveRedirect(user);
        if (redirectTo) {
          router.replace(redirectTo);
        }
      } catch (error) {
        rethrowTranslated(error, 'Não foi possível entrar. Tente novamente.');
      }
    },
    [router, resolveRedirect, syncServerSession]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        await account.create(ID.unique(), email, password, name);
      } catch (error) {
        rethrowTranslated(error, 'Não foi possível criar a conta.');
      }
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await account.deleteSessions().catch(() => {});
      await clearServerSession();
      setLoggedInUser(null);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, clearServerSession]);

  const updateName = useCallback(
    async (name: string) => {
      try {
        const user = await account.updateName(name);
        setLoggedInUser(user);
        await syncServerSession(); // name is embedded in the token
      } catch (error) {
        rethrowTranslated(error, 'Não foi possível alterar o nome.');
      }
    },
    [syncServerSession]
  );

  const updateEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const user = await account.updateEmail(email, password);
        setLoggedInUser(user);
        await syncServerSession();
      } catch (error) {
        rethrowTranslated(error, 'Não foi possível alterar o e-mail.');
      }
    },
    [syncServerSession]
  );

  const updatePassword = useCallback(
    async (newPassword: string, oldPassword: string) => {
      try {
        await account.updatePassword(newPassword, oldPassword);
        await syncServerSession();
      } catch (error) {
        rethrowTranslated(error, 'Não foi possível alterar a senha.');
      }
    },
    [syncServerSession]
  );

  /** Sends the reset link. Appwrite appends ?userId=…&secret=… to the URL. */
  const requestPasswordRecovery = useCallback(async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/recover/confirm`;
      await account.createRecovery(email, redirectUrl);
    } catch (error) {
      rethrowTranslated(error, 'Não foi possível enviar o e-mail de recuperação.');
    }
  }, []);

  const confirmPasswordRecovery = useCallback(
    async (userId: string, secret: string, password: string) => {
      try {
        await account.updateRecovery(userId, secret, password);
      } catch (error) {
        rethrowTranslated(error, 'Não foi possível redefinir a senha.');
      }
    },
    []
  );

  /**
   * Self-service deactivation. The client SDK cannot hard-delete an account
   * (that needs a server API key), but updateStatus() blocks it, which revokes
   * access immediately and is reversible by an admin.
   */
  const deactivateAccount = useCallback(async () => {
    try {
      await account.updateStatus();
      await clearServerSession();
      setLoggedInUser(null);
      router.replace('/login');
    } catch (error) {
      rethrowTranslated(error, 'Não foi possível desativar a conta.');
    }
  }, [router, clearServerSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      loggedInUser,
      isAdmin,
      login,
      register,
      logout,
      updateName,
      updateEmail,
      updatePassword,
      requestPasswordRecovery,
      confirmPasswordRecovery,
      deactivateAccount,
      refreshSession,
    }),
    [
      isLoading,
      loggedInUser,
      isAdmin,
      login,
      register,
      logout,
      updateName,
      updateEmail,
      updatePassword,
      requestPasswordRecovery,
      confirmPasswordRecovery,
      deactivateAccount,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
