import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Tabs, Card } from '@/components/ui';
import { notifications } from '@/data/mockData';
import { colors, spacing, typography } from '@/design-system';
import { NotificationItem } from '@/types';

const tabFilters = [
  { key: 'all', label: 'All' },
  { key: 'announcement', label: 'Announcements' },
  { key: 'price_alert', label: 'Price Alerts' },
  { key: 'order_update', label: 'Orders' },
  { key: 'approval_update', label: 'Approvals' },
];

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  announcement: 'megaphone-outline',
  price_alert: 'trending-up-outline',
  order_update: 'receipt-outline',
  approval_update: 'checkmark-circle-outline',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const filtered =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  return (
    <View style={styles.container}>
      <AppBar
        title="Notifications"
        showBack
        onBack={() => router.back()}
      />
      <Tabs tabs={tabFilters} activeTab={activeTab} onTabChange={setActiveTab} />
      <ScreenContainer scroll padded>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No notifications in this category</Text>
        ) : (
          filtered.map((notif) => (
            <NotificationCard key={notif.id} notification={notif} />
          ))
        )}
      </ScreenContainer>
    </View>
  );
}

function NotificationCard({ notification }: { notification: NotificationItem }) {
  return (
    <Card style={notification.read ? styles.card : [styles.card, styles.unread]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={typeIcons[notification.type] ?? 'notifications-outline'}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
          <Text style={styles.timestamp}>
            {new Date(notification.timestamp).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  card: { marginBottom: spacing.sm },
  unread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  cardHeader: { flexDirection: 'row', gap: spacing.md },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  title: { ...typography.bodyMedium, marginBottom: spacing.xs },
  message: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  timestamp: { ...typography.caption },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
