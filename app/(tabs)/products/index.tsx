import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, SearchBar, ErrorState, EmptyState, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getActiveCategories } from '@/api/categories.api';
import { Category } from '@/types/backend';
import { colors, radius, spacing, typography, elevation } from '@/design-system';

export default function ProductsIndexScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Extract family slug from the user's active family (e.g. "geotrix")
  const activeFamilySlug = typeof user?.family === 'object' ? (user.family as any)?.slug : undefined;
  const activeFamilyId = typeof user?.family === 'object' ? (user.family as any)?._id : (typeof user?.family === 'string' ? user.family : undefined);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Pass familySlug so backend filters: GET /api/categories?familySlug=geotrix
      const response = await getActiveCategories({ familySlug: activeFamilySlug, familyId: activeFamilyId });

      if (response.success && response.data) {
        const categoryList = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as any)?.data)
            ? (response.data as any).data
            : [];
        setCategories(categoryList);
      } else {
        setError(response.message || 'Failed to load categories');
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [activeFamilySlug, activeFamilyId]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories]),
  );

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/products/list',
      params: {
        categoryId,
        categoryName,
      },
    });
  };

  // Icon chooser based on Category Name
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('steel') || lower.includes('tmt') || lower.includes('rebar')) {
      return 'cube-outline' as const;
    }
    if (lower.includes('coil') || lower.includes('sheet') || lower.includes('plate')) {
      return 'layers-outline' as const;
    }
    if (lower.includes('alum') || lower.includes('ingot')) {
      return 'shield-outline' as const;
    }
    if (lower.includes('copper') || lower.includes('wire') || lower.includes('brass')) {
      return 'flash-outline' as const;
    }
    if (lower.includes('pipe') || lower.includes('tube') || lower.includes('hollow')) {
      return 'analytics-outline' as const;
    }
    return 'grid-outline' as const;
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      return search.trim() === '' || cat.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [categories, search]);

  const renderCategoryCard = ({ item }: { item: Category }) => {
    const iconName = getCategoryIcon(item.name);

    return (
      <Pressable
        onPress={() => handleCategoryPress(item._id, item.name)}
        style={({ pressed }) => [
          styles.simpleCategoryCard,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={iconName} size={22} color={colors.primary} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.categoryTitle} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.categorySubtitle} numberOfLines={1}>
              {item.description}
            </Text>
          ) : (
            <Text style={styles.categorySubtitle} numberOfLines={1}>
              Browse verified product variants
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Categories"
        subtitle="Browse All Metal Categories"
        showBack={false}
        showCart
      />

      <ScreenContainer padded>
        {/* Simple Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search categories..."
          />
        </View>

        {loading ? (
          <View style={styles.skeletonContainer}>
            <Skeleton height={68} style={{ borderRadius: 12, marginBottom: spacing.sm }} />
            <Skeleton height={68} style={{ borderRadius: 12, marginBottom: spacing.sm }} />
            <Skeleton height={68} style={{ borderRadius: 12, marginBottom: spacing.sm }} />
            <Skeleton height={68} style={{ borderRadius: 12, marginBottom: spacing.sm }} />
          </View>
        ) : error ? (
          <ErrorState
            title="Failed to Load Categories"
            message={error}
            onRetry={fetchCategories}
          />
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            title="No Categories Found"
            message={search.trim() !== '' ? `No categories match "${search}".` : 'No product categories available.'}
          />
        ) : (
          <FlatList
            data={filteredCategories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
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
  searchContainer: {
    marginBottom: spacing.md,
  },
  skeletonContainer: {
    marginTop: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  simpleCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
    ...elevation.sm,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.988 }],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  categorySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
