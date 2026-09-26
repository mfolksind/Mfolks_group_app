import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, SearchBar, Chip, Badge } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/design-system';
import { useAuth } from '@/context/AuthContext';
import { getFamilies } from '@/api/families.api';
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

import { useHardwareBack } from '@/hooks/useHardwareBack';

export default function IndustryNewsScreen() {
  const router = useRouter();
  useHardwareBack('/(tabs)/home');
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activeFamilySlug = typeof user?.family === 'object' ? (user.family as any)?.slug : undefined;
  const familyKey = activeFamilySlug || (typeof user?.family === 'string' ? user.family : 'default');

  // Synchronous memory check for instant display
  const memNews = getMemoryCache<any[]>(CACHE_KEYS.HOME_NEWS(familyKey), CACHE_TTL.NEWS);
  const memCats = getMemoryCache<Record<number, string>>(CACHE_KEYS.WP_CATEGORIES, CACHE_TTL.CATEGORIES);

  const [articles, setArticles] = useState<any[]>(memNews?.data || []);
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>(memCats?.data || {});
  const [loading, setLoading] = useState<boolean>(!memNews?.data || memNews.data.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFamilySlug, setCurrentFamilySlug] = useState<string>(activeFamilySlug || '');

  const isFetchingRef = React.useRef(false);

  const fetchCategoriesAndNews = async (options?: { silent?: boolean; force?: boolean }) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const silent = options?.silent ?? false;
    const force = options?.force ?? false;

    try {
      if (!silent && articles.length === 0) {
        setLoading(true);
      }
      setError(null);

      // 1. Fetch families list to resolve family ID to slug
      let resolvedFamilySlug = '';
      try {
        const famRes = await getFamilies();
        if (famRes.success && famRes.data) {
          const userFamId = typeof user?.family === 'object'
            ? (user.family as any)?._id || (user.family as any)?.id
            : (typeof user?.family === 'string' ? user?.family : '');

          const matchedFam = famRes.data.find(f => f._id === userFamId);
          if (matchedFam) {
            resolvedFamilySlug = matchedFam.slug?.toLowerCase() || '';
          }
        }
      } catch (famErr) {
        console.error('Error fetching families in news screen:', famErr);
      }

      // If resolving failed but user.family is already an object, use it as fallback
      if (!resolvedFamilySlug && typeof user?.family === 'object') {
        resolvedFamilySlug = (user.family as any)?.slug?.toLowerCase() || '';
      }

      setCurrentFamilySlug(resolvedFamilySlug);

      // 2. Fetch all WordPress categories to map IDs to Names
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
          console.error('Error fetching categories in news screen:', catErr);
        }
      }

      // 3. Fetch posts matching the active user family (205 for Geotrix, 206 for Thermox)
      let postsUrl = 'https://mfolks.com/wp-json/wp/v2/posts?per_page=45';
      const familyId = resolvedFamilySlug.includes('geotrix') ? '205' : (resolvedFamilySlug.includes('thermox') ? '206' : '');
      if (familyId) {
        postsUrl += `&categories=${familyId}`;
      }

      const postsRes = await fetch(postsUrl);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setArticles(postsData);
        setCache(CACHE_KEYS.HOME_NEWS(familyKey), postsData);
      } else if (articles.length === 0) {
        setError('Failed to fetch latest industry news');
      }
    } catch (err) {
      console.error('Error fetching categories/news/families:', err);
      if (articles.length === 0) {
        setError('Network error: Unable to load news');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const restoreNewsCache = async () => {
      const [newsCache, catCache] = await Promise.all([
        getCache<any[]>(CACHE_KEYS.HOME_NEWS(familyKey), CACHE_TTL.NEWS),
        getCache<Record<number, string>>(CACHE_KEYS.WP_CATEGORIES, CACHE_TTL.CATEGORIES),
      ]);

      if (!isMounted) return;

      const hasNews = Boolean(newsCache?.data && newsCache.data.length > 0);
      if (hasNews) {
        setArticles(newsCache!.data);
        setLoading(false);
      }
      if (catCache?.data) {
        setCategoriesMap(catCache.data);
      }

      const shouldRevalidate = !hasNews || newsCache?.isStale;
      fetchCategoriesAndNews({ silent: hasNews, force: shouldRevalidate });
    };

    restoreNewsCache();

    return () => {
      isMounted = false;
    };
  }, [familyKey]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategoriesAndNews({ silent: true, force: true });
  };

  // Find all category IDs present in the loaded family articles (excluding the family ID itself)
  const isGeotrix = currentFamilySlug.includes('geotrix');
  const isThermox = currentFamilySlug.includes('thermox');

  // 1. Filter articles locally based on User's Family (Geotrix: 205, Thermox: 206)
  const familyFiltered = articles.filter((article) => {
    const categoriesList = article.categories || [];
    if (isGeotrix) {
      return categoriesList.includes(205);
    } else if (isThermox) {
      return categoriesList.includes(206);
    }
    return false;
  });

  const familyCategoryIds = [205, 206];
  const uniqueCategoryIds: number[] = [];

  familyFiltered.forEach((article) => {
    if (article.categories && Array.isArray(article.categories)) {
      article.categories.forEach((catId: number) => {
        if (!familyCategoryIds.includes(catId) && !uniqueCategoryIds.includes(catId)) {
          if (categoriesMap[catId]) {
            uniqueCategoryIds.push(catId);
          }
        }
      });
    }
  });

  // Build filter chips list dynamically from WordPress categories
  const categories = [
    { key: 'all', label: 'All News' },
    ...uniqueCategoryIds.map((id) => ({
      key: id.toString(),
      label: categoriesMap[id] || `Cat ${id}`,
    })),
  ];

  // 2. Filter articles based on Chip Filter and Search query
  const filteredNews = familyFiltered.filter((article) => {
    const titleText = article.title?.rendered?.toLowerCase() || '';
    const contentText = article.content?.rendered?.toLowerCase() || '';

    const matchesCategory =
      selectedCategory === 'all' ||
      article.categories?.includes(parseInt(selectedCategory));

    const matchesSearch =
      titleText.includes(search.toLowerCase()) ||
      contentText.includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <AppBar
        title="Industry News"
        subtitle={currentFamilySlug ? `${currentFamilySlug.toUpperCase()} Market Analysis` : 'Latest Market Trends'}
        showBack
      />

      <ScreenContainer
        scroll
        padded
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {/* Search Bar */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search industry news..."
        />

        {/* Category Filters */}
        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {categories.map((cat) => (
              <Chip
                key={cat.key}
                label={cat.label}
                selected={selectedCategory === cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                style={styles.filterChip}
              />
            ))}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching latest updates...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={44} color={colors.error || '#EF4444'} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => fetchCategoriesAndNews({ force: true })}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((article) => {
            // Find a tag/sub-category badge that is not the family id
            const subCatId = article.categories?.find((id: number) => !familyCategoryIds.includes(id));
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
                <Card style={styles.newsCard}>
                  <View style={styles.cardHeader}>
                    <Badge
                      label={subCatName ? subCatName.toUpperCase() : (article.categories?.includes(205) ? 'GEOTRIX' : 'THERMOX')}
                      variant="info"
                    />
                    <Text style={styles.date}>
                      {article.date
                        ? new Date(article.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                        : 'N/A'}
                    </Text>
                  </View>

                  <Text style={styles.title}>{stripHtmlTags(article.title?.rendered)}</Text>
                  <Text style={styles.summary} numberOfLines={2}>
                    {stripHtmlTags(article.excerpt?.rendered || article.content?.rendered)}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.readTime}>3 min read</Text>
                    <View style={styles.readMore}>
                      <Text style={styles.readMoreText}>Read Article</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={44} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No news articles found</Text>
          </View>
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
  filterScroll: {
    marginBottom: spacing.md,
    paddingTop: 10,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  newsCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.heading3,
    fontSize: 16,
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  summary: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  readTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    ...typography.caption,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  retryButtonText: {
    ...typography.bodyMedium,
    color: colors.surface,
    fontWeight: '700',
  },
});
