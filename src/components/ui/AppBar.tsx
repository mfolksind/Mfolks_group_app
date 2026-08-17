import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, elevation, layout, radius, spacing, typography } from '@/design-system';

interface AppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

export function AppBar({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
  style,
}: AppBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
  };

  return (
    <View style={[styles.container, transparent && styles.transparent, style]}>
      <View style={styles.left}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: layout.appBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    backgroundColor: colors.surface,
    ...elevation.sm,
  },
  transparent: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
    borderRadius: radius.full,
  },
  pressed: {
    backgroundColor: colors.primaryLight,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.heading3,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  right: {
    marginLeft: spacing.sm,
  },
});
