import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography, elevation, radius } from '@/design-system';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user, registrationStatus } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 850, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }),
      Animated.timing(contentFadeAnim, { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 2600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2600, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(tabs)/home');
        } else if (
          registrationStatus === 'pending' ||
          (user && (user.status === 'inactive' || user.status === 'pending' || user.familyApprovalStatus === 'pending'))
        ) {
          router.replace('/(auth)/waiting-approval');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, registrationStatus, user]);

  return (
    <View style={styles.container}>
      {/* Ambient background soft glow orbs */}
      <Animated.View style={[styles.glowCircleTop, { transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.glowCircleBottom, { transform: [{ scale: pulseAnim }] }]} />
      <View style={styles.glowCircleCenter} />

      {/* Main Logo & Identity */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Unified Official MFolks Brand Logo Card */}
        <View style={styles.logoCard}>
          <Image
            source={require('../assets/mfolks-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Animated.View style={[styles.metaWrapper, { opacity: contentFadeAnim }]}>
          {/* Category Tag */}
          <View style={styles.categoryBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>B2B INDUSTRIAL EXCHANGE</Text>
          </View>

          <Text style={styles.subtitle}>India's Premier Manufacturing & Raw Material Network</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom Loading Status & Enterprise Guarantee */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomStatusContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingStatusText}>Securing verified mill network...</Text>
        </View>

        <View style={styles.trustBadgeRow}>
          <Ionicons name="shield-checkmark" size={13} color={colors.secondary} />
          <Text style={styles.trustBadgeText}>Enterprise Grade • Verified Supplier Ecosystem</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircleTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#EEF2FF',
    opacity: 0.7,
  },
  glowCircleBottom: {
    position: 'absolute',
    bottom: -90,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#ECFDF5',
    opacity: 0.7,
  },
  glowCircleCenter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F8FAFC',
    opacity: 0.8,
  },
  logoWrapper: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoCard: {
    width: 140,
    height: 140,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  metaWrapper: {
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomSection: {
    position: 'absolute',
    bottom: spacing.xxl + 8,
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  bottomStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  loadingStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  trustBadgeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
