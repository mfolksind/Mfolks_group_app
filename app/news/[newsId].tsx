import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, elevation } from '@/design-system';
import { useHardwareBack } from '@/hooks/useHardwareBack';

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
};

export default function NewsDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useHardwareBack('/industry-news');

  const { newsId, title, url, content } = useLocalSearchParams<{
    newsId: string;
    title?: string;
    url?: string;
    content?: string;
    date?: string;
  }>();

  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [showOfflineSummary, setShowOfflineSummary] = useState(false);

  // Construct target website permalink: prioritize real article url, fallback to mfolks.com post link
  const targetUrl = url && url.startsWith('http')
    ? url
    : (newsId ? `https://mfolks.com/?p=${newsId}` : 'https://mfolks.com/industry-news');

  const cleanTitle = title ? stripHtmlTags(title) : 'MFolks Industry Article';

  const handleBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      router.back();
    }
  };

  const handleReload = () => {
    setHasError(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  const handleOpenInBrowser = async () => {
    try {
      await Linking.openURL(targetUrl);
    } catch (err) {
      console.error('Failed to open article in browser:', err);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: cleanTitle,
        message: `${cleanTitle} - Read on MFOLKS:\n${targetUrl}`,
        url: targetUrl,
      });
    } catch (err) {
      console.error('Error sharing article:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom In-App Browser Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.btnPressed]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.domainBadge}>
              <Ionicons name="lock-closed" size={12} color="#16A34A" />
              <Text style={styles.domainText}>mfolks.com</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {cleanTitle}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={handleReload}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.btnPressed]}
              hitSlop={8}
            >
              <Ionicons name="reload" size={19} color={colors.textPrimary} />
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.btnPressed]}
              hitSlop={8}
            >
              <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
            </Pressable>

            <Pressable
              onPress={handleOpenInBrowser}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.btnPressed]}
              hitSlop={8}
            >
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Progress Bar */}
        {loading && progress < 1 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.max(progress * 100, 15)}%` }]} />
          </View>
        )}
      </View>

      {/* Main WebView Content */}
      {hasError ? (
        <View style={styles.errorCard}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.errorTitle}>Could not load article webpage</Text>
          <Text style={styles.errorSubtitle}>
            Please check your internet connection to load the live page on mfolks.com.
          </Text>

          <View style={styles.errorActions}>
            <Pressable style={styles.retryBtn} onPress={handleReload}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Retry Web View</Text>
            </Pressable>

            <Pressable
              style={styles.externalBtn}
              onPress={handleOpenInBrowser}
            >
              <Text style={styles.externalBtnText}>Open in Browser</Text>
              <Ionicons name="open-outline" size={15} color={colors.primary} />
            </Pressable>
          </View>

          {content && (
            <Pressable
              style={styles.toggleSummaryBtn}
              onPress={() => setShowOfflineSummary(!showOfflineSummary)}
            >
              <Text style={styles.toggleSummaryText}>
                {showOfflineSummary ? 'Hide Offline Summary' : 'Read Offline Summary'}
              </Text>
              <Ionicons
                name={showOfflineSummary ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.textSecondary}
              />
            </Pressable>
          )}

          {showOfflineSummary && content && (
            <View style={styles.offlineContentBox}>
              <Text style={styles.offlineContentText}>
                {stripHtmlTags(content)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.webContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: targetUrl }}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
            }}
            onLoadProgress={({ nativeEvent }) => {
              setProgress(nativeEvent.progress);
              if (nativeEvent.progress >= 1) {
                setLoading(false);
              }
            }}
            onLoadStart={() => {
              setLoading(true);
              setHasError(false);
            }}
            onLoadEnd={() => {
              setLoading(false);
            }}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsBackForwardNavigationGestures={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading mfolks.com article...</Text>
              </View>
            )}
            style={styles.webView}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    position: 'relative',
    ...elevation.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 2,
    paddingBottom: spacing.sm,
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  btnPressed: {
    opacity: 0.75,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
  },
  domainText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 180,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressTrack: {
    height: 2.5,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  progressBar: {
    height: 2.5,
    backgroundColor: colors.primary,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: '#F8FAFC',
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.heading3,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280,
    lineHeight: 18,
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  externalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  toggleSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    marginTop: 8,
  },
  toggleSummaryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  offlineContentBox: {
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    maxHeight: 200,
    width: '100%',
  },
  offlineContentText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
  },
});

