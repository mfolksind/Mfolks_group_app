import { api } from './client';
import { Order, CreateOrderRequest, ApiResponse, PaginatedResponse } from '@/types/backend';

/**
 * Orders API Service
 */

/**
 * Create a new order
 * IMPORTANT: Use Variant IDs, NOT Product IDs
 */
export const createOrder = async (
  orderData: CreateOrderRequest,
): Promise<ApiResponse<Order>> => {
  try {
    const response = await api.post<Order>('/api/orders', orderData);
    return response;
  } catch (error) {
    console.error('Create order error:', error);
    return {
      success: false,
      message: 'Failed to create order',
    };
  }
};

/**
 * Get all orders for current user
 */
export const getUserOrders = async (options?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ApiResponse<Order[] | PaginatedResponse<Order>>> => {
  try {
    let url = '/api/orders';
    
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await api.get<Order[] | PaginatedResponse<Order>>(url);
    return response;
  } catch (error) {
    console.error('Get user orders error:', error);
    return {
      success: false,
      message: 'Failed to fetch orders',
    };
  }
};

/**
 * Get single order by ID
 */
export const getOrderById = async (
  orderId: string,
): Promise<ApiResponse<Order>> => {
  try {
    const response = await api.get<Order>(`/api/orders/${orderId}`);
    return response;
  } catch (error) {
    console.error('Get order by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch order details',
    };
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (
  orderId: string,
  reason?: string,
): Promise<ApiResponse<Order>> => {
  try {
    const response = await api.patch<Order>(`/api/orders/${orderId}`, {
      status: 'cancelled',
      cancelReason: reason,
    });
    return response;
  } catch (error) {
    console.error('Cancel order error:', error);
    return {
      success: false,
      message: 'Failed to cancel order',
    };
  }
};

/**
 * Update order status (admin/internal use)
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
  notes?: string,
): Promise<ApiResponse<Order>> => {
  try {
    const response = await api.patch<Order>(`/api/orders/${orderId}`, {
      status,
      notes,
    });
    return response;
  } catch (error) {
    console.error('Update order status error:', error);
    return {
      success: false,
      message: 'Failed to update order',
    };
  }
};
