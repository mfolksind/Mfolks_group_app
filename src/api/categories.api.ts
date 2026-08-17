import { api } from './client';
import { Category, ApiResponse, PaginatedResponse } from '@/types/backend';

/**
 * Categories API Service
 */

/**
 * Get all categories
 * Backend endpoint: GET https://api.mfolks.com/api/categories
 */
export const getCategories = async (): Promise<
  ApiResponse<Category[]>
> => {
  try {
    const response = await api.get<any>('/api/categories');

    if (response.success && response.data) {
      const categories = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      return {
        ...response,
        data: categories,
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
 * Get active categories only
 */
export const getActiveCategories = async (): Promise<
  ApiResponse<Category[]>
> => {
  try {
    const response = await api.get<any>('/api/categories');

    if (response.success && response.data) {
      const categories = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      return {
        ...response,
        data: categories.filter((item: Category) => item.status === 'ACTIVE'),
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
 * Get categories by parent category (if backend supports hierarchies)
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
