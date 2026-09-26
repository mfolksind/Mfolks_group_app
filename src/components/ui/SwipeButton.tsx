import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/design-system';

interface SwipeButtonProps {
  onSwipeSuccess: () => void;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function SwipeButton({
  onSwipeSuccess,
  title = 'Swipe to Confirm',
  disabled = false,
  loading = false,
  style,
}: SwipeButtonProps) {
  const panX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const buttonWidth = 46; // Match handle width style

  // Keep state values in a mutable ref to solve hook closure issue
  const stateRef = useRef({ disabled, swiped, loading, containerWidth });
  stateRef.current = { disabled, swiped, loading, containerWidth };

  const swipeSuccessRef = useRef(onSwipeSuccess);
  swipeSuccessRef.current = onSwipeSuccess;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const { disabled: d, swiped: s, loading: l } = stateRef.current;
        return !d && !s && !l;
      },
      onStartShouldSetPanResponderCapture: () => {
        const { disabled: d, swiped: s, loading: l } = stateRef.current;
        return !d && !s && !l;
      },
      onMoveShouldSetPanResponder: (e, gestureState) => {
        const { disabled: d, swiped: s, loading: l } = stateRef.current;
        return !d && !s && !l && Math.abs(gestureState.dx) > 4;
      },
      onMoveShouldSetPanResponderCapture: (e, gestureState) => {
        const { disabled: d, swiped: s, loading: l } = stateRef.current;
        return !d && !s && !l && Math.abs(gestureState.dx) > 4;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (e, gestureState) => {
        const { containerWidth: cw } = stateRef.current;
        const maxDrag = cw - buttonWidth - 8;
        if (gestureState.dx > 0 && gestureState.dx <= maxDrag) {
          panX.setValue(gestureState.dx);
        } else if (gestureState.dx > maxDrag) {
          panX.setValue(maxDrag);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        const { containerWidth: cw } = stateRef.current;
        const maxDrag = cw - buttonWidth - 8;
        if (maxDrag > 0 && gestureState.dx >= maxDrag * 0.95) { // 95% threshold (must reach full right)
          setSwiped(true);
          Animated.timing(panX, {
            toValue: maxDrag,
            duration: 100,
            useNativeDriver: false,
          }).start(() => {
            swipeSuccessRef.current();
          });
        } else {
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  React.useEffect(() => {
    if (!loading && swiped) {
      setSwiped(false);
      panX.setValue(0);
    }
  }, [loading]);

  const maxDrag = containerWidth ? containerWidth - buttonWidth - 8 : 0;

  const textOpacity = panX.interpolate({
    inputRange: [0, maxDrag || 1],
    outputRange: [1, 0.2],
    extrapolate: 'clamp',
  });

  const trackColor = panX.interpolate({
    inputRange: [0, maxDrag || 1],
    outputRange: ['#FEE2E2', '#D1FAE5'], // Soft Red to Soft Green
    extrapolate: 'clamp',
  });

  const borderColor = panX.interpolate({
    inputRange: [0, maxDrag || 1],
    outputRange: ['#EF4444', '#10B981'], // Red to Green
    extrapolate: 'clamp',
  });

  const textColor = panX.interpolate({
    inputRange: [0, maxDrag || 1],
    outputRange: ['#991B1B', '#065F46'], // Dark Red to Dark Green
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        disabled && styles.disabled,
        { backgroundColor: trackColor, borderColor: borderColor },
        style,
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <>
          <Animated.Text style={[styles.text, { opacity: textOpacity, color: textColor }]} numberOfLines={1}>
            {title}
          </Animated.Text>
          <Animated.View
            style={[
              styles.handle,
              { transform: [{ translateX: panX }] },
            ]}
          >
            <Ionicons
              name={swiped ? 'checkmark' : 'arrow-forward'}
              size={22}
              color={colors.textInverse || '#FFFFFF'}
            />
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.bodyMedium,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'Inter_600SemiBold',
  },
  handle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
