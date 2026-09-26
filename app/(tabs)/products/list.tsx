import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, ProductCard, SearchBar, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { getVariantsByCategory } from '@/api/products.api';
import { Variant } from '@/types/backend';
import { colors, spacing, typography } from '@/design-system';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export default function ProductListScreen() {
  const router = useRouter();
  useHardwareBack('/(tabs)/products');
  const { type, categoryId, categoryName } = useLocalSearchParams<{
    type: string;
    categoryId: string;
    categoryName: string;
  }>();

  const [variants, setVariants] = useState<Variant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getVariantsByCategory(categoryId);

      if (response.success && response.data) {
        const variantList = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as any)?.data)
            ? (response.data as any).data
            : [];
        setVariants(variantList);
        setFilteredVariants(variantList);
      } else {
        setError(response.message || 'Failed to load products');
        setVariants([]);
        setFilteredVariants([]);
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
      setError('Failed to load products');
      setVariants([]);
      setFilteredVariants([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchVariants();
    }, [fetchVariants]),
  );

  // Filter variants based on search
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredVariants(variants);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = variants.filter(
        (variant) =>
          variant.variantName?.toLowerCase().includes(searchLower) ||
          variant.product?.name?.toLowerCase().includes(searchLower) ||
          variant.sku?.toLowerCase().includes(searchLower),
      );
      setFilteredVariants(filtered);
    }
  }, [search, variants]);

  const handleProductPress = (variantId: string) => {
    router.push({
      pathname: '/products/[productId]',
      params: {
        productId: variantId, // Note: This is actually the variant ID
      },
    });
  };

  const renderProductCard = ({ item }: { item: Variant }) => (
    <View style={styles.gridItemHalf}>
      <ProductCard variant={item} />
    </View>
  );

  const renderLoadingSkeletons = () => (
    <View style={styles.columnWrapper}>
      <Skeleton height={180} style={{ width: '48.5%', borderRadius: 14 }} />
      <Skeleton height={180} style={{ width: '48.5%', borderRadius: 14 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <AppBar
        title={categoryName ? categoryName : 'Product Variants'}
        subtitle="All Product Variants"
        showBack
        showCart
      />

      <ScreenContainer padded>
        {!loading && (
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${categoryName ?? 'variants'}...`}
          />
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            {renderLoadingSkeletons()}
          </View>
        ) : error ? (
          <ErrorState
            title="Failed to Load Variants"
            message={error}
            onRetry={() => {
              fetchVariants();
            }}
          />
        ) : filteredVariants.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No Variants Found"
            message={search.trim() !== '' ? 'No variants match your search.' : 'No variants available in this category.'}
          />
        ) : (
          <>
            <Text style={styles.count}>
              {filteredVariants.length} variant{filteredVariants.length !== 1 ? 's' : ''} available
            </Text>
            <FlatList
              data={filteredVariants}
              renderItem={renderProductCard}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              scrollEnabled={false}
            />
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    paddingTop: spacing.md,
  },
  count: {
    ...typography.caption,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  gridItemHalf: {
    width: '48.5%',
  },
});
