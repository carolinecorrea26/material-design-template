import { createTheme } from "@mui/material/styles";
import { components } from "./components";
import { getClientTheme } from "../config/clients";
import { UI_COLORS } from "../config/themeColors";

declare module "@mui/material/styles" {
  interface PaletteColor {
    lighter: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
  }
  interface Palette {
    successAlt?: Palette["primary"];
  }
  interface PaletteOptions {
    successAlt?: PaletteOptions["primary"];
  }
}

// Get client-specific primary color
const primaryColor = getClientTheme();

export const theme = createTheme({
  palette: {
    // Use client theme color with proper light/dark variants
    primary: primaryColor,
    // Use semantic UI colors that don't change based on theme
    success: UI_COLORS.success,
    error: UI_COLORS.error,
    warning: UI_COLORS.warning,
    info: UI_COLORS.info,
  },
  typography: {
    // Custom scale with h1 at 48px and proportional sizes
    // Inter is closer to Circular and widely used for modern interfaces
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.167 }, // Bold for main headings
    h2: { fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.2 }, // Bold for page headings
    h3: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.167 }, // Semi-bold for section headings
    h4: { fontSize: "1.375rem", fontWeight: 600, lineHeight: 1.235 }, // Semi-bold for subsections
    h5: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.334 }, // Semi-bold for small headings
    h6: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.6, color: "rgba(82, 83, 91, 0.87)" }, // Semi-bold for micro headings
    body1: { fontSize: "1rem", fontWeight: 400 }, // Normal weight for body text
    body2: { fontSize: "0.875rem", fontWeight: 400 }, // Normal weight for smaller text
    button: { textTransform: "none", fontWeight: 500 } // Medium weight for buttons
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  components: {
    ...components,
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill style
          transition: 'transform 0.2s ease-in-out, background-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        },
        sizeLarge: {
          '&:hover': {
            transform: 'translateY(-3px)'
          }
        }
      }
    }
  }
});
