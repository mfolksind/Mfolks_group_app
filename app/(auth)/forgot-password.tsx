import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Input, Button, Snackbar } from '@/components/ui';
import { colors, spacing, typography } from '@/design-system';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSnackbar(true);
  };

  return (
    <View style={styles.container}>
      <AppBar title="Forgot Password" showBack />
      <ScreenContainer scroll padded>
        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.description}>
          Enter your registered email address. We'll send you a link to reset your password.
        </Text>
        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
          required
        />
        <Button title="Send Reset Link" onPress={handleReset} loading={loading} fullWidth icon="send-outline" />
        <Button
          title="Back to Login"
          onPress={() => router.back()}
          variant="ghost"
          fullWidth
          style={styles.backButton}
        />
      </ScreenContainer>
      <Snackbar
        visible={snackbar}
        message="Password reset link sent to your email"
        variant="success"
        onDismiss={() => setSnackbar(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heading: {
    ...typography.heading1,
    marginTop: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  backButton: {
    marginTop: spacing.sm,
  },
});
