import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, Dialog, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography, elevation } from '@/design-system';
import { useState, useEffect, useCallback } from 'react';
import { getFamilies, FamilyItem } from '@/api/families.api';

const menuItems = [
  { icon: 'person-outline' as const, label: 'Personal Information', route: '/profile/personal-info' },
  { icon: 'business-outline' as const, label: 'Company Information', route: '/profile/company-info' },
  { icon: 'location-outline' as const, label: 'Addresses', route: '/profile/addresses' },
  { icon: 'receipt-outline' as const, label: 'Order History', route: '/profile/order-history' },
  // { icon: 'settings-outline' as const, label: 'Settings', route: '/profile/settings' },
  { icon: 'headset-outline' as const, label: 'Support', route: '/profile/support' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, switchActiveFamily, checkApprovalStatus } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const fetchFamilyData = useCallback(async () => {
    setLoadingFamilies(true);
    try {
      const res = await getFamilies();
      if (res.success && res.data) {
        setFamilies(res.data);
      }
    } catch (err) {
      console.error('Error fetching families:', err);
    } finally {
      setLoadingFamilies(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);

  const handleLogout = () => {
    setShowLogout(false);
    logout();
    router.replace('/(auth)/login');
  };

  const handleSwitchFamily = async (familyId: string, familyName: string) => {
    setSwitching(familyId);
    setActionMessage(null);
    try {
      const res = await switchActiveFamily(familyId);
      if (res.success) {
        if (res.isPending) {
          setActionMessage(`Request submitted for ${familyName}. Status: Pending Admin Review.`);
          router.push('/(auth)/waiting-approval');
        } else {
          setActionMessage(`Switched active industry family to ${familyName}.`);
        }
      } else {
        setActionMessage(res.message || 'Failed to switch family.');
      }
    } catch (err) {
      console.error('Error switching family:', err);
      setActionMessage('Failed to switch family.');
    } finally {
      setSwitching(null);
    }
  };

  const rawFamily = user?.family || user?.industryType;
  const activeFamilyObj = typeof rawFamily === 'object' && rawFamily !== null ? (rawFamily as any) : null;
  const activeFamilyId = activeFamilyObj?._id || (typeof rawFamily === 'string' ? rawFamily : '');

  // Look up in families list fetched from API
  const matchedFamilyFromList = families.find(
    (f) => String(f._id) === String(activeFamilyId) || String(f.slug) === String(activeFamilyId)
  );

  const activeFamilyName =
    activeFamilyObj?.name ||
    matchedFamilyFromList?.name ||
    activeFamilyObj?.familyName ||
    matchedFamilyFromList?.slug ||
    activeFamilyObj?.slug ||
    'Standard Family';

  const approvedList: any[] = Array.isArray(user?.approvedFamilies) ? user!.approvedFamilies! : [];
  const approvedIds = approvedList.map((f) => (typeof f === 'object' ? f._id : f));

  return (
    <View style={styles.container}>
      <AppBar title="Profile" showCart showSupport showNotification />
      <ScreenContainer scroll padded>
        {/* User Details Header Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] || user?.name?.[0] || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Valued User'}</Text>
          <Text style={styles.company}>{user?.companyName || user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{(user?.role || 'CUSTOMER').toUpperCase()}</Text>
          </View>
        </Card>

        {/* Industry Family Info */}
        <Card style={styles.familySectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={20} color={colors.primary} />
            <Text style={styles.sectionTitleText}>My Industry</Text>
          </View>

          {/* Active Family Card */}
          <View style={styles.activeFamilyBox}>

            <View style={styles.activeRow}>
              <Text style={styles.activeFamilyTitle}>{activeFamilyName}</Text>
              <View style={styles.approvedTag}>
                <Ionicons name="checkmark-circle" size={14} color="#047857" />
                <Text style={styles.approvedTagText}>Active</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Profile Menu Items */}
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

        {/* Legal & Policies (Google Play compliance) */}
        <Card style={[styles.menuCard, { marginTop: spacing.md }]} padding={0}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, styles.menuBorder, pressed && styles.menuPressed]}
            onPress={() => Linking.openURL('https://mfolks.com/app-privacy-policy/')}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            <Text style={styles.menuLabel}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
            onPress={() => Linking.openURL('https://mfolks.com/app-terms-and-conditions/')}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            <Text style={styles.menuLabel}>Terms & Conditions</Text>
            <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
          </Pressable>
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
  profileCard: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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

  /* Family Approvals Section */
  familySectionCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  toastBox: {
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  toastText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  activeFamilyBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: spacing.md,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeFamilyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: 'Inter_700Bold',
  },
  approvedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  approvedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  familiesList: {
    gap: 8,
  },
  familyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  familyItemActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  famName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  famDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  currentActiveBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentActiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  btnPressed: {
    opacity: 0.8,
  },

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
