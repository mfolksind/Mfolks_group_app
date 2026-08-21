import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { colors, elevation, layout, radius, spacing, typography } from '@/design-system';

interface AppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showCart?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

export function AppBar({
  title,
  subtitle,
  showBack = false,
  showCart = false,
  onBack,
  rightAction,
  transparent = false,
  style,
}: AppBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/home');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: layout.appBarHeight + insets.top,
        },
        transparent && styles.transparent,
        style,
      ]}
    >
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
      {rightAction ? (
        <View style={styles.right}>{rightAction}</View>
      ) : showCart ? (
        <View style={styles.right}>
          <Pressable
            onPress={() => router.push('/cart')}
            style={styles.cartButton}
            hitSlop={8}
          >
            <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {itemCount > 99 ? '99+' : itemCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      ) : null}
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
  cartButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error || '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
