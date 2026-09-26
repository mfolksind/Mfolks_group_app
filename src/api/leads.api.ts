import { api } from './client';
import { ApiResponse } from '@/types/backend';

export interface CreateLeadPayload {
  productId?: string;
  variantId?: string;
  productName?: string;
  sku?: string;
  notes?: string;
  phone?: string;
  email?: string;
  type?: string;
  source?: string;
  [key: string]: any;
}

/**
 * Sends a product interest request to the leads endpoint.
 * Request URL: https://api.mfolks.com/api/leads/stats
 */
export const submitProductLead = async (payload: CreateLeadPayload): Promise<ApiResponse<any>> => {
  const endpoints = ['/api/leads/stats', '/api/leads', '/leads/stats', '/leads'];
  let lastError: ApiResponse<any> = {
    success: false,
    message: 'Unable to reach leads service',
  };

  const body = {
    type: 'PRODUCT_INTEREST',
    source: 'PRODUCT_CARD',
    createdAt: new Date().toISOString(),
    ...payload,
  };

  for (const endpoint of endpoints) {
    try {
      const response = await api.post(endpoint, body);
      if (response && (response.success || (response as any).status === 200 || (response as any).status === 201)) {
        return {
          success: true,
          message: response.message || 'Interest registered successfully',
          data: response.data,
        };
      }
      if (response) {
        lastError = response;
      }
    } catch (err: any) {
      console.warn(`[Leads API] Request to ${endpoint} failed:`, err?.message);
    }
  }

  return lastError;
};
