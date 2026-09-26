import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Detect Expo Go environment (SDK 53+ removed remote push from Expo Go)
const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  (Constants as any).appOwnership === 'expo';

// Safe dynamic import for expo-notifications to prevent Expo Go SDK 53 startup crash
let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications!.AndroidNotificationPriority.MAX,
        }),
      });
    }
  } catch (e) {
    console.log('[NotificationService] Safe load skipped (Expo Go)');
  }
}

import { triggerInAppBanner } from '../components/ui/GlobalNotificationBanner';

// Global deduplication cache for phone notifications (prevents duplicate popups within 5 seconds)
const recentlyShownNotifications = new Map<string, number>();

/**
 * Format notification title & body like Fortune 500 apps (Apple, Uber, Stripe, Amazon)
 */
const formatBrandContent = (title?: string, body?: string, data?: Record<string, any>) => {
  const rawTitle = (title || '').trim();
  const rawBody = (body || '').trim();
  const ticketId = data?.ticketId;
  const orderId = data?.orderId;
  const type = data?.type || '';

  let formattedTitle = rawTitle || 'Mfolks Update';
  let channelId = 'default';

  if (type.includes('TICKET') || ticketId || rawTitle.toLowerCase().includes('support') || rawTitle.toLowerCase().includes('ticket')) {
    formattedTitle = rawTitle.startsWith('💬') ? rawTitle : `💬 ${rawTitle || 'Mfolks Support Update'}`;
    channelId = 'support';
  } else if (type.includes('ORDER') || orderId || rawTitle.toLowerCase().includes('order')) {
    formattedTitle = rawTitle.startsWith('📦') ? rawTitle : `📦 ${rawTitle || 'Order Status Update'}`;
    channelId = 'orders';
  } else if (type.includes('PAYMENT') || rawTitle.toLowerCase().includes('payment')) {
    formattedTitle = rawTitle.startsWith('💳') ? rawTitle : `💳 ${rawTitle || 'Payment Notification'}`;
    channelId = 'payments';
  } else {
    formattedTitle = rawTitle.startsWith('⚡') ? rawTitle : `⚡ ${rawTitle}`;
  }

  return { formattedTitle, formattedBody: rawBody, channelId };
};

/**
 * Trigger an instant native phone notification on the device & in-app banner
 */
export const showPhoneNotification = async (params: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) => {
  const { formattedTitle, formattedBody, channelId } = formatBrandContent(
    params.title,
    params.body,
    params.data
  );

  // Always trigger sleek in-app floating banner when inside app
  triggerInAppBanner({
    title: formattedTitle,
    message: formattedBody,
    data: params.data,
  });

  if (isExpoGo || !Notifications) return;

  const now = Date.now();
  const notifKey = params.data?._id || params.data?.id || `${params.title}_${params.body}`;

  const lastTime = recentlyShownNotifications.get(notifKey);
  if (lastTime && now - lastTime < 5000) {
    console.log('[NotificationService] Suppressed duplicate phone notification:', notifKey);
    return;
  }

  recentlyShownNotifications.set(notifKey, now);

  // Clean up old entries
  if (recentlyShownNotifications.size > 50) {
    for (const [key, time] of recentlyShownNotifications.entries()) {
      if (now - time > 10000) recentlyShownNotifications.delete(key);
    }
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: formattedTitle,
        body: formattedBody,
        data: params.data || {},
        sound: 'default',
        badge: 1,
        color: '#2563EB',
      },
      trigger: null, // triggers immediately
    });
  } catch (error) {
    console.warn('Failed to schedule local phone notification:', error);
  }
};

/**
 * Register device for native push notifications (FCM / APNs)
 */
export const registerForPushNotificationsAsync = async (
  apiBaseUrl: string,
  accessToken: string
): Promise<string | null> => {
  if (isExpoGo || !Notifications) {
    console.log(
      '[NotificationService] Running in Expo Go — Native push notifications are disabled by Expo SDK 53. Socket notifications & in-app alerts are fully active. Use EAS development/preview build for native push tokens.'
    );
    return null;
  }

  if (!Device.isDevice) {
    console.log('[NotificationService] Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationService] Push notification permission denied');
      return null;
    }

    // Set Dedicated Android Notification Channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('support', {
        name: 'Customer Support & Chat',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#2563EB',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Tracking & Deliveries',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('payments', {
        name: 'Payment & Account Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 150, 150, 150],
        lightColor: '#059669',
        sound: 'default',
      });
    }

    // Get Native FCM / APNs Token
    let pushToken = '';
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      pushToken = deviceToken.data;
    } catch (_err) {
      try {
        // Fallback to Expo Push Token if native device token isn't available
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ||
          Constants.easConfig?.projectId;
        const expoToken = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        pushToken = expoToken.data;
      } catch (expoPushErr) {
        console.warn('[NotificationService] Could not obtain push token:', expoPushErr);
        return null;
      }
    }

    // Register token with backend if present
    if (pushToken && accessToken) {
      try {
        await fetch(`${apiBaseUrl}/api/notifications/fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ token: pushToken }),
        });
        console.log('✅ FCM Push Token registered with backend');
      } catch (e) {
        console.error('Failed to send FCM token to backend', e);
      }
    }

    return pushToken;
  } catch (err) {
    console.warn('[NotificationService] Registration error:', err);
    return null;
  }
};

/**
 * Unregister push token on logout
 */
export const unregisterPushToken = async (
  apiBaseUrl: string,
  accessToken: string,
  token: string
) => {
  try {
    await fetch(`${apiBaseUrl}/api/notifications/fcm-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.error('Failed to unregister push token', err);
  }
};
