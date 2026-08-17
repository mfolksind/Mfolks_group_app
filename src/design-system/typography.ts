import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  } satisfies TextStyle,
  heading1: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  } satisfies TextStyle,
  heading2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  } satisfies TextStyle,
  heading3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  } satisfies TextStyle,
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.textInverse,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  } satisfies TextStyle,
} as const;
