import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import React from 'react';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, ErrorState, EmptyState } from '@/components/ui';
import { getActiveCategories } from '@/api/categories.api';
import { Category } from '@/types/backend';
import { colors, radius, spacing, typography } from '@/design-system';

export default function FamilyScreen() {
  const router = useRouter();

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
    React.useCallback(() => {
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

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <Pressable onPress={() => handleCategoryPress(item._id, item.name)}>
      <Card style={styles.categoryCard}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="cube-outline"
            size={28}
            color={colors.primary}
          />
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.categoryDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
      </Card>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <AppBar title="Product Categories" showBack={router.canGoBack()} />

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
                <Text style={styles.heading}>Select Product Category</Text>
                <Text style={styles.description}>
                  Browse products by category to find what you need.
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
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
});

