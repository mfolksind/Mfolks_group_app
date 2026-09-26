import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Card } from '@/components/ui';
import { colors, layout, radius, spacing, typography, elevation } from '@/design-system';

export default function WaitingApprovalScreen() {
  const router = useRouter();
  const { user, checkApprovalStatus, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const onBackPress = () => {
      // Prevent closing app ungracefully while pending approval
      if (!isApproved) {
        handleCheckStatus();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isApproved]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const u = await checkApprovalStatus();
      if (u) {
        const approved = u.status === 'active' || u.familyApprovalStatus === 'approved';
        if (approved) {
          setIsApproved(true);
          setStatusMessage('🎉 Congratulations! Your account has been approved.');
        } else {
          setIsApproved(false);
          setStatusMessage('Status: Pending. Your account is still under admin review.');
        }
      } else {
        setStatusMessage('Status check completed.');
      }
    } catch (err) {
      console.error('Error checking approval status:', err);
      setStatusMessage('Unable to check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (user) {
      const approved = user.status === 'active' || user.familyApprovalStatus === 'approved';
      if (approved) {
        setIsApproved(true);
        const timer = setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const activeFamilyName = typeof user?.family === 'object' ? (user.family as any)?.name : 'Selected Family';

  return (
    <ScreenContainer scroll padded>
      <View style={styles.container}>
        {/* Header Branding */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Mfolks_main - Copy.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {isApproved ? (
          /* CONGRATULATIONS APPROVED CARD */
          <Card style={styles.approvedCard}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="checkmark-circle" size={56} color="#047857" />
            </View>

            <Text style={styles.congratsTitle}>Congratulations! 🎉</Text>
            <Text style={styles.approvedSubtitle}>
              Your account has been officially approved by the Admin. You now have full access to MFolks Marketplace.
            </Text>

            <View style={styles.familyPillGreen}>
              <Ionicons name="shield-checkmark" size={14} color="#047857" />
              <Text style={styles.familyPillGreenText}>Approved for {activeFamilyName}</Text>
            </View>

            <Button
              title="Proceed to Marketplace"
              onPress={() => router.replace('/(tabs)/home')}
              fullWidth
              icon="arrow-forward-outline"
              style={styles.actionBtn}
            />
          </Card>
        ) : (
          /* PENDING APPROVAL WAITING CARD */
          <Card style={styles.pendingCard}>
            <View style={styles.iconCircleAmber}>
              <Ionicons name="time-outline" size={52} color="#D97706" />
            </View>

            <Text style={styles.pendingTitle}>Account Under Review</Text>
            <Text style={styles.pendingSubtitle}>
              Your account registration is under admin review. Please wait while an administrator approves your access.
            </Text>

            <View style={styles.familyPillAmber}>
              <Ionicons name="business-outline" size={14} color="#B45309" />
              <Text style={styles.familyPillAmberText}>Requested Family: {activeFamilyName}</Text>
            </View>

            {statusMessage && (
              <View style={styles.statusToast}>
                <Text style={styles.statusToastText}>{statusMessage}</Text>
              </View>
            )}

            <Button
              title="Refresh / Check Approval Status"
              onPress={handleCheckStatus}
              loading={checking}
              fullWidth
              icon="refresh-outline"
              style={styles.actionBtn}
            />

            <Button
              title="Sign In with Different Account"
              variant="outline"
              onPress={handleLogout}
              loading={loggingOut}
              fullWidth
              icon="log-out-outline"
              style={styles.switchAccountBtn}
            />
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 180,
    height: 50,
    marginBottom: spacing.xl,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  pendingCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 18,
    ...elevation.md,
  },
  approvedCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    ...elevation.md,
  },
  iconCircleAmber: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconCircleGreen: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pendingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#047857',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  pendingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  approvedSubtitle: {
    fontSize: 14,
    color: '#15803D',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  familyPillAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  familyPillAmberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  familyPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  familyPillGreenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  statusToast: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: spacing.md,
    width: '100%',
  },
  statusToastText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
  switchAccountBtn: {
    marginTop: spacing.md,
  },
  logoutLink: {
    marginTop: spacing.lg,
    padding: spacing.xs,
  },
  logoutText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
