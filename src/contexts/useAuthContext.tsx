'use client';

import type { Models } from 'appwrite';
import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useEffect, useState } from 'react';

import { ID, account } from '@/configs/appwrite';
import { LocalStorageKeysCache } from '@/configs/local-storage-keys';
import { isTokenExpired } from '@/helpers/validators';

interface IAuthContext {
  loggedInUser: Models.User<Models.Preferences> | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (newName: string) => Promise<void>;
  updateEmail: (newEmail: string, password: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext({} as IAuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        setIsLoading(true);
        const userInfo = await account.get();
        const { jwt } = await account.createJWT();
        setLoggedInUser(userInfo);
        Cookies.set(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET, jwt);
      } catch {
        setLoggedInUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedInUser();
  }, []);

  useEffect(() => {
    const updateToken = async () => {
      if (loggedInUser) {
        const token = Cookies.get(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET);
        if (token) {
          if (isTokenExpired(token)) {
            const { jwt } = await account.createJWT();
            Cookies.set(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET, jwt);
          }
        } else {
          const { jwt } = await account.createJWT();
          Cookies.set(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET, jwt);
        }
      } else {
        Cookies.remove(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET);
      }
    };

    updateToken();
  }, [pathname, loggedInUser, router]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      if (!email || !password) {
        throw new Error('Invalid parameters');
      }

      await account.createEmailPasswordSession(email, password);
      const userInfo = await account.get();
      const { jwt } = await account.createJWT();
      setLoggedInUser(userInfo);

      Cookies.set(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET, jwt);
      router.push('/home');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      await account.create(ID.unique(), email, password, name);
      await login(email, password);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await account.deleteSessions();
      setLoggedInUser(null);
      Cookies.remove(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET);
      router.push('/login');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateName = async (newName: string) => {
    try {
      setIsLoading(true);
      await account.updateName(newName);
      const userInfo = await account.get();
      setLoggedInUser(userInfo);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = async (newEmail: string, password: string) => {
    try {
      setIsLoading(true);
      await account.updateEmail(newEmail, password);
      const userInfo = await account.get();
      setLoggedInUser(userInfo);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await account.updatePassword(newPassword, oldPassword);
      const userInfo = await account.get();
      setLoggedInUser(userInfo);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const providerValue = {
    loggedInUser,
    login,
    register,
    logout,
    updateName,
    updateEmail,
    updatePassword,
    isLoading,
  };

  return <AuthContext.Provider value={providerValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
