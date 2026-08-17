import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, StatusTag, getOrderStatusVariant } from '@/components/ui';
import { orders, formatCurrency, formatWeight, getOrderStatusLabel } from '@/data/mockData';
import { colors, spacing, typography } from '@/design-system';

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <View style={styles.container}>
        <AppBar title="Order Details" showBack />
        <Text style={styles.notFound}>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Order Details" subtitle={order.orderNo} showBack />
      <ScreenContainer scroll padded>
        <View style={styles.statusRow}>
          <StatusTag
            label={getOrderStatusLabel(order.status)}
            variant={getOrderStatusVariant(order.status)}
          />
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <InfoRow label="Product" value={order.productName} />
          <InfoRow label="Buying Type" value={order.buyingType === 'domestic' ? 'Domestic' : 'International'} />
          <InfoRow label="Family" value={order.familyName} />
          <InfoRow label="Category" value={order.categoryName} />
          <InfoRow label="Location" value={order.location} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <InfoRow label="Order No." value={order.orderNo} />
          <InfoRow label="Serial No." value={order.serialNo} />
          <InfoRow label="Party Name" value={order.partyName} />
          <InfoRow label="Lots Required" value={String(order.lotsRequired)} />
          <InfoRow label="Lot Size" value={`${order.lotSize} MT`} />
          <InfoRow label="Total Weight" value={formatWeight(order.totalWeight)} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <InfoRow label="Base Price" value={formatCurrency(order.price * order.totalWeight)} />
          <InfoRow label="Premium" value={formatCurrency(order.premium * order.totalWeight)} />
          <InfoRow label="Discount" value={`-${formatCurrency(order.discount * order.totalWeight)}`} />
          <InfoRow label="Taxes" value={formatCurrency(order.taxes)} />
          <InfoRow label="Grand Total" value={formatCurrency(order.totalPrice)} highlight />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressLabel}>{order.deliveryAddress.label}</Text>
          <Text style={styles.addressText}>{order.deliveryAddress.line1}</Text>
          <Text style={styles.addressText}>
            {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
          </Text>
        </Card>
      </ScreenContainer>
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
  notFound: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  statusRow: { marginTop: spacing.md, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  sectionTitle: { ...typography.heading3, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.bodyMedium },
  highlight: { color: colors.primary, fontFamily: 'Inter_700Bold' },
  addressLabel: { ...typography.bodyMedium, marginBottom: spacing.xs },
  addressText: { ...typography.body, color: colors.textSecondary },
});
