import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, StatusTag, getOrderStatusVariant, getOrderStatusLabel, EmptyState, ErrorState } from '@/components/ui';
import { getUserOrders } from '@/api/orders.api';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types/backend';
import { colors, spacing, typography } from '@/design-system';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getUserOrders({ page: 1, limit: 50 });

      if (response.success && response.data) {
        const ordersList = Array.isArray(response.data) ? response.data : response.data.data || [];
        setOrders(ordersList);
      } else {
        setError(response.message || 'Failed to load order history');
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError('Failed to load order history');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '₹0';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <AppBar title="Order History" showBack />
        <ScreenContainer padded>
          <EmptyState
            icon="receipt-outline"
            title="Not Logged In"
            message="Please login to view your order history."
            actionLabel="Login"
            onAction={() => router.push('/(auth)/login')}
          />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Order History" showBack />
      <ScreenContainer
        scroll
        padded
        refreshing={refreshing}
        onRefresh={() => fetchOrders(true)}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading order history...</Text>
          </View>
        ) : error ? (
          <ErrorState
            title="Failed to Load Orders"
            message={error}
            onRetry={() => fetchOrders(false)}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Orders Yet"
            message="You haven't placed any orders yet. Browse our catalog to place an order."
            actionLabel="Browse Products"
            onAction={() => router.push('/(tabs)/products')}
          />
        ) : (
          orders.map((order) => {
            const orderId = order._id;
            const orderNum = order.orderNumber || order.orderNo || `Order #${orderId ? orderId.substring(0, 8) : ''}`;
            const itemCount = order.items?.length || 1;
            const primaryItemName =
              order.items && order.items.length > 0
                ? order.items[0].productName || order.items[0].variantName || order.items[0].variant?.variantName || 'Product'
                : `Order #${orderId ? orderId.substring(0, 8) : ''}`;

            return (
              <Pressable
                key={orderId}
                onPress={() => router.push(`/orders/${orderId}`)}
              >
                <Card style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNo}>{orderNum}</Text>
                    <StatusTag
                      label={getOrderStatusLabel(order.status)}
                      variant={getOrderStatusVariant(order.status)}
                    />
                  </View>

                  <Text style={styles.productName}>{primaryItemName}</Text>
                  {order.items && order.items.length > 1 && (
                    <Text style={styles.orderMeta}>
                      + {order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}
                    </Text>
                  )}

                  <View style={styles.orderDetails}>
                    <View style={styles.detail}>
                      <Text style={styles.detailLabel}>Items</Text>
                      <Text style={styles.detailValue}>{itemCount}</Text>
                    </View>
                    <View style={styles.detail}>
                      <Text style={styles.detailLabel}>Total Amount</Text>
                      <Text style={styles.totalValue}>
                        {formatPrice(order.totalAmount || order.totalPrice || order.subtotal || 0)}
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
                      : 'Recently Placed'}
                  </Text>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  orderCard: {
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNo: {
    ...typography.bodyMedium,
    fontFamily: 'Inter_700Bold',
  },
  productName: {
    ...typography.heading3,
    marginBottom: spacing.xs,
  },
  orderMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  detail: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
  totalValue: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  orderDate: {
    ...typography.caption,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
});
