import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, Dialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/design-system';
import { useState } from 'react';

const menuItems = [
  { icon: 'person-outline' as const, label: 'Personal Information', route: '/profile/personal-info' },
  { icon: 'business-outline' as const, label: 'Company Information', route: '/profile/company-info' },
  { icon: 'location-outline' as const, label: 'Addresses', route: '/profile/addresses' },
  { icon: 'receipt-outline' as const, label: 'Order History', route: '/profile/order-history' },
  { icon: 'settings-outline' as const, label: 'Settings', route: '/profile/settings' },
  { icon: 'headset-outline' as const, label: 'Support', route: '/profile/support' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    setShowLogout(false);
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <AppBar title="Profile" />
      <ScreenContainer scroll padded>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.company}>{user?.companyName}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.userType?.toUpperCase()}</Text>
          </View>
        </Card>

        <Card style={styles.menuCard} padding={0}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuBorder,
                pressed && styles.menuPressed,
              ]}
              onPress={() => router.push(item.route as never)}
            >
              <Ionicons name={item.icon} size={22} color={colors.primary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </Card>

        <Pressable style={styles.logoutButton} onPress={() => setShowLogout(true)}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScreenContainer>

      <Dialog
        visible={showLogout}
        title="Logout"
        message="Are you sure you want to logout from your account?"
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileCard: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { ...typography.heading1, color: colors.textInverse },
  name: { ...typography.heading2 },
  company: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  badgeText: { ...typography.caption, color: colors.primaryDark, fontFamily: 'Inter_600SemiBold' },
  menuCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 56,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuPressed: { backgroundColor: colors.background },
  menuLabel: { ...typography.body, flex: 1 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  logoutText: { ...typography.bodyMedium, color: colors.error },
});
