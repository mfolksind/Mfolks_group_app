import { api } from './client';
import { Variant, Product, ApiResponse, PaginatedResponse } from '@/types/backend';
import { getMemoryCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/utils/cache';

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
  categoryId?: string,
  options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
): Promise<ApiResponse<Variant[] | PaginatedResponse<Variant>>> => {
  try {
    const params = new URLSearchParams();
    if (categoryId && categoryId !== 'all') params.append('category', categoryId);
    if (options?.page) params.append('page', options.page.toString());
    params.append('limit', (options?.limit || 50).toString());
    if (options?.status) params.append('status', options.status);
    if (options?.search) params.append('search', options.search);

    const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<any>(url);

    if (response.success && response.data) {
      const allVariants: Variant[] = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      let list = allVariants;
      if (categoryId && categoryId !== 'all') {
        const filtered = allVariants.filter((variant: any) => {
          const vCat = typeof variant.category === 'object' ? variant.category?._id : variant.category;
          const pCat = typeof variant.product?.category === 'object' ? variant.product?.category?._id : variant.product?.category;
          return vCat === categoryId || pCat === categoryId;
        });

        if (filtered.length > 0) {
          list = filtered;
        }
      }

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
 * Get all variants in catalog (with in-memory & storage caching)
 */
export const getAllVariants = async (force: boolean = false): Promise<ApiResponse<Variant[]>> => {
  try {
    const cacheKey = CACHE_KEYS.ALL_PRODUCTS || '@mfolks_cache_all_products';
    if (!force) {
      const cached = getMemoryCache<Variant[]>(cacheKey, CACHE_TTL.PRODUCTS);
      if (cached && cached.data && cached.data.length > 0) {
        return { success: true, data: cached.data };
      }
    }

    const response = await api.get<any>('/api/products?limit=200');
    if (response.success && response.data) {
      const list: Variant[] = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];
      if (list.length > 0) {
        setCache(cacheKey, list);
      }
      return {
        ...response,
        data: list,
      };
    }
    return response;
  } catch (error) {
    console.error('Get all variants error:', error);
    return {
      success: false,
      message: 'Failed to fetch catalog',
    };
  }
};

/**
 * Search variants across categories.
 * Searches across variant name, product name, sku, category, description, and specifications.
 */
export const searchVariants = async (
  query: string,
  options?: {
    categoryId?: string;
    status?: string;
    limit?: number;
    familyId?: string;
  },
): Promise<ApiResponse<Variant[]>> => {
  try {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { success: true, data: [] };
    }

    const res = await getAllVariants();
    const allVariants = res.data || [];

    const terms = trimmed.split(/\s+/).filter(Boolean);

    let filtered = allVariants.filter((item: any) => {
      const vName = (item.variantName || '').toLowerCase();
      const pName = (item.product?.name || item.name || '').toLowerCase();
      const sku = (item.sku || '').toLowerCase();
      const desc = (item.description || item.shortDescription || '').toLowerCase();
      const cat = typeof item.category === 'object' ? (item.category?.name || '') : '';
      const catLower = cat.toLowerCase();

      const combined = `${vName} ${pName} ${sku} ${desc} ${catLower}`;
      return terms.every((term) => combined.includes(term));
    });

    if (options?.categoryId && options.categoryId !== 'all') {
      filtered = filtered.filter((item: any) => {
        const vCat = typeof item.category === 'object' && item.category !== null ? item.category?._id : item.category;
        const pCat = typeof item.product?.category === 'object' && item.product?.category !== null ? item.product?.category?._id : item.product?.category;
        return String(vCat) === String(options.categoryId) || String(pCat) === String(options.categoryId);
      });
    }

    if (options?.familyId) {
      filtered = filtered.filter((item: any) => {
        const itemFamily = item.family || item.product?.family;
        if (!itemFamily) return false;
        const itemFamId = typeof itemFamily === 'object' && itemFamily !== null ? itemFamily._id || itemFamily.id : itemFamily;
        return String(itemFamId) === String(options.familyId);
      });
    }

    const limit = options?.limit || 50;
    return {
      success: true,
      data: filtered.slice(0, limit),
    };
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
  options?: { familySlug?: string; familyId?: string }
): Promise<ApiResponse<Variant[]>> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', '50'); // Fetch more to allow proper client-side filtering fallback
    if (options?.familySlug) params.append('familySlug', options.familySlug);
    else if (options?.familyId) params.append('family', options.familyId);

    const url = `/api/products?${params.toString()}`;
    const response = await api.get<any>(url);

    if (response.success && response.data) {
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      let filtered = list;
      if (options?.familyId) {
        filtered = list.filter((item: any) => {
          const itemFamily = item.family || item.product?.family;
          if (!itemFamily) return false;
          const itemFamId = typeof itemFamily === 'object' ? itemFamily._id || itemFamily.id : itemFamily;
          return String(itemFamId) === String(options.familyId);
        });
      }

      return {
        ...response,
        data: filtered.slice(0, limit),
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
