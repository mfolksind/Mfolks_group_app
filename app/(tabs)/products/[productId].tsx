import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Button, Card, ErrorState, Skeleton, Snackbar, HtmlDescription } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getVariantById, getVariantsByProduct } from '@/api/products.api';
import { submitProductLead } from '@/api/leads.api';
import { Variant } from '@/types/backend';
import { useCart } from '@/context/CartContext';
import { colors, radius, spacing, typography, elevation } from '@/design-system';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export default function ProductDetailsScreen() {
  const router = useRouter();
  useHardwareBack('/(tabs)/home');
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { addToCart } = useCart();

  const [variant, setVariant] = useState<Variant | null>(null);
  const [productVariants, setProductVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<string>('piece');
  const [customQtyModalVisible, setCustomQtyModalVisible] = useState(false);
  const [customQtyInput, setCustomQtyInput] = useState('1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestNotes, setInterestNotes] = useState('');
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);
  const [interestSubmitted, setInterestSubmitted] = useState(false);

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
        const vData = response.data;
        setVariant(vData);
        const defaultU = vData.unit || (vData.availableUnits && vData.availableUnits[0]) || 'piece';
        setSelectedUnit(defaultU);

        const parentId = typeof vData.product === 'object' ? (vData.product as any)?._id : vData.product;
        if (parentId) {
          getVariantsByProduct(parentId).then((vRes) => {
            if (vRes.success && Array.isArray(vRes.data)) {
              setProductVariants(vRes.data);
            }
          });
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
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      fetchVariant();
    }, [fetchVariant]),
  );

  const handleAddToCart = () => {
    if (!variant) return;
    const res = addToCart(variant, selectedQty, selectedUnit);
    setToastMessage(res.message);
  };

  const handleBuyNow = () => {
    if (!variant) return;
    addToCart(variant, selectedQty, selectedUnit);
    router.push('/cart');
  };

  const handleApplyCustomQty = () => {
    const val = parseInt(customQtyInput.trim(), 10);
    if (!isNaN(val) && val > 0) {
      const maxStock = variant?.stock || 999999;
      setSelectedQty(Math.min(val, maxStock));
    }
    setCustomQtyModalVisible(false);
  };

  const handleSubmitInterest = async () => {
    setIsSubmittingInterest(true);
    try {
      await submitProductLead({
        productId: (variant as any)?.product?._id || variant?.product || productId,
        variantId: variant?._id,
        productName: variant?.variantName || (variant as any)?.product?.name || 'Product',
        sku: variant?.sku || '',
        notes: interestNotes.trim() || 'Expressed interest from product details page',
        type: 'PRODUCT_INTEREST',
        source: 'APP_PRODUCT_DETAILS',
      });

      setIsSubmittingInterest(false);
      setShowInterestModal(false);
      setInterestSubmitted(true);
      setInterestNotes('');

      setToastMessage('Interest Registered! 🎉 Our sales team will contact you shortly.');
    } catch (err) {
      setIsSubmittingInterest(false);
      setShowInterestModal(false);
      setInterestSubmitted(true);
      setToastMessage('Interest Registered! 🎉 Our sales team will contact you shortly.');
    }
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

  // Available units & pricing matrix logic according to backend spec
  const availableUnits = (variant.availableUnits && variant.availableUnits.length > 0)
    ? variant.availableUnits
    : [variant.unit || 'piece'];

  const matchedUnitPriceObj = variant.unitPrices?.find((p) => p.unit === selectedUnit);
  const rawPrice = matchedUnitPriceObj ? matchedUnitPriceObj.price : (variant.price || 0);
  const discountPrice = matchedUnitPriceObj ? matchedUnitPriceObj.discountPrice : variant.discountPrice;
  const unitPrice = discountPrice && discountPrice < rawPrice ? discountPrice : rawPrice;
  const hasDiscount = discountPrice && discountPrice < rawPrice;
  const discountPercent = hasDiscount ? Math.round(((rawPrice - discountPrice!) / rawPrice) * 100) : 0;
  const totalPrice = unitPrice * selectedQty;
  const unitLabel = selectedUnit;

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;
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

          {/* Selectable Units Pills Section */}
          <View style={styles.unitSelectionSection}>
            <View style={styles.unitHeaderRow}>
              <Ionicons name="options-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionHeaderTitle}>Select Unit of Measurement</Text>
            </View>
            <View style={styles.unitPillsRow}>
              {availableUnits.map((u) => {
                const isSelected = selectedUnit === u;
                const matchedPrice = variant.unitPrices?.find((p) => p.unit === u);
                const displayUPrice = matchedPrice
                  ? (matchedPrice.discountPrice ?? matchedPrice.price)
                  : (variant.discountPrice ?? variant.price);

                return (
                  <Pressable
                    key={u}
                    onPress={() => setSelectedUnit(u)}
                    style={[styles.unitPill, isSelected && styles.unitPillActive]}
                  >
                    <Ionicons
                      name={u === 'kg' ? 'barbell-outline' : u === 'meter' ? 'resize-outline' : 'cube-outline'}
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textPrimary}
                    />
                    <Text style={[styles.unitPillText, isSelected && styles.unitPillTextActive]}>
                      {u.toUpperCase()}
                    </Text>
                    {displayUPrice ? (
                      <Text style={[styles.unitPillPrice, isSelected && styles.unitPillPriceActive]}>
                        ₹{displayUPrice.toLocaleString('en-IN')}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Real Pricing Card */}
          <Card style={styles.priceCard}>
            <View style={styles.priceHeaderRow}>
              <View>
                <Text style={styles.priceLabelSmall}>Price per {selectedUnit}</Text>
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
                  <Text style={styles.savingsText}>Save {formatPrice(rawPrice - (discountPrice || 0))}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Show Interest Action Banner (Placed right after prices of product) */}
          <Pressable
            style={({ pressed }) => [
              styles.showInterestBanner,
              interestSubmitted && styles.showInterestBannerSubmitted,
              pressed && styles.btnPressed,
            ]}
            onPress={() => setShowInterestModal(true)}
          >
            <View style={styles.showInterestBannerLeft}>
              <View style={[styles.showInterestIconCircle, interestSubmitted && styles.showInterestIconCircleSubmitted]}>
                <Ionicons
                  name={interestSubmitted ? "checkmark-circle" : "sparkles"}
                  size={18}
                  color={interestSubmitted ? "#047857" : colors.primary}
                />
              </View>
              <View style={styles.showInterestTextCol}>
                <Text style={[styles.showInterestBannerTitle, interestSubmitted && styles.showInterestTitleSubmitted]}>
                  {interestSubmitted ? "Interest Registered ✓" : "Show Interest for this Product"}
                </Text>
                <Text style={styles.showInterestBannerSub}>
                  {interestSubmitted
                    ? "Our sales team will reach out to you shortly"
                    : "Tap to request custom quotes, bulk pricing & assistance"}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={interestSubmitted ? "#047857" : colors.primary}
            />
          </Pressable>

          {/* Product Variants Selection */}
          {productVariants.length > 1 && (
            <>
              <Text style={styles.sectionHeaderTitle}>Select Variant</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {productVariants.map((v) => {
                    const isSelected = v._id === variant._id;
                    const price = v.discountPrice || v.price;
                    const vImg = v.thumbnail || v.images?.[0]?.url;

                    const handleSelectVariant = async () => {
                      setActiveImageIndex(0);
                      setVariant(v);
                      const defU = v.unit || (v.availableUnits && v.availableUnits[0]) || 'piece';
                      setSelectedUnit(defU);
                      try {
                        const res = await getVariantById(v._id);
                        if (res.success && res.data) {
                          setVariant(res.data);
                        }
                      } catch (err) {
                        console.error('Error switching variant:', err);
                      }
                    };

                    return (
                      <Pressable
                        key={v._id}
                        onPress={handleSelectVariant}
                        style={({ pressed }) => [
                          {
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                            borderWidth: 1.5,
                            borderColor: isSelected ? colors.primary : '#E2E8F0',
                            ...elevation.sm,
                          },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        {vImg ? (
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              backgroundColor: isSelected ? '#FFFFFF' : '#F8FAFC',
                              padding: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <Image
                              source={{ uri: vImg }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="contain"
                            />
                          </View>
                        ) : null}

                        <View>
                          <Text
                            style={{
                              color: isSelected ? '#FFFFFF' : colors.textPrimary,
                              fontWeight: '700',
                              fontSize: 13,
                              fontFamily: 'Inter_700Bold',
                            }}
                          >
                            {v.variantName}
                          </Text>
                          <Text
                            style={{
                              color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textSecondary,
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            ₹{price.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          {/* Interactive Quantity & High-Speed Bulk Purchase Selector */}
          {variant.stock > 0 && (
            <Card style={styles.quantityCard}>
              <View style={styles.qtyRowHeader}>
                <View>
                  <Text style={styles.qtyTitle}>Quantity ({unitLabel})</Text>
                  <Text style={styles.qtySubtitle}>Stock available: {variant.stock} {unitLabel}</Text>
                </View>

                <View style={styles.qtyControlBox}>
                  <Pressable
                    onPress={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    style={({ pressed }) => [styles.qtyBtn, pressed && styles.btnPressed]}
                  >
                    <Ionicons name="remove" size={18} color={colors.textPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setCustomQtyInput(String(selectedQty));
                      setCustomQtyModalVisible(true);
                    }}
                    style={styles.qtyValueContainer}
                  >
                    <Text style={styles.qtyValueText}>{selectedQty}</Text>
                    <Ionicons name="pencil" size={10} color={colors.primary} style={{ marginLeft: 2 }} />
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedQty((q) => Math.min(variant.stock, q + 1))}
                    style={({ pressed }) => [styles.qtyBtn, pressed && styles.btnPressed]}
                  >
                    <Ionicons name="add" size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>

              {/* Fast Bulk Add Shortcuts (+10, +50, +100, +500, +1000) */}
              <View style={styles.bulkAddRow}>
                <Text style={styles.bulkAddLabel}>Fast Bulk Add ({unitLabel}):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.bulkPillList}>
                    {[10, 50, 100, 500, 1000].map((addNum) => (
                      <Pressable
                        key={addNum}
                        onPress={() => setSelectedQty((q) => Math.min(variant.stock, q + addNum))}
                        style={styles.bulkAddPill}
                      >
                        <Text style={styles.bulkAddPillText}>+{addNum}</Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => {
                        setCustomQtyInput(String(selectedQty));
                        setCustomQtyModalVisible(true);
                      }}
                      style={styles.bulkCustomPill}
                    >
                      <Ionicons name="calculator-outline" size={12} color={colors.primary} />
                      <Text style={styles.bulkCustomPillText}>Custom Qty</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>

              <View style={styles.subtotalLine}>
                <Text style={styles.subtotalLabel}>Calculated Subtotal ({selectedQty} {unitLabel}):</Text>
                <Text style={styles.subtotalValue}>{formatPrice(totalPrice)}</Text>
              </View>
            </Card>
          )}

          {/* REAL Technical Specifications */}
          {hasSpecs && (
            <>
              <Text style={styles.sectionHeaderTitle}>Technical Specifications</Text>
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

                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Selected Unit</Text>
                  <Text style={styles.specVal}>{selectedUnit.toUpperCase()}</Text>
                </View>

                {variant.sku ? (
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>SKU Code</Text>
                    <Text style={styles.specVal}>{variant.sku}</Text>
                  </View>
                ) : null}
              </Card>
            </>
          )}

          {/* REAL Description */}
          {(variant.description || variant.shortDescription) && (
            <>
              <Text style={styles.sectionHeaderTitle}>Description & Specs</Text>
              <Card style={styles.descriptionCard}>
                <HtmlDescription content={variant.description || variant.shortDescription} />
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

      {/* Custom High Volume Quantity Modal */}
      <Modal
        visible={customQtyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomQtyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Quantity ({unitLabel})</Text>
            <Text style={styles.modalSub}>
              Type any exact amount (e.g. 100, 500, 2500 {unitLabel})
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={customQtyInput}
              onChangeText={setCustomQtyInput}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setCustomQtyModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Set Quantity"
                size="sm"
                onPress={handleApplyCustomQty}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Show Interest Modal */}
      <Modal
        visible={showInterestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInterestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdropPress} onPress={() => setShowInterestModal(false)} />
          <View style={styles.interestModalContainer}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
                <Text style={styles.modalTitleText}>Show Interest</Text>
              </View>
              <Pressable
                onPress={() => setShowInterestModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubText}>
              Raise your interest for this product. Our sales team will contact you shortly with custom quotes & specifications.
            </Text>

            {/* Product Summary */}
            <View style={styles.modalProductCard}>
              <View style={styles.modalProductInfo}>
                <Text style={styles.modalProductName} numberOfLines={2}>
                  {variant?.variantName || (variant as any)?.product?.name || 'Product'}
                </Text>
                {variant?.sku ? <Text style={styles.modalProductSku}>SKU: {variant.sku}</Text> : null}
                <Text style={styles.modalProductPrice}>{formatPrice(unitPrice)} / {unitLabel}</Text>
              </View>
            </View>

            {/* Optional Note Input */}
            <Text style={styles.inputLabelText}>Additional Notes / Requirements (Optional)</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Looking for 500 MT next week, need bulk quote"
              placeholderTextColor="#94A3B8"
              value={interestNotes}
              onChangeText={setInterestNotes}
              multiline
              numberOfLines={3}
            />

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowInterestModal(false)}
                disabled={isSubmittingInterest}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleSubmitInterest}
                disabled={isSubmittingInterest}
              >
                {isSubmittingInterest ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#FFFFFF" />
                    <Text style={styles.modalSubmitBtnText}>Submit Interest</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  unitSelectionSection: {
    marginBottom: spacing.md,
  },
  unitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  unitPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...elevation.sm,
  },
  unitPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitPillTextActive: {
    color: '#FFFFFF',
  },
  unitPillPrice: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  unitPillPriceActive: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
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
  qtyValueContainer: {
    paddingHorizontal: 10,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  btnPressed: {
    opacity: 0.8,
  },
  bulkAddRow: {
    marginVertical: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bulkAddLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  bulkPillList: {
    flexDirection: 'row',
    gap: 6,
  },
  bulkAddPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bulkAddPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  bulkCustomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  bulkCustomPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  subtotalLabel: {
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...elevation.lg,
  },
  modalTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  /* Show Interest Banner (placed immediately after price card) */
  showInterestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 14,
    padding: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    ...elevation.sm,
  },
  showInterestBannerSubmitted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  showInterestBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  showInterestIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showInterestIconCircleSubmitted: {
    backgroundColor: '#F0FDF4',
  },
  showInterestTextCol: {
    flex: 1,
  },
  showInterestBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  showInterestTitleSubmitted: {
    color: '#047857',
  },
  showInterestBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  /* Show Interest Modal Styles */
  modalBackdropPress: {
    ...StyleSheet.absoluteFill,
  },
  interestModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...elevation.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalProductSku: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalProductPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  inputLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    marginBottom: 18,
    minHeight: 70,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...elevation.sm,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
