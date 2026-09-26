import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, onSocketReady } from '../services/socket';
import { showPhoneNotification } from '../services/notificationService';
import { getAuthToken } from '../api/client';

export interface AppNotification {
  _id: string;
  id?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// Global tracker of which ticket chat room the user is currently inside
let activeTicketChatId: string | null = null;

export const setActiveTicketChatId = (ticketId: string | null) => {
  activeTicketChatId = ticketId;
};

export const getActiveTicketChatId = (): string | null => activeTicketChatId;

const DEFAULT_API_URL = 'https://api.mfolks.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim() !== ''
    ? process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/$/, '')
    : DEFAULT_API_URL;

// Global notification event emitter to prevent duplicated listeners per hook instance
type NotifHandler = (notif: AppNotification) => void;
type ReadHandler = (id?: string) => void;
type ReadAllHandler = () => void;

const newNotifSubscribers = new Set<NotifHandler>();
const readNotifSubscribers = new Set<ReadHandler>();
const readAllNotifSubscribers = new Set<ReadAllHandler>();
const handleGlobalNewNotif = (notif: AppNotification) => {
  const ticketId = notif.data?.ticketId;
  const isViewingChat = activeTicketChatId && String(activeTicketChatId) === String(ticketId);

  // Trigger phone notification EXACTLY ONCE globally
  if (!isViewingChat) {
    showPhoneNotification({
      title: notif.title || 'Mfolks Support Update',
      body: notif.message,
      data: notif.data,
    });
  }

  // Notify all active React hook subscribers
  newNotifSubscribers.forEach((cb) => cb(notif));
};

const handleGlobalReadNotif = (data: { id?: string }) => {
  readNotifSubscribers.forEach((cb) => cb(data?.id));
};

const handleGlobalReadAllNotif = () => {
  readAllNotifSubscribers.forEach((cb) => cb());
};

const initGlobalNotifSocketListener = () => {
  onSocketReady((socket) => {
    // Always clean up existing global handlers first to prevent duplicate callbacks on socket reconnects
    socket.off('notification:new', handleGlobalNewNotif);
    socket.off('notification:read', handleGlobalReadNotif);
    socket.off('notification:read_all', handleGlobalReadAllNotif);

    socket.on('notification:new', handleGlobalNewNotif);
    socket.on('notification:read', handleGlobalReadNotif);
    socket.on('notification:read_all', handleGlobalReadAllNotif);
  });
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  // Bind global socket listener once
  useEffect(() => {
    initGlobalNotifSocketListener();
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        if (isMounted.current) setLoading(false);
        return;
      }

      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/notifications?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success && isMounted.current) {
        const items = result.data?.notifications || result.data?.items || result.data || [];
        const realUnreadCount =
          typeof result.data?.unreadCount === 'number'
            ? result.data.unreadCount
            : typeof result.unreadCount === 'number'
            ? result.unreadCount
            : Array.isArray(items)
            ? items.filter((n: any) => !n.isRead).length
            : 0;
        setNotifications(Array.isArray(items) ? items : []);
        setUnreadCount(realUnreadCount);
      }
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchNotifications();
    return () => {
      isMounted.current = false;
    };
  }, [fetchNotifications]);

  // Subscribe to global socket notification events
  useEffect(() => {
    const handleNewNotif: NotifHandler = (notif) => {
      if (!isMounted.current) return;
      setNotifications((prev) => {
        if (prev.some((n) => (n._id && n._id === notif._id) || (n.id && n.id === notif.id))) {
          return prev;
        }
        const updated = [notif, ...prev];
        setUnreadCount(updated.filter((n) => !n.isRead).length);
        return updated;
      });
    };

    const handleReadNotif: ReadHandler = (id) => {
      if (!isMounted.current || !id) return;
      setNotifications((prev) => {
        const updated = prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(updated.filter((n) => !n.isRead).length);
        return updated;
      });
    };

    const handleReadAllNotif: ReadAllHandler = () => {
      if (!isMounted.current) return;
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, isRead: true }));
        setUnreadCount(0);
        return updated;
      });
    };

    newNotifSubscribers.add(handleNewNotif);
    readNotifSubscribers.add(handleReadNotif);
    readAllNotifSubscribers.add(handleReadAllNotif);

    return () => {
      newNotifSubscribers.delete(handleNewNotif);
      readNotifSubscribers.delete(handleReadNotif);
      readAllNotifSubscribers.delete(handleReadAllNotif);
    };
  }, []);

  const markAsRead = async (id: string) => {
    // Optimistically mark read locally so badge disappears immediately
    setNotifications((prev) => {
      const updated = prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(updated.filter((n) => !n.isRead).length);
      return updated;
    });

    try {
      const token = await getAuthToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn('Failed to mark notification read:', e);
    }
  };

  const markAllRead = async () => {
    // Optimistically update all locally
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const token = await getAuthToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn('Failed to mark all notifications read:', e);
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistically remove from state like LinkedIn
    setNotifications((prev) => {
      const updated = prev.filter((n) => n._id !== id && n.id !== id);
      setUnreadCount(updated.filter((n) => !n.isRead).length);
      return updated;
    });

    try {
      const token = await getAuthToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn('Failed to delete notification:', e);
    }
  };

  const clearAllNotifications = async () => {
    // Optimistically clear all notifications like LinkedIn
    setNotifications([]);
    setUnreadCount(0);

    try {
      const token = await getAuthToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn('Failed to clear all notifications:', e);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications,
  };
};
