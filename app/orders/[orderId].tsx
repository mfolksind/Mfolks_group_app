import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Button, Card, StatusTag, getOrderStatusVariant, ErrorState, Dialog } from '@/components/ui';
import { getOrderById, cancelOrder } from '@/api/orders.api';
import { Order } from '@/types/backend';
import { colors, radius, spacing, typography } from '@/design-system';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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

  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirm_order: 'Confirmed',
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      payment_received: 'Payment Received',
      dispatched: 'Dispatched',
      SHIPPED: 'Shipped',
      completed: 'Completed',
      DELIVERED: 'Delivered',
      cancelled: 'Cancelled',
      CANCELLED: 'Cancelled',
    };
    return labels[status] || status.toUpperCase();
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
      <AppBar title="Order Details" subtitle={order.orderNo || `Order #${order._id.substring(0, 8)}`} showBack />
      <ScreenContainer scroll padded>
        {/* Status Header */}
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.orderNoLabel}>Order Number</Text>
              <Text style={styles.orderNoValue}>{order.orderNo || order._id}</Text>
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

        {/* Line Items */}
        <Text style={styles.sectionTitle}>Ordered Products ({order.items?.length || 0})</Text>
        {order.items?.map((item, idx) => {
          const variantName = item.variant?.variantName || 'Product Variant';
          const brand = item.variant?.product?.brand;
          const thumbnail = item.variant?.thumbnail || item.variant?.images?.[0]?.url;
          const unitPrice = item.discountPrice || item.price;

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
                  <Text style={styles.itemName}>{variantName}</Text>
                  {brand && <Text style={styles.itemMeta}>Brand: {brand}</Text>}
                  {item.variant?.sku && <Text style={styles.itemMeta}>SKU: {item.variant.sku}</Text>}
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPriceText}>
                      {formatPrice(unitPrice)} × {item.quantity}
                    </Text>
                    <Text style={styles.itemSubtotal}>{formatPrice(item.subtotal)}</Text>
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
            value={formatPrice(order.totalPrice || (order.totalAmount ? order.totalAmount / 1.18 : 0))}
          />
          <InfoRow
            label="Taxes & GST (18%)"
            value={formatPrice(order.taxes || (order.totalAmount ? order.totalAmount - (order.totalAmount / 1.18) : 0))}
          />
          <View style={styles.divider} />
          <InfoRow
            label="Grand Total"
            value={formatPrice(order.totalAmount || order.totalPrice)}
            highlight
          />
        </Card>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Card style={styles.card}>
              <Text style={styles.addressLabel}>{order.deliveryAddress.label}</Text>
              <Text style={styles.addressText}>{order.deliveryAddress.line1}</Text>
              {order.deliveryAddress.line2 ? (
                <Text style={styles.addressText}>{order.deliveryAddress.line2}</Text>
              ) : null}
              <Text style={styles.addressText}>
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
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
    </View>
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
});
