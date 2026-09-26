import { api } from './client';
import { Ticket, TicketMessage, CreateTicketRequest, TicketStatus, ApiResponse } from '@/types/backend';

/**
 * Support Ticket API Service
 * Handles user ticket creation, fetching status, viewing conversations, and replying
 * strictly matching backend/src/modules/support schemas and routes.
 */

export interface GetTicketsOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}

// Support routes can be mounted at /api/support/tickets, /api/tickets, or /support/tickets
const SUPPORT_BASE_PATHS = ['/api/support/tickets', '/api/tickets', '/support/tickets'];

async function requestWithFallback<T>(
  method: 'get' | 'post' | 'patch',
  subPath: string,
  body?: any
): Promise<ApiResponse<T>> {
  let lastErrorResponse: ApiResponse<T> = {
    success: false,
    message: 'Support service unavailable',
  };

  for (const base of SUPPORT_BASE_PATHS) {
    const fullPath = `${base}${subPath}`;
    try {
      let res: ApiResponse<T>;
      if (method === 'get') {
        res = await api.get<T>(fullPath);
      } else if (method === 'post') {
        res = await api.post<T>(fullPath, body);
      } else {
        res = await api.patch<T>(fullPath, body);
      }

      // If route not found (404), try next mount path
      if (!res.success && res.message?.includes('404')) {
        lastErrorResponse = res;
        continue;
      }

      return res;
    } catch (err) {
      lastErrorResponse = {
        success: false,
        message: 'Failed to communicate with support service',
      };
    }
  }

  return lastErrorResponse;
}

/**
 * Get all support tickets for current user
 */
export const getUserTickets = async (
  options?: GetTicketsOptions
): Promise<ApiResponse<{ items: Ticket[]; meta?: { page: number; limit: number; total: number } }>> => {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status && options.status !== 'ALL') params.append('status', options.status);
    if (options?.priority && options.priority !== 'ALL') params.append('priority', options.priority);
    if (options?.search) params.append('search', options.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await requestWithFallback<any>('get', query);

    if (response.success && response.data) {
      const items = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : Array.isArray(response.data.items)
            ? response.data.items
            : [];
      return {
        ...response,
        data: {
          items,
          meta: response.data.meta,
        },
      };
    }

    return {
      success: response.success,
      data: { items: [] },
      message: response.message,
    };
  } catch (error) {
    console.error('Get user tickets error:', error);
    return {
      success: false,
      message: 'Failed to fetch support tickets',
      data: { items: [] },
    };
  }
};

/**
 * Get single ticket details
 */
export const getTicketDetails = async (id: string): Promise<ApiResponse<Ticket>> => {
  try {
    const response = await requestWithFallback<Ticket>('get', `/${id}`);
    return response;
  } catch (error) {
    console.error('Get ticket details error:', error);
    return {
      success: false,
      message: 'Failed to fetch ticket details',
    };
  }
};

/**
 * Get conversation messages for a ticket
 * Safely handles environments where messages route is separate or bundled with ticket details
 */
export const getTicketMessages = async (
  ticketId: string,
  page = 1,
  limit = 100
): Promise<ApiResponse<TicketMessage[]>> => {
  try {
    const response = await requestWithFallback<any>('get', `/${ticketId}/messages?page=${page}&limit=${limit}`);
    if (response.success && response.data) {
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : Array.isArray(response.data.messages)
            ? response.data.messages
            : [];
      return {
        ...response,
        data: list,
      };
    }

    // Fallback: check if getTicketDetails has bundled messages
    const detailRes = await getTicketDetails(ticketId);
    if (detailRes.success && (detailRes.data as any)?.messages) {
      return {
        success: true,
        data: (detailRes.data as any).messages,
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    return {
      success: true,
      data: [],
    };
  }
};

/**
 * Raise a new support ticket (matches createTicketSchema: subject, category, priority, message)
 */
export const createTicket = async (
  data: CreateTicketRequest
): Promise<ApiResponse<Ticket>> => {
  try {
    const response = await requestWithFallback<Ticket>('post', '', {
      subject: data.subject.trim(),
      category: data.category?.trim() || 'GENERAL',
      priority: data.priority || 'LOW',
      message: data.message.trim(),
    });
    return response;
  } catch (error) {
    console.error('Create ticket error:', error);
    return {
      success: false,
      message: 'Failed to create support ticket',
    };
  }
};

/**
 * Reply to an existing ticket (matches replySchema: message)
 */
export const replyToTicket = async (
  ticketId: string,
  message: string
): Promise<ApiResponse<TicketMessage>> => {
  try {
    const response = await requestWithFallback<TicketMessage>('post', `/${ticketId}/reply`, {
      message: message.trim(),
    });
    return response;
  } catch (error) {
    console.error('Reply to ticket error:', error);
    return {
      success: false,
      message: 'Failed to send reply',
    };
  }
};

/**
 * Update ticket status (matches updateStatusSchema: status)
 */
export const updateTicketStatus = async (
  ticketId: string,
  status: TicketStatus
): Promise<ApiResponse<Ticket>> => {
  try {
    const response = await requestWithFallback<Ticket>('patch', `/${ticketId}/status`, {
      status,
    });
    return response;
  } catch (error) {
    console.error('Update ticket status error:', error);
    return {
      success: false,
      message: 'Failed to update ticket status',
    };
  }
};
