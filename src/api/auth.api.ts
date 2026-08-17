import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, setRefreshToken, clearAuthToken, clearRefreshToken } from './client';
import { User, LoginRequest, LoginResponse, RegisterRequest, ApiResponse } from '@/types/backend';

const DEMO_EMAIL = 'demo@mforks.com';
const DEMO_PASSWORD = 'Demo@123';

const demoUser: User = {
  _id: 'demo-user-1',
  companyName: 'MFolks Demo',
  firstName: 'Demo',
  lastName: 'User',
  mobile: '9999999999',
  email: DEMO_EMAIL,
  userType: 'buyer',
  status: 'approved',
  addresses: [
    {
      _id: 'demo-address-1',
      label: 'Home',
      line1: '12 Demo Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India',
      isDefault: true,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const isDemoLogin = (email: string, password: string) => {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
};

/**
 * Authentication API Service
 */

/**
 * User login
 */
export const loginUser = async (
  email: string,
  password: string,
): Promise<ApiResponse<LoginResponse>> => {
  try {
    if (isDemoLogin(email, password)) {
      await setAuthToken('demo-access-token');
      await setRefreshToken('demo-refresh-token');
      await AsyncStorage.setItem('demo_session', 'true');

      return {
        success: true,
        data: {
          user: demoUser,
          accessToken: 'demo-access-token',
          refreshToken: 'demo-refresh-token',
        },
      };
    }

    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    }, { skipAuth: true });

    if (response.success && response.data) {
      // Store tokens
      await setAuthToken(response.data.accessToken);
      if (response.data.refreshToken) {
        await setRefreshToken(response.data.refreshToken);
      }
      await AsyncStorage.removeItem('demo_session');
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed',
    };
  }
};

/**
 * User registration
 */
export const registerUser = async (
  data: RegisterRequest,
): Promise<ApiResponse<{ user: User }>> => {
  try {
    const response = await api.post<{ user: User }>('/auth/register', data, {
      skipAuth: true,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed',
    };
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  try {
    const isDemoSession = await AsyncStorage.getItem('demo_session');
    if (isDemoSession === 'true') {
      return {
        success: true,
        data: demoUser,
      };
    }

    const response = await api.get<User>('/auth/me');
    return response;
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      message: 'Failed to fetch user profile',
    };
  }
};

/**
 * Logout user
 */
export const logoutUser = async (): Promise<ApiResponse<void>> => {
  try {
    // Clear tokens locally
    await clearAuthToken();
    await clearRefreshToken();
    await AsyncStorage.removeItem('demo_session');

    // Notify backend (optional, server may not require this)
    try {
      await api.post('/auth/logout', {});
    } catch (_error) {
      // ignore backend logout failure during demo session
    }

    return {
      success: true,
      message: 'Logout successful',
    };
  } catch (error) {
    // Even if backend call fails, clear tokens locally
    await clearAuthToken();
    await clearRefreshToken();
    await AsyncStorage.removeItem('demo_session');

    console.error('Logout error:', error);
    return {
      success: true,
      message: 'Logged out locally',
    };
  }
};

/**
 * Refresh access token
 * (Called automatically by the API client when token expires)
 */
export const refreshToken = async (): Promise<ApiResponse<LoginResponse>> => {
  try {
    const isDemoSession = await AsyncStorage.getItem('demo_session');
    if (isDemoSession === 'true') {
      return {
        success: true,
        data: {
          user: demoUser,
          accessToken: 'demo-access-token',
          refreshToken: 'demo-refresh-token',
        },
      };
    }

    const response = await api.post<LoginResponse>(
      '/auth/refresh',
      {},
      { skipAuth: true },
    );

    if (response.success && response.data) {
      await setAuthToken(response.data.accessToken);
      if (response.data.refreshToken) {
        await setRefreshToken(response.data.refreshToken);
      }
    }

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear tokens on refresh failure
    await clearAuthToken();
    await clearRefreshToken();

    return {
      success: false,
      message: 'Failed to refresh token',
    };
  }
};
