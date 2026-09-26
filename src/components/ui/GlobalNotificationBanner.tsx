import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export interface InAppNotificationPayload {
  id?: string;
  title: string;
  message: string;
  type?: string;
  data?: Record<string, any>;
}

// Global listener for in-app floating banner
type BannerListener = (payload: InAppNotificationPayload) => void;
const bannerListeners = new Set<BannerListener>();

export const triggerInAppBanner = (payload: InAppNotificationPayload) => {
  bannerListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (e) {
      console.warn('[Banner] Error triggering in-app banner:', e);
    }
  });
};

export const GlobalNotificationBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentNotif, setCurrentNotif] = useState<InAppNotificationPayload | null>(null);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideBanner = (onComplete?: () => void) => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentNotif(null);
      if (onComplete) onComplete();
    });
  };

  const showBanner = (payload: InAppNotificationPayload) => {
    // If already showing, hide first then show new
    if (currentNotif) {
      hideBanner(() => {
        setCurrentNotif(payload);
        animateIn();
      });
    } else {
      setCurrentNotif(payload);
      animateIn();
    }
  };

  const animateIn = () => {
    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4.5 seconds
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      hideBanner();
    }, 4500);
  };

  useEffect(() => {
    const handleListener: BannerListener = (payload) => {
      showBanner(payload);
    };

    bannerListeners.add(handleListener);
    return () => {
      bannerListeners.delete(handleListener);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  if (!currentNotif) return null;

  const handlePress = () => {
    hideBanner();
    if (currentNotif.data?.ticketId) {
      router.push('/support' as any);
    } else if (currentNotif.data?.orderId) {
      router.push(`/orders/${currentNotif.data.orderId}` as any);
    } else {
      router.push('/notifications' as any);
    }
  };

  const getTypeMeta = (type?: string, title?: string) => {
    const lowerTitle = (title || '').toLowerCase();
    const t = type || '';
    if (t.includes('TICKET') || lowerTitle.includes('ticket') || lowerTitle.includes('support')) {
      return {
        icon: 'chatbubble-ellipses' as const,
        iconBg: '#2563EB',
        badge: 'SUPPORT',
      };
    }
    if (t.includes('ORDER') || lowerTitle.includes('order') || lowerTitle.includes('shipped')) {
      return {
        icon: 'cube' as const,
        iconBg: '#10B981',
        badge: 'ORDER',
      };
    }
    if (t.includes('PAYMENT') || lowerTitle.includes('payment') || lowerTitle.includes('bank')) {
      return {
        icon: 'card' as const,
        iconBg: '#059669',
        badge: 'PAYMENT',
      };
    }
    return {
      icon: 'sparkles' as const,
      iconBg: '#7C3AED',
      badge: 'ALERT',
    };
  };

  const meta = getTypeMeta(currentNotif.type, currentNotif.title);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Math.max(insets.top + 6, 12),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.bannerCard, pressed && styles.cardPressed]}
      >
        <View style={[styles.iconAvatar, { backgroundColor: meta.iconBg }]}>
          <Ionicons name={meta.icon} size={18} color="#FFFFFF" />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.topRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{meta.badge}</Text>
            </View>
            <Text style={styles.timeText}>Just now</Text>
          </View>

          <Text style={styles.titleText} numberOfLines={1}>
            {currentNotif.title}
          </Text>

          <Text style={styles.bodyText} numberOfLines={2}>
            {currentNotif.message}
          </Text>
        </View>

        <Pressable
          onPress={() => hideBanner()}
          style={styles.closeBtn}
          hitSlop={10}
        >
          <Ionicons name="close" size={16} color="#94A3B8" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 99999,
    elevation: 99999,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardPressed: {
    opacity: 0.92,
  },
  iconAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  bodyText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
