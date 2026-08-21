import { View, Text, StyleSheet, Linking } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/design-system';

const supportOptions = [
  { icon: 'call-outline' as const, label: 'Call Support', value: '+91 1800-123-4567', action: 'tel:+9118001234567' },
  { icon: 'mail-outline' as const, label: 'Email Support', value: 'support@metaltradepro.com', action: 'mailto:support@metaltradepro.com' },
  { icon: 'chatbubble-outline' as const, label: 'Live Chat', value: 'Available 9 AM - 6 PM IST', action: null },
];

export default function SupportScreen() {
  return (
    <View style={styles.container}>
      <AppBar title="Support" showBack />
      <ScreenContainer scroll padded>
        <Text style={styles.heading}>How can we help?</Text>
        <Text style={styles.description}>
          Our enterprise support team is available to assist with orders, registrations, and platform queries.
        </Text>

        {supportOptions.map((option) => (
          <Card key={option.label} style={styles.supportCard}>
            <View style={styles.supportRow}>
              <View style={styles.iconContainer}>
                <Ionicons name={option.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportLabel}>{option.label}</Text>
                <Text style={styles.supportValue}>{option.value}</Text>
              </View>
            </View>
            {option.action && (
              <Button
                title="Contact"
                variant="outline"
                size="sm"
                onPress={() => Linking.openURL(option.action!)}
                style={styles.contactButton}
              />
            )}
          </Card>
        ))}

        <Card style={styles.faqCard}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          {[
            'How long does registration approval take?',
            'What payment methods are accepted?',
            'How are live rates updated?',
            'Can I modify an order after submission?',
          ].map((q) => (
            <Text key={q} style={styles.faqItem}>• {q}</Text>
          ))}
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { ...typography.heading1, marginTop: spacing.md },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, marginTop: spacing.sm },
  supportCard: { marginBottom: spacing.md },
  supportRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportContent: { flex: 1 },
  supportLabel: { ...typography.bodyMedium },
  supportValue: { ...typography.caption, marginTop: 2 },
  contactButton: { alignSelf: 'flex-start' },
  faqCard: { marginTop: spacing.md },
  faqTitle: { ...typography.heading3, marginBottom: spacing.md },
  faqItem: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
});
