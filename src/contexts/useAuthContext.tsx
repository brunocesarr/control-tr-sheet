'use client';

import { createContext, useEffect, useState } from 'react';
import { account, ID } from '@/configs/appwrite';
import { Models } from 'appwrite';
import Loader from '@/components/Loader';
import { LocalStorageKeysCache } from '@/configs/local-storage-keys';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface IAuthContext {
  loggedInUser: Models.User<Models.Preferences>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext({} as IAuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        setIsLoading(true);
        const userInfo = await account.get();
        setLoggedInUser(userInfo);
      } catch (error) {
        setLoggedInUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedInUser();
  }, []);

  useEffect(() => {
    const listenerLoggedUser = async () => {
      if (loggedInUser) {
        // save token
      } else {
        // delete token
      }
    };

    listenerLoggedUser();
  }, [loggedInUser]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      if (!email || !password) {
        throw new Error('Invalid parameters');
      }

      const session = await account.createEmailPasswordSession(email, password);
      const userInfo = await account.get();
      setLoggedInUser(userInfo);

      Cookies.set(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET, session.$id, {
        expires: 1,
      });
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
      await account.deleteSession('current');
      setLoggedInUser(null);
      Cookies.remove(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET);
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
    isLoading: isLoading,
  };

  if (isLoading) return <Loader />;

  return <AuthContext.Provider value={providerValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
