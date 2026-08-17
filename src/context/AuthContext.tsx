import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { User } from '@/types/backend';
import { loginUser, registerUser, getCurrentUser, logoutUser } from '@/api/auth.api';
import { RegisterRequest } from '@/types/backend';

export type UserStatus = 'pending' | 'approved' | 'rejected';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  registrationStatus: UserStatus | null;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: Partial<RegisterRequest>) => Promise<boolean>;
  logout: () => Promise<void>;
  setRegistrationPending: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<UserStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Try to restore session on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);
        const response = await getCurrentUser();
        
        if (response.success && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
          setRegistrationStatus(response.data.status as UserStatus);
        } else {
          // No valid session
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
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await loginUser(email, password);

      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        setRegistrationStatus(response.data.user.status as UserStatus);
        return true;
      } else {
        const errorMsg = response.message || 'Login failed';
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    data: Partial<RegisterRequest>,
  ): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await registerUser(data as RegisterRequest);

      if (response.success && response.data) {
        setUser(response.data.user);
        setRegistrationStatus('pending');
        setIsAuthenticated(false); // User needs approval before login
        return true;
      } else {
        const errorMsg = response.message || 'Registration failed';
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
      console.error('Registration error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Notify backend
      await logoutUser();

      // Clear local state
      setIsAuthenticated(false);
      setUser(null);
      setRegistrationStatus(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local state even if backend fails
      setIsAuthenticated(false);
      setUser(null);
      setRegistrationStatus(null);
    } finally {
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
      setRegistrationPending: () => setRegistrationStatus('pending'),
      clearError,
    }),
    [isAuthenticated, isLoading, user, registrationStatus, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
