import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Input, Button, Card, Snackbar } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, elevation } from '@/design-system';
import { forgotPassword, verifyOtp, resetPassword } from '@/api/auth.api';

type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Snackbar state
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarVariant, setSnackbarVariant] = useState<'default' | 'success' | 'error' | 'warning'>('default');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendTimer]);

  const showToast = (message: string, variant: 'default' | 'success' | 'error' | 'warning' = 'default') => {
    setSnackbarMessage(message);
    setSnackbarVariant(variant);
    setSnackbarVisible(true);
  };

  // Step 1: Send OTP to Email
  const handleRequestOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(trimmed);
      if (res.success) {
        showToast('Verification code sent to your email!', 'success');
        setStep('OTP');
        setResendTimer(60);
      } else {
        showToast(res.message || 'No account found with this email.', 'error');
      }
    } catch (err) {
      showToast('Failed to send verification code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      showToast('Please enter the verification code sent to your email.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email.trim(), trimmedOtp);
      if (res.success && res.data?.token) {
        setResetToken(res.data.token);
        showToast('Code verified! Set your new password.', 'success');
        setStep('NEW_PASSWORD');
      } else {
        showToast(res.message || 'Invalid or expired verification code.', 'error');
      }
    } catch (err) {
      showToast('Failed to verify code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      if (res.success) {
        showToast('New verification code sent!', 'success');
        setResendTimer(60);
      } else {
        showToast(res.message || 'Failed to resend code.', 'error');
      }
    } catch (err) {
      showToast('Error resending verification code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please recheck.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        token: resetToken,
        email: email.trim(),
        otp: otp.trim(),
        password,
      });

      if (res.success) {
        showToast('Password reset successfully! Redirecting to login...', 'success');
        setTimeout(() => {
          router.replace('/(auth)/login' as any);
        }, 1500);
      } else {
        showToast(res.message || 'Failed to reset password. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error resetting password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Reset Password"
        showBack
        onBack={() => {
          if (step === 'OTP') {
            setStep('EMAIL');
          } else if (step === 'NEW_PASSWORD') {
            setStep('OTP');
          } else {
            router.back();
          }
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScreenContainer scroll padded>
          {/* Step Progress Indicator */}
          <View style={styles.stepIndicatorContainer}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Text style={styles.stepDotText}>1</Text>
            </View>
            <View
              style={[
                styles.stepLine,
                (step === 'OTP' || step === 'NEW_PASSWORD') && styles.stepLineActive,
              ]}
            />
            <View
              style={[
                styles.stepDot,
                (step === 'OTP' || step === 'NEW_PASSWORD') && styles.stepDotActive,
              ]}
            >
              <Text
                style={[
                  styles.stepDotText,
                  step === 'EMAIL' && styles.stepDotTextInactive,
                ]}
              >
                2
              </Text>
            </View>
            <View
              style={[
                styles.stepLine,
                step === 'NEW_PASSWORD' && styles.stepLineActive,
              ]}
            />
            <View
              style={[
                styles.stepDot,
                step === 'NEW_PASSWORD' && styles.stepDotActive,
              ]}
            >
              <Text
                style={[
                  styles.stepDotText,
                  step !== 'NEW_PASSWORD' && styles.stepDotTextInactive,
                ]}
              >
                3
              </Text>
            </View>
          </View>

          {/* STEP 1: Enter Email */}
          {step === 'EMAIL' && (
            <Card style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-unread-outline" size={32} color={colors.primary} />
              </View>

              <Text style={styles.heading}>Forgot Password?</Text>
              <Text style={styles.description}>
                Enter the email address registered with your account. We will send you a 6-digit verification code.
              </Text>

              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                required
              />

              <Button
                title="Send Verification Code"
                onPress={handleRequestOtp}
                loading={loading}
                fullWidth
                icon="arrow-forward-outline"
                style={styles.actionButton}
              />

              <Button
                title="Return to Login"
                onPress={() => router.back()}
                variant="ghost"
                fullWidth
                style={styles.backButton}
              />
            </Card>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 'OTP' && (
            <Card style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />
              </View>

              <Text style={styles.heading}>Verify OTP Code</Text>
              <Text style={styles.description}>
                We sent a 6-digit verification code to{' '}
                <Text style={styles.highlightText}>{email}</Text>.
              </Text>

              <Input
                label="6-Digit Verification Code"
                value={otp}
                onChangeText={setOtp}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                leftIcon="key-outline"
                required
              />

              <Button
                title="Verify Code"
                onPress={handleVerifyOtp}
                loading={loading}
                fullWidth
                icon="checkmark-outline"
                style={styles.actionButton}
              />

              {/* Resend OTP Row */}
              <View style={styles.resendRow}>
                {resendTimer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend code in <Text style={{ fontWeight: '700' }}>{resendTimer}s</Text>
                  </Text>
                ) : (
                  <Pressable onPress={handleResendOtp} disabled={loading} hitSlop={8}>
                    <Text style={styles.resendLink}>Resend Verification Code</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => setStep('EMAIL')}
                style={styles.changeEmailBtn}
                hitSlop={8}
              >
                <Text style={styles.changeEmailText}>Wrong email? Change address</Text>
              </Pressable>
            </Card>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 'NEW_PASSWORD' && (
            <Card style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
              </View>

              <Text style={styles.heading}>Create New Password</Text>
              <Text style={styles.description}>
                Your code has been verified. Enter a secure new password for your account.
              </Text>

              <Input
                label="New Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter at least 6 characters"
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                required
              />

              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your new password"
                secureTextEntry={!showConfirmPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                required
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                icon="checkmark-circle-outline"
                style={styles.actionButton}
              />
            </Card>
          )}
        </ScreenContainer>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        variant={snackbarVariant}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepDotTextInactive: {
    color: colors.textSecondary,
  },
  stepLine: {
    width: 48,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginTop: spacing.xs,
    ...elevation.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.heading2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  highlightText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actionButton: {
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.xs,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  timerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  resendLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  changeEmailBtn: {
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  changeEmailText: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
