import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography, elevation } from '@/design-system';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
      Animated.timing(logoRotateAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  const rotateInterpolate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background Subtle Gradient Circles */}
      <View style={styles.glowCircleTop} />
      <View style={styles.glowCircleBottom} />

      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { rotate: rotateInterpolate }],
          },
        ]}
      >
        {/* Official Mfolks Logo Ball Icon */}
        <View style={styles.logoBallCard}>
          <Image
            source={require('../assets/Mfolks_main - Copy.png')}
            style={styles.logoBallImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.brandTitle}>Mfolks</Text>
        <Text style={styles.subtitle}>India's Premier Manufacturing & Industrial Exchange</Text>
      </Animated.View>

      {/* Loading Status Indicator */}
      <View style={styles.bottomStatusContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingStatusText}>Securing verified mill network...</Text>
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
  },
  glowCircleTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#EEF2FF',
    opacity: 0.6,
  },
  glowCircleBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#ECFDF5',
    opacity: 0.6,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoBallCard: {
    width: 65,
    height: 65,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  logoBallImage: {
    width: 220,
    height: 65,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 19,
    fontFamily: 'Inter_500Medium',
  },
  bottomStatusContainer: {
    position: 'absolute',
    bottom: spacing.xxl + 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
