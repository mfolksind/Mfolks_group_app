import React, { useState, useCallback } from 'react';
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
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Button, Card, Dropdown, EmptyState, ErrorState, Dialog, SwipeButton } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/api/orders.api';
import { getAddresses } from '@/api/addresses.api';
import { Address } from '@/types/backend';
import { colors, radius, spacing, typography } from '@/design-system';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export default function CartScreen() {
  const router = useRouter();
  useHardwareBack('/(tabs)/home');
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [swipeKey, setSwipeKey] = useState(0);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSwipeKey((prev) => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotals } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await getAddresses();
      if (res.success) {
        const addrList = res.data || [];
        setAddresses(addrList);
        const defaultAddr = addrList.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id || defaultAddr.id || '');
        } else if (addrList.length > 0) {
          setSelectedAddressId(addrList[0]._id || addrList[0].id || '');
        }
      }
    } catch (err) {
      console.error('Error loading addresses in cart:', err);
    }
  }, []);

  // Fetch addresses when checkout page is loaded
  React.useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const { subtotal, taxes, grandTotal } = getCartTotals();

  // Format delivery addresses for Dropdown options
  const addressOptions = addresses.map((addr) => ({
    label: `${addr.addressType}: ${addr.addressLine1}, ${addr.city} (${addr.postalCode})`,
    value: addr._id || addr.id || '',
  }));

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

    // Prepare order items
    // Prepare order items with unit
    const orderItems = cartItems.map((item) => ({
      variantId: item.variant._id || '',
      quantity: item.quantity,
      unit: item.unit || item.variant.unit || 'piece',
    }));

    router.push({
      pathname: '/payment',
      params: {
        items: JSON.stringify(orderItems),
        addressId: selectedAddressId,
        amount: grandTotal.toString(),
      },
    });
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
        {cartItems.map((item, index) => {
          const variant = item.variant;
          const itemUnit = item.unit || variant.unit || 'piece';
          const matchedUnitPriceObj = variant.unitPrices?.find((p) => p.unit === itemUnit);
          const unitPrice = matchedUnitPriceObj
            ? (matchedUnitPriceObj.discountPrice ?? matchedUnitPriceObj.price)
            : (variant.discountPrice || variant.price || 0);

          const isMaxStock = item.quantity >= variant.stock;

          return (
            <Card key={`${variant._id}_${itemUnit}_${index}`} style={styles.itemCard}>
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
                      onPress={() => removeFromCart(variant._id, itemUnit)}
                      hitSlop={8}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error || '#DC2626'} />
                    </Pressable>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                    {variant.product?.brand && (
                      <Text style={styles.itemBrand}>Brand: {variant.product.brand} • </Text>
                    )}
                    <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                        Unit: {itemUnit.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemSku}>SKU: {variant.sku}</Text>

                  <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>
                      {formatPrice(unitPrice)} <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '400' }}>/ {itemUnit}</Text>
                    </Text>

                    {/* Quantity Picker */}
                    <View style={styles.qtyContainer}>
                      <Pressable
                        onPress={() => updateQuantity(variant._id, itemUnit, item.quantity - 1)}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={16} color={colors.textPrimary} />
                      </Pressable>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <Pressable
                        onPress={() => updateQuantity(variant._id, itemUnit, item.quantity + 1)}
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
                    <Text style={styles.maxStockText}>Max available stock ({variant.stock} {itemUnit}) reached</Text>
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
            <View>
              <Dropdown
                label="Select Saved Address"
                options={addressOptions}
                value={selectedAddressId}
                onChange={setSelectedAddressId}
              />
              <Pressable
                onPress={() => router.push('/profile/addresses?from=cart')}
                style={{ marginTop: spacing.sm, alignSelf: 'flex-end' }}
                hitSlop={8}
              >
                <Text style={{ ...typography.caption, color: colors.primary, fontWeight: '600' }}>
                  + Add or Manage Addresses
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm }}>
                No delivery addresses found on your account.
              </Text>
              <Button
                title="Manage Addresses"
                onPress={() => router.push('/profile/addresses?from=cart')}
                variant="outline"
                size="sm"
              />
            </View>
          )}
        </Card>

        {/* Price Summary Breakdown */}
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Subtotal ({cartItems.length} items)</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total GST (18%)</Text>
            <Text style={styles.summaryValue}>{formatPrice(taxes)}</Text>
          </View>
          <View style={[styles.summaryRow, { paddingLeft: spacing.sm }]}>
            <Text style={[styles.summaryLabel, { fontSize: 12, color: colors.textSecondary }]}>• CGST (9.0%)</Text>
            <Text style={[styles.summaryValue, { fontSize: 12, color: colors.textSecondary }]}>+{formatPrice(taxes / 2)}</Text>
          </View>
          <View style={[styles.summaryRow, { paddingLeft: spacing.sm }]}>
            <Text style={[styles.summaryLabel, { fontSize: 12, color: colors.textSecondary }]}>• SGST (9.0%)</Text>
            <Text style={[styles.summaryValue, { fontSize: 12, color: colors.textSecondary }]}>+{formatPrice(taxes / 2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total (Incl. Taxes)</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(grandTotal)}</Text>
          </View>
        </Card>
      </ScreenContainer>

      {/* Footer Checkout Bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <SwipeButton
          key={swipeKey}
          title={`Swipe to Pay ${formatPrice(grandTotal)}`}
          onSwipeSuccess={handleCheckout}
          disabled={submitting || !selectedAddressId || grandTotal <= 0}
          loading={submitting}
          style={styles.checkoutBtn}
        />
      </View>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirmModal}
        title="Confirm Order & Pay"
        message={`Are you sure you want to proceed to payment for ${formatPrice(grandTotal)}?`}
        confirmLabel="Proceed to Payment"
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
    width: '100%',
  },
});
