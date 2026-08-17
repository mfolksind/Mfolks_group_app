import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Input, Button } from '@/components/ui';
import { colors, layout, radius, spacing, typography } from '@/design-system';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@mforks.com');
  const [password, setPassword] = useState('Demo@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      router.replace('/(tabs)/home');
    } else {
      setError('Invalid credentials. Use demo@mforks.com / Demo@123 for local testing.');
    }
  };

  return (
    <ScreenContainer scroll padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="hardware-chip" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your enterprise account</Text>
        </View>

        <View style={styles.form}>
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
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
            required
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <Button title="Sign In" onPress={handleLogin} loading={loading} fullWidth icon="log-in-outline" />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={styles.registerLink}>Register</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    backgroundColor: colors.primaryLight,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: layout.screenPadding,
    alignItems: 'center',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading1,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  form: {
    padding: layout.screenPadding,
    paddingTop: spacing.xl,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  forgotText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  registerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
});
