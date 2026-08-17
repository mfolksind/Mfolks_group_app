import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/design-system';

export default function PendingApprovalScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false} padded>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={56} color={colors.warning} />
        </View>
        <Text style={styles.title}>Pending Approval</Text>
        <Text style={styles.message}>
          Your registration request has been submitted successfully and is awaiting admin approval.
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.infoText}>Registration form submitted</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="hourglass-outline" size={20} color={colors.warning} />
            <Text style={styles.infoText}>Admin verification in progress</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>You'll be notified once approved</Text>
          </View>
        </View>
        <Text style={styles.note}>
          Only approved users can log in. Our team may contact you to verify your company details.
        </Text>
        <Button
          title="Back to Login"
          onPress={() => router.replace('/(auth)/login')}
          variant="outline"
          fullWidth
          icon="log-in-outline"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.body,
    flex: 1,
  },
  note: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
