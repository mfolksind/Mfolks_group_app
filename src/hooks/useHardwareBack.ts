import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';

/**
 * Handles Android hardware back button press.
 * Intercepts the back button, calls navigation.goBack() or router.back(),
 * and falls back to fallbackRoute if the stack cannot go back.
 * Guarantees that the app never exits abruptly when on child screens.
 */
export function useHardwareBack(fallbackRoute: string = '/(tabs)/home') {
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const onBackPress = () => {
      try {
        if (navigation && typeof (navigation as any).canGoBack === 'function' && (navigation as any).canGoBack()) {
          (navigation as any).goBack();
          return true;
        }

        if (router.canGoBack()) {
          router.back();
          return true;
        }

        router.replace(fallbackRoute as never);
        return true;
      } catch (err) {
        try {
          router.replace(fallbackRoute as never);
        } catch (e) {}
        return true;
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [navigation, router, fallbackRoute]);
}
