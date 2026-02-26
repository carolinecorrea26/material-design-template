/**
 * Predefined Theme Colors
 * Clients can choose from these standardized color palettes.
 * Each theme has a primary color with a darker variant.
 * This structure allows for future expansion with secondary colors.
 */
export const THEME_COLORS = {
  blue: {
    primary: {
      main: '#1e5dd1',
      // main: '#1e5dd1', NYL blue
      // main: '#1860f2',
      dark: '#002975',
      // dark: '#001e94',
      light: '#6b9bea',
    },
  },
  green: {
    primary: {
      main: '#038a81',
      dark: '#04445b',
      light: '#93c3bf',
    },
  },
  purple: {
    primary: {
      main: '#6827d7ff',
      dark: '#3f0073ff',
      light: '#a78bfa',
    },
  },
  orange: {
    primary: {
      main: '#ea580c',
      dark: '#c2410c',
      light: '#fb923c',
    },
  },
  red: {
    primary: {
      main: '#dc2626',
      dark: '#b91c1c',
      light: '#f87171',
    },
  },
} as const;

export type ThemeColorName = keyof typeof THEME_COLORS;

/**
 * UI System Colors
 * These are semantic colors used throughout the application
 * and are independent of the client theme color
 */
export const UI_COLORS = {
  success: {
    main: '#00a16e',
    light: '#4caf50',
    dark: '#007551',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
} as const;