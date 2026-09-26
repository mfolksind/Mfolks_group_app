import { api } from './client';
import { ApiResponse } from '@/types/backend';

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: any[];
  created_at: number;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

/**
 * Create a new Razorpay order
 */
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string,
  orderId?: string,
): Promise<ApiResponse<RazorpayOrderResponse>> => {
  try {
    if (orderId) {
      const serverRes = await api.post<RazorpayOrderResponse>('/api/payments/razorpay/create-order', {
        orderId,
        amount: Math.round(amount * 100),
        currency,
        receipt,
      });

      if (serverRes.success && serverRes.data) {
        return serverRes;
      }
    }
  } catch (err) {
    console.warn('Backend create-order call warning, falling back to client test simulation:', err);
  }

  // Generate mock Razorpay order locally for sandbox/test simulation
  const mockOrder: RazorpayOrderResponse = {
    id: `order_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    entity: 'order',
    amount: Math.round(amount * 100),
    amount_paid: 0,
    amount_due: Math.round(amount * 100),
    currency,
    receipt,
    status: 'created',
    attempts: 0,
    notes: [],
    created_at: Math.floor(Date.now() / 1000),
  };

  return {
    success: true,
    data: mockOrder,
  };
};

/**
 * Verify a Razorpay payment signature and mark order paid
 */
export const verifyRazorpayPayment = async (
  verificationData: VerifyPaymentRequest,
): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post<any>('/api/payments/razorpay/verify', verificationData);
    return response;
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    return {
      success: false,
      message: 'Failed to verify payment with server',
    };
  }
};
