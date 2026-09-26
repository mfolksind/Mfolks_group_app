import React, { useState } from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, typography } from '@/design-system';

interface HtmlDescriptionProps {
  content?: string;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

/**
 * Checks if a string contains HTML tags
 */
export const isHtmlFormat = (text?: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(text);
};

/**
 * Strips HTML tags for a clean plain text fallback
 */
export const stripHtml = (html?: string): string => {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export function HtmlDescription({
  content,
  style,
  containerStyle,
}: HtmlDescriptionProps) {
  const [webViewHeight, setWebViewHeight] = useState(60);

  if (!content || !content.trim()) {
    return null;
  }

  // If plain text (not HTML), render standard Text directly
  if (!isHtmlFormat(content)) {
    return (
      <View style={containerStyle}>
        <Text style={[styles.plainText, style]}>{content}</Text>
      </View>
    );
  }

  // HTML format: render with styled auto-height WebView
  const htmlDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
          }
          body {
            margin: 0;
            padding: 2px 0 10px 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
            color: #1E293B;
            font-size: 14px;
            line-height: 1.65;
            background-color: transparent;
            word-break: break-word;
          }
          p {
            margin: 0 0 12px 0;
            color: #334155;
          }
          p:last-child {
            margin-bottom: 0;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #0F172A;
            margin-top: 14px;
            margin-bottom: 8px;
            font-weight: 700;
            line-height: 1.35;
          }
          h1 { font-size: 18px; }
          h2 { font-size: 16px; }
          h3 { font-size: 15px; }
          strong, b {
            font-weight: 700;
            color: #0F172A;
          }
          ul, ol {
            padding-left: 20px;
            margin: 6px 0 12px 0;
          }
          li {
            margin-bottom: 5px;
            color: #334155;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #E2E8F0;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #E2E8F0;
            padding: 8px 10px;
            text-align: left;
            line-height: 1.45;
          }
          th {
            background-color: #F1F5F9;
            color: #0F172A;
            font-weight: 600;
          }
          tr:nth-child(even) td {
            background-color: #F8FAFC;
          }
          blockquote {
            margin: 8px 0;
            padding: 8px 12px;
            border-left: 3px solid #6363d3;
            background: #F8FAFC;
            color: #475569;
            border-radius: 0 6px 6px 0;
          }
          img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 8px 0;
          }
          a {
            color: #6363d3;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div id="content-root">${content}</div>
        <script>
          function postHeight() {
            var el = document.getElementById('content-root') || document.body;
            var height = Math.max(el.scrollHeight, document.documentElement.offsetHeight || 0, document.body.scrollHeight || 0);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(String(height));
            }
          }
          window.addEventListener('load', function() {
            setTimeout(postHeight, 50);
            setTimeout(postHeight, 300);
          });
          if (window.ResizeObserver) {
            new ResizeObserver(postHeight).observe(document.body);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, containerStyle, { minHeight: webViewHeight }]}>
      <WebView
        source={{ html: htmlDoc }}
        style={[styles.webView, { height: webViewHeight }]}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        onMessage={(event) => {
          const raw = Number(event.nativeEvent.data);
          if (!isNaN(raw) && raw > 20) {
            setWebViewHeight(raw + 16);
          }
        }}
        scalesPageToFit={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  plainText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  webView: {
    backgroundColor: 'transparent',
    opacity: 0.99,
  },
});
