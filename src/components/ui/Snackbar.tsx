import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, elevation, radius, spacing, typography } from '@/design-system';

type SnackbarVariant = 'default' | 'success' | 'error' | 'warning';

interface SnackbarProps {
  visible: boolean;
  message: string;
  variant?: SnackbarVariant;
  onDismiss: () => void;
  duration?: number;
}

const variantConfig = {
  default: { bg: colors.textPrimary, icon: 'information-circle' as const },
  success: { bg: colors.success, icon: 'checkmark-circle' as const },
  error: { bg: colors.error, icon: 'alert-circle' as const },
  warning: { bg: colors.warning, icon: 'warning' as const },
};

export function Snackbar({
  visible,
  message,
  variant = 'default',
  onDismiss,
  duration = 3000,
}: SnackbarProps) {
  const translateY = React.useRef(new Animated.Value(100)).current;
  const config = variantConfig[variant];

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, { toValue: 100, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, duration, onDismiss, translateY]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={[styles.snackbar, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={20} color={colors.textInverse} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    ...elevation.lg,
  },
  message: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    flex: 1,
  },
});
