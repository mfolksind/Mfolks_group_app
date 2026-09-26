import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { getSocket, onSocketReady } from '../services/socket';
import { getTicketMessages, replyToTicket } from '../api/support.api';
import { TicketMessage, TicketStatus } from '../types/backend';
import { setActiveTicketChatId } from './useNotifications';

export const useTicketChat = (ticketId: string | null) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Fetch message history
  const fetchMessages = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const res = await getTicketMessages(ticketId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.warn('Error fetching ticket messages:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 2. Socket Smart Presence (ticket:join / ticket:leave) & Real-time Listeners
  useEffect(() => {
    if (!ticketId) return;

    const safeTicketId = String(ticketId);

    setActiveTicketChatId(safeTicketId);

    const handleNewMessage = (data: any) => {
      const incomingTicketId = data?.ticketId || data?.message?.ticket || data?.ticket;
      if (incomingTicketId && String(incomingTicketId) !== safeTicketId) {
        return;
      }

      const msgObj: TicketMessage | null =
        typeof data?.message === 'object' && data?.message !== null
          ? data.message
          : typeof data === 'object'
          ? data
          : null;

      if (!msgObj || !msgObj.message) return;

      const newId = String(msgObj._id || (msgObj as any).id || '');
      const newText = String(msgObj.message || '').trim();

      const getMsgTime = (d?: any) => {
        if (!d) return Date.now();
        const parsed = new Date(d).getTime();
        return isNaN(parsed) ? Date.now() : parsed;
      };

      const msgTime = getMsgTime(msgObj.createdAt);

      setMessages((prev) => {
        // 1. Check by ID (exact match)
        if (newId && prev.some((m) => String(m._id || (m as any).id || '') === newId)) {
          return prev;
        }

        // 2. Check by content + timestamp proximity (within 15 seconds)
        const isDuplicateContent = prev.some((m) => {
          const mText = String(m.message || '').trim();
          if (mText !== newText || !newText) return false;
          const prevTime = getMsgTime(m.createdAt);
          const timeDiff = Math.abs(prevTime - msgTime);
          return timeDiff < 15000;
        });

        if (isDuplicateContent) {
          return prev;
        }

        return [...prev, msgObj];
      });
    };

    const handleTyping = (data: {
      ticketId: string;
      isTyping: boolean;
      userName?: string;
    }) => {
      if (data?.ticketId && String(data.ticketId) !== safeTicketId) {
        return;
      }

      setIsAgentTyping(!!data.isTyping);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsAgentTyping(false);
        }, 4000);
      }
    };

    const handleStatusChange = (data: any) => {
      const targetTicketId = data?.ticketId || data?.id || data?._id;
      if (!targetTicketId || String(targetTicketId) === safeTicketId) {
        fetchMessages();
      }
    };

    const handleSocketConnect = (socket: any) => {
      if (AppState.currentState !== 'active') {
        return;
      }

      console.log('[TicketChat] Joining ticket:', safeTicketId);
      socket.emit('ticket:join', { ticketId: safeTicketId });
    };

    const unsubscribeSocket = onSocketReady((socket) => {
      // Clean up previous listeners first to avoid accumulating duplicates
      socket.off('ticket:message', handleNewMessage);
      socket.off('ticket:typing', handleTyping);
      socket.off('ticket:status_changed', handleStatusChange);
      socket.off('ticket:updated', handleStatusChange);

      handleSocketConnect(socket);

      socket.on('ticket:message', handleNewMessage);
      socket.on('ticket:typing', handleTyping);
      socket.on('ticket:status_changed', handleStatusChange);
      socket.on('ticket:updated', handleStatusChange);
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      const socket = getSocket();
      if (!socket || !socket.connected) return;

      if (nextState === 'active') {
        setActiveTicketChatId(safeTicketId);
        socket.emit('ticket:join', { ticketId: safeTicketId });
      } else {
        setActiveTicketChatId(null);
        socket.emit('ticket:leave', { ticketId: safeTicketId });
      }
    });

    return () => {
      const socket = getSocket();

      if (socket) {
        socket.emit('ticket:leave', { ticketId: safeTicketId });
        socket.off('ticket:message', handleNewMessage);
        socket.off('ticket:typing', handleTyping);
        socket.off('ticket:status_changed', handleStatusChange);
        socket.off('ticket:updated', handleStatusChange);
      }

      appStateSubscription.remove();
      unsubscribeSocket();
      setActiveTicketChatId(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [ticketId, fetchMessages]);

  // Send typing status to socket
  const sendTypingStatus = (isTyping: boolean) => {
    if (!ticketId) return;
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('ticket:typing', { ticketId, isTyping });
    }
  };

  // 3. Send Message
  const sendMessage = async (text: string): Promise<boolean> => {
    if (!ticketId || !text.trim() || sending) return false;
    setSending(true);
    try {
      sendTypingStatus(false);
      const res = await replyToTicket(ticketId, text.trim());
      if (res.success && res.data) {
        const newMsg = res.data as TicketMessage;
        const newId = String(newMsg._id || (newMsg as any).id || '');
        const newText = String(newMsg.message || text.trim()).trim();

        const getMsgTime = (d?: any) => {
          if (!d) return Date.now();
          const parsed = new Date(d).getTime();
          return isNaN(parsed) ? Date.now() : parsed;
        };

        const msgTime = getMsgTime(newMsg.createdAt);

        setMessages((prev) => {
          if (newId && prev.some((m) => String(m._id || (m as any).id || '') === newId)) {
            return prev;
          }
          const isDuplicateContent = prev.some((m) => {
            const mText = String(m.message || '').trim();
            if (mText !== newText || !newText) return false;
            const prevTime = getMsgTime(m.createdAt);
            const timeDiff = Math.abs(prevTime - msgTime);
            return timeDiff < 15000;
          });
          if (isDuplicateContent) return prev;
          return [...prev, newMsg];
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error sending reply:', err);
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    isAgentTyping,
    sendMessage,
    sendTypingStatus,
    refetch: fetchMessages,
  };
};
