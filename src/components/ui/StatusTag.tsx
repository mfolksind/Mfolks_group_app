import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@/design-system';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusTagProps {
  label: string;
  variant?: StatusVariant;
  showDot?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

const variantColors: Record<StatusVariant, { bg: string; text: string; border: string; dot: string; defaultIcon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', dot: '#22C55E', defaultIcon: 'checkmark-circle' }, // Green: Confirmed, Completed, Delivered
  warning: { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', dot: '#F59E0B', defaultIcon: 'time' },             // Yellow/Amber: Pending, Payment Pending
  error: { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', dot: '#EF4444', defaultIcon: 'close-circle' },       // Red: Cancelled, Failed, Rejected
  info: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', dot: '#0EA5E9', defaultIcon: 'navigate-circle' },      // Blue: Shipped, Dispatched, Processing
  neutral: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', dot: '#64748B', defaultIcon: 'help-circle' },       // Slate: Unknown / Neutral
};

export function StatusTag({ label, variant = 'neutral', showDot = true, icon, style }: StatusTagProps) {
  const theme = variantColors[variant] || variantColors.neutral;
  const iconName = icon || theme.defaultIcon;

  return (
    <View style={[styles.tag, { backgroundColor: theme.bg, borderColor: theme.border }, style]}>
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: theme.dot }]} />
      ) : (
        <Ionicons name={iconName} size={12} color={theme.text} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

export function getOrderStatusVariant(status: string): StatusVariant {
  const s = (status || '').toLowerCase().trim();
  switch (s) {
    // Green (Confirmed, Completed, Delivered, Paid)
    case 'confirmed':
    case 'confirm_order':
    case 'completed':
    case 'delivered':
    case 'paid':
    case 'success':
      return 'success';

    // Red (Cancelled, Failed, Rejected)
    case 'cancelled':
    case 'canceled':
    case 'failed':
    case 'rejected':
      return 'error';

    // Yellow / Amber (Pending, Payment Pending)
    case 'pending':
    case 'payment_pending':
    case 'waiting_approval':
    case 'awaiting_payment':
    case 'on_hold':
      return 'warning';

    // Blue / Info (Shipped, Dispatched, Processing)
    case 'processing':
    case 'in_production':
    case 'dispatched':
    case 'shipped':
    case 'in_transit':
    case 'out_for_delivery':
    case 'payment_received':
      return 'info';

    default:
      return 'neutral';
  }
}

export function getOrderStatusLabel(status: string): string {
  if (!status) return 'Unknown';
  const s = status.toLowerCase().trim();
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    confirm_order: 'Confirmed',
    processing: 'Processing',
    in_production: 'In Production',
    payment_received: 'Payment Received',
    dispatched: 'Dispatched',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    failed: 'Failed',
    rejected: 'Rejected',
    returned: 'Returned',
    paid: 'Paid',
  };
  return labels[s] || status.toUpperCase();
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  icon: {
    marginRight: 1,
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.1,
  },
});
