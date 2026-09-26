import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppBar, Card, Button, Dialog } from '@/components/ui';
import { colors, spacing, typography, radius, elevation } from '@/design-system';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

const tabFilters = [
  { key: 'ALL', label: 'All' },
  { key: 'TICKET_REPLY', label: 'Support Tickets' },
  { key: 'ORDER_UPDATE', label: 'Orders' },
  { key: 'ANNOUNCEMENT', label: 'System Alerts' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    refetch,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'TICKET_REPLY') {
      return (
        n.type === 'TICKET_REPLY' ||
        n.type === 'TICKET_CREATED' ||
        n.type === 'TICKET_STATUS_CHANGED' ||
        (n.title && n.title.toLowerCase().includes('ticket'))
      );
    }
    if (activeTab === 'ORDER_UPDATE') {
      return (
        n.type === 'ORDER_UPDATE' ||
        n.type === 'ORDER_PLACED' ||
        n.type === 'PAYMENT_RECEIVED' ||
        (n.title && n.title.toLowerCase().includes('order'))
      );
    }
    return n.type === activeTab;
  });

  const handleNotificationPress = async (item: AppNotification) => {
    const id = item._id || item.id;
    if (id && !item.isRead) {
      await markAsRead(id);
    }

    if (item.data?.ticketId) {
      router.push('/support' as any);
    } else if (item.data?.orderId) {
      router.push(`/orders/${item.data.orderId}` as any);
    }
  };

  const handleDeleteItem = async (id: string) => {
    await deleteNotification(id);
    setSelectedDeleteId(null);
  };

  const handleConfirmClearAll = async () => {
    setShowClearAllDialog(false);
    await clearAllNotifications();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'TICKET_REPLY':
      case 'TICKET_CREATED':
      case 'TICKET_STATUS_CHANGED':
        return { name: 'chatbubble-ellipses-outline' as const, color: colors.primary, bg: '#EEF2FF' };
      case 'ORDER_UPDATE':
      case 'ORDER_PLACED':
      case 'PAYMENT_RECEIVED':
        return { name: 'receipt-outline' as const, color: '#10B981', bg: '#ECFDF5' };
      case 'PRICE_ALERT':
        return { name: 'trending-up-outline' as const, color: '#F59E0B', bg: '#FEF3C7' };
      default:
        return { name: 'sparkles-outline' as const, color: '#8B5CF6', bg: '#F5F3FF' };
    }
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
        showBack
        showNotification={false}
        rightAction={
          notifications.length > 0 ? (
            <View style={styles.headerRightActions}>
              {unreadCount > 0 && (
                <Pressable onPress={markAllRead} style={styles.markAllBtn} hitSlop={8}>
                  <Ionicons name="checkmark-done" size={14} color={colors.primary} />
                  <Text style={styles.markAllText}>Mark read</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => setShowClearAllDialog(true)}
                style={styles.clearAllBtn}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error || '#DC2626'} />
              </Pressable>
            </View>
          ) : undefined
        }
      />

      {/* Humanized Executive AI Summary Banner */}
      <View style={styles.aiSummaryHeader}>
        <View style={styles.aiBadgeRow}>
          <View style={styles.aiPulseDot} />
          <Ionicons name="sparkles" size={13} color="#7C3AED" />
          <Text style={styles.aiBadgeTitle}>AI Executive Summary</Text>
        </View>
        <Text style={styles.aiSummaryText}>
          {unreadCount > 0
            ? `You have ${unreadCount} new update${unreadCount > 1 ? 's' : ''} requiring your attention.`
            : 'Your stream is up to date. Real-time background sync is active.'}
        </Text>
      </View>

      {/* Segmented Filter Bar */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabFilters}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item }) => {
            const isSelected = activeTab === item.key;
            return (
              <Pressable
                onPress={() => setActiveTab(item.key)}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Syncing notifications with server...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => {
            const notifId = item._id || item.id || '';
            const icon = getIconForType(item.type);
            const timeAgo = formatRelativeTime(item.createdAt);

            return (
              <View style={styles.itemWrapper}>
                <Pressable
                  onPress={() => handleNotificationPress(item)}
                  style={({ pressed }) => [styles.itemPressable, pressed && styles.pressed]}
                >
                  <Card style={[styles.card, !item.isRead && styles.unreadCard]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                        <Ionicons name={icon.name} size={18} color={icon.color} />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.timeAgoText}>{timeAgo}</Text>
                        </View>

                        <Text style={styles.message} numberOfLines={2}>
                          {item.message}
                        </Text>

                        {/* LinkedIn-style Action bar */}
                        <View style={styles.footerRow}>
                          <View style={styles.leftChipsRow}>
                            {!item.isRead && <View style={styles.unreadTag}><Text style={styles.unreadTagText}>NEW</Text></View>}
                            {(item.data?.ticketId || item.data?.orderId) && (
                              <View style={styles.deepLinkBadge}>
                                <Text style={styles.deepLinkText}>
                                  {item.data?.ticketId ? 'View Ticket →' : 'View Order →'}
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.actionsRightRow}>
                            {!item.isRead && (
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  if (notifId) markAsRead(notifId);
                                }}
                                style={styles.actionChip}
                                hitSlop={8}
                              >
                                <Ionicons name="checkmark" size={13} color={colors.primary} />
                              </Pressable>
                            )}
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                if (notifId) setSelectedDeleteId(notifId);
                              }}
                              style={styles.deleteChip}
                              hitSlop={8}
                            >
                              <Ionicons name="trash-outline" size={14} color="#94A3B8" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={42} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'ALL'
                  ? "You don't have any notifications right now."
                  : `No notifications found under "${tabFilters.find((t) => t.key === activeTab)?.label}".`}
              </Text>
            </View>
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={!!selectedDeleteId}
        title="Delete Notification"
        message="Are you sure you want to remove this notification from your updates?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => selectedDeleteId && handleDeleteItem(selectedDeleteId)}
        onCancel={() => setSelectedDeleteId(null)}
      />

      {/* Clear All Dialog */}
      <Dialog
        visible={showClearAllDialog}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearAllDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pressed: {
    opacity: 0.92,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  clearAllBtn: {
    padding: 4,
  },
  aiSummaryHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  aiBadgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.3,
    fontFamily: 'Inter_700Bold',
  },
  aiSummaryText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemWrapper: {
    marginBottom: spacing.xs,
  },
  itemPressable: {
    width: '100%',
  },
  card: {
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.sm,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: `${colors.primary}60`,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  unreadTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeAgoText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  message: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  leftChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  unreadTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deepLinkBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EEF2FF',
  },
  deepLinkText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
  actionsRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionChip: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  deleteChip: {
    padding: 4,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
