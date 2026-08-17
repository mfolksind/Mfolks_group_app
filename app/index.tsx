import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/design-system';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
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
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="hardware-chip" size={48} color={colors.textInverse} />
        </View>
        <Text style={styles.title}>MFolks Group</Text>
        <Text style={styles.subtitle}>Manufacturing Marketplace</Text>
      </Animated.View>
      <Text style={styles.tagline}>Enterprise Metal Platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.display,
    color: colors.textInverse,
    fontSize: 28,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
  },
  tagline: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    position: 'absolute',
    bottom: spacing.xxl,
  },
});
