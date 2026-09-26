import { api } from './client';
import { Category, ApiResponse } from '@/types/backend';

/**
 * Categories API Service
 * Uses familySlug query parameter to let the live backend filter categories by family.
 * See FAMILY_API_DOCS.md: GET /api/categories?familySlug=geotrix
 */

/**
 * Get all categories (optionally filtered by familySlug)
 */
export const getCategories = async (options?: { familyId?: string; familySlug?: string }): Promise<
  ApiResponse<Category[]>
> => {
  try {
    const params = new URLSearchParams();
    if (options?.familySlug) params.append('familySlug', options.familySlug);
    else if (options?.familyId) params.append('family', options.familyId);

    const url = `/api/categories${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<any>(url);

    if (response.success && response.data) {
      const categories = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      let filtered = categories;
      if (options?.familyId) {
        filtered = filtered.filter((item: any) => {
          if (!item.family) return false;
          const catFamId = typeof item.family === 'object' ? item.family._id || item.family.id : item.family;
          return String(catFamId) === String(options.familyId);
        });
      }

      return {
        ...response,
        data: filtered,
      };
    }

    return response;
  } catch (error) {
    console.error('Get categories error:', error);
    return {
      success: false,
      message: 'Failed to fetch categories',
    };
  }
};

/**
 * Get active categories (optionally filtered by familySlug)
 * Backend handles family filtering via ?familySlug=geotrix
 */
export const getActiveCategories = async (options?: { familyId?: string; familySlug?: string }): Promise<
  ApiResponse<Category[]>
> => {
  try {
    const params = new URLSearchParams();
    if (options?.familySlug) params.append('familySlug', options.familySlug);
    else if (options?.familyId) params.append('family', options.familyId);

    const url = `/api/categories${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<any>(url);

    if (response.success && response.data) {
      const categories = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      let filtered = categories.filter((item: Category) => item.status === 'ACTIVE');
      if (options?.familyId) {
        filtered = filtered.filter((item: any) => {
          if (!item.family) return false;
          const catFamId = typeof item.family === 'object' ? item.family._id || item.family.id : item.family;
          return String(catFamId) === String(options.familyId);
        });
      }

      return {
        ...response,
        data: filtered,
      };
    }

    return response;
  } catch (error) {
    console.error('Get active categories error:', error);
    return {
      success: false,
      message: 'Failed to fetch active categories',
    };
  }
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (
  categoryId: string,
): Promise<ApiResponse<Category>> => {
  try {
    const response = await api.get<Category>(`/api/categories/${categoryId}`);
    return response;
  } catch (error) {
    console.error('Get category by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch category',
    };
  }
};

/**
 * Get categories by parent category
 */
export const getCategoriesByParent = async (
  parentId: string,
): Promise<ApiResponse<Category[]>> => {
  try {
    const response = await api.get<Category[]>(
      `/api/categories?parentCategory=${parentId}`,
    );
    return response;
  } catch (error) {
    console.error('Get categories by parent error:', error);
    return {
      success: false,
      message: 'Failed to fetch subcategories',
    };
  }
};
