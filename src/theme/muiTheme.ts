import { createTheme } from "@mui/material/styles";
import { components } from "./components";
import { getClientTheme } from "../config/clients";

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

// Get client-specific theme colors
const clientTheme = getClientTheme();

export const theme = createTheme({
  palette: {
    // Override all primary color variants to use the same color for consistency
    primary: {
      main: clientTheme.primaryColor,
      light: clientTheme.primaryColor,
      dark: clientTheme.primaryColor,
      lighter: clientTheme.primaryColor,
    },
    // Override success color to custom green
    success: {
      main: '#1b9021',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
  },
  typography: {
    // Custom scale with h1 at 48px and proportional sizes
    // Inter is closer to Circular and widely used for modern interfaces
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: "2.5rem", fontWeight: 600, lineHeight: 1.167 }, // Bold for main headings
    h2: { fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.2 }, // Bold for page headings
    h3: { fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.167 }, // Semi-bold for section headings
    h4: { fontSize: "1.375rem", fontWeight: 600, lineHeight: 1.235 }, // Semi-bold for subsections
    h5: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.334 }, // Semi-bold for small headings
    h6: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.6 }, // Semi-bold for micro headings
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
          borderRadius: 9999 // Pill style
        }
      }
    }
  }
});
