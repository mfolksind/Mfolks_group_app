import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Input, Button } from '@/components/ui';
import { colors, layout, radius, spacing, typography, elevation } from '@/design-system';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      router.replace('/(tabs)/home');
    } else if (res.isPending) {
      router.replace('/(auth)/waiting-approval');
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  return (
    <ScreenContainer scroll padded={false} backgroundColor="#FAFCFF">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Modern Header with Brand Identity */}
        <View style={styles.header}>
          {/* Subtle Ambient Background Decorative Shapes */}
          <View style={styles.headerAuraTop} />
          <View style={styles.headerAuraBottom} />

          {/* Unified Official MFolks Brand Logo Card */}
          <View style={styles.logoCard}>
            <Image
              source={require('../../assets/mfolks-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Enterprise Badge */}
          <View style={styles.portalBadge}>
            <View style={styles.portalDot} />
            <Text style={styles.portalBadgeText}>ENTERPRISE TRADING PORTAL</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to manage RFQs, live quotes & mill orders</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formCard}>
          <Input
            label="Business Email Address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            placeholder="name@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            required
          />
          <Input
            label="Account Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
            required
          />

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.error} style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
            hitSlop={8}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Button
            title="Sign In to Enterprise"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            icon="log-in-outline"
            style={styles.signInButton}
          />

          {/* Trust Value Pillars */}
          <View style={styles.trustFeaturesContainer}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={15} color={colors.secondary} />
              <Text style={styles.trustItemText}>Verified Mills</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="flash" size={15} color={colors.primary} />
              <Text style={styles.trustItemText}>Live Spot RFQs</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={15} color="#6366F1" />
              <Text style={styles.trustItemText}>Escrow Safe</Text>
            </View>
          </View>

          {/* Registration Promotion Card */}
          <View style={styles.registerCard}>
            <View style={styles.registerCardLeft}>
              <Text style={styles.registerCardTitle}>New to MFolks Marketplace?</Text>
              <Text style={styles.registerCardSubtitle}>Apply for verified buyer or supplier access</Text>
            </View>
            <Link href="/(auth)/register" asChild>
              <Pressable style={styles.registerButton}>
                <Text style={styles.registerButtonText}>Register</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </Link>
          </View>

          {/* Legal Compliance Footer */}
          <View style={styles.legalFooter}>
            <Text style={styles.legalFooterText}>
              By signing in, you agree to MFolks'{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://mfolks.com/app-terms-and-conditions/')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://mfolks.com/app-privacy-policy/')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 4,
    paddingHorizontal: layout.screenPadding,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
    position: 'relative',
    overflow: 'hidden',
  },
  headerAuraTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#EEF2FF',
    opacity: 0.6,
  },
  headerAuraBottom: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ECFDF5',
    opacity: 0.6,
  },
  logoCard: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: spacing.md,
  },
  logoImage: {
    width: 82,
    height: 82,
  },
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  portalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: 6,
  },
  portalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  formCard: {
    padding: layout.screenPadding,
    paddingTop: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
    fontWeight: '500',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  signInButton: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  trustFeaturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trustDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
  },
  registerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  registerCardLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  registerCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  registerCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  registerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  legalFooter: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  legalFooterText: {
    ...typography.caption,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
