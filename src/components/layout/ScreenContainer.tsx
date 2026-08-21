import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ViewStyle,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout } from '@/design-system';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  backgroundColor?: string;
  onScroll?: (event: any) => void;
  scrollEventThrottle?: number;
}

export function ScreenContainer({
  children,
  scroll = true,
  padded = true,
  refreshing = false,
  onRefresh,
  style,
  backgroundColor = colors.background,
  onScroll,
  scrollEventThrottle = 16,
}: ScreenContainerProps) {

  const content = (
    <View
      style={[
        styles.content,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor },
      ]}
      edges={['top', 'left', 'right']}
    >
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 90,
  },

  content: {
    width: '100%',
    alignSelf: 'center',
  },

  padded: {
    paddingHorizontal: layout.screenPadding,
  },
});