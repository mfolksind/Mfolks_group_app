import { api } from './client';
import { Variant, Product, ApiResponse, PaginatedResponse } from '@/types/backend';

/**
 * Products & Variants API Service
 * 
 * Note: The backend treats Variant as the main product entity shown to users.
 * Each Variant is associated with a Product and Category.
 */

// ============================================================================
// Variant Endpoints (Primary - what users see)
// ============================================================================

/**
 * Get variants/products by category.
 * Real backend contract: GET https://api.mfolks.com/api/products?category=... 
 */
export const getVariantsByCategory = async (
  categoryId: string,
  options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
): Promise<ApiResponse<Variant[] | PaginatedResponse<Variant>>> => {
  try {
    const params = new URLSearchParams();
    if (categoryId) params.append('category', categoryId);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.search) params.append('search', options.search);

    const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<any>(url);

    if (response.success && response.data) {
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      return {
        ...response,
        data: list,
      };
    }

    return response;
  } catch (error) {
    console.error('Get variants by category error:', error);
    return {
      success: false,
      message: 'Failed to fetch products',
    };
  }
};

/**
 * Get single product/variant by ID.
 * Real backend contract returns a variant object from GET /api/products/:id.
 */
export const getVariantById = async (
  variantId: string,
): Promise<ApiResponse<Variant>> => {
  try {
    const response = await api.get<any>(`/api/products/${variantId}`);
    return response;
  } catch (error) {
    console.error('Get variant by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch product details',
    };
  }
};

/**
 * Get variants by product
 * Useful if you want all variants of a single product
 */
export const getVariantsByProduct = async (
  productId: string,
): Promise<ApiResponse<Variant[]>> => {
  try {
    const response = await api.get<Variant[]>(
      `/api/products/${productId}/variants`,
    );
    return response;
  } catch (error) {
    console.error('Get variants by product error:', error);
    return {
      success: false,
      message: 'Failed to fetch product variants',
    };
  }
};

/**
 * Search variants across categories.
 * Backend search is implemented via the main products route.
 */
export const searchVariants = async (
  query: string,
  options?: {
    categoryId?: string;
    status?: string;
    limit?: number;
  },
): Promise<ApiResponse<Variant[]>> => {
  try {
    const params = new URLSearchParams();
    params.append('search', query);
    if (options?.categoryId) params.append('category', options.categoryId);
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());

    const url = `/api/products?${params.toString()}`;
    const response = await api.get<any>(url);

    if (response.success && response.data) {
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      return {
        ...response,
        data: list,
      };
    }

    return response;
  } catch (error) {
    console.error('Search variants error:', error);
    return {
      success: false,
      message: 'Search failed',
    };
  }
};

// ============================================================================
// Product Endpoints (Backend reference)
// ============================================================================

/**
 * Get all products (backend reference)
 * Real contract: GET https://api.mfolks.com/api/products
 */
export const getProducts = async (): Promise<
  ApiResponse<Product[]>
> => {
  try {
    const response = await api.get<any>('/api/products');

    if (response.success && response.data) {
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      return {
        ...response,
        data: list,
      };
    }

    return response;
  } catch (error) {
    console.error('Get products error:', error);
    return {
      success: false,
      message: 'Failed to fetch products',
    };
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (
  productId: string,
): Promise<ApiResponse<Product>> => {
  try {
    const response = await api.get<any>(`/api/products/${productId}`);
    return response;
  } catch (error) {
    console.error('Get product by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch product',
    };
  }
};

// ============================================================================
// Recommendation Endpoints
// ============================================================================

/**
 * Get related/recommended variants for a variant
 */
export const getRelatedVariants = async (
  variantId: string,
  type: 'related' | 'compatible' | 'recommended' = 'recommended',
): Promise<ApiResponse<Variant[]>> => {
  try {
    const response = await api.get<Variant[]>(
      `/api/variants/${variantId}/${type}`,
    );
    return response;
  } catch (error) {
    console.error(`Get ${type} variants error:`, error);
    return {
      success: false,
      message: `Failed to fetch ${type} products`,
    };
  }
};

/**
 * Get featured/popular variants.
 * Real backend contract: use the main /api/products endpoint with a limit.
 */
export const getFeaturedVariants = async (
  limit: number = 10,
): Promise<ApiResponse<Variant[]>> => {
  try {
    const response = await api.get<any>(`/api/products?limit=${limit}`);

    if (response.success && response.data) {
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      return {
        ...response,
        data: list.slice(0, limit),
      };
    }

    return response;
  } catch (error) {
    console.error('Get featured variants error:', error);
    return {
      success: false,
      message: 'Failed to fetch featured products',
    };
  }
};
