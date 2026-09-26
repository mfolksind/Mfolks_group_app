import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '@/types';
import { Variant } from '@/types/backend';
import { useCart } from '@/context/CartContext';
import { colors, radius, spacing, typography, elevation } from '@/design-system';

interface ProductCardProps {
  product?: Product;
  variant?: Partial<Variant>;
  onBuy?: () => void;
  compact?: boolean;
}

export function ProductCard({ product, variant, onBuy, compact = false }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [addedToCart, setAddedToCart] = useState(false);

  const name = variant?.variantName || product?.name || 'Product';
  const brand = (variant as any)?.product?.brand || (product as any)?.brand;
  const sku = variant?.sku || (product as any)?.sku;
  const stock = variant?.stock ?? (product as any)?.stock ?? 0;
  const unit = variant?.unit || (product as any)?.unit || 'unit';
  const dimensions = variant?.dimensions;
  const weight = variant?.weight;

  const rawPrice = variant ? (variant.price ?? 0) : product ? product.liveRate + product.premium : 0;
  const discountPrice = variant?.discountPrice;
  const unitPrice = discountPrice && discountPrice < rawPrice ? discountPrice : rawPrice;
  const hasDiscount = discountPrice && discountPrice < rawPrice;
  const discountPercent = hasDiscount ? Math.round(((rawPrice - discountPrice!) / rawPrice) * 100) : 0;

  const imageUri = variant?.thumbnail || variant?.images?.[0]?.url;
  const routeId = variant?._id || product?.id || '';

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  const handleCardPress = () => {
    if (routeId) {
      router.push(`/products/${routeId}`);
    }
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    if (variant && variant._id) {
      addToCart(variant as Variant, 1);
    } else if (onBuy) {
      onBuy();
    } else {
      handleCardPress();
    }

    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 1500);
  };

  const hasSpecs = !!(dimensions || weight);

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [
        styles.luxuryProductCard,
        compact && styles.compactCard,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Compact Image Frame */}
      <View style={[styles.cardImageFrame, compact && styles.compactImageFrame]}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.cardImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.cardImageFallback}>
            <Ionicons name="cube-outline" size={compact ? 28 : 36} color={colors.primary} />
          </View>
        )}

        {/* Real Discount Tag (Top Right) */}
        {hasDiscount && (
          <View style={styles.overlayTopRight}>
            <View style={styles.discountBadgeTag}>
              <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
            </View>
          </View>
        )}

        {/* Real Stock Status Tag (Bottom Left) */}
        <View style={styles.overlayBottomLeft}>
          {stock > 0 ? (
            <View style={styles.stockPillGreen}>
              <Ionicons name="cube-outline" size={9} color="#047857" />
              <Text style={styles.stockPillGreenText}>{stock} {unit}</Text>
            </View>
          ) : (
            <View style={styles.stockPillRed}>
              <Text style={styles.stockPillRedText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Floating '+' Add Button overlay (Image 2 style) */}
        <Pressable
          style={({ pressed }) => [
            styles.floatingAddBtn,
            addedToCart && styles.floatingAddBtnSuccess,
            pressed && styles.floatingAddBtnPressed,
            stock <= 0 && styles.floatingAddBtnDisabled,
          ]}
          disabled={stock <= 0}
          onPress={handleAddToCart}
          hitSlop={6}
        >
          <Ionicons
            name={addedToCart ? "checkmark" : "add"}
            size={18}
            color={addedToCart ? '#10B981' : stock > 0 ? '#042178' : '#94A3B8'}
          />
        </Pressable>
      </View>

      {/* Compact Card Body Info */}
      <View style={styles.cardBody}>
        {/* Brand & SKU Header Chips */}
        {(brand || sku) && (
          <View style={styles.brandSkuRow}>
            {brand ? (
              <View style={styles.brandPill}>
                <Ionicons name="ribbon-outline" size={11} color={colors.primary} />
                <Text style={styles.brandPillText}>{brand}</Text>
              </View>
            ) : null}
            {sku ? <Text style={styles.skuText}>SKU: {sku}</Text> : null}
          </View>
        )}

        {/* Product Title */}
        <Text style={styles.luxuryProductTitle} numberOfLines={1}>
          {name}
        </Text>

        {/* Specs Pills Line */}
        {!compact && hasSpecs && (
          <View style={styles.specsPillsRow}>
            {dimensions ? (
              <View style={styles.specMiniPill}>
                <Text style={styles.specMiniText}>{dimensions}</Text>
              </View>
            ) : null}
            {weight ? (
              <View style={styles.specMiniPill}>
                <Text style={styles.specMiniText}>
                  {weight} {unit}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Price Row */}
        <View style={styles.priceBlockGroup}>
          <View style={styles.mainPriceRow}>
            <Text style={styles.luxuryMainPrice}>{formatPrice(unitPrice)}</Text>
            <Text style={styles.priceUnitLabel}>/{unit}</Text>
            {hasDiscount && (
              <Text style={styles.luxuryStrikethrough}>
                {formatPrice(rawPrice)}
              </Text>
            )}
          </View>
        </View>

        {/* Single Action Button: View Details */}
        <View style={styles.cardActionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.viewDetailsBtn,
              pressed && styles.buttonPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleCardPress();
            }}
          >
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={styles.viewDetailsBtnText}>View Details</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  luxuryProductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: spacing.sm + 2,
    ...elevation.sm,
  },
  compactCard: {
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.988 }],
  },
  cardImageFrame: {
    height: 115,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactImageFrame: {
    height: 90,
  },
  cardImage: {
    width: '90%',
    height: '90%',
  },
  cardImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  overlayTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  discountBadgeTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  overlayBottomLeft: {
    position: 'absolute',
    bottom: 6,
    left: 8,
  },
  stockPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stockPillGreenText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  stockPillRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockPillRedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B91C1C',
  },
  /* Floating '+' overlay button (Image 2 style) */
  floatingAddBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#042178',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
  },
  floatingAddBtnPressed: {
    backgroundColor: '#EEF2FF',
    transform: [{ scale: 0.92 }],
  },
  floatingAddBtnSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  floatingAddBtnDisabled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  brandSkuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  skuText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  luxuryProductTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    lineHeight: 18,
    marginBottom: 4,
  },
  specsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  specMiniPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specMiniText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  priceBlockGroup: {
    marginBottom: 8,
  },
  mainPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  luxuryMainPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  priceUnitLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  luxuryStrikethrough: {
    fontSize: 10,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  /* View Details Button */
  viewDetailsBtn: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
