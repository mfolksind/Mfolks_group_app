import { api } from './client';
import { ApiResponse } from '@/types/backend';

export interface FamilyItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  requiresAdminApproval?: boolean;
  status?: string;
}

/**
 * Fetch all available families for industry type selection
 */
export const getFamilies = async (): Promise<ApiResponse<FamilyItem[]>> => {
  try {
    const response = await api.get<any>('/api/families');
    if (response.success && response.data) {
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];
      return {
        ...response,
        data: list.filter((f: FamilyItem) => f.status !== 'INACTIVE'),
      };
    }
    return response;
  } catch (error) {
    console.error('Get families error:', error);
    return {
      success: false,
      message: 'Failed to fetch industry families',
    };
  }
};

/**
 * Fetch single family details by ID
 */
export const getFamilyById = async (id: string): Promise<ApiResponse<FamilyItem>> => {
  try {
    const response = await api.get<FamilyItem>(`/api/families/${id}`);
    return response;
  } catch (error) {
    console.error('Get family by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch family details',
    };
  }
};

/**
 * Switch active family or request approval for a new family
 */
export const updateUserFamily = async (familyId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put<any>('/api/users/me', { family: familyId });
    return response;
  } catch (error) {
    console.error('Update user family error:', error);
    return {
      success: false,
      message: 'Failed to switch family',
    };
  }
};
