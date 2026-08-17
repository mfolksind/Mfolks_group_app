import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, elevation, radius, spacing } from '@/design-system';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  padding?: number;
}

export function Card({ children, style, elevated = true, padding = spacing.md }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && elevation.md,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
});
