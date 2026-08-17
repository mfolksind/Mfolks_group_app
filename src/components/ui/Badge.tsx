import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/design-system';

interface BadgeProps {
  count: number;
  max?: number;
}

export function Badge({ count, max = 99 }: BadgeProps) {
  if (count <= 0) return null;
  const display = count > max ? `${max}+` : String(count);

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  text: {
    ...typography.caption,
    color: colors.textInverse,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
});
