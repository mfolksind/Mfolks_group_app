import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius, spacing } from '@/design-system';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={140} borderRadius={0} />
      <View style={styles.cardContent}>
        <Skeleton height={20} width="80%" />
        <Skeleton height={14} width="50%" style={{ marginTop: spacing.sm }} />
        <Skeleton height={14} width="40%" style={{ marginTop: spacing.sm }} />
        <View style={styles.statsRow}>
          <Skeleton height={32} width="28%" />
          <Skeleton height={32} width="28%" />
          <Skeleton height={32} width="28%" />
        </View>
        <Skeleton height={40} style={{ marginTop: spacing.md }} />
      </View>
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={styles.home}>
      <Skeleton height={160} borderRadius={radius.lg} />
      <Skeleton height={48} style={{ marginTop: spacing.md }} />
      <View style={styles.chipRow}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={32} width={80} borderRadius={radius.full} />
        ))}
      </View>
      <ProductCardSkeleton />
      <ProductCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.skeleton,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardContent: {
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  home: {
    padding: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
});
