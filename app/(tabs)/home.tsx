import { useEffect, useState, useCallback, useRef } from 'react';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import {
  SearchBar,
  SectionHeader,
  Card,
  Badge,
  HeroBannerCarousel,
  Snackbar,
  ProductCard,
} from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getFeaturedVariants } from '@/api/products.api';
import { Variant } from '@/types/backend';
import { liveRatesData, industryNewsData } from '@/data/liveRatesAndNews';
import { colors, elevation, radius, spacing, typography } from '@/design-system';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getItemCount, addToCart } = useCart();
  const cartCount = getItemCount();

  const [search, setSearch] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scroll-driven logo collapse/expand animation
  const isExpanded = useRef(true);
  const logoWidthAnim = useRef(new Animated.Value(1)).current; // 1 = full logo (140px), 0 = ball icon only (36px)

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;

    if (y > 35 && isExpanded.current) {

      isExpanded.current = false;

      Animated.spring(logoWidthAnim, {
        toValue: 0,
        friction: 11,
        tension: 32,
        useNativeDriver: false,
      }).start();

    } else if (y <= 6 && !isExpanded.current) {

      isExpanded.current = true;

      Animated.spring(logoWidthAnim, {
        toValue: 1,
        friction: 11,
        tension: 32,
        useNativeDriver: false,
      }).start();

    }
  };

  const logoContainerWidth = logoWidthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 140],
  });

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const productsRes = await getFeaturedVariants(6);

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
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
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

  const handleAddToCart = (product: Variant, e: any) => {
    e.stopPropagation();
    const res = addToCart(product, 1);
    setToastMessage(res.message);
  };

  // Top 5 live rates for home page
  const topLiveRates = liveRatesData.slice(0, 5);
  // Top 2 industry news for home page
  const topNews = industryNewsData.slice(0, 2);

  // Filter featured products by search text
  const displayedProducts = featuredProducts.filter((product) => {
    const name = (product.variantName || product.product?.name || '').toLowerCase();
    return search ? name.includes(search.toLowerCase()) : true;
  });

  return (
    <View style={styles.container}>
      {/* Scroll-Animated Executive Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <Animated.View style={[styles.logoContainer, { width: logoContainerWidth }]}>
          <Image
            source={require('../../assets/Mfolks_main - Copy.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.btnPressed]}
            hitSlop={8}
          >
            <Ionicons name="cart-outline" size={22} color={colors.textPrimary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.btnPressed]}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScreenContainer
        onRefresh={onRefresh}
        refreshing={refreshing}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        padded
      >
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
        />

        {/* Hero Banner Carousel */}
        <HeroBannerCarousel />

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          {[
            { icon: 'globe-outline' as const, label: 'Industry Articles', route: '/industry-news' },
            { icon: 'trending-up-outline' as const, label: 'Live Rates', route: '/live-rates' },
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

        {/* Live Market Rates (Before Featured Products) */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWithBadge}>
            <Text style={styles.sectionTitle}>Live Market Rates</Text>
            <View style={styles.livePulseDot} />
          </View>
          <Pressable onPress={() => router.push('/live-rates')}>
            <Text style={styles.viewAllAction}>View All</Text>
          </Pressable>
        </View>

        <Card style={styles.ratesCard} padding={0}>
          {topLiveRates.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.rateRow,
                index < topLiveRates.length - 1 && styles.rateBorder,
              ]}
            >
              <View style={styles.rateInfo}>
                <Text style={styles.rateName}>{item.name}</Text>
                <Text style={styles.rateUnit}>{item.unit}</Text>
              </View>

              <View style={styles.rateRight}>
                <Text style={styles.ratePrice}>{formatPrice(item.price)}</Text>
                <View
                  style={[
                    styles.trendBadge,
                    item.isPositive ? styles.badgePositive : styles.badgeNegative,
                  ]}
                >
                  <Ionicons
                    name={item.isPositive ? 'caret-up' : 'caret-down'}
                    size={11}
                    color={item.isPositive ? '#137333' : '#C5221F'}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      item.isPositive ? styles.textPositive : styles.textNegative,
                    ]}
                  >
                    {item.isPositive ? '+' : '-'}
                    {item.change.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Featured Products */}
        {!loading && (
          <>
            <SectionHeader
              title="Featured Products"
              actionLabel="See All"
              onAction={() => router.push('/(tabs)/products')}
            />
            {displayedProducts.length > 0 ? (
              <View style={styles.productsTwoColumnGrid}>
                {displayedProducts.slice(0, 8).map((product) => (
                  <View key={product._id} style={styles.gridItemHalf}>
                    <ProductCard variant={product} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No featured products available</Text>
            )}
          </>
        )}

        {/* Latest Industry News (After Featured Products) */}
        <SectionHeader
          title="Latest Industry News"
          actionLabel="See All"
          onAction={() => router.push('/industry-news')}
        />
        {topNews.map((article) => (
          <Pressable
            key={article.id}
            onPress={() => router.push(`/news/${article.id}`)}
          >
            <Card style={styles.newsSmallCard}>
              <View style={styles.newsSmallHeader}>
                <Badge count={1} />
                <Text style={styles.newsDate}>{article.date}</Text>
              </View>
              <Text style={styles.newsTitle} numberOfLines={2}>
                {article.title}
              </Text>
              <Text style={styles.newsSummary} numberOfLines={2}>
                {article.summary}
              </Text>
              <View style={styles.newsSmallFooter}>
                <Text style={styles.readTimeText}>{article.readTime}</Text>
                <View style={styles.readLink}>
                  <Text style={styles.readLinkText}>Read More</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </Card>
          </Pressable>
        ))}

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

      {/* Snackbar Toast */}
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
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingBottom: spacing.sm + 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...elevation.sm,
  },
  logoContainer: {
    height: 55,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnPressed: {
    opacity: 0.8,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.heading2,
    fontSize: 18,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34A853',
  },
  viewAllAction: {
    ...typography.caption,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  ratesCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  rateBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rateInfo: {
    flex: 1,
  },
  rateName: {
    ...typography.bodyMedium,
  },
  rateUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rateRight: {
    alignItems: 'flex-end',
  },
  ratePrice: {
    ...typography.bodyMedium,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  badgePositive: {
    backgroundColor: '#E6F4EA',
  },
  badgeNegative: {
    backgroundColor: '#FCE8E6',
  },
  trendText: {
    ...typography.caption,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  textPositive: {
    color: '#137333',
  },
  textNegative: {
    color: '#C5221F',
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

  productsTwoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  gridItemHalf: {
    width: '48.5%',
  },
  luxuryProductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...elevation.md,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
  cardImageFrame: {
    height: 165,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  fallbackCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  overlayTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  verifiedGlassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    elevation: 2,
  },
  verifiedGlassText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  overlayTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  discountBadgeTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  overlayBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 12,
  },
  stockPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stockPillGreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  stockPillRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockPillRedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },
  cardBody: {
    padding: spacing.md + 2,
  },
  brandSkuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  skuText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  luxuryProductTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
    marginBottom: 8,
  },
  specsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  specMiniPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  specMiniText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardPriceActionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceBlockGroup: {
    flex: 1,
  },
  mainPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  luxuryMainPrice: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  priceUnitLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  luxuryStrikethrough: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  luxuryCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
    ...elevation.sm,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  luxuryCartBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },

  /* News Section & Info Card */
  newsSmallCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  newsSmallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  newsDate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  newsTitle: {
    ...typography.heading3,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  newsSummary: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  newsSmallFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  readTimeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  readLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  infoCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryLight,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoTitle: {
    ...typography.heading3,
    color: colors.primaryDark,
  },
  infoText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
