import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '@/types';
import { Variant } from '@/types/backend';
import { formatCurrency, getCategoryById, getFamilyById } from '@/data/mockData';
import { Button } from './Button';
import { Card } from './Card';
import { StatusTag } from './StatusTag';
import { colors, radius, spacing, typography } from '@/design-system';

interface ProductCardProps {
  product?: Product;
  variant?: Partial<Variant>;
  onBuy?: () => void;
  compact?: boolean;
}

export function ProductCard({ product, variant, onBuy, compact = false }: ProductCardProps) {
  const router = useRouter();
  const source = variant ?? product;
  const family = product ? getFamilyById(product.familyId) : null;
  const category = product ? getCategoryById(product.categoryId) : null;

  const name = variant?.variantName || product?.name || 'Product';
  const brand = (variant as any)?.product?.brand || (product as any)?.brand || 'Brand';
  const price = variant ? (variant.discountPrice ?? variant.price ?? 0) : product ? product.liveRate + product.premium - product.discount : 0;
  const imageUri = variant?.thumbnail || variant?.images?.[0]?.url;
  const routeId = variant?._id || product?.id || '';

  const handlePress = () => {
    if (routeId) {
      router.push(`/products/${routeId}`);
    }
  };

  return (
    <Card style={styles.card} padding={0}>
      <Pressable onPress={handlePress}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={[styles.imagePlaceholder, compact && styles.imageCompact]} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, compact && styles.imageCompact]}>
            <Ionicons name="cube-outline" size={compact ? 32 : 48} color={colors.primary} />
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <StatusTag label={category?.symbol ?? (variant?.category ? 'VAR' : '')} variant="info" />
            <Text style={styles.meta}>{family?.name || brand}</Text>
          </View>
          {product?.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{product.location}</Text>
            </View>
          )}
          {variant ? (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Stock</Text>
                <Text style={styles.statValue}>{variant.stock ?? 0}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Unit</Text>
                <Text style={styles.statValue}>{variant.unit ?? 'pcs'}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Price</Text>
                <Text style={styles.price}>{formatCurrency(price)}</Text>
              </View>
            </View>
          ) : product ? (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Lots</Text>
                <Text style={styles.statValue}>{product.lotsAvailable}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Lot Size</Text>
                <Text style={styles.statValue}>{product.lotSize} MT</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Live Price</Text>
                <Text style={styles.price}>{formatCurrency(price)}</Text>
              </View>
            </View>
          ) : null}
          {!compact && (
            <Button
              title="Buy Now"
              onPress={() => (onBuy ? onBuy() : handlePress())}
              size="sm"
              fullWidth
              icon="cart-outline"
              style={styles.buyButton}
            />
          )}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 140,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageCompact: {
    height: 100,
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.liveRate,
  },
  liveText: {
    ...typography.caption,
    fontFamily: 'Inter_700Bold',
    color: colors.liveRate,
    fontSize: 10,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.heading3,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.caption,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  location: {
    ...typography.caption,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
  price: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.secondary,
    fontFamily: 'Inter_700Bold',
  },
  buyButton: {
    marginTop: spacing.xs,
  },
});
