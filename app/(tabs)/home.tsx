import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  ScrollView,
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
import { useNotifications } from '@/hooks/useNotifications';
import { getFeaturedVariants, searchVariants, getAllVariants } from '@/api/products.api';
import { getFamilies } from '@/api/families.api';
import { getActiveCategories } from '@/api/categories.api';
import { Variant, Category } from '@/types/backend';
import { liveRatesData } from '@/data/liveRatesAndNews';
import { colors, elevation, radius, spacing, typography } from '@/design-system';
import { getCache, setCache, getMemoryCache, CACHE_KEYS, CACHE_TTL } from '@/utils/cache';

// Helper to clean HTML tags from WordPress content
const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\[&hellip;\]/g, '...')
    .trim();
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getItemCount, addToCart } = useCart();
  const cartCount = getItemCount();
  const { unreadCount } = useNotifications();

  const activeFamilySlug = typeof user?.family === 'object' ? (user.family as any)?.slug : undefined;
  const activeFamilyId = typeof user?.family === 'object' ? (user.family as any)?._id : (typeof user?.family === 'string' ? user.family : undefined);
  const familyKey = activeFamilySlug || (typeof user?.family === 'string' ? user.family : 'default');

  const [search, setSearch] = useState('');
  const [familyCategories, setFamilyCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [catalogVariants, setCatalogVariants] = useState<Variant[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Fetch active categories for the user's selected family industry (like in Products screen)
  const fetchFamilyCategories = useCallback(async () => {
    try {
      const res = await getActiveCategories({
        familySlug: activeFamilySlug,
        familyId: activeFamilyId,
      });
      if (res.success && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.data)
            ? (res.data as any).data
            : [];
        setFamilyCategories(list);
      }
    } catch (err) {
      console.error('Error fetching categories for family on home:', err);
    }
  }, [activeFamilySlug, activeFamilyId]);

  // Fetch full catalog for fast instant filtering
  const fetchCatalogVariants = useCallback(async () => {
    try {
      setCatalogLoading(true);
      const res = await getAllVariants();
      if (res.success && res.data) {
        setCatalogVariants(res.data);
      }
    } catch (err) {
      console.error('Error loading catalog variants on home:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilyCategories();
    fetchCatalogVariants();
  }, [fetchFamilyCategories, fetchCatalogVariants]);

  // Synchronous in-memory lookup for instantaneous (0ms) render during tab switching
  const memProducts = getMemoryCache<Variant[]>(CACHE_KEYS.HOME_PRODUCTS(familyKey), CACHE_TTL.PRODUCTS);
  const memNews = getMemoryCache<any[]>(CACHE_KEYS.HOME_NEWS(familyKey), CACHE_TTL.NEWS);
  const memCats = getMemoryCache<Record<number, string>>(CACHE_KEYS.WP_CATEGORIES, CACHE_TTL.CATEGORIES);

  const [featuredProducts, setFeaturedProducts] = useState<Variant[]>(memProducts?.data || []);
  const [news, setNews] = useState<any[]>(memNews?.data || []);
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>(memCats?.data || {});
  const [currentFamilySlug, setCurrentFamilySlug] = useState<string>(activeFamilySlug || '');
  const [loading, setLoading] = useState<boolean>(!memProducts?.data || memProducts.data.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

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

  const fetchHomeData = async (options?: { silent?: boolean; force?: boolean }) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const silent = options?.silent ?? false;
    const force = options?.force ?? false;

    try {
      // Only show full loading spinner if we have no products to show at all
      if (!silent && featuredProducts.length === 0) {
        setLoading(true);
      }
      setError(null);
      lastFetchTimeRef.current = Date.now();

      // 1. Fetch featured products
      const productsRes = await getFeaturedVariants(6, { familySlug: activeFamilySlug, familyId: activeFamilyId });

      if (productsRes.success && productsRes.data) {
        const productsList = Array.isArray(productsRes.data)
          ? productsRes.data
          : Array.isArray((productsRes.data as any)?.data)
            ? (productsRes.data as any).data
            : [];
        setFeaturedProducts(productsList);
        setCache(CACHE_KEYS.HOME_PRODUCTS(familyKey), productsList);
      } else if (!productsRes.success) {
        console.error('Failed to load featured products:', productsRes.message);
      }

      // 2. Fetch families list to resolve user's family ID to slug
      let resolvedFamilySlug = '';
      try {
        const famRes = await getFamilies();
        if (famRes.success && famRes.data) {
          const userFamId = activeFamilyId || '';
          const matchedFam = famRes.data.find(f => f._id === userFamId);
          if (matchedFam) {
            resolvedFamilySlug = matchedFam.slug?.toLowerCase() || '';
          }
        }
      } catch (famErr) {
        console.error('Error fetching families in home:', famErr);
      }

      if (!resolvedFamilySlug && typeof user?.family === 'object') {
        resolvedFamilySlug = (user.family as any)?.slug?.toLowerCase() || '';
      }
      setCurrentFamilySlug(resolvedFamilySlug);

      // 3. Fetch WordPress categories mapping (only if missing or forced)
      let currentCategories = categoriesMap;
      if (force || Object.keys(currentCategories).length === 0) {
        try {
          const catRes = await fetch('https://mfolks.com/wp-json/wp/v2/categories?per_page=100');
          if (catRes.ok) {
            const catData = await catRes.json();
            let catMap: Record<number, string> = {};
            catData.forEach((c: any) => {
              catMap[c.id] = c.name;
            });
            setCategoriesMap(catMap);
            setCache(CACHE_KEYS.WP_CATEGORIES, catMap);
            currentCategories = catMap;
          }
        } catch (catErr) {
          console.error('Error fetching categories in home:', catErr);
        }
      }

      // 4. Fetch WordPress news posts matching the user family
      try {
        let postsUrl = 'https://mfolks.com/wp-json/wp/v2/posts?per_page=15';
        const familyId = resolvedFamilySlug.includes('geotrix') ? '205' : (resolvedFamilySlug.includes('thermox') ? '206' : '');
        if (familyId) {
          postsUrl += `&categories=${familyId}`;
        }
        const postsRes = await fetch(postsUrl);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setNews(postsData);
          setCache(CACHE_KEYS.HOME_NEWS(familyKey), postsData);
        }
      } catch (newsErr) {
        console.error('Error fetching posts in home:', newsErr);
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Restore cache on mount / family change
  useEffect(() => {
    let isMounted = true;

    const restoreFromStorage = async () => {
      const [prodCache, newsCache, catCache] = await Promise.all([
        getCache<Variant[]>(CACHE_KEYS.HOME_PRODUCTS(familyKey), CACHE_TTL.PRODUCTS),
        getCache<any[]>(CACHE_KEYS.HOME_NEWS(familyKey), CACHE_TTL.NEWS),
        getCache<Record<number, string>>(CACHE_KEYS.WP_CATEGORIES, CACHE_TTL.CATEGORIES),
      ]);

      if (!isMounted) return;

      const hasProducts = Boolean(prodCache?.data && prodCache.data.length > 0);
      const hasNews = Boolean(newsCache?.data && newsCache.data.length > 0);

      if (hasProducts) {
        setFeaturedProducts(prodCache!.data);
        setLoading(false);
      }
      if (hasNews) {
        setNews(newsCache!.data);
      }
      if (catCache?.data) {
        setCategoriesMap(catCache.data);
      }

      // Background revalidate if stale or missing
      const shouldRevalidate = !hasProducts || prodCache?.isStale || !hasNews || newsCache?.isStale;
      if (shouldRevalidate) {
        fetchHomeData({ silent: hasProducts });
      }
    };

    restoreFromStorage();

    return () => {
      isMounted = false;
    };
  }, [familyKey]);

  // Handle tab focus: DO NOT wipe data or show spinners!
  // Only silently revalidate in the background if data is older than 5 minutes.
  useFocusEffect(
    useCallback(() => {
      const age = Date.now() - lastFetchTimeRef.current;
      if (age > CACHE_TTL.PRODUCTS) {
        fetchHomeData({ silent: true });
      }
    }, [familyKey, activeFamilySlug, activeFamilyId]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData({ silent: true, force: true }).finally(() => setRefreshing(false));
  }, [familyKey, activeFamilySlug, activeFamilyId]);

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

  const isGeotrix = currentFamilySlug.includes('geotrix');
  const isThermox = currentFamilySlug.includes('thermox');

  // Filter WordPress news posts locally to enforce strict Geotrix/Thermox bounds
  const familyFilteredNews = news.filter((article) => {
    const categoriesList = article.categories || [];
    if (isGeotrix) {
      return categoriesList.includes(205);
    } else if (isThermox) {
      return categoriesList.includes(206);
    }
    return false;
  });

  // Top 2 industry news for home page
  const topNews = familyFilteredNews.slice(0, 2);

  const isSearching = search.trim().length > 0;
  const isCategoryFiltered = selectedCategoryId !== 'all';
  const isFilterActive = isSearching || isCategoryFiltered;

  const selectedCategoryObj = familyCategories.find((c) => c._id === selectedCategoryId);

  const filteredCatalogProducts = useMemo(() => {
    if (!isFilterActive) return [];

    let list = catalogVariants;

    // 1. Strictly filter by user's family industry (like in Products screen)
    if (activeFamilyId) {
      list = list.filter((item: any) => {
        const itemFamily = item.family || item.product?.family;
        if (!itemFamily) return false;
        const itemFamId = typeof itemFamily === 'object' && itemFamily !== null ? itemFamily._id || itemFamily.id : itemFamily;
        return String(itemFamId) === String(activeFamilyId);
      });
    }

    // 2. Filter by selected category if not 'all'
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      list = list.filter((item: any) => {
        const vCat = typeof item.category === 'object' && item.category !== null ? item.category?._id : item.category;
        const pCat = typeof item.product?.category === 'object' && item.product?.category !== null ? item.product?.category?._id : item.product?.category;
        return String(vCat) === String(selectedCategoryId) || String(pCat) === String(selectedCategoryId);
      });
    }

    // 3. Filter by search query if entered
    const query = search.trim().toLowerCase();
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      list = list.filter((item: any) => {
        const vName = (item.variantName || '').toLowerCase();
        const pName = (item.product?.name || item.name || '').toLowerCase();
        const sku = (item.sku || '').toLowerCase();
        const desc = (item.description || item.shortDescription || '').toLowerCase();
        const cat = typeof item.category === 'object' && item.category !== null ? (item.category?.name || '') : '';
        const combined = `${vName} ${pName} ${sku} ${desc} ${cat}`.toLowerCase();
        return terms.every((t) => combined.includes(t));
      });
    }

    return list;
  }, [catalogVariants, isFilterActive, activeFamilyId, selectedCategoryId, search]);

  const displayedProducts = featuredProducts;

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
            onPress={() => router.push('/support' as any)}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.btnPressed]}
            hitSlop={8}
            accessibilityLabel="Support"
          >
            <Ionicons name="headset-outline" size={22} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.btnPressed]}
            hitSlop={8}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.btnPressed]}
            hitSlop={8}
            accessibilityLabel="Shopping Cart"
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
          placeholder="Search products, materials, SKUs..."
          onClear={() => setSearch('')}
        />

        {/* Industry Family Categories (Filtered by User's Family) */}
        {familyCategories.length > 0 && (
          <View style={styles.quickTagsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickTagsScroll}
            >
              <Pressable
                onPress={() => setSelectedCategoryId('all')}
                style={[
                  styles.quickTagChip,
                  selectedCategoryId === 'all' && styles.quickTagChipActive,
                ]}
                hitSlop={4}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons
                    name="grid"
                    size={12}
                    color={selectedCategoryId === 'all' ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.quickTagText,
                      selectedCategoryId === 'all' && styles.quickTagTextActive,
                    ]}
                  >
                    All
                  </Text>
                </View>
              </Pressable>

              {familyCategories.map((cat) => {
                const isActive = selectedCategoryId === cat._id;
                return (
                  <Pressable
                    key={cat._id}
                    onPress={() => setSelectedCategoryId(isActive ? 'all' : cat._id)}
                    style={[
                      styles.quickTagChip,
                      isActive && styles.quickTagChipActive,
                    ]}
                    hitSlop={4}
                  >
                    <Text
                      style={[
                        styles.quickTagText,
                        isActive && styles.quickTagTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {isFilterActive ? (
          <View style={styles.searchResultsSection}>
            <View style={styles.searchResultsHeader}>
              <View style={styles.searchHeaderLeft}>
                <Text style={styles.searchResultsTitle}>
                  {selectedCategoryObj
                    ? (isSearching ? `"${selectedCategoryObj.name}" Matches` : selectedCategoryObj.name)
                    : (isSearching ? 'Search Results' : 'All Products')}
                </Text>
                <View style={styles.resultsBadge}>
                  <Text style={styles.resultsBadgeText}>
                    {filteredCatalogProducts.length} {filteredCatalogProducts.length === 1 ? 'Product' : 'Products'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setSearch('');
                  setSelectedCategoryId('all');
                }}
                style={styles.clearSearchBtn}
                hitSlop={8}
              >
                <Text style={styles.clearSearchBtnText}>Reset</Text>
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </Pressable>
            </View>

            {catalogLoading && filteredCatalogProducts.length === 0 ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchLoadingText}>Loading products...</Text>
              </View>
            ) : filteredCatalogProducts.length > 0 ? (
              <View style={styles.productsTwoColumnGrid}>
                {filteredCatalogProducts.map((product) => (
                  <View key={product._id} style={styles.gridItemHalf}>
                    <ProductCard variant={product} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noResultsCard}>
                <View style={styles.noResultsIconCircle}>
                  <Ionicons name="cube-outline" size={32} color={colors.textSecondary} />
                </View>
                <Text style={styles.noResultsTitle}>No products found</Text>
                <Text style={styles.noResultsSubtitle}>
                  {isSearching
                    ? `No products found matching "${search}" in this category.`
                    : 'No products currently available in this category for your industry.'}
                </Text>
                <View style={styles.noResultsActions}>
                  <Pressable
                    style={styles.clearSearchActionBtn}
                    onPress={() => {
                      setSearch('');
                      setSelectedCategoryId('all');
                    }}
                  >
                    <Ionicons name="refresh-outline" size={15} color={colors.primary} />
                    <Text style={styles.clearSearchActionText}>Reset Filters</Text>
                  </Pressable>
                  <Pressable
                    style={styles.browseCatalogActionBtn}
                    onPress={() => router.push('/(tabs)/products')}
                  >
                    <Text style={styles.browseCatalogActionText}>Browse Categories</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ) : (
          <>
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
            <SectionHeader
              title="Featured Products"
              actionLabel="See All"
              onAction={() => router.push('/(tabs)/products')}
            />
            {loading && featuredProducts.length === 0 ? (
              <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : displayedProducts.length > 0 ? (
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

            {/* Latest Industry News (After Featured Products) */}
            <SectionHeader
              title="Latest Industry News"
              actionLabel="See All"
              onAction={() => router.push('/industry-news')}
            />
            {loading && topNews.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : topNews.length > 0 ? (
              topNews.map((article) => {
                const subCatId = article.categories?.find((id: number) => id !== 205 && id !== 206);
                const subCatName = subCatId ? categoriesMap[subCatId] : '';

                return (
                  <Pressable
                    key={article.id}
                    onPress={() =>
                      router.push({
                        pathname: '/news/[newsId]',
                        params: {
                          newsId: article.id.toString(),
                          title: article.title?.rendered,
                          content: article.content?.rendered,
                          date: article.date,
                          url: article.link,
                        },
                      })
                    }
                  >
                    <Card style={styles.newsSmallCard}>
                      <View style={styles.newsSmallHeader}>
                        <Badge
                          label={subCatName ? subCatName.toUpperCase() : (article.categories?.includes(205) ? 'GEOTRIX' : 'THERMOX')}
                          variant="info"
                        />
                        <Text style={styles.newsDate}>
                          {article.date
                            ? new Date(article.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                            : 'N/A'}
                        </Text>
                      </View>
                      <Text style={styles.newsTitle} numberOfLines={2}>
                        {stripHtmlTags(article.title?.rendered)}
                      </Text>
                      <Text style={styles.newsSummary} numberOfLines={2}>
                        {stripHtmlTags(article.excerpt?.rendered || article.content?.rendered)}
                      </Text>
                      <View style={styles.newsSmallFooter}>
                        <Text style={styles.readTimeText}>3 min read</Text>
                        <View style={styles.readLink}>
                          <Text style={styles.readLinkText}>Read More</Text>
                          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No articles available</Text>
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
          </>
        )}
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
  quickTagsContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  quickTagsScroll: {
    alignItems: 'center',
    paddingVertical: 2,
    gap: 6,
  },
  quickTagsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 2,
  },
  quickTagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickTagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickTagText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  quickTagTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchResultsSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchResultsTitle: {
    ...typography.heading2,
    fontSize: 18,
    color: colors.textPrimary,
  },
  resultsBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  resultsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  clearSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  clearSearchBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  searchLoadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  searchLoadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  noResultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...elevation.sm,
  },
  noResultsIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noResultsTitle: {
    ...typography.heading3,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  noResultsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearSearchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  clearSearchActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  browseCatalogActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  browseCatalogActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
