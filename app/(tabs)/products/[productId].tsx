import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Button, Card, ErrorState, Skeleton, Snackbar } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getVariantById } from '@/api/products.api';
import { Variant } from '@/types/backend';
import { useCart } from '@/context/CartContext';
import { colors, radius, spacing, typography, elevation } from '@/design-system';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { addToCart } = useCart();

  const [variant, setVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQty, setSelectedQty] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchVariant = useCallback(async () => {
    if (!productId) {
      setError('Product ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getVariantById(productId);

      if (response.success && response.data) {
        setVariant(response.data);
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
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      fetchVariant();
    }, [fetchVariant]),
  );

  const handleAddToCart = () => {
    if (!variant) return;
    const res = addToCart(variant, selectedQty);
    setToastMessage(res.message);
  };

  const handleBuyNow = () => {
    if (!variant) return;
    addToCart(variant, selectedQty);
    router.push('/cart');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Product Details" showBack showCart />
        <ScreenContainer scroll padded>
          <Skeleton height={240} style={{ borderRadius: 16, marginBottom: spacing.md }} />
          <Skeleton height={32} width="70%" style={{ marginBottom: spacing.xs }} />
          <Skeleton height={20} width="40%" style={{ marginBottom: spacing.md }} />
          <Skeleton height={100} style={{ borderRadius: 14, marginBottom: spacing.md }} />
        </ScreenContainer>
      </View>
    );
  }

  if (error || !variant) {
    return (
      <View style={styles.container}>
        <AppBar title="Product Details" showBack showCart />
        <ScreenContainer scroll padded>
          <ErrorState
            title={error ? 'Failed to Load Product' : 'Product Not Found'}
            message={error || 'The product you are looking for does not exist.'}
            onRetry={fetchVariant}
          />
        </ScreenContainer>
      </View>
    );
  }

  // Real Image data from API
  const images = variant.images || [];
  const primaryImage = images.find((img) => img.isPrimary);
  const selectedImage = images[activeImageIndex] || primaryImage;
  const displayImage = selectedImage?.url || variant.thumbnail;

  // Real Pricing data from API
  const rawPrice = variant.price || 0;
  const unitPrice = variant.discountPrice && variant.discountPrice < rawPrice ? variant.discountPrice : rawPrice;
  const hasDiscount = variant.discountPrice && variant.discountPrice < rawPrice;
  const discountPercent = hasDiscount ? Math.round(((rawPrice - variant.discountPrice!) / rawPrice) * 100) : 0;
  const totalPrice = unitPrice * selectedQty;
  const unitLabel = variant.unit || 'unit';

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  // Check if real technical specifications exist in API response
  const hasSpecs = !!(variant.dimensions || variant.weight || variant.sku || variant.unit);

  return (
    <View style={styles.container}>
      <AppBar title="Product Details" showBack showCart />

      <ScreenContainer scroll padded={false}>
        {/* Main Image Frame */}
        <View style={styles.heroSection}>
          <View style={styles.mainImageContainer}>
            {displayImage ? (
              <Image
                source={{ uri: displayImage }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.fallbackImageContainer}>
                <Ionicons name="cube-outline" size={64} color={colors.primary} />
              </View>
            )}

            {/* Real Stock Status Tag */}
            <View style={styles.stockBadgeContainer}>
              {variant.stock > 0 ? (
                <View style={styles.stockTagGreen}>
                  <Ionicons name="checkmark-circle-outline" size={12} color="#047857" />
                  <Text style={styles.stockTagGreenText}>In Stock ({variant.stock} {unitLabel})</Text>
                </View>
              ) : (
                <View style={styles.stockTagRed}>
                  <Text style={styles.stockTagRedText}>Out of Stock</Text>
                </View>
              )}
            </View>

            {/* Real Discount Tag */}
            {hasDiscount && (
              <View style={styles.discountTagContainer}>
                <View style={styles.discountTag}>
                  <Text style={styles.discountTagText}>{discountPercent}% OFF</Text>
                </View>
              </View>
            )}
          </View>

          {/* Real Thumbnails Gallery */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gallery}
              contentContainerStyle={styles.galleryContent}
            >
              {images.map((img, index) => (
                <Pressable
                  key={img._id || index}
                  onPress={() => setActiveImageIndex(index)}
                  style={[styles.thumbnail, activeImageIndex === index && styles.activeThumbnail]}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={styles.thumbnailImage}
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Details Content */}
        <View style={styles.contentBody}>
          {/* Brand & SKU Header Row */}
          <View style={styles.brandHeaderRow}>
            {variant.product?.brand ? (
              <View style={styles.brandBadgePill}>
                <Ionicons name="ribbon-outline" size={13} color={colors.primary} />
                <Text style={styles.brandBadgeText}>{variant.product.brand}</Text>
              </View>
            ) : null}
            {variant.sku ? (
              <View style={styles.skuBadgePill}>
                <Text style={styles.skuBadgeText}>SKU: {variant.sku}</Text>
              </View>
            ) : null}
          </View>

          {/* Real Variant Title */}
          <Text style={styles.productNameTitle}>
            {variant.variantName || variant.product?.name}
          </Text>

          {/* Real Pricing Card */}
          <Card style={styles.priceCard}>
            <View style={styles.priceHeaderRow}>
              <View>
                <Text style={styles.priceLabelSmall}>Price</Text>
                <View style={styles.priceValRow}>
                  <Text style={styles.unitPriceText}>{formatPrice(unitPrice)}</Text>
                  <Text style={styles.unitText}> / {unitLabel}</Text>
                </View>
                {hasDiscount && (
                  <Text style={styles.originalStrikethroughText}>
                    {formatPrice(rawPrice)}
                  </Text>
                )}
              </View>

              {hasDiscount && (
                <View style={styles.savingsPill}>
                  <Text style={styles.savingsText}>Save {formatPrice(rawPrice - (variant.discountPrice || 0))}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Interactive Quantity Selector */}
          {variant.stock > 0 && (
            <Card style={styles.quantityCard}>
              <View style={styles.qtyRowHeader}>
                <View>
                  <Text style={styles.qtyTitle}>Quantity ({unitLabel})</Text>
                  <Text style={styles.qtySubtitle}>Max {variant.stock} {unitLabel} available</Text>
                </View>

                <View style={styles.qtyControlBox}>
                  <Pressable
                    onPress={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    style={({ pressed }) => [styles.qtyBtn, pressed && styles.btnPressed]}
                  >
                    <Ionicons name="remove" size={18} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.qtyValueText}>{selectedQty}</Text>
                  <Pressable
                    onPress={() => setSelectedQty((q) => Math.min(variant.stock, q + 1))}
                    style={({ pressed }) => [styles.qtyBtn, pressed && styles.btnPressed]}
                  >
                    <Ionicons name="add" size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.subtotalLine}>
                <Text style={styles.subtotalLabel}>Item Subtotal:</Text>
                <Text style={styles.subtotalValue}>{formatPrice(totalPrice)}</Text>
              </View>
            </Card>
          )}

          {/* REAL Technical Specifications (Rendered ONLY if fields exist in API) */}
          {hasSpecs && (
            <>
              <Text style={styles.sectionHeaderTitle}>Specifications</Text>
              <Card style={styles.specsContainerCard}>
                {variant.dimensions ? (
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Dimensions</Text>
                    <Text style={styles.specVal}>{variant.dimensions}</Text>
                  </View>
                ) : null}

                {variant.weight ? (
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Weight</Text>
                    <Text style={styles.specVal}>{variant.weight} {unitLabel}</Text>
                  </View>
                ) : null}

                {variant.unit ? (
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Unit Metric</Text>
                    <Text style={styles.specVal}>{variant.unit}</Text>
                  </View>
                ) : null}

                {variant.sku ? (
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>SKU Code</Text>
                    <Text style={styles.specVal}>{variant.sku}</Text>
                  </View>
                ) : null}
              </Card>
            </>
          )}

          {/* REAL Description (Rendered ONLY if description exists in API) */}
          {(variant.description || variant.shortDescription) && (
            <>
              <Text style={styles.sectionHeaderTitle}>Description</Text>
              <Card style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  {variant.description || variant.shortDescription}
                </Text>
              </Card>
            </>
          )}
        </View>
      </ScreenContainer>

      {/* Sticky Action Footer */}
      <View style={[styles.bottomStickyFooter, { paddingBottom: Math.max(20, spacing.md) }]}>
        <View style={styles.footerPriceInfo}>
          <Text style={styles.footerSubtotalLabel}>Total ({selectedQty} {unitLabel})</Text>
          <Text style={styles.footerSubtotalPrice}>{formatPrice(totalPrice)}</Text>
        </View>

        {variant.stock > 0 ? (
          <View style={styles.footerButtonPair}>
            <Pressable
              style={({ pressed }) => [styles.cartOutlineBtn, pressed && styles.btnPressed]}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart-outline" size={18} color={colors.primary} />
              <Text style={styles.cartOutlineBtnText}>Add</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.buySolidBtn, pressed && styles.btnPressed]}
              onPress={handleBuyNow}
            >
              <Text style={styles.buySolidBtnText}>Buy Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.outOfStockFooterBtn}>
            <Text style={styles.outOfStockFooterText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Toast Feedback */}
      {toastMessage && (
        <Snackbar
          visible={!!toastMessage}
          message={toastMessage}
          variant="success"
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    overflow: 'hidden',
  },
  mainImageContainer: {
    height: 220,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  fallbackImageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  stockBadgeContainer: {
    position: 'absolute',
    bottom: 12,
    right: 14,
  },
  stockTagGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stockTagGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  stockTagRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockTagRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  discountTagContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  discountTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  discountTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gallery: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  galleryContent: {
    gap: spacing.sm,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '90%',
    height: '90%',
  },
  activeThumbnail: {
    borderColor: colors.primary,
  },
  contentBody: {
    padding: spacing.md,
  },
  brandHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  brandBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  skuBadgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skuBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  productNameTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.sm,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceLabelSmall: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  priceValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  unitPriceText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  unitText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  originalStrikethroughText: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  savingsPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  quantityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.sm,
  },
  qtyRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  qtyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  qtySubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qtyControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  qtyValueText: {
    width: 36,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  btnPressed: {
    opacity: 0.8,
  },
  subtotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subtotalLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  specsContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
    ...elevation.sm,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specKey: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.sm,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomStickyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...elevation.lg,
  },
  footerPriceInfo: {
    marginRight: spacing.sm,
  },
  footerSubtotalLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  footerSubtotalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  footerButtonPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  cartOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  cartOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  buySolidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    ...elevation.sm,
  },
  buySolidBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outOfStockFooterBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  outOfStockFooterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
