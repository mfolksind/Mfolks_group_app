import { colors } from './colors';
import { typography, fontFamily } from './typography';
import { spacing, layout, grid } from './spacing';
import { radius, elevation } from './elevation';

export const theme = {
  colors,
  typography,
  fontFamily,
  spacing,
  layout,
  grid,
  radius,
  elevation,
} as const;

export type Theme = typeof theme;
