import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Card } from '@/components/ui';
import { bankDetails, formatCurrency } from '@/data/mockData';
import { colors, radius, spacing, typography } from '@/design-system';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderNo, total, orderId, paymentMethod } = useLocalSearchParams<{
    orderNo: string;
    total: string;
    orderId: string;
    paymentMethod?: 'razorpay' | 'offline';
  }>();

  const isOnline = paymentMethod === 'razorpay';

  return (
    <ScreenContainer scroll padded>
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Ionicons
            name={isOnline ? 'shield-checkmark' : 'checkmark-circle'}
            size={72}
            color={colors.success || '#10B981'}
          />
        </View>
        <Text style={styles.title}>{isOnline ? 'Payment Successful!' : 'Order Placed!'}</Text>
        <Text style={styles.message}>
          {isOnline
            ? 'Your payment has been securely processed. We are preparing your manufacturing contract now.'
            : 'Your B2B order has been generated in pending state. Complete the bank transfer below to proceed.'}
        </Text>

        <Card style={styles.orderCard}>
          <Text style={styles.orderLabel}>Order Number</Text>
          <Text style={styles.orderNo}>{orderNo ?? 'MT-2026-0000'}</Text>
          {total && (
            <>
              <Text style={[styles.orderLabel, { marginTop: spacing.md }]}>Order Total</Text>
              <Text style={styles.orderTotal}>{formatCurrency(Number(total))}</Text>
            </>
          )}
        </Card>

        {!isOnline && (
          <>
            <Text style={styles.bankTitle}>Payment — Bank Details</Text>
            <Card style={styles.bankCard}>
              <BankRow label="Account Name" value={bankDetails.accountName} />
              <BankRow label="Bank Name" value={bankDetails.bankName} />
              <BankRow label="Account Number" value={bankDetails.accountNumber} />
              <BankRow label="IFSC Code" value={bankDetails.ifscCode} />
              <BankRow label="Branch" value={bankDetails.branch} />
            </Card>

            <Text style={styles.note}>
              Please transfer the payment to the above account and share the transaction reference with our support team.
            </Text>
          </>
        )}

        <Button
          title="Track Order"
          onPress={() => router.replace(`/orders/${orderId}`)}
          fullWidth
          icon="receipt-outline"
          style={styles.button}
        />
        <Button
          title="Back to Home"
          onPress={() => router.replace('/(tabs)/home')}
          variant="outline"
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankLabel}>{label}</Text>
      <Text style={styles.bankValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.display, fontSize: 28, marginBottom: spacing.sm },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  orderCard: { width: '100%', alignItems: 'center', marginBottom: spacing.lg },
  orderLabel: { ...typography.caption },
  orderNo: { ...typography.heading2, color: colors.primary },
  orderTotal: { ...typography.heading2, color: colors.secondary },
  bankTitle: { ...typography.heading3, alignSelf: 'flex-start', marginBottom: spacing.sm },
  bankCard: { width: '100%', marginBottom: spacing.md },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bankLabel: { ...typography.body, color: colors.textSecondary },
  bankValue: { ...typography.bodyMedium, textAlign: 'right', flex: 1, marginLeft: spacing.md },
  note: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  button: { marginBottom: spacing.sm },
});
