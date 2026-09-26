import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect, useCallback } from 'react';
import { User } from '@/types/backend';
import { loginUser, registerUser, getCurrentUser, logoutUser } from '@/api/auth.api';
import { RegisterRequest } from '@/types/backend';
import { updateUserFamily } from '@/api/families.api';

import { initSocket, disconnectSocket } from '@/services/socket';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { getAuthToken } from '@/api/client';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  registrationStatus: UserStatus | null;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; isPending?: boolean; message?: string }>;
  register: (data: Partial<RegisterRequest>) => Promise<{ success: boolean; isPending?: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkApprovalStatus: () => Promise<User | null>;
  switchActiveFamily: (familyId: string) => Promise<{ success: boolean; isPending?: boolean; message?: string }>;
  setRegistrationPending: () => void;
  clearError: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<UserStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        const uData = response.data;
        setUser(uData);

        const isApproved = uData.status === 'active' || uData.familyApprovalStatus === 'approved';
        if (isApproved) {
          setIsAuthenticated(true);
          setRegistrationStatus('approved');
        } else {
          setIsAuthenticated(false);
          setRegistrationStatus('pending');
        }
        return uData;
      }
      return null;
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      return null;
    }
  }, []);

  // Subscribe to auth failure events (e.g. token refresh fails)
  useEffect(() => {
    const { subscribeAuthFailure } = require('@/api/client');
    subscribeAuthFailure(() => {
      setIsAuthenticated(false);
      setUser(null);
      setRegistrationStatus(null);
    });
  }, []);

  // Restore session on startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);
        const u = await refreshUser();
        if (u) {
          const token = await getAuthToken();
          if (token) {
            initSocket(token);
            registerForPushNotificationsAsync('https://api.mfolks.com', token);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; isPending?: boolean; message?: string }> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await loginUser(email, password);

      if (response.success && response.data) {
        const u = response.data.user;
        setUser(u);

        const isPending = u.status === 'inactive' || u.familyApprovalStatus === 'pending';

        if (isPending) {
          setIsAuthenticated(false);
          setRegistrationStatus('pending');
          return { success: false, isPending: true, message: 'Account is pending admin approval' };
        } else {
          setIsAuthenticated(true);
          setRegistrationStatus('approved');
          const token = await getAuthToken();
          if (token) {
            initSocket(token);
            registerForPushNotificationsAsync('https://api.mfolks.com', token);
          }
          return { success: true };
        }
      } else {
        const errorMsg = response.message || 'Login failed';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      console.error('Login error:', err);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    data: Partial<RegisterRequest>,
  ): Promise<{ success: boolean; isPending?: boolean; message?: string }> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await registerUser(data as RegisterRequest);

      if (response.success && response.data) {
        const u = response.data.user;
        setUser(u);

        const isPending = u.status === 'inactive' || u.familyApprovalStatus === 'pending';

        if (isPending) {
          setIsAuthenticated(false);
          setRegistrationStatus('pending');
          return { success: true, isPending: true };
        } else {
          setIsAuthenticated(true);
          setRegistrationStatus('approved');
          return { success: true, isPending: false };
        }
      } else {
        const errorMsg = response.message || 'Registration failed';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
      console.error('Registration error:', err);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const checkApprovalStatus = async (): Promise<User | null> => {
    return refreshUser();
  };

  const switchActiveFamily = async (familyId: string): Promise<{ success: boolean; isPending?: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const res = await updateUserFamily(familyId);
      if (res.success) {
        const u = await refreshUser();
        const isPending = u?.status === 'inactive' || u?.familyApprovalStatus === 'pending';
        return { success: true, isPending };
      } else {
        return { success: false, message: res.message || 'Failed to switch family' };
      }
    } catch (err) {
      console.error('Switch active family error:', err);
      return { success: false, message: 'Failed to switch family' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      disconnectSocket();
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setRegistrationStatus(null);
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      registrationStatus,
      error,
      login,
      register,
      logout,
      checkApprovalStatus,
      switchActiveFamily,
      setRegistrationPending: () => setRegistrationStatus('pending'),
      clearError,
      refreshUser,
    }),
    [isAuthenticated, isLoading, user, registrationStatus, error, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
