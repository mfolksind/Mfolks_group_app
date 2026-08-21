import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Badge, Card, Button } from '@/components/ui';
import { industryNewsData } from '@/data/liveRatesAndNews';
import { colors, radius, spacing, typography } from '@/design-system';

export default function NewsDetailScreen() {
  const router = useRouter();
  const { newsId } = useLocalSearchParams<{ newsId: string }>();

  const article = industryNewsData.find((item) => item.id === newsId) || industryNewsData[0];

  return (
    <View style={styles.container}>
      <AppBar title="Article Detail" showBack />

      <ScreenContainer scroll padded>
        <View style={styles.metaHeader}>
          <Badge label={article.category} variant="info" />
          <Text style={styles.date}>{article.date}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.readTime}>{article.readTime}</Text>
        </View>

        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Ionicons name="newspaper-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.authorName}>{article.author}</Text>
            <Text style={styles.authorRole}>Market Analysis Bureau</Text>
          </View>
        </View>

        {/* Summary Banner Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.summaryTitle}>Key Takeaway</Text>
          </View>
          <Text style={styles.summaryText}>{article.summary}</Text>
        </Card>

        {/* Article Body */}
        <View style={styles.bodyContainer}>
          {article.content.split('\n\n').map((paragraph, idx) => (
            <Text key={idx} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            title="Back to All News"
            variant="outline"
            onPress={() => router.back()}
            icon="arrow-back"
          />
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  dot: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  readTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.heading1,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    ...typography.bodyMedium,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  authorRole: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  summaryCard: {
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  summaryTitle: {
    ...typography.bodyMedium,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    fontSize: 13,
  },
  summaryText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  bodyContainer: {
    marginBottom: spacing.xl,
  },
  paragraph: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionContainer: {
    marginBottom: spacing.xl,
  },
});
