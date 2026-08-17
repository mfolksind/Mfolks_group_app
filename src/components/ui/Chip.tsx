import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/design-system';

type ChipVariant = 'default' | 'primary' | 'secondary' | 'outline';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, variant = 'default', style }: ChipProps) {
  const variantStyles = {
    default: { bg: colors.background, text: colors.textSecondary, border: colors.divider },
    primary: { bg: colors.primaryLight, text: colors.primaryDark, border: colors.primary },
    secondary: { bg: colors.secondaryLight, text: colors.secondaryDark, border: colors.secondary },
    outline: { bg: 'transparent', text: colors.textPrimary, border: colors.divider },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : variantStyles.bg,
          borderColor: selected ? colors.primary : variantStyles.border,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.textInverse : variantStyles.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.caption,
    fontFamily: 'Inter_500Medium',
  },
});
