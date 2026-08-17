import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, spacing, typography } from '@/design-system';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  success?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  success = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: { bg: colors.primary, text: colors.textInverse, border: colors.primary },
    secondary: { bg: colors.secondary, text: colors.textInverse, border: colors.secondary },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', text: colors.textPrimary, border: 'transparent' },
    danger: { bg: colors.error, text: colors.textInverse, border: colors.error },
  }[variant];

  const sizeStyles = {
    sm: { height: 40, paddingHorizontal: spacing.md, fontSize: 13 },
    md: { height: layout.minTouchTarget, paddingHorizontal: spacing.lg, fontSize: 14 },
    lg: { height: 56, paddingHorizontal: spacing.xl, fontSize: 16 },
  }[size];

  const iconColor = success ? colors.success : variantStyles.text;
  const bgColor = success ? colors.successLight : variantStyles.bg;
  const textColor = success ? colors.success : variantStyles.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor: success ? colors.success : variantStyles.border,
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={18} color={textColor} style={styles.iconLeft} />
          )}
          <Text style={[styles.text, { color: textColor, fontSize: sizeStyles.fontSize }]}>
            {success ? 'Success!' : title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={18} color={textColor} style={styles.iconRight} />
          )}
          {success && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.button,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
