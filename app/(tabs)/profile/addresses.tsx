import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, StatusTag } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/design-system';

export default function AddressesScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <AppBar title="Addresses" showBack />
      <ScreenContainer scroll padded>
        {user?.addresses?.map((address, index) => (
          <Card key={address._id ?? address.id ?? `${address.label}-${index}`} style={styles.addressCard}>
            <View style={styles.header}>
              <Text style={styles.label}>{address.label}</Text>
              {address.isDefault && <StatusTag label="Default" variant="success" />}
            </View>
            <Text style={styles.line}>{address.line1}</Text>
            {address.line2 ? <Text style={styles.line}>{address.line2}</Text> : null}
            <Text style={styles.line}>
              {address.city}, {address.state} - {address.pincode}
            </Text>
            <Text style={styles.country}>{address.country}</Text>
          </Card>
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 30 },
  addressCard: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  label: { ...typography.heading3 },
  line: { ...typography.body, color: colors.textSecondary, marginBottom: 2 },
  country: { ...typography.caption, marginTop: spacing.xs },
});
