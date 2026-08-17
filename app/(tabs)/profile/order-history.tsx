import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, StatusTag, getOrderStatusVariant, EmptyState } from '@/components/ui';
import { orders, formatCurrency, formatWeight, getOrderStatusLabel } from '@/data/mockData';
import { colors, spacing, typography } from '@/design-system';

export default function OrderHistoryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppBar title="Order History" showBack />
      <ScreenContainer scroll padded>
        {orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Orders"
            message="You haven't placed any orders yet."
            actionLabel="Browse Products"
            onAction={() => router.push('/(tabs)/products')}
          />
        ) : (
          orders.map((order) => (
            <Pressable key={order.id} onPress={() => router.push(`/orders/${order.id}`)}>
              <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNo}>{order.orderNo}</Text>
                  <StatusTag
                    label={getOrderStatusLabel(order.status)}
                    variant={getOrderStatusVariant(order.status)}
                  />
                </View>
                <Text style={styles.productName}>{order.productName}</Text>
                <Text style={styles.orderMeta}>
                  {order.familyName} · {order.categoryName}
                </Text>
                <View style={styles.orderDetails}>
                  <Text style={styles.detail}>{order.lotsRequired} lots · {formatWeight(order.totalWeight)}</Text>
                  <Text style={styles.total}>{formatCurrency(order.totalPrice)}</Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 30 },
  orderCard: { marginBottom: spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  orderNo: { ...typography.bodyMedium, fontFamily: 'Inter_700Bold' },
  productName: { ...typography.heading3, marginBottom: spacing.xs },
  orderMeta: { ...typography.caption, marginBottom: spacing.sm },
  orderDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  detail: { ...typography.caption },
  total: { ...typography.bodyMedium, color: colors.primary, fontFamily: 'Inter_700Bold' },
});
