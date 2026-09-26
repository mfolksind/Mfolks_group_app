import { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card } from '@/components/ui';
import { colors, spacing, typography } from '@/design-system';

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const settings = [
    { label: 'Push Notifications', value: pushNotifications, onChange: setPushNotifications },

  ];

  return (
    <View style={styles.container}>
      <AppBar title="Settings" showBack />
      <ScreenContainer scroll padded>
        <Card padding={0}>
          {settings.map((setting, index) => (
            <View
              key={setting.label}
              style={[styles.settingRow, index < settings.length - 1 && styles.border]}
            >
              <Text style={styles.settingLabel}>{setting.label}</Text>
              <Switch
                value={setting.value}
                onValueChange={setting.onChange}
                trackColor={{ false: colors.divider, true: colors.primaryLight }}
                thumbColor={setting.value ? colors.primary : colors.textSecondary}
              />
            </View>
          ))}
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0 (Build 1)</Text>
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 56,
  },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  settingLabel: { ...typography.body },
  infoCard: { marginTop: spacing.lg },
  infoTitle: { ...typography.caption, marginBottom: spacing.xs },
  infoValue: { ...typography.bodyMedium },
});
