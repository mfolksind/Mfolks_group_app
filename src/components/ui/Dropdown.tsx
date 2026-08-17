import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, spacing, typography } from '@/design-system';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export function Dropdown({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  required,
  error,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, error ? styles.errorBorder : null]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label ?? 'Select'}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    item.value === value && styles.selectedOption,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: layout.minTouchTarget,
  },
  errorBorder: {
    borderColor: colors.error,
  },
  value: {
    ...typography.body,
    flex: 1,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
  },
  sheetTitle: {
    ...typography.heading3,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: layout.minTouchTarget,
  },
  selectedOption: {
    backgroundColor: colors.primaryLight,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  optionText: {
    ...typography.body,
  },
  selectedOptionText: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.primaryDark,
  },
});
