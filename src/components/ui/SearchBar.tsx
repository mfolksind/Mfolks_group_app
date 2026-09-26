import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, elevation, layout, radius, spacing, typography } from '@/design-system';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  returnKeyType?: 'search' | 'done' | 'go' | 'next';
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search products, categories...',
  onFilterPress,
  onSubmitEditing,
  onClear,
  returnKeyType = 'search',
  autoFocus = false,
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={colors.textSecondary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
        </Pressable>
      )}
      {onFilterPress && (
        <Pressable onPress={onFilterPress} style={styles.filterButton} hitSlop={8}>
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: layout.minTouchTarget,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.sm,
    ...elevation.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  filterButton: {
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
});
