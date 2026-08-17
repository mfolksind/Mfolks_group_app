import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Button, Card, ErrorState, Skeleton } from '@/components/ui';
import { getVariantById } from '@/api/products.api';
import { Variant } from '@/types/backend';
import { colors, radius, spacing, typography } from '@/design-system';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const [variant, setVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
    React.useCallback(() => {
      fetchVariant();
    }, [fetchVariant]),
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Product Details" showBack />
        <ScreenContainer scroll padded>
          <Skeleton height={220} style={{ marginBottom: spacing.md }} />
          <Skeleton height={40} width="60%" style={{ marginBottom: spacing.md }} />
          <Skeleton height={20} width="40%" style={{ marginBottom: spacing.lg }} />
          <Skeleton height={120} style={{ marginBottom: spacing.md }} />
        </ScreenContainer>
      </View>
    );
  }

  if (error || !variant) {
    return (
      <View style={styles.container}>
        <AppBar title="Product Details" showBack />
        <ScreenContainer scroll padded>
          <ErrorState
            title={error ? 'Failed to Load Product' : 'Product Not Found'}
            message={error || 'The product you are looking for does not exist.'}
            onRetry={() => {
              fetchVariant();
            }}
          />
        </ScreenContainer>
      </View>
    );
  }

  // Get primary image
  const images = variant.images || [];
  const primaryImage = images.find((img) => img.isPrimary);
  const selectedImage = images[activeImageIndex] || primaryImage;
  const displayImage = selectedImage?.url || variant.thumbnail;

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.container}>
      <AppBar title="Product Details" showBack />
      <ScreenContainer scroll padded={false}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.mainImage}>
            {displayImage ? (
              <Image
                source={{ uri: displayImage }}
                style={styles.productImage}
                defaultSource={require('../../../assets/icon.png')}
              />
            ) : (
              <Ionicons name="cube-outline" size={80} color={colors.primary} />
            )}
            {variant.stock > 0 && (
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>In Stock</Text>
              </View>
            )}
          </View>

          {/* Image Gallery */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gallery}
              contentContainerStyle={styles.galleryContent}
            >
              {images.map((img, index) => (
                <Pressable
                  key={img._id}
                  onPress={() => setActiveImageIndex(index)}
                  style={[styles.thumbnail, activeImageIndex === index && styles.activeThumbnail]}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={styles.thumbnailImage}
                    defaultSource={require('../../../assets/icon.png')}
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.content}>
          {/* Title and Brand */}
          <Text style={styles.name}>{variant.variantName || variant.product?.name}</Text>
          {variant.product?.brand && (
            <Text style={styles.brand}>Brand: {variant.product.brand}</Text>
          )}

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>SKU: {variant.sku}</Text>
            {variant.stock > 0 && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaStock}>{variant.stock} in stock</Text>
              </>
            )}
          </View>

          {/* Price Card */}
          <Card style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>{formatPrice(variant.price)}</Text>
            </View>
            {variant.discountPrice && variant.discountPrice < variant.price && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discounted Price</Text>
                <Text style={styles.discountPrice}>{formatPrice(variant.discountPrice)}</Text>
              </View>
            )}
          </Card>

          {/* Stock Info */}
          <Card style={styles.stockCard}>
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>Available Stock</Text>
              <Text style={styles.stockValue}>{variant.stock} units</Text>
            </View>
            {variant.weight && (
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Weight</Text>
                <Text style={styles.stockValue}>{variant.weight} {variant.unit || 'unit'}</Text>
              </View>
            )}
          </Card>

          {/* Description */}
          {(variant.description || variant.shortDescription) && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {variant.description || variant.shortDescription}
              </Text>
            </>
          )}

          {/* Specifications */}
          {variant.dimensions && (
            <>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <Card style={styles.specCard}>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Dimensions</Text>
                  <Text style={styles.specValue}>{variant.dimensions}</Text>
                </View>
                {variant.weight && (
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Weight</Text>
                    <Text style={styles.specValue}>
                      {variant.weight} {variant.unit || 'unit'}
                    </Text>
                  </View>
                )}
              </Card>
            </>
          )}
        </View>
      </ScreenContainer>

      {/* Footer Action */}
      {variant.stock > 0 ? (
        <View style={styles.footer}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerLabel}>Price</Text>
            <Text style={styles.footerValue}>
              {formatPrice(variant.discountPrice || variant.price)}
            </Text>
          </View>
          <Button
            title="Buy Now"
            onPress={() =>
              router.push({
                pathname: '/products/buy',
                params: { variantId: variant._id },
              })
            }
            icon="cart-outline"
            style={styles.buyButton}
          />
        </View>
      ) : (
        <View style={styles.footer}>
          <Button
            title="Out of Stock"
            disabled
            style={styles.buyButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  imageSection: { backgroundColor: colors.primaryLight },
  mainImage: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  stockBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  stockText: {
    ...typography.caption,
    fontFamily: 'Inter_700Bold',
    color: colors.surface,
    fontSize: 10,
  },
  gallery: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  galleryContent: { gap: spacing.sm },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  activeThumbnail: { borderColor: colors.primary },
  content: { padding: spacing.md },
  name: { ...typography.heading1, marginBottom: spacing.xs },
  brand: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  meta: { ...typography.caption, color: colors.textSecondary },
  metaDot: { ...typography.caption, color: colors.textSecondary },
  metaStock: { ...typography.caption, color: colors.success },
  priceCard: { marginBottom: spacing.md },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  priceLabel: { ...typography.body, color: colors.textSecondary },
  price: { ...typography.heading2, color: colors.primary },
  discountPrice: { ...typography.heading3, color: colors.success },
  stockCard: { marginBottom: spacing.md },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stockLabel: { ...typography.body, color: colors.textSecondary },
  stockValue: { ...typography.bodyMedium },
  sectionTitle: { ...typography.heading2, marginBottom: spacing.md, marginTop: spacing.sm },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  specCard: { marginBottom: spacing.lg },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  specKey: { ...typography.body, color: colors.textSecondary },
  specValue: { ...typography.bodyMedium },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.md,
  },
  footerPrice: { flex: 1 },
  footerLabel: { ...typography.caption },
  footerValue: { ...typography.heading3, color: colors.primary },
  buyButton: { flex: 1 },
});

import { Pressable } from 'react-native';
