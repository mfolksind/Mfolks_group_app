import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/design-system';
import { OrderStatus } from '@/types';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusTagProps {
  label: string;
  variant?: StatusVariant;
}

const variantColors: Record<StatusVariant, { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  error: { bg: colors.errorLight, text: colors.error },
  info: { bg: colors.primaryLight, text: colors.primaryDark },
  neutral: { bg: colors.background, text: colors.textSecondary },
};

export function StatusTag({ label, variant = 'neutral' }: StatusTagProps) {
  const { bg, text } = variantColors[variant];
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

export function getOrderStatusVariant(status: OrderStatus): StatusVariant {
  switch (status) {
    case 'completed':
      return 'success';
    case 'dispatched':
    case 'payment_received':
      return 'info';
    case 'confirm_order':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'neutral';
  }
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontFamily: 'Inter_600SemiBold',
  },
});
