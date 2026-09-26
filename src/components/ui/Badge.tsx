import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/design-system';

interface BadgeProps {
  count?: number;
  label?: string;
  variant?: 'info' | 'success' | 'warning' | 'error' | string;
  max?: number;
  children?: React.ReactNode;
}

export function Badge({ count, label, variant = 'info', max = 99, children }: BadgeProps) {
  if (count !== undefined && count <= 0) return null;
  const display = count !== undefined ? (count > max ? `${max}+` : String(count)) : (label || children);

  const getBgColor = () => {
    switch (variant) {
      case 'success': return '#DCFCE7';
      case 'warning': return '#FEF3C7';
      case 'error': return '#FEE2E2';
      case 'info':
      default: return colors.primaryLight;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success': return '#047857';
      case 'warning': return '#B45309';
      case 'error': return colors.error;
      case 'info':
      default: return colors.primaryDark;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBgColor() }]}>
      <Text style={[styles.text, { color: getTextColor() }]}>{display}</Text>
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
