import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Pressable, Alert, Modal, Clipboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Button, Card, StatusTag, getOrderStatusVariant, getOrderStatusLabel, ErrorState, Dialog } from '@/components/ui';
import { getOrderById, cancelOrder } from '@/api/orders.api';
import { Order } from '@/types/backend';
import { colors, radius, spacing, typography } from '@/design-system';
import { bankDetails } from '@/data/mockData';
import { Ionicons } from '@expo/vector-icons';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export default function OrderDetailScreen() {
  const router = useRouter();
  useHardwareBack('/(tabs)/orders');
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [copingText, setCopingText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    setCopingText(label);
    setTimeout(() => setCopingText(null), 2000);
  };

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setError('Order ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getOrderById(orderId);

      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError(response.message || 'Failed to load order details');
        setOrder(null);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!orderId) return;

    try {
      setShowCancelDialog(false);
      setCancelling(true);

      const response = await cancelOrder(orderId, 'Cancelled by user');

      if (response.success) {
        Alert.alert('Success', 'Order cancelled successfully');
        fetchOrderDetails();
      } else {
        Alert.alert('Error', response.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      Alert.alert('Error', 'An unexpected error occurred while cancelling order');
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '₹0';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Order Details" showBack />
        <ScreenContainer padded>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <AppBar title="Order Details" showBack />
        <ScreenContainer padded>
          <ErrorState
            title="Failed to Load Order"
            message={error || 'Order details not found.'}
            onRetry={fetchOrderDetails}
          />
        </ScreenContainer>
      </View>
    );
  }

  const statusStr = (order.status as string).toLowerCase();
  const isCancelable = statusStr === 'pending' || statusStr === 'confirm_order';

  return (
    <View style={styles.container}>
      <AppBar title="Order Details" subtitle={order.orderNumber || order.orderNo || `Order #${order._id.substring(0, 8)}`} showBack />
      <ScreenContainer scroll padded>
        {/* Status Header */}
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.orderNoLabel}>Order Number</Text>
              <Text style={styles.orderNoValue}>{order.orderNumber || order.orderNo || order._id}</Text>
            </View>
            <StatusTag
              label={getOrderStatusLabel(order.status)}
              variant={getOrderStatusVariant(order.status)}
            />
          </View>
          <Text style={styles.orderDate}>
            Placed on:{' '}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              : 'N/A'}
          </Text>
        </Card>

        {/* Order Tracking Timeline matching Image 1 */}
        <Text style={styles.sectionTitle}>Track Order Status</Text>
        <OrderTrackingTimeline order={order} />

        {/* Payment Pending Bank details link */}
        {order.paymentStatus !== 'PAID' && statusStr !== 'cancelled' && (
          <Card style={[styles.card, { borderColor: colors.primary, borderWidth: 1.5 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Ionicons name="alert-circle" size={20} color={colors.primary} />
              <Text style={{ ...typography.bodyMedium, color: colors.primary, fontFamily: 'Inter_700Bold' }}>
                Payment Pending
              </Text>
            </View>
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm, fontSize: 13, lineHeight: 18 }}>
              Please transfer the grand total amount to our corporate account to complete your payment.
            </Text>
            <Button
              title="View Bank Details"
              onPress={() => setShowBankModal(true)}
              variant="outline"
              size="sm"
              icon="business-outline"
            />
          </Card>
        )}

        {/* Line Items */}
        <Text style={styles.sectionTitle}>Ordered Products ({order.items?.length || 0})</Text>
        {order.items?.map((item, idx) => {
          const productName = item.productName || 'Product';
          const variantName = item.variantName || 'Variant';
          const displayName = productName === variantName ? productName : `${productName} - ${variantName}`;
          const thumbnail = item.variant?.images?.[0]?.url || item.product?.thumbnail;
          const unitPrice = item.unitPrice || item.discountPrice || item.price || 0;
          const subtotal = item.subtotal || (unitPrice * item.quantity);

          return (
            <Card key={idx} style={styles.itemCard}>
              <View style={styles.itemRow}>
                {thumbnail ? (
                  <Image source={{ uri: thumbnail }} style={styles.itemImage} resizeMode="cover" />
                ) : (
                  <View style={styles.itemPlaceholder}>
                    <Text style={{ fontSize: 24 }}>📦</Text>
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{displayName}</Text>
                  {item.variant?.sku && <Text style={styles.itemMeta}>SKU: {item.variant.sku}</Text>}
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPriceText}>
                      {formatPrice(unitPrice)} × {item.quantity}
                    </Text>
                    <Text style={styles.itemSubtotal}>{formatPrice(subtotal)}</Text>
                  </View>
                </View>
              </View>
            </Card>
          );
        })}

        {/* Price Breakdown */}
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <Card style={styles.card}>
          <InfoRow
            label="Subtotal"
            value={formatPrice(order.subtotal || order.totalPrice || 0)}
          />
          {order.shippingCharge ? (
            <InfoRow
              label="Shipping Charge"
              value={formatPrice(order.shippingCharge)}
            />
          ) : null}
          {order.discount ? (
            <InfoRow
              label="Discount"
              value={`-${formatPrice(order.discount)}`}
            />
          ) : null}
          <InfoRow
            label="Taxes & GST (18%)"
            value={formatPrice(order.tax || order.taxes || 0)}
          />
          <View style={styles.divider} />
          <InfoRow
            label="Grand Total"
            value={formatPrice(order.totalAmount || order.totalPrice || 0)}
            highlight
          />
        </Card>

        {/* Delivery Address */}
        {order.address && (
          <>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Card style={styles.card}>
              <Text style={styles.addressLabel}>
                {order.address.label || order.address.addressType || 'Shipping Address'}
              </Text>
              <Text style={styles.addressText}>
                {order.address.fullName} - {order.address.phone}
              </Text>
              <Text style={styles.addressText}>
                {order.address.line1 || order.address.addressLine1}
              </Text>
              {(order.address.line2 || order.address.addressLine2) ? (
                <Text style={styles.addressText}>
                  {order.address.line2 || order.address.addressLine2}
                </Text>
              ) : null}
              {order.address.landmark ? (
                <Text style={styles.addressText}>
                  Landmark: {order.address.landmark}
                </Text>
              ) : null}
              <Text style={styles.addressText}>
                {order.address.city}, {order.address.state} - {order.address.pincode || order.address.postalCode}
              </Text>
            </Card>
          </>
        )}

        {/* Cancel Order Action */}
        {isCancelable && (
          <View style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
            <Button
              title={cancelling ? 'Cancelling...' : 'Cancel Order'}
              variant="outline"
              onPress={() => setShowCancelDialog(true)}
              disabled={cancelling}
              style={{ borderColor: colors.error || '#DC2626' }}
            />
          </View>
        )}
      </ScreenContainer>

      <Dialog
        visible={showCancelDialog}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Order"
        onConfirm={handleCancelOrder}
        onCancel={() => setShowCancelDialog(false)}
      />

      {/* Bank Details Modal */}
      <Modal
        visible={showBankModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Corporate Bank Details</Text>
              <Pressable onPress={() => setShowBankModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSub}>
                Transfer your order total of {formatPrice(order.totalAmount || order.totalPrice || 0)} to complete your transaction.
              </Text>

              <Card style={styles.bankCardBox}>
                <BankDetailRow
                  label="Account Name"
                  value={bankDetails.accountName}
                  onCopy={() => copyToClipboard(bankDetails.accountName, 'Account Name')}
                />
                <BankDetailRow
                  label="Bank Name"
                  value={bankDetails.bankName}
                  onCopy={() => copyToClipboard(bankDetails.bankName, 'Bank Name')}
                />
                <BankDetailRow
                  label="Account Number"
                  value={bankDetails.accountNumber}
                  onCopy={() => copyToClipboard(bankDetails.accountNumber, 'Account Number')}
                />
                <BankDetailRow
                  label="IFSC Code"
                  value={bankDetails.ifscCode}
                  onCopy={() => copyToClipboard(bankDetails.ifscCode, 'IFSC Code')}
                />
                <BankDetailRow
                  label="Branch"
                  value={bankDetails.branch}
                  onCopy={() => copyToClipboard(bankDetails.branch, 'Branch')}
                />
              </Card>

              {copingText && (
                <View style={styles.toastBox}>
                  <Text style={styles.toastText}>{copingText} copied to Clipboard!</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                onPress={() => setShowBankModal(false)}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface BankDetailRowProps {
  label: string;
  value: string;
  onCopy: () => void;
}

function BankDetailRow({ label, value, onCopy }: BankDetailRowProps) {
  return (
    <View style={styles.bankDetailRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bankDetailLabel}>{label}</Text>
        <Text style={styles.bankDetailValue}>{value}</Text>
      </View>
      <Pressable onPress={onCopy} style={styles.copyBtn} hitSlop={8}>
        <Ionicons name="copy-outline" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function formatBackendDate(dateInput?: string | Date, offsetMinutes: number = 0): string {
  if (!dateInput) return 'Pending';
  const d = new Date(new Date(dateInput).getTime() + offsetMinutes * 60000);
  if (isNaN(d.getTime())) return 'Pending';

  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hoursStr}:${minutes}${ampm}`;
}

function OrderTrackingTimeline({ order }: { order: Order }) {
  const statusLower = (order.status || '').toLowerCase().trim();
  const history = order.statusHistory || order.trackingHistory || [];

  // Find exact history entry timestamp from backend if present
  const findHistoryTime = (statusKeywords: string[]): string | undefined => {
    const item = history.find((h) => {
      const s = (h.status || h.title || '').toLowerCase();
      return statusKeywords.some((kw) => s.includes(kw));
    });
    return item?.timestamp || item?.createdAt || item?.date || item?.updatedAt;
  };

  const isCancelled = statusLower === 'cancelled' || statusLower === 'canceled' || statusLower === 'failed' || statusLower === 'rejected';

  let activeStepIndex = 0;
  if (isCancelled) {
    activeStepIndex = 4;
  } else if (statusLower === 'delivered' || statusLower === 'completed') {
    activeStepIndex = 4;
  } else if (statusLower === 'shipped' || statusLower === 'dispatched' || statusLower === 'in_transit' || statusLower === 'out_for_delivery') {
    activeStepIndex = 3;
  } else if (statusLower === 'processing' || statusLower === 'in_production') {
    activeStepIndex = 2;
  } else if (statusLower === 'confirmed' || statusLower === 'confirm_order' || statusLower === 'paid' || statusLower === 'payment_received') {
    activeStepIndex = 1;
  } else {
    activeStepIndex = 0;
  }

  const baseCreatedDate = order.createdAt ? new Date(order.createdAt) : new Date();

  // 1. Order Placed
  const placedTime = findHistoryTime(['placed', 'pending', 'created']) || order.createdAt;
  const placedTimeStr = formatBackendDate(placedTime);

  // 2. Order Confirmed
  const confirmedTime = findHistoryTime(['confirmed', 'confirm_order', 'paid', 'payment_received']) || order.updatedAt;
  const confirmedTimeStr = confirmedTime && activeStepIndex >= 1
    ? formatBackendDate(confirmedTime)
    : formatBackendDate(baseCreatedDate, 15);

  // 3. Processing
  const processingTime = findHistoryTime(['processing', 'production']) || order.updatedAt;
  const processingTimeStr = processingTime && activeStepIndex >= 2
    ? formatBackendDate(processingTime)
    : formatBackendDate(baseCreatedDate, 120);

  // 4. Shipped
  const shippedTime = order.dispatchedAt || findHistoryTime(['shipped', 'dispatched', 'transit']) || order.updatedAt;
  const shippedTimeStr = shippedTime && activeStepIndex >= 3
    ? formatBackendDate(shippedTime)
    : formatBackendDate(baseCreatedDate, 1440);

  // 5. Delivered / Cancelled
  const deliveredTime = order.deliveredAt || order.estimatedDeliveryDate || findHistoryTime(['delivered', 'completed']) || order.updatedAt;
  const deliveredTimeStr = deliveredTime && activeStepIndex >= 4
    ? formatBackendDate(deliveredTime)
    : formatBackendDate(baseCreatedDate, 2880);

  const cancelledTime = findHistoryTime(['cancelled', 'canceled', 'failed', 'rejected']) || order.updatedAt;
  const cancelledTimeStr = formatBackendDate(cancelledTime || order.updatedAt);

  const STEPS = isCancelled
    ? [
        { title: 'Order Placed', time: placedTimeStr },
        { title: 'Order Confirmed', time: confirmedTimeStr },
        { title: 'Processing', time: processingTimeStr },
        { title: 'Shipped', time: shippedTimeStr },
        { title: 'Cancelled', time: cancelledTimeStr },
      ]
    : [
        { title: 'Order Placed', time: placedTimeStr },
        { title: 'Order Confirmed', time: confirmedTimeStr },
        { title: 'Processing', time: processingTimeStr },
        { title: 'Shipped', time: shippedTimeStr },
        { title: 'Delivered', time: activeStepIndex === 4 ? deliveredTimeStr : `Est: ${deliveredTimeStr}` },
      ];

  return (
    <Card style={styles.timelineCard}>
      {STEPS.map((step, idx) => {
        const isCompleted = idx < activeStepIndex;
        const isActive = idx === activeStepIndex;
        const isFuture = idx > activeStepIndex;

        const isLast = idx === STEPS.length - 1;

        return (
          <View key={idx} style={styles.timelineRow}>
            {/* Box Package Icon container on Left */}
            <View style={styles.boxIconSquare}>
              <Ionicons
                name="cube-outline"
                size={16}
                color={isFuture ? '#CBD5E1' : '#10B981'}
              />
            </View>

            {/* Vertical Line & Status Dot */}
            <View style={styles.lineCol}>
              <View
                style={[
                  styles.lineTop,
                  { backgroundColor: idx <= activeStepIndex ? '#10B981' : '#E2E8F0' },
                  idx === 0 && { backgroundColor: 'transparent' },
                ]}
              />

              {isActive ? (
                <View style={styles.activeOuterDot}>
                  <View style={styles.activeInnerDot} />
                </View>
              ) : (
                <View
                  style={[
                    styles.normalDot,
                    { backgroundColor: isCompleted ? '#10B981' : '#CBD5E1' },
                  ]}
                />
              )}

              <View
                style={[
                  styles.lineBottom,
                  { backgroundColor: idx < activeStepIndex ? '#10B981' : '#E2E8F0' },
                  isLast && { backgroundColor: 'transparent' },
                ]}
              />
            </View>

            {/* Step Label & Timestamp */}
            <View style={styles.stepContentCol}>
              <Text
                style={[
                  styles.stepTitle,
                  isActive && styles.stepTitleActive,
                  isFuture && styles.stepTitleFuture,
                ]}
              >
                {step.title}
              </Text>
              <Text style={[styles.stepTime, isFuture && styles.stepTimeFuture]}>
                {step.time}
              </Text>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.highlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  card: { marginBottom: spacing.md },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderNoLabel: { ...typography.caption, color: colors.textSecondary },
  orderNoValue: { ...typography.heading3, fontFamily: 'Inter_700Bold' },
  orderDate: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitle: { ...typography.heading2, marginTop: spacing.sm, marginBottom: spacing.sm },
  itemCard: { marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemImage: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  itemPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, marginLeft: spacing.md },
  itemName: { ...typography.bodyMedium, fontFamily: 'Inter_600SemiBold' },
  itemMeta: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  itemPriceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  itemPriceText: { ...typography.caption },
  itemSubtotal: { ...typography.bodyMedium, color: colors.primary, fontFamily: 'Inter_700Bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.bodyMedium },
  highlight: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 16 },
  divider: { height: 1, backgroundColor: colors.divider || '#E5E7EB', marginVertical: spacing.xs },
  addressLabel: { ...typography.bodyMedium, marginBottom: spacing.xs },
  addressText: { ...typography.body, color: colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    minHeight: 460,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider || '#E5E7EB',
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.heading3,
    fontFamily: 'Inter_700Bold',
  },
  modalSub: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  bankCardBox: {
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider || '#E5E7EB',
  },
  bankDetailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bankDetailValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  copyBtn: {
    padding: spacing.xs,
  },
  toastBox: {
    backgroundColor: colors.successLight || '#D1FAE5',
    padding: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  toastText: {
    ...typography.bodyMedium,
    color: colors.success || '#047857',
    fontSize: 13,
  },
  modalBody: {
    paddingVertical: spacing.xs,
  },
  modalFooter: {
    marginTop: 'auto',
    paddingTop: spacing.sm,
  },
  // Order Tracking Timeline Styles (Matching Image 1)
  timelineCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  boxIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lineCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginRight: 10,
  },
  lineTop: {
    width: 2.5,
    flex: 1,
  },
  lineBottom: {
    width: 2.5,
    flex: 1,
  },
  normalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginVertical: 2,
  },
  activeOuterDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  activeInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  stepContentCol: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  stepTitleActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  stepTitleFuture: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  stepTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stepTimeFuture: {
    color: '#CBD5E1',
  },
});
