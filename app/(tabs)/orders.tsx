import { useEffect, useState } from 'react';
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, StatusTag, getOrderStatusVariant, getOrderStatusLabel, EmptyState, ErrorState } from '@/components/ui';
import { getUserOrders } from '@/api/orders.api';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types/backend';
import { colors, spacing, typography } from '@/design-system';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getUserOrders({ page: 1, limit: 50 });

      if (response.success && response.data) {
        // Handle both array and paginated response formats
        const ordersList = Array.isArray(response.data) ? response.data : response.data.data || [];
        setOrders(ordersList);
      } else {
        setError(response.message || 'Failed to load orders');
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [user]),
  );

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <AppBar title="Orders" subtitle="Order History" showCart />
        <ScreenContainer padded>
          <EmptyState
            icon="receipt-outline"
            title="Not Logged In"
            message="Please login to view your orders."
            actionLabel="Login"
            onAction={() => router.push('/login')}
          />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Orders" subtitle="Order History" showCart showSupport showNotification />
      <ScreenContainer scroll padded>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        ) : error ? (
          <ErrorState
            title="Failed to Load Orders"
            message={error}
            onRetry={fetchOrders}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Orders Yet"
            message="Your order history will appear here once you place your first order."
            actionLabel="Browse Products"
            onAction={() => router.push('/(tabs)/products')}
          />
        ) : (
          orders.map((order) => (
            <Pressable
              key={order._id}
              onPress={() => router.push(`/orders/${order._id}`)}
            >
              <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNo}>{order.orderNumber || order.orderNo || `Order #${order._id.substring(0, 8)}`}</Text>
                  <StatusTag
                    label={getOrderStatusLabel(order.status)}
                    variant={getOrderStatusVariant(order.status)}
                  />
                </View>

                {/* Show first item's product info */}
                {order.items && order.items.length > 0 ? (
                  <>
                    <Text style={styles.productName}>
                      {order.items[0].productName || order.items[0].variant?.variantName || 'Product'}
                    </Text>
                    {order.items.length > 1 && (
                      <Text style={styles.orderMeta}>
                        + {order.items.length - 1} more items
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.productName}>Order #{order.orderNumber || order.orderNo || order._id.substring(0, 8)}</Text>
                )}

                <View style={styles.orderDetails}>
                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>Items</Text>
                    <Text style={styles.detailValue}>{order.items?.length || 1}</Text>
                  </View>
                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      {formatPrice(order.totalAmount || order.subtotal || 0)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.orderDate}>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScreenContainer>
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
  orderCard: { marginBottom: spacing.md },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNo: { ...typography.bodyMedium, fontFamily: 'Inter_700Bold' },
  productName: { ...typography.heading3, marginBottom: spacing.xs },
  orderMeta: { ...typography.caption, marginBottom: spacing.md },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  detail: { alignItems: 'flex-start' },
  detailLabel: { ...typography.caption, fontSize: 10 },
  detailValue: { ...typography.bodyMedium, fontSize: 13 },
  totalValue: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  orderDate: { ...typography.caption, marginTop: spacing.sm },
});
