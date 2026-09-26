import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, Button, Input, Snackbar } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, elevation } from '@/design-system';
import {
  getUserTickets,
  createTicket,
  updateTicketStatus,
} from '@/api/support.api';
import { Ticket, TicketMessage, TicketStatus, TicketPriority } from '@/types/backend';
import { useTicketChat } from '@/hooks/useTicketChat';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatHtmlText = (htmlStr?: string) => {
  if (!htmlStr) return '';
  let text = String(htmlStr);
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, ' • ');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
};

const CATEGORIES = [
  'GENERAL',
  'ORDERS',
  'TECHNICAL',
  'PAYMENTS',
  'PRODUCTS',
  'DELIVERY',
];

const PRIORITIES: { label: string; value: TicketPriority; color: string; icon: string }[] = [
  { label: 'Low', value: 'LOW', color: '#64748B', icon: 'arrow-down' },
  { label: 'Medium', value: 'MEDIUM', color: '#0EA5E9', icon: 'remove' },
  { label: 'High', value: 'HIGH', color: '#F59E0B', icon: 'arrow-up' },
  { label: 'Urgent', value: 'URGENT', color: '#EF4444', icon: 'flame' },
];

// Premium accent color for left borders based on status
const getStatusAccent = (status: TicketStatus) => {
  switch (status) {
    case 'OPEN': return '#3B82F6';
    case 'IN_PROGRESS': return '#F59E0B';
    case 'RESOLVED': return '#22C55E';
    case 'CLOSED': return '#94A3B8';
    default: return '#94A3B8';
  }
};

