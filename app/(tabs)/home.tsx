import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import {
  SearchBar,
  SectionHeader,
  Card,
  Chip,
  Badge,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getActiveCategories } from '@/api/categories.api';
import { getFeaturedVariants } from '@/api/products.api';
import { Variant, Category } from '@/types/backend';
import { colors, elevation, radius, spacing, typography } from '@/design-system';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories and featured products in parallel
      const [categoriesRes, productsRes] = await Promise.all([
        getActiveCategories(),
        getFeaturedVariants(6),
      ]);

      // Handle categories response
      if (categoriesRes.success && categoriesRes.data) {
        const categoryList = Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : Array.isArray((categoriesRes.data as any)?.data)
            ? (categoriesRes.data as any).data
            : [];
        setCategories(categoryList);
      } else if (!categoriesRes.success) {
        console.error('Failed to load categories:', categoriesRes.message);
      }

      // Handle products response
      if (productsRes.success && productsRes.data) {
        const productsList = Array.isArray(productsRes.data)
          ? productsRes.data
          : Array.isArray((productsRes.data as any)?.data)
            ? (productsRes.data as any).data
            : [];
        setFeaturedProducts(productsList);
      } else if (!productsRes.success) {
        console.error('Failed to load featured products:', productsRes.message);
      }

      // Only show error if both failed
      if (!categoriesRes.success && !productsRes.success) {
        setError('Failed to load content');
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchHomeData();
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData().finally(() => setRefreshing(false));
  }, []);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Mfolks_main - Copy.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={styles.notifButton}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScreenContainer onRefresh={onRefresh} refreshing={refreshing} padded>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
        />

        {/* Hero Banner */}
        <Card style={styles.heroBanner} padding={0}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Industrial Metal Marketplace</Text>
            <Text style={styles.heroSubtitle}>
              Access quality metal products for domestic & international markets
            </Text>
            <Pressable
              style={styles.heroCta}
              onPress={() => router.push('/(tabs)/products')}
            >
              <Text style={styles.heroCtaText}>Browse Products</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
            </Pressable>
          </View>
        </Card>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          {[
            { icon: 'globe-outline' as const, label: 'Calculator' },
            { icon: 'home-outline' as const, label: 'Query' },
            { icon: 'cube-outline' as const, label: 'Categories', route: '/(tabs)/products' },
            { icon: 'receipt-outline' as const, label: 'Orders', route: '/(tabs)/orders' },
          ].map((action) => (
            <Pressable
              key={action.label}
              style={styles.quickAction}
              onPress={() => router.push(action.route as never)}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Categories */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <>
            <SectionHeader
              title="Categories"
              actionLabel="View All"
              onAction={() => router.push('/(tabs)/products')}
            />
            {categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
              >
                {categories.slice(0, 8).map((cat) => (
                  <Chip
                    key={cat._id}
                    label={cat.name}
                    onPress={() =>
                      router.push({
                        pathname: '/products/list',
                        params: { categoryId: cat._id, categoryName: cat.name },
                      })
                    }
                    style={styles.chip}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No categories available</Text>
            )}
          </>
        )}

        {/* Featured Products */}
        {!loading && (
          <>
            <SectionHeader
              title="Featured Products"
              actionLabel="See All"
              onAction={() => router.push('/(tabs)/products')}
            />
            {featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 4).map((product) => (
                <Pressable
                  key={product._id}
                  onPress={() =>
                    router.push({
                      pathname: '/products/[productId]',
                      params: { productId: product._id },
                    })
                  }
                >
                  <Card style={styles.productCard}>
                    <View style={styles.productHeader}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {product.variantName || product.product?.name}
                        </Text>
                        {product.product?.brand && (
                          <Text style={styles.productBrand}>{product.product.brand}</Text>
                        )}
                      </View>
                      {product.stock > 0 && (
                        <View style={styles.inStock}>
                          <Text style={styles.inStockText}>In Stock</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.productDetails}>
                      <Text style={styles.productPrice}>
                        {formatPrice(product.discountPrice || product.price)}
                      </Text>
                      {product.discountPrice && product.discountPrice < product.price && (
                        <Text style={styles.originalPrice}>
                          {formatPrice(product.price)}
                        </Text>
                      )}
                    </View>

                    {product.shortDescription && (
                      <Text style={styles.productDescription} numberOfLines={1}>
                        {product.shortDescription}
                      </Text>
                    )}
                  </Card>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No featured products available</Text>
            )}
          </>
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>Welcome to Mfolks</Text>
          </View>
          <Text style={styles.infoText}>
            Your trusted platform for industrial metal products. Browse, compare, and order from verified suppliers.
          </Text>
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: 30,
    backgroundColor: colors.surface,
    ...elevation.sm,
  },
  logoContainer: {
    flex: 1,
    height: 30,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  notifButton: {
    padding: spacing.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  heroBanner: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  heroContent: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  heroTitle: {
    ...typography.heading2,
    color: colors.textInverse,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.9,
    marginBottom: spacing.md,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textInverse,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  heroCtaText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  chipScroll: {
    marginBottom: spacing.lg,
  },
  chip: {
    marginRight: spacing.sm,
  },
  productCard: {
    marginBottom: spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...typography.heading3,
    marginBottom: spacing.xs,
  },
  productBrand: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inStock: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  inStockText: {
    ...typography.caption,
    color: colors.textInverse,
    fontSize: 10,
  },
  productDetails: {
    marginBottom: spacing.sm,
  },
  productPrice: {
    ...typography.heading3,
    color: colors.primary,
  },
  originalPrice: {
    ...typography.caption,
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  productDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoTitle: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
//   },
//   greeting: {
//     ...typography.caption,
//   },
//   logoContainer: {
//   justifyContent: 'center',
// },

// logo: {
//   width: 120,
//   height: 50,
// },
//   companyName: {
//     ...typography.heading3,
//   },
//   notifButton: {
//     width: 48,
//     height: 48,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   heroBanner: {
//     marginTop: spacing.md,
//     overflow: 'hidden',
//     backgroundColor: colors.primary,
//   },
//   heroContent: {
//     padding: spacing.lg,
//   },
//   heroTitle: {
//     ...typography.heading1,
//     color: colors.textInverse,
//     fontSize: 22,
//   },
//   heroSubtitle: {
//     ...typography.body,
//     color: 'rgba(255,255,255,0.85)',
//     marginTop: spacing.sm,
//     marginBottom: spacing.md,
//   },
//   heroCta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     paddingHorizontal: spacing.md,
//     paddingVertical: spacing.sm,
//     borderRadius: radius.full,
//     gap: spacing.xs,
//   },
//   heroCtaText: {
//     ...typography.button,
//     color: colors.textInverse,
//   },
//   quickActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: spacing.sm,
//   },
//   quickAction: {
//     alignItems: 'center',
//     width: '23%',
//   },
//   quickActionIcon: {
//     width: 52,
//     height: 52,
//     borderRadius: radius.md,
//     backgroundColor: colors.primaryLight,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: spacing.xs,
//   },
//   quickActionLabel: {
//     ...typography.caption,
//     textAlign: 'center',
//     fontSize: 11,
//   },
//   chipScroll: {
//     marginBottom: spacing.sm,
//   },
//   chip: {
//     marginRight: spacing.sm,
//   },
//   ratesCard: {
//     padding: 0,
//     overflow: 'hidden',
//   },
//   rateRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: spacing.md,
//   },
//   rateBorder: {
//     borderBottomWidth: 1,
//     borderBottomColor: colors.divider,
//   },
//   rateName: {
//     ...typography.bodyMedium,
//   },
//   rateCategory: {
//     ...typography.caption,
//     marginTop: 2,
//   },
//   rateRight: {
//     alignItems: 'flex-end',
//   },
//   rateValue: {
//     ...typography.bodyMedium,
//     fontFamily: 'Inter_700Bold',
//     color: colors.secondary,
//   },
//   rateChange: {
//     ...typography.caption,
//     fontFamily: 'Inter_600SemiBold',
//     marginTop: 2,
//   },
//   announcementCard: {
//     marginBottom: spacing.sm,
//   },
//   announcementHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: spacing.sm,
//   },
//   announcementDate: {
//     ...typography.caption,
//   },
//   announcementTitle: {
//     ...typography.heading3,
//     marginBottom: spacing.xs,
//   },
//   announcementMessage: {
//     ...typography.body,
//     color: colors.textSecondary,
//   },
//   recentCard: {
//     width: 280,
//     marginRight: spacing.md,
//   },
//   newsCard: {
//     marginBottom: spacing.sm,
//   },
//   newsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: spacing.sm,
//   },
//   newsDate: {
//     ...typography.caption,
//   },
//   newsTitle: {
//     ...typography.heading3,
//     marginBottom: spacing.xs,
//   },
//   newsSummary: {
//     ...typography.body,
//     color: colors.textSecondary,
//   },
// });
