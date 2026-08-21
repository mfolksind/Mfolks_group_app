import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, SearchBar, Chip } from '@/components/ui';
import { liveRatesData, LiveRate } from '@/data/liveRatesAndNews';
import { colors, radius, spacing, typography } from '@/design-system';

export default function LiveRatesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [rates, setRates] = useState<LiveRate[]>(liveRatesData);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      // Simulate live price update
      setRates((prev) =>
        prev.map((item) => ({
          ...item,
          price: Math.round(item.price * (1 + (Math.random() * 0.01 - 0.005))),
        })),
      );
      setRefreshing(false);
    }, 800);
  }, []);

  const categories = [
    { key: 'all', label: 'All Rates' },
    { key: 'steel', label: 'Steel' },
    { key: 'copper', label: 'Copper' },
    { key: 'aluminium', label: 'Aluminium' },
    { key: 'non-ferrous', label: 'Non-Ferrous' },
    { key: 'ferrous', label: 'Ferrous' },
  ];

  const filteredRates = rates.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.unit.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Live Market Rates"
        subtitle="Real-time LME & Domestic Benchmarks"
        showBack
      />

      <ScreenContainer scroll padded refreshing={refreshing} onRefresh={onRefresh}>
        {/* Header Badge */}
        <View style={styles.liveHeaderBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveHeaderText}>LIVE MARKET UPDATES</Text>
          <Text style={styles.updateTime}>Updated 2 mins ago</Text>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search live market rates..."
        />

        {/* Category Filter Chips */}
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

        {/* Live Market Rates Card */}
        <Card style={styles.ratesCard} padding={0}>
          {filteredRates.length > 0 ? (
            filteredRates.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.rateRow,
                  index < filteredRates.length - 1 && styles.rateBorder,
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
                      size={12}
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
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No rates found matching your filter</Text>
            </View>
          )}
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
  liveHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,

  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34A853',
    marginRight: 2,

  },
  liveHeaderText: {
    ...typography.caption,
    fontFamily: 'Inter_700Bold',
    color: '#34A853',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  updateTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 'auto',
    fontSize: 11,
  },
  filterScroll: {
    marginBottom: spacing.md,
    paddingTop: 20,
  },
  filterChip: {
    marginRight: spacing.sm,

  },
  ratesCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  rateBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rateInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  rateName: {
    ...typography.heading3,
    fontSize: 15,
    marginBottom: 2,
  },
  rateUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  rateRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ratePrice: {
    ...typography.heading3,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    gap: 2,
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
