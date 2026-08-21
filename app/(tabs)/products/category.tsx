import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, StatusTag, ErrorState, EmptyState } from '@/components/ui';
import { getActiveCategories } from '@/api/categories.api';
import { Category } from '@/types/backend';
import { colors, spacing, typography } from '@/design-system';

export default function CategoryScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const buyingType = type ?? 'domestic';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getActiveCategories();

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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories]),
  );

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/products/list',
      params: {
        type: buyingType,
        categoryId,
        categoryName,
      },
    });
  };

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <Pressable
      onPress={() => handleCategoryPress(item._id, item.name)}
    >
      <Card style={styles.categoryCard}>
        <StatusTag label={item.slug?.substring(0, 3).toUpperCase() || 'CAT'} variant="info" />
        <View style={styles.categoryContent}>
          <Text style={styles.categoryName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.categoryDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        <Text style={styles.arrow}>›</Text>
      </Card>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <AppBar
        title="Category"
        subtitle={buyingType === 'domestic' ? 'Domestic Buying' : 'International Buying'}
        showBack={router.canGoBack()}
      />

      <ScreenContainer padded>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : error ? (
          <ErrorState
            title="Failed to Load Categories"
            message={error}
            onRetry={fetchCategories}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No Categories Available"
            message="No product categories are currently available."
          />
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            ListHeaderComponent={
              <>
                <Text style={styles.heading}>Select Category</Text>
                <Text style={styles.description}>
                  Choose a product category to browse available products.
                </Text>
              </>
            }
            ItemSeparatorComponent={() => null}
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
  listContent: {
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  heading: {
    ...typography.heading1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    ...typography.heading3,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
});

