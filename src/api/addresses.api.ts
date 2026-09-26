import { api } from './client';
import { Address, ApiResponse } from '@/types/backend';

/**
 * Address API Service
 * Connects directly to the live backend API endpoints
 */

/**
 * Get all addresses of current user
 */
export const getAddresses = async (): Promise<ApiResponse<Address[]>> => {
  try {
    const response = await api.get<any>('/api/addresses');
    if (response.success) {
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      return {
        ...response,
        data: list,
      };
    }
    return response;
  } catch (error) {
    console.error('Get addresses API error:', error);
    return {
      success: false,
      message: 'Failed to fetch addresses',
    };
  }
};

/**
 * Create new address
 */
export const createAddress = async (data: Omit<Address, '_id' | 'id'>): Promise<ApiResponse<Address>> => {
  try {
    const response = await api.post<Address>('/api/addresses', data);
    return response;
  } catch (error) {
    console.error('Create address API error:', error);
    return {
      success: false,
      message: 'Failed to save address',
    };
  }
};

/**
 * Update existing address
 */
export const updateAddress = async (id: string, data: Partial<Address>): Promise<ApiResponse<Address>> => {
  try {
    const response = await api.patch<Address>(`/api/addresses/${id}`, data);
    return response;
  } catch (error) {
    console.error('Update address API error:', error);
    return {
      success: false,
      message: 'Failed to update address',
    };
  }
};

/**
 * Set address as default
 */
export const setDefaultAddress = async (id: string): Promise<ApiResponse<Address>> => {
  try {
    const response = await api.patch<Address>(`/api/addresses/${id}/default`);
    return response;
  } catch (error) {
    console.error('Set default address API error:', error);
    return {
      success: false,
      message: 'Failed to set default address',
    };
  }
};

/**
 * Delete address
 */
export const deleteAddress = async (id: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.delete<any>(`/api/addresses/${id}`);
    return response;
  } catch (error) {
    console.error('Delete address API error:', error);
    return {
      success: false,
      message: 'Failed to delete address',
    };
  }
};
