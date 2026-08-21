import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Button, Card, Dropdown, EmptyState, ErrorState, Dialog } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/api/orders.api';
import { colors, radius, spacing, typography } from '@/design-system';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotals } = useCart();

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    user?.addresses?.[0]?._id || user?.addresses?.[0]?.id || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const { subtotal, taxes, grandTotal } = getCartTotals();

  // Format delivery addresses for Dropdown options
  const addressOptions =
    user?.addresses?.map((addr) => ({
      label: `${addr.label}: ${addr.line1}, ${addr.city} (${addr.pincode})`,
      value: addr._id || addr.id || '',
    })) || [];

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!selectedAddressId) {
      setErrorMsg('Please select a delivery address before placing order.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    try {
      setShowConfirmModal(false);
      setSubmitting(true);
      setErrorMsg(null);

      // Prepare order items
      const orderItems = cartItems.map((item) => {
        const unitPrice = item.variant.discountPrice || item.variant.price || 0;
        return {
          variantId: item.variant._id,
          quantity: item.quantity,
          price: item.variant.price,
          discountPrice: item.variant.discountPrice,
          subtotal: unitPrice * item.quantity,
        };
      });

      const response = await createOrder({
        items: orderItems,
        deliveryAddressId: selectedAddressId,
      });

      if (response.success && response.data) {
        const newOrder = response.data;
        clearCart();
        router.replace({
          pathname: '/order-success',
          params: {
            orderId: newOrder._id,
            orderNo: newOrder.orderNo || 'ORD-SUCCESS',
            total: grandTotal.toString(),
          },
        });
      } else {
        setErrorMsg(response.message || 'Failed to submit order. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting order:', err);
      setErrorMsg('An unexpected error occurred while placing order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <AppBar title="My Cart" showBack />
        <ScreenContainer padded>
          <EmptyState
            icon="cart-outline"
            title="Your Cart is Empty"
            message="Looks like you haven't added any products to your cart yet."
            actionLabel="Browse Products"
            onAction={() => router.push('/(tabs)/products')}
          />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="My Cart" subtitle={`${cartItems.length} items`} showBack />
      <ScreenContainer scroll padded>
        {errorMsg && (
          <View style={{ marginBottom: spacing.md }}>
            <ErrorState
              title="Order Error"
              message={errorMsg}
              onRetry={() => setErrorMsg(null)}
            />
          </View>
        )}

        {/* Cart Items List */}
        <Text style={styles.sectionTitle}>Cart Items</Text>
        {cartItems.map((item) => {
          const variant = item.variant;
          const unitPrice = variant.discountPrice || variant.price || 0;
          const isMaxStock = item.quantity >= variant.stock;

          return (
            <Card key={variant._id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                {variant.thumbnail || variant.images?.[0]?.url ? (
                  <Image
                    source={{ uri: variant.thumbnail || variant.images?.[0]?.url }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.itemPlaceholder}>
                    <Ionicons name="cube-outline" size={32} color={colors.primary} />
                  </View>
                )}

                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {variant.variantName || variant.product?.name}
                    </Text>
                    <Pressable
                      onPress={() => removeFromCart(variant._id)}
                      hitSlop={8}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error || '#DC2626'} />
                    </Pressable>
                  </View>

                  {variant.product?.brand && (
                    <Text style={styles.itemBrand}>Brand: {variant.product.brand}</Text>
                  )}
                  <Text style={styles.itemSku}>SKU: {variant.sku}</Text>

                  <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>{formatPrice(unitPrice)}</Text>

                    {/* Quantity Picker */}
                    <View style={styles.qtyContainer}>
                      <Pressable
                        onPress={() => updateQuantity(variant._id, item.quantity - 1)}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={16} color={colors.textPrimary} />
                      </Pressable>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <Pressable
                        onPress={() => updateQuantity(variant._id, item.quantity + 1)}
                        style={[styles.qtyBtn, isMaxStock && styles.qtyBtnDisabled]}
                        disabled={isMaxStock}
                      >
                        <Ionicons
                          name="add"
                          size={16}
                          color={isMaxStock ? colors.textSecondary || '#9CA3AF' : colors.textPrimary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {isMaxStock && (
                    <Text style={styles.maxStockText}>Max available stock ({variant.stock}) reached</Text>
                  )}
                </View>
              </View>
            </Card>
          );
        })}

        {/* Delivery Address Section */}
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Card style={styles.sectionCard}>
          {addressOptions.length > 0 ? (
            <Dropdown
              label="Select Saved Address"
              options={addressOptions}
              value={selectedAddressId}
              onChange={setSelectedAddressId}
            />
          ) : (
            <View>
              <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: 8 }}>
                No delivery addresses found on your account.
              </Text>
            </View>
          )}
        </Card>

        {/* Price Summary Breakdown */}
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cartItems.length} items)</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST & Taxes (18%)</Text>
            <Text style={styles.summaryValue}>{formatPrice(taxes)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(grandTotal)}</Text>
          </View>
        </Card>
      </ScreenContainer>

      {/* Footer Checkout Bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerTotal}>{formatPrice(grandTotal)}</Text>
        </View>
        <Button
          title={submitting ? 'Placing Order...' : 'Submit Order'}
          onPress={() => setShowConfirmModal(true)}
          disabled={submitting || !selectedAddressId}
          style={styles.checkoutBtn}
        />
      </View>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirmModal}
        title="Confirm Order"
        message={`Are you sure you want to submit this order for ${formatPrice(grandTotal)}?`}
        confirmLabel="Confirm Order"
        cancelLabel="Cancel"
        onConfirm={handleCheckout}
        onCancel={() => setShowConfirmModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: {
    ...typography.heading2,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  itemPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    ...typography.heading3,
    flex: 1,
    marginRight: spacing.xs,
  },
  removeBtn: {
    padding: 2,
  },
  itemBrand: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemSku: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  itemPrice: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider || '#E5E7EB',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  qtyText: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  maxStockText: {
    fontSize: 10,
    color: colors.error || '#DC2626',
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodyMedium,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.divider || '#E5E7EB',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  grandTotalLabel: {
    ...typography.heading3,
  },
  grandTotalValue: {
    ...typography.heading2,
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider || '#E5E7EB',
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerTotal: {
    ...typography.heading2,
    color: colors.primary,
  },
  checkoutBtn: {
    minWidth: 140,
  },
});
