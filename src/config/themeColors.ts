/**
 * Predefined Theme Colors
 * Clients can choose from these standardized color palettes
 *
 * Current Usage:
 * - cyan: ABE, AVMA
 * - blue: AMA, WAEPA, Default
 */
export const THEME_COLORS = {
  cyan: {
    primaryColor: '#0e7490',
    primaryLight: '#0891b2',
    primaryDark: '#155e75',
    secondaryColor: '#0369a1',
    secondaryLight: '#0284c7',
    secondaryDark: '#075985',
  },
  blue: {
    primaryColor: '#003d79',
    primaryLight: '#0052a3',
    primaryDark: '#002952',
    secondaryColor: '#1976d2',
    secondaryLight: '#42a5f5',
    secondaryDark: '#1565c0',
  },
  skyBlue: {
    primaryColor: '#056db9',
    primaryLight: '#3d8ed4',
    primaryDark: '#04528a',
    secondaryColor: '#00539B',
    secondaryLight: '#0073CF',
    secondaryDark: '#003D73',
  },
  green: {
    primaryColor: '#059669',
    primaryLight: '#10b981',
    primaryDark: '#047857',
    secondaryColor: '#0d9488',
    secondaryLight: '#14b8a6',
    secondaryDark: '#0f766e',
  },
  purple: {
    primaryColor: '#7c3aed',
    primaryLight: '#a855f7',
    primaryDark: '#6b21a8',
    secondaryColor: '#6366f1',
    secondaryLight: '#818cf8',
    secondaryDark: '#4f46e5',
  },
  orange: {
    primaryColor: '#ea580c',
    primaryLight: '#f97316',
    primaryDark: '#c2410c',
    secondaryColor: '#dc2626',
    secondaryLight: '#ef4444',
    secondaryDark: '#b91c1c',
  },
} as const;

export type ThemeColorName = keyof typeof THEME_COLORS;