import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:6001';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10);

// Token management
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const clearAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('refreshToken');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('refreshToken', token);
  } catch (error) {
    console.error('Error setting refresh token:', error);
  }
};

export const clearRefreshToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('Error clearing refresh token:', error);
  }
};

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Create abort controller with timeout
 */
const createAbortController = (timeout: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
};

/**
 * Main API fetch function
 */
export const apiClient = async <T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> => {
  const { skipAuth = false, headers = {}, ...fetchOptions } = options;

  const { controller, timeoutId } = createAbortController(API_TIMEOUT);

  try {
    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authorization header if token exists
    if (!skipAuth) {
      const token = await getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Make the request
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    let responseData: any;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = { success: response.ok, data: await response.text() };
    }

    // Handle successful response
    if (response.ok) {
      return responseData;
    }

    // Handle 401 - Token might be expired
    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Try to refresh the token
          const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include cookies if server uses them
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.data?.accessToken) {
              await setAuthToken(refreshData.data.accessToken);
              if (refreshData.data.refreshToken) {
                await setRefreshToken(refreshData.data.refreshToken);
              }

              isRefreshing = false;
              onRefreshed(refreshData.data.accessToken);

              // Retry the original request with the new token
              return apiClient<T>(endpoint, options);
            } else {
              // Refresh failed
              isRefreshing = false;
              refreshSubscribers = [];
              await clearAuthToken();
              await clearRefreshToken();
              return {
                success: false,
                message: 'Session expired. Please login again.',
              };
            }
          } else {
            // Refresh endpoint failed
            isRefreshing = false;
            refreshSubscribers = [];
            await clearAuthToken();
            await clearRefreshToken();
            return {
              success: false,
              message: 'Session expired. Please login again.',
            };
          }
        } catch (error) {
          isRefreshing = false;
          refreshSubscribers = [];
          await clearAuthToken();
          await clearRefreshToken();
          return {
            success: false,
            message: 'Failed to refresh session. Please login again.',
          };
        }
      } else {
        // Wait for token refresh
        return new Promise((resolve) => {
          subscribeTokenRefresh(async (token) => {
            try {
              const retryResponse = await apiClient<T>(endpoint, options);
              resolve(retryResponse);
            } catch (error) {
              resolve({
                success: false,
                message: 'Request failed after token refresh.',
              });
            }
          });
        });
      }
    }

    // Handle other error responses
    return {
      success: false,
      message:
        responseData.message ||
        `API Error: ${response.status} ${response.statusText}`,
      data: responseData.data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: `Request timeout after ${API_TIMEOUT}ms`,
        };
      }

      return {
        success: false,
        message: `Network error: ${error.message}`,
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred',
    };
  }
};

/**
 * Shorthand methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(
    endpoint: string,
    data?: any,
    options?: FetchOptions,
  ) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(
    endpoint: string,
    data?: any,
    options?: FetchOptions,
  ) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(
    endpoint: string,
    data?: any,
    options?: FetchOptions,
  ) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { API_URL };
