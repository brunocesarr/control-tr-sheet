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
  updateName: (newName: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
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

  const updateEmail = async (newEmail: string) => {
    try {
      setIsLoading(true);
      await account.updateEmail(newEmail, '123456789');
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
  }

  const providerValue = {
    loggedInUser,
    login,
    register,
    logout,
    updateName,
    updateEmail,
    updatePassword,
    isLoading: isLoading,
  };

  if (isLoading) return <Loader />;

  return <AuthContext.Provider value={providerValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
