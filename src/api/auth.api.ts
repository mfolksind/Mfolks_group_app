import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, setRefreshToken, clearAuthToken, clearRefreshToken } from './client';
import { User, LoginRequest, LoginResponse, RegisterRequest, ApiResponse } from '@/types/backend';



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

    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    }, { skipAuth: true });

    if (response.success && response.data) {
      const { tokens } = response.data;
      if (tokens) {
        await setAuthToken(tokens.accessToken);
        if (tokens.refreshToken) {
          await setRefreshToken(tokens.refreshToken);
        }
        await AsyncStorage.removeItem('demo_session');
      }
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
): Promise<ApiResponse<{ user: User; tokens?: { accessToken: string; refreshToken?: string } }>> => {
  try {
    const response = await api.post<any>('/auth/register', data, {
      skipAuth: true,
    });

    if (response.success && response.data) {
      const { tokens } = response.data;
      if (tokens) {
        await setAuthToken(tokens.accessToken);
        if (tokens.refreshToken) {
          await setRefreshToken(tokens.refreshToken);
        }
        await AsyncStorage.removeItem('demo_session');
      }
    }

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
    const response = await api.get<User>('/api/users/me');
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
export const refreshToken = async (): Promise<ApiResponse<{ accessToken: string; refreshToken?: string }>> => {
  try {
    const isDemoSession = await AsyncStorage.getItem('demo_session');
    if (isDemoSession === 'true') {
      return {
        success: true,
        data: {
          accessToken: 'demo-access-token',
          refreshToken: 'demo-refresh-token',
        },
      };
    }

    const response = await api.post<{ accessToken: string; refreshToken?: string }>(
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

/**
 * Request password reset OTP
 */
export const forgotPassword = async (
  email: string,
): Promise<ApiResponse<{ email: string }>> => {
  try {
    const response = await api.post<{ email: string }>(
      '/auth/forgot-password',
      { email: email.trim() },
      { skipAuth: true }
    );
    return response;
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      message: 'Failed to request password reset OTP',
    };
  }
};

/**
 * Verify password reset OTP
 */
export const verifyOtp = async (
  email: string,
  otp: string,
): Promise<ApiResponse<{ token: string; email: string }>> => {
  try {
    const response = await api.post<{ token: string; email: string }>(
      '/auth/verify-otp',
      { email: email.trim(), otp: otp.trim() },
      { skipAuth: true }
    );
    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      message: 'Failed to verify OTP code',
    };
  }
};

/**
 * Reset password with verified token or OTP
 */
export const resetPassword = async (payload: {
  token?: string;
  email?: string;
  otp?: string;
  password: string;
}): Promise<ApiResponse<Record<string, unknown>>> => {
  try {
    const response = await api.post<Record<string, unknown>>(
      '/auth/reset-password',
      payload,
      { skipAuth: true }
    );
    return response;
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      message: 'Failed to reset password',
    };
  }
};

