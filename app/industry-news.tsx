import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, SearchBar, Chip, Badge } from '@/components/ui';
import { industryNewsData, NewsArticle } from '@/data/liveRatesAndNews';
import { colors, radius, spacing, typography } from '@/design-system';

export default function IndustryNewsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'All News' },
    { key: 'Steel Market', label: 'Steel' },
    { key: 'Non-Ferrous', label: 'Non-Ferrous' },
    { key: 'Policy & Regulations', label: 'Policy' },
    { key: 'Automotive & Alloys', label: 'Automotive' },
  ];

  const filteredNews = industryNewsData.filter((article) => {
    const matchesCategory =
      selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.summary.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <AppBar
        title="Industry News"
        subtitle="Latest Market Trends & Analysis"
        showBack
      />

      <ScreenContainer scroll padded>
        {/* Search Bar */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search industry news..."
        />

        {/* Category Filters */}
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

        {/* News Cards */}
        {filteredNews.length > 0 ? (
          filteredNews.map((article) => (
            <Pressable
              key={article.id}
              onPress={() => router.push(`/news/${article.id}`)}
            >
              <Card style={styles.newsCard}>
                <View style={styles.cardHeader}>
                  <Badge label={article.category} variant="info" />
                  <Text style={styles.date}>{article.date}</Text>
                </View>

                <Text style={styles.title}>{article.title}</Text>
                <Text style={styles.summary} numberOfLines={2}>
                  {article.summary}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.readTime}>{article.readTime}</Text>
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
          ))
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
    paddingTop: 40,
  },
  filterScroll: {
    marginBottom: spacing.md,
    paddingTop: 20,
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
});
