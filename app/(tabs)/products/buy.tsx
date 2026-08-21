import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Button, Card, Dropdown, Dialog, ErrorState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getVariantById } from '@/api/products.api';
import { createOrder } from '@/api/orders.api';
import { Variant, Address } from '@/types/backend';
import { colors, spacing, typography } from '@/design-system';

export default function BuyProductScreen() {
  const router = useRouter();
  const { variantId } = useLocalSearchParams<{ variantId: string }>();
  const { user } = useAuth();

  const [variant, setVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses?.[0]?._id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch variant details
  useEffect(() => {
    const fetchVariant = async () => {
      if (!variantId) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getVariantById(variantId);

        if (response.success && response.data) {
          setVariant(response.data);
          // Set default address
          if (user?.addresses && user.addresses.length > 0) {
            setSelectedAddressId(user.addresses[0]._id || '');
          }
        } else {
          setError(response.message || 'Failed to load product details');
          setVariant(null);
        }
      } catch (err) {
        console.error('Error fetching variant:', err);
        setError('Failed to load product details');
        setVariant(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [variantId, user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <AppBar title="Buy Product" showBack showCart />
        <ScreenContainer padded>
          <ErrorState
            title="Not Logged In"
            message="Please login to place an order."
          />
        </ScreenContainer>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Buy Product" showBack showCart />
        <ScreenContainer padded>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading product details...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (error || !variant) {
    return (
      <View style={styles.container}>
        <AppBar title="Buy Product" showBack showCart />
        <ScreenContainer padded>
          <ErrorState
            title={error ? 'Failed to Load Product' : 'Product Not Found'}
            message={error || 'The product you are trying to purchase does not exist.'}
            onRetry={() => {
              setLoading(true);
              setError(null);
              getVariantById(variantId!).then((response) => {
                if (response.success && response.data) {
                  setVariant(response.data);
                } else {
                  setError(response.message || 'Failed to load product details');
                }
                setLoading(false);
              });
            }}
          />
        </ScreenContainer>
      </View>
    );
  }

  // Calculate totals
  const quantityNum = parseInt(quantity, 10) || 1;
  const unitPrice = variant.discountPrice || variant.price;
  const subtotal = unitPrice * quantityNum;
  const taxes = subtotal * 0.18; // 18% GST
  const grandTotal = subtotal + taxes;

  const selectedAddress = user.addresses?.find((a) => a._id === selectedAddressId);
  const canOrder = variant.stock > 0 && quantityNum <= variant.stock;

  const handleSubmitOrder = async () => {
    if (!canOrder || !selectedAddressId) {
      return;
    }

    try {
      setShowConfirm(false);
      setSubmitting(true);

      // Create order with variant ID (NOT product ID)
      const orderResponse = await createOrder({
        items: [
          {
            variantId: variant._id,
            quantity: quantityNum,
            price: variant.price,
            discountPrice: variant.discountPrice,
            subtotal: subtotal,
          },
        ],
        deliveryAddressId: selectedAddressId,
      });

      if (orderResponse.success && orderResponse.data) {
        // Navigate to order success
        router.replace({
          pathname: '/order-success',
          params: {
            orderId: orderResponse.data._id,
            orderNo: orderResponse.data.orderNo,
            total: grandTotal.toFixed(2),
          },
        });
      } else {
        alert(orderResponse.message || 'Failed to create order. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      alert('Error creating order. Please try again.');
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.container}>
      <AppBar title="Buy Product" subtitle="Order Summary" showBack />

      <ScreenContainer scroll padded>
        {/* Product Info */}
        <Card style={styles.productCard}>
          <Text style={styles.productName}>{variant.variantName || variant.product?.name}</Text>
          {variant.product?.brand && (
            <Text style={styles.productBrand}>Brand: {variant.product.brand}</Text>
          )}
          <Text style={styles.productMeta}>SKU: {variant.sku}</Text>
        </Card>

        {/* Quantity Selection */}
        <Text style={styles.sectionTitle}>Order Quantity</Text>
        <Dropdown
          label="Quantity"
          value={quantity}
          onChange={setQuantity}
          options={Array.from({ length: Math.min(variant.stock, 100) }, (_, i) => ({
            label: `${i + 1} unit${i > 0 ? 's' : ''}`,
            value: String(i + 1),
          }))}
          required
        />

        {/* Stock Warning */}
        {variant.stock <= 0 && (
          <Card style={[styles.warningCard, { borderColor: colors.error }]}>
            <Text style={[styles.warningText, { color: colors.error }]}>
              This product is currently out of stock
            </Text>
          </Card>
        )}

        {variant.stock > 0 && variant.stock < 10 && (
          <Card style={[styles.warningCard, { borderColor: colors.warning }]}>
            <Text style={[styles.warningText, { color: colors.warning }]}>
              Only {variant.stock} units in stock
            </Text>
          </Card>
        )}

        {/* Delivery Address */}
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Dropdown
          label="Select Address"
          value={selectedAddressId}
          onChange={setSelectedAddressId}
          options={
            user.addresses?.map((a) => ({
              label: `${a.label} - ${a.city}`,
              value: a._id || '',
            })) || []
          }
          required
        />

        {selectedAddress && (
          <Card style={styles.addressCard}>
            <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
            <Text style={styles.addressText}>
              {selectedAddress.line1}
              {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}
            </Text>
            <Text style={styles.addressText}>
              {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
            </Text>
            <Text style={styles.addressText}>{selectedAddress.country}</Text>
          </Card>
        )}

        {/* Price Breakdown */}
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <Card style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Unit Price</Text>
            <Text style={styles.priceValue}>{formatPrice(unitPrice)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Quantity</Text>
            <Text style={styles.priceValue}>{quantityNum} unit{quantityNum !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax (GST 18%)</Text>
            <Text style={styles.priceValue}>{formatPrice(taxes)}</Text>
          </View>
          <View style={[styles.priceRow, styles.grandTotalRow]}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>{formatPrice(grandTotal)}</Text>
          </View>
        </Card>

        {/* Payment Info */}
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <Card style={styles.paymentCard}>
          <Text style={styles.paymentNote}>
            Payment details will be provided after order confirmation. Bank transfer is the preferred method for B2B transactions.
          </Text>
        </Card>

        {/* Submit Button */}
        <Button
          title="Submit Order"
          onPress={() => setShowConfirm(true)}
          loading={submitting}
          disabled={!canOrder || !selectedAddressId}
          fullWidth
          icon="checkmark-circle-outline"
          style={styles.submitButton}
        />
      </ScreenContainer>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirm}
        title="Confirm Order"
        message={`Submit order for ${quantityNum} unit${quantityNum !== 1 ? 's' : ''} of ${variant.variantName || variant.product?.name} totaling ${formatPrice(grandTotal)}?`}
        confirmLabel="Confirm"
        onConfirm={handleSubmitOrder}
        onCancel={() => setShowConfirm(false)}
      />
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
  productCard: { marginTop: spacing.md, marginBottom: spacing.md },
  productName: { ...typography.heading2, marginBottom: spacing.xs },
  productBrand: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  productMeta: { ...typography.caption, color: colors.textSecondary },
  sectionTitle: { ...typography.heading3, marginBottom: spacing.sm, marginTop: spacing.md },
  warningCard: {
    borderWidth: 1,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  warningText: { ...typography.body },
  addressCard: { marginBottom: spacing.md },
  addressLabel: { ...typography.bodyMedium, marginBottom: spacing.xs },
  addressText: { ...typography.body, color: colors.textSecondary },
  priceCard: { marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  priceLabel: { ...typography.body, color: colors.textSecondary },
  priceValue: { ...typography.bodyMedium },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: colors.divider, marginTop: spacing.sm, paddingTop: spacing.sm },
  grandLabel: { ...typography.heading3 },
  grandValue: { ...typography.heading2, color: colors.primary },
  paymentCard: { marginBottom: spacing.md },
  paymentNote: { ...typography.body, color: colors.textSecondary },
  submitButton: { marginBottom: spacing.xl },
});