const CATEGORY_ICONS: Record<string, string> = {
  GENERAL: 'help-circle-outline',
  ORDERS: 'cube-outline',
  TECHNICAL: 'construct-outline',
  PAYMENTS: 'card-outline',
  PRODUCTS: 'pricetags-outline',
  DELIVERY: 'car-outline',
};

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Ticket Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newMessage, setNewMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Ticket Detail & Conversation Modal State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Snackbar State
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarVariant, setSnackbarVariant] = useState<'default' | 'success' | 'error' | 'warning'>('default');

  const showToast = (message: string, variant: 'default' | 'success' | 'error' | 'warning' = 'default') => {
    setSnackbarMessage(message);
    setSnackbarVariant(variant);
    setSnackbarVisible(true);
  };

  const fetchTickets = useCallback(async () => {
    try {
      const res = await getUserTickets();
      if (res.success && res.data?.items) {
        setTickets(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesFilter = (() => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'OPEN') return t.status === 'OPEN' || t.status === 'IN_PROGRESS';
      return t.status === activeFilter;
    })();

    const matchesSearch = !searchQuery.trim() ||
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleOpenTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim()) {
      showToast('Please enter a ticket subject', 'warning');
      return;
    }
    if (!newMessage.trim()) {
      showToast('Please describe your query', 'warning');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await createTicket({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        message: newMessage.trim(),
      });

      if (res.success && res.data) {
        showToast('Support ticket created successfully!', 'success');
        setCreateModalVisible(false);
        setNewSubject('');
        setNewMessage('');
        fetchTickets();
        setSelectedTicket(res.data);
      } else {
        showToast(res.message || 'Failed to create ticket', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error submitting ticket', 'error');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await updateTicketStatus(selectedTicket._id, status);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
        showToast(`Ticket status updated to ${status}`, 'success');
        fetchTickets();
      } else {
        showToast(res.message || 'Failed to update ticket status', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'Open',
          bg: '#DBEAFE',
          text: '#2563EB',
          icon: 'radio-button-on' as const,
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          bg: '#FEF3C7',
          text: '#D97706',
          icon: 'time' as const,
        };
      case 'RESOLVED':
        return {
          label: 'Resolved',
          bg: '#DCFCE7',
          text: '#15803D',
          icon: 'checkmark-circle' as const,
        };
      case 'CLOSED':
        return {
          label: 'Closed',
          bg: '#F1F5F9',
          text: '#475569',
          icon: 'lock-closed' as const,
        };
      default:
        return {
          label: status,
          bg: '#F1F5F9',
          text: '#475569',
          icon: 'help-circle-outline' as const,
        };
    }
  };

  const getPriorityInfo = (priority?: string) => {
    switch (priority) {
      case 'URGENT':
        return { color: '#EF4444', bg: '#FEE2E2', label: 'Urgent' };
      case 'HIGH':
        return { color: '#F59E0B', bg: '#FEF3C7', label: 'High' };
      case 'MEDIUM':
        return { color: '#0EA5E9', bg: '#E0F2FE', label: 'Medium' };
      case 'LOW':
      default:
        return { color: '#64748B', bg: '#F1F5F9', label: 'Low' };
    }
  };

  const getFilterCounts = () => {
    const all = tickets.length;
    const open = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter(t => t.status === 'RESOLVED').length;
    const closed = tickets.filter(t => t.status === 'CLOSED').length;
    return { ALL: all, OPEN: open, RESOLVED: resolved, CLOSED: closed };
  };

  const counts = getFilterCounts();

  const renderTicketCard = ({ item, index }: { item: Ticket; index: number }) => {
    const statusInfo = getStatusBadge(item.status);
    const priorityInfo = getPriorityInfo(item.priority);
    const accentColor = getStatusAccent(item.status);
    const dateFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
    const timeFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const catIcon = CATEGORY_ICONS[item.category || 'GENERAL'] || 'help-circle-outline';

    return (
      <Pressable
        onPress={() => handleOpenTicketDetails(item)}
        style={({ pressed }) => [styles.ticketCardWrapper, pressed && styles.pressed]}
      >
        <View style={[styles.ticketCard, { borderLeftColor: accentColor }]}>
          {/* Top Row: Avatar + Info + Status Badge */}
          <View style={styles.ticketTopRow}>
            <View style={[styles.ticketAvatarCircle, { backgroundColor: `${accentColor}18` }]}>
              <Ionicons name={catIcon as any} size={20} color={accentColor} />
            </View>

            <View style={styles.ticketInfoCol}>
              <View style={styles.ticketTitleRow}>
                <Text style={styles.ticketSubject} numberOfLines={1}>
                  {formatHtmlText(item.subject)}
                </Text>
              </View>
              <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
            </View>

            <Text style={styles.ticketTime}>{timeFormatted}</Text>
          </View>

          {/* Bottom Meta Row */}
          <View style={styles.ticketBottomRow}>
            <View style={styles.ticketMetaLeft}>
              {/* Status Badge */}
              <View style={[styles.statusBadgeMini, { backgroundColor: statusInfo.bg }]}>
                <Ionicons name={statusInfo.icon} size={10} color={statusInfo.text} />
                <Text style={[styles.statusBadgeMiniText, { color: statusInfo.text }]}>
                  {statusInfo.label}
                </Text>
              </View>

              {/* Category Tag */}
              {item.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{item.category}</Text>
                </View>
              )}
            </View>

            <View style={styles.ticketMetaRight}>
              {/* Priority */}
              <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.bg }]}>
                <View style={[styles.priorityDotTiny, { backgroundColor: priorityInfo.color }]} />
                <Text style={[styles.priorityBadgeText, { color: priorityInfo.color }]}>
                  {priorityInfo.label}
                </Text>
              </View>

              {/* Date */}
              <View style={styles.dateChip}>
                <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
                <Text style={styles.dateChipText}>{dateFormatted}</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <AppBar title="Help & Support" showBack showCart showNotification />

      <ScreenContainer scroll={false} padded={false}>
        {/* ========== Premium Gradient Header ========== */}
        <LinearGradient
          colors={['#1E3A5F', '#2563EB', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <View style={styles.headerContent}>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Support Center</Text>
              <Text style={styles.headerSubtitle}>
                Get help from our expert team
              </Text>
            </View>
            <Pressable
              onPress={() => setCreateModalVisible(true)}
              style={({ pressed }) => [styles.headerCreateBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="add-circle" size={20} color="#2563EB" />
              <Text style={styles.headerCreateBtnText}>New Ticket</Text>
            </Pressable>
          </View>

          {/* Quick Contact Actions */}
          <View style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [styles.quickActionBtn, pressed && { opacity: 0.8 }]}
              onPress={() => Linking.openURL('tel:+919711826427')}
            >
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="call" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Call Us</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickActionBtn, pressed && { opacity: 0.8 }]}
              onPress={() => Linking.openURL('mailto:info@mfolks.com')}
            >
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="mail" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Email Us</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickActionBtn, pressed && { opacity: 0.8 }]}
              onPress={() => Linking.openURL('https://wa.me/919711826427')}
            >
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>WhatsApp</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* ========== Search Bar ========== */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tickets..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* ========== Filter Tabs ========== */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {[
              { id: 'ALL', label: 'All', icon: 'layers-outline' },
              { id: 'OPEN', label: 'Open', icon: 'radio-button-on-outline' },
              { id: 'RESOLVED', label: 'Resolved', icon: 'checkmark-circle-outline' },
              { id: 'CLOSED', label: 'Closed', icon: 'lock-closed-outline' },
            ].map((tab) => {
              const isSelected = activeFilter === tab.id;
              const count = counts[tab.id as keyof typeof counts] || 0;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveFilter(tab.id as any)}
                  style={[styles.filterTab, isSelected && styles.filterTabActive]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      isSelected && styles.filterTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View style={[styles.filterCountBadge, isSelected && styles.filterCountBadgeActive]}>
                    <Text style={[styles.filterCountText, isSelected && styles.filterCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ========== Tickets List ========== */}
        {loading ? (
          <View style={styles.centerContainer}>
            <View style={styles.loaderCircle}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
            <Text style={styles.loadingText}>Loading your tickets...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            keyExtractor={(item) => item._id}
            renderItem={renderTicketCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyIconWrap}>
                  <LinearGradient
                    colors={['#EEF2FF', '#DBEAFE']}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="chatbubbles-outline" size={40} color="#3B82F6" />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No Results Found' : 'No Tickets Yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `No tickets match "${searchQuery}". Try a different search.`
                    : activeFilter === 'ALL'
                    ? 'You haven\'t created any support tickets yet.\nTap below to get started!'
                    : `No tickets matching "${activeFilter}" filter.`}
                </Text>
                {!searchQuery && (
                  <Pressable
                    onPress={() => setCreateModalVisible(true)}
                    style={({ pressed }) => [styles.emptyCreateBtn, pressed && { opacity: 0.85 }]}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.emptyCreateBtnText}>Create Your First Ticket</Text>
                  </Pressable>
                )}
              </View>
            }
          />
        )}
      </ScreenContainer>

      {/* ========== Floating Action Button ========== */}
      <Pressable
        onPress={() => setCreateModalVisible(true)}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.fabText}>Raise Ticket</Text>
        </LinearGradient>
      </Pressable>

      {/* ========================================================================= */}
      {/* CREATE TICKET MODAL                                                        */}
      {/* ========================================================================= */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setCreateModalVisible(false)} />
          <View style={styles.modalContent}>
            {/* Drag handle */}
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconCircle}>
                  <Ionicons name="ticket-outline" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>New Ticket</Text>
                  <Text style={styles.modalSubtitle}>We'll respond within 24 hours</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setCreateModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Subject */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Subject</Text>
                <View style={styles.formInputWrap}>
                  <Ionicons name="create-outline" size={18} color="#94A3B8" style={{ marginLeft: 12 }} />
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="e.g. Payment not going through"
                    placeholderTextColor="#94A3B8"
                    value={newSubject}
                    onChangeText={setNewSubject}
                  />
                </View>
              </View>

              {/* Category Selector */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => {
                    const isCatSelected = newCategory === cat;
                    const icon = CATEGORY_ICONS[cat] || 'help-circle-outline';
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setNewCategory(cat)}
                        style={[styles.categoryGridItem, isCatSelected && styles.categoryGridItemActive]}
                      >
                        <Ionicons
                          name={icon as any}
                          size={18}
                          color={isCatSelected ? '#2563EB' : '#94A3B8'}
                        />
                        <Text
                          style={[
                            styles.categoryGridItemText,
                            isCatSelected && styles.categoryGridItemTextActive,
                          ]}
                        >
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Priority Selector */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {PRIORITIES.map((p) => {
                    const isPSelected = newPriority === p.value;
                    return (
                      <Pressable
                        key={p.value}
                        onPress={() => setNewPriority(p.value)}
                        style={[
                          styles.priorityOption,
                          isPSelected && { borderColor: p.color, backgroundColor: `${p.color}10` },
                        ]}
                      >
                        <Ionicons
                          name={p.icon as any}
                          size={14}
                          color={isPSelected ? p.color : '#94A3B8'}
                        />
                        <Text
                          style={[
                            styles.priorityOptionText,
                            isPSelected && { color: p.color, fontWeight: '700' },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Message Details */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Describe your issue</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={5}
                  placeholder="Please provide as much details as possible so we can assist you quickly..."
                  placeholderTextColor="#94A3B8"
                  value={newMessage}
                  onChangeText={setNewMessage}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleCreateTicket}
                disabled={submittingTicket}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && { opacity: 0.9 },
                  submittingTicket && { opacity: 0.6 },
                ]}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  style={styles.submitBtnGradient}
                >
                  {submittingTicket ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Submit Ticket</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* TICKET DETAILS & LIVE CHAT MODAL                                           */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedTicket(null)}
      >
        {selectedTicket && (
          <LiveTicketChatView
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onUpdateStatus={handleUpdateStatus}
            updatingStatus={updatingStatus}
            getStatusBadge={getStatusBadge}
          />
        )}
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        variant={snackbarVariant}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </View>
  );
}

/**
 * Separate full-screen live chat component with Socket.IO Smart Presence and anti-keyboard overlap
 */
function LiveTicketChatView({
  ticket,
  onClose,
  onUpdateStatus,
  updatingStatus,
  getStatusBadge,
}: {
  ticket: Ticket;
  onClose: () => void;
  onUpdateStatus: (status: TicketStatus) => void;
  updatingStatus: boolean;
  getStatusBadge: (status: TicketStatus) => { label: string; bg: string; text: string; icon: any };
}) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<{ fileName: string; fileType: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { messages, loading, sending, isAgentTyping, sendMessage, sendTypingStatus } = useTicketChat(ticket._id);

  const statusInfo = getStatusBadge(ticket.status);

  const quickReplies = [
    "I've sent the payment receipt",
    "When will my order be dispatched?",
    "Thanks, issue resolved!",
    "Share technical specifications",
  ];

  const toggleAttachment = () => {
    if (selectedAttachment) {
      setSelectedAttachment(null);
    } else {
      setSelectedAttachment({
        fileName: 'PO_Document_Reference.pdf',
        fileType: 'application/pdf',
      });
    }
  };

  const handleSendText = async (text: string) => {
    if ((!text.trim() && !selectedAttachment) || sending) return;
    const msgContent = text.trim();
    setInputText('');
    setSelectedAttachment(null);
    await sendMessage(msgContent);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSend = () => handleSendText(inputText);

  const renderMessageItem = ({ item, index }: { item: TicketMessage; index: number }) => {
    const currentUserId = String(user?._id || user?.id || '');

    const senderObj = typeof item.sender === 'object' && item.sender !== null ? item.sender : null;
    const senderId = String(senderObj?._id || item.sender || '');
    const senderRole = (senderObj?.role || '').toLowerCase();

    // Check if message was sent by current logged-in customer vs support agent
    const isCustomer =
      (currentUserId && senderId && currentUserId === senderId) ||
      senderRole === 'customer' ||
      senderRole === 'buyer';

    const senderName = isCustomer
      ? 'You'
      : senderObj?.name || 'Support Agent';

    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      : '';

    const cleanedMessageText = formatHtmlText(item.message);
    const hasAttachments = item.attachments && item.attachments.length > 0;

    // Check if message clustering applies (same sender consecutive messages)
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const prevSenderObj = prevMessage && typeof prevMessage.sender === 'object' && prevMessage.sender !== null ? prevMessage.sender : null;
    const prevSenderId = String(prevSenderObj?._id || prevMessage?.sender || '');

    const currentDateStr = item.createdAt ? new Date(item.createdAt).toDateString() : '';
    const prevDateStr = prevMessage?.createdAt ? new Date(prevMessage.createdAt).toDateString() : '';
    const showDateDivider = index === 0 || currentDateStr !== prevDateStr;

    const isSameSenderAsPrev = prevMessage && prevSenderId === senderId && !showDateDivider;
    const isFirstInGroup = !isSameSenderAsPrev;

    return (
      <View key={item._id || index}>
        {showDateDivider && (
          <View style={chatStyles.dateDividerRow}>
            <View style={chatStyles.dateDividerLine} />
            <View style={chatStyles.dateDividerPill}>
              <Text style={chatStyles.dateDividerText}>
                {currentDateStr === new Date().toDateString()
                  ? 'Today'
                  : currentDateStr === new Date(Date.now() - 86400000).toDateString()
                    ? 'Yesterday'
                    : new Date(item.createdAt!).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
              </Text>
            </View>
            <View style={chatStyles.dateDividerLine} />
          </View>
        )}

        <View
          style={[
            chatStyles.messageRow,
            isCustomer ? chatStyles.customerRow : chatStyles.agentRow,
            !isFirstInGroup && { marginTop: 2 },
          ]}
        >
          {/* Agent avatar */}
          {!isCustomer && (
            isFirstInGroup ? (
              <View style={chatStyles.agentAvatar}>
                <Ionicons name="headset" size={14} color="#FFFFFF" />
                <View style={chatStyles.onlineDot} />
              </View>
            ) : (
              <View style={{ width: 32 }} />
            )
          )}

          <View style={{ maxWidth: '78%' }}>
            {/* Sender name for first message in group */}
            {isFirstInGroup && !isCustomer && (
              <View style={chatStyles.senderRow}>
                <Text style={chatStyles.senderName}>{senderName}</Text>
                <View style={chatStyles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#2563EB" />
                </View>
              </View>
            )}

            <View
              style={[
                chatStyles.bubble,
                isCustomer ? chatStyles.customerBubble : chatStyles.agentBubble,
                !isFirstInGroup && isCustomer && { borderTopRightRadius: 16 },
                !isFirstInGroup && !isCustomer && { borderTopLeftRadius: 16 },
              ]}
            >
              {cleanedMessageText ? (
                <Text
                  style={[
                    chatStyles.messageText,
                    isCustomer ? chatStyles.customerText : chatStyles.agentText,
                  ]}
                >
                  {cleanedMessageText}
                </Text>
              ) : null}

              {/* Render attachments if present */}
              {hasAttachments && (
                <View style={chatStyles.attachmentsWrap}>
                  {item.attachments!.map((att, attIdx) => (
                    <View key={attIdx} style={[chatStyles.attachmentItem, isCustomer && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Ionicons name="document-text" size={16} color={isCustomer ? '#FFFFFF' : '#2563EB'} />
                      <Text style={[chatStyles.attachmentText, isCustomer && { color: '#FFFFFF' }]} numberOfLines={1}>
                        {att.fileName || `Attachment ${attIdx + 1}`}
                      </Text>
                      <Ionicons name="download-outline" size={14} color={isCustomer ? '#FFFFFF' : '#2563EB'} />
                    </View>
                  ))}
                </View>
              )}

              <View style={chatStyles.timeRow}>
                <Text
                  style={[
                    chatStyles.timeText,
                    isCustomer ? { color: 'rgba(255,255,255,0.65)' } : { color: '#94A3B8' },
                  ]}
                >
                  {timeStr}
                </Text>
                {isCustomer && (
                  <Ionicons name="checkmark-done" size={13} color="rgba(255,255,255,0.7)" />
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[chatStyles.container, { paddingTop: insets.top }]}>
      {/* ========== Modern Chat Navbar ========== */}
      <LinearGradient
        colors={['#1E3A5F', '#1E40AF']}
        style={chatStyles.navbar}
      >
        <Pressable onPress={onClose} style={chatStyles.navBackBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={chatStyles.navInfoCol}>
          <View style={chatStyles.navTitleRow}>
            <Text style={chatStyles.navTitle} numberOfLines={1}>
              #{ticket.ticketNumber}
            </Text>
            <View style={chatStyles.livePulse}>
              <View style={chatStyles.livePulseDot} />
              <Text style={chatStyles.livePulseText}>Live</Text>
            </View>
          </View>
          <Text style={chatStyles.navSubtitle} numberOfLines={1}>
            {formatHtmlText(ticket.subject)}
          </Text>
        </View>

        <View style={[chatStyles.navStatusBadge, { backgroundColor: statusInfo.bg }]}>
          <Ionicons name={statusInfo.icon} size={11} color={statusInfo.text} />
          <Text style={[chatStyles.navStatusText, { color: statusInfo.text }]}>
            {statusInfo.label}
          </Text>
        </View>
      </LinearGradient>

      {/* Status Action Bar */}
      <View style={chatStyles.statusBar}>
        {ticket.status === 'RESOLVED' ? (
          <View style={chatStyles.resolvedBanner}>
            <Ionicons name="checkmark-done-circle" size={16} color="#15803D" />
            <Text style={chatStyles.resolvedBannerText}>
              Ticket resolved. You can still message below.
            </Text>
          </View>
        ) : ticket.status === 'CLOSED' ? (
          <View style={chatStyles.closedBanner}>
            <Ionicons name="lock-closed" size={14} color="#64748B" />
            <Text style={chatStyles.closedBannerText}>This ticket has been closed.</Text>
          </View>
        ) : (
          <View style={chatStyles.openBanner}>
            <Text style={chatStyles.openBannerText}>Issue resolved?</Text>
            <Pressable
              style={({ pressed }) => [chatStyles.resolveBtn, pressed && { opacity: 0.85 }]}
              disabled={updatingStatus}
              onPress={() => onUpdateStatus('RESOLVED')}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color="#15803D" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={15} color="#15803D" />
                  <Text style={chatStyles.resolveBtnText}>Mark Resolved</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* ========== Chat Messages ========== */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading ? (
          <View style={chatStyles.loadingWrap}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={chatStyles.loadingText}>Connecting to support...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || String(index)}
            renderItem={renderMessageItem}
            contentContainerStyle={chatStyles.messagesList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={
              <View style={chatStyles.ticketInfoCard}>
                <View style={chatStyles.ticketInfoHeader}>
                  <View style={chatStyles.ticketInfoIcon}>
                    <Ionicons name="ticket" size={16} color="#2563EB" />
                  </View>
                  <Text style={chatStyles.ticketInfoTitle}>
                    Ticket #{ticket.ticketNumber}
                  </Text>
                  <View style={chatStyles.ticketInfoCategoryTag}>
                    <Text style={chatStyles.ticketInfoCategoryText}>
                      {ticket.category || 'GENERAL'}
                    </Text>
                  </View>
                </View>
                <Text style={chatStyles.ticketInfoSubject}>
                  "{formatHtmlText(ticket.subject)}"
                </Text>
                <View style={chatStyles.ticketInfoMeta}>
                  <Text style={chatStyles.ticketInfoMetaText}>
                    Priority: <Text style={{ fontWeight: '700', color: '#2563EB' }}>{ticket.priority || 'LOW'}</Text>
                  </Text>
                  <Text style={chatStyles.ticketInfoMetaText}>
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                  </Text>
                </View>
              </View>
            }
          />
        )}

        {/* Typing Indicator */}
        {isAgentTyping && (
          <View style={chatStyles.typingRow}>
            <View style={chatStyles.typingAvatarSmall}>
              <Ionicons name="headset" size={10} color="#FFFFFF" />
            </View>
            <View style={chatStyles.typingBubble}>
              <View style={chatStyles.typingDots}>
                <View style={[chatStyles.typingDot, { opacity: 0.4 }]} />
                <View style={[chatStyles.typingDot, { opacity: 0.7 }]} />
                <View style={[chatStyles.typingDot, { opacity: 1 }]} />
              </View>
              <Text style={chatStyles.typingText}>typing...</Text>
            </View>
          </View>
        )}

        {/* Quick Reply Chips */}
        {ticket.status !== 'CLOSED' && (
          <View style={chatStyles.quickRepliesWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chatStyles.quickRepliesScroll}>
              {quickReplies.map((qr, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSendText(qr)}
                  style={({ pressed }) => [chatStyles.quickReplyChip, pressed && { backgroundColor: '#DBEAFE' }]}
                >
                  <Ionicons name="flash" size={11} color="#2563EB" />
                  <Text style={chatStyles.quickReplyText}>{qr}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Attachment Banner */}
        {selectedAttachment && (
          <View style={chatStyles.attachBanner}>
            <Ionicons name="document-attach" size={16} color="#2563EB" />
            <Text style={chatStyles.attachBannerText} numberOfLines={1}>
              {selectedAttachment.fileName}
            </Text>
            <Pressable onPress={() => setSelectedAttachment(null)} hitSlop={6}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          </View>
        )}

        {/* Reply Composer */}
        {ticket.status !== 'CLOSED' && (
          <View style={[chatStyles.composerBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <Pressable
              onPress={toggleAttachment}
              style={[
                chatStyles.composerAttachBtn,
                selectedAttachment && { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
              ]}
              hitSlop={6}
            >
              <Ionicons
                name="attach"
                size={20}
                color={selectedAttachment ? '#2563EB' : '#94A3B8'}
              />
            </Pressable>

            <TextInput
              style={chatStyles.composerInput}
              placeholder="Type your message..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={(txt) => {
                setInputText(txt);
                sendTypingStatus?.(txt.length > 0);
              }}
              multiline
              maxLength={1000}
            />

            <Pressable
              onPress={handleSend}
              disabled={sending || (!inputText.trim() && !selectedAttachment)}
              style={({ pressed }) => [
                chatStyles.composerSendBtn,
                (!inputText.trim() && !selectedAttachment || sending) && chatStyles.composerSendBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              hitSlop={6}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ==========================================
// MAIN SCREEN STYLES
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  pressed: {
    opacity: 0.88,
  },

  // ---- Premium Gradient Header ----
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    ...elevation.md,
  },
  headerCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  // ---- Quick Actions ----
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quickActionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ---- Search ----
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    backgroundColor: '#F1F5F9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Inter_400Regular',
  },

  // ---- Filter Tabs ----
  filterContainer: {
    backgroundColor: '#F1F5F9',
    paddingTop: 10,
    paddingBottom: 6,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },

  // ---- Ticket List ----
  listContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 10,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  loaderCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },

  // ---- Empty State ----
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    ...elevation.sm,
  },
  emptyCreateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ---- Ticket Card (Premium) ----
  ticketCardWrapper: {
    // No extra margin — gap handles it
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.sm,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ticketAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInfoCol: {
    flex: 1,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter_700Bold',
    lineHeight: 20,
  },
  ticketNumber: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  ticketTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  ticketBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  ticketMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryTagText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityDotTiny: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateChipText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // ---- Floating Action Button ----
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    borderRadius: 16,
    overflow: 'hidden',
    ...elevation.lg,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },

  // ---- Create Modal ----
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 20,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter_700Bold',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    padding: 20,
    gap: 18,
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    fontFamily: 'Inter_600SemiBold',
  },
  formInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  formTextInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  categoryGridItemActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  categoryGridItemText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryGridItemTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
});

// ==========================================
// CHAT VIEW STYLES
// ==========================================
const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  // ---- Navbar ----
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  navInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  livePulseText: {
    fontSize: 10,
    color: '#34D399',
    fontWeight: '800',
  },
  navSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  navStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  navStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ---- Status Bar ----
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  resolvedBannerText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  closedBannerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  openBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openBannerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resolveBtnText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '700',
  },

  // ---- Messages ----
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  messagesList: {
    padding: 16,
    gap: 8,
  },

  // Ticket Info Card at top of chat
  ticketInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 12,
    ...elevation.sm,
  },
  ticketInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketInfoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Inter_700Bold',
  },
  ticketInfoCategoryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ticketInfoCategoryText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  ticketInfoSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  ticketInfoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  ticketInfoMetaText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Date divider
  dateDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  dateDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dateDividerPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  dateDividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },

  // Messages
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  customerRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  agentRow: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#F0F4F8',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
    marginLeft: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  customerBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
    ...elevation.sm,
  },
  agentBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.sm,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  customerText: {
    color: '#FFFFFF',
  },
  agentText: {
    color: '#1E293B',
  },
  attachmentsWrap: {
    marginTop: 8,
    gap: 4,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  attachmentText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  typingAvatarSmall: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 3,
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563EB',
  },
  typingText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Quick replies
  quickRepliesWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
  },
  quickRepliesScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  quickReplyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickReplyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Attachment banner
  attachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
  },
  attachBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Composer
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  composerAttachBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1E293B',
    maxHeight: 100,
  },
  composerSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.sm,
  },
  composerSendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
