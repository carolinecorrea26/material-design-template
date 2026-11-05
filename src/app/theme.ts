import { createTheme, darken, responsiveFontSizes, type PaletteOptions } from "@mui/material/styles";
import type { ClientThemeConfig, ThemeColorId } from "../config/clients/types";

const presets: Record<ThemeColorId, { main: string; light: string; dark: string }> = {
  default: { main: "#0668ff", light: "#5c94ff", dark: "#034cba" },
  teal: { main: "#0882a1", light: "#39a4bf", dark: "#005b70" },
  purple: { main: "#3f51b5", light: "#7986cb", dark: "#283593" },
  "dark-blue": { main: "#045aab", light: "#316493", dark: "#002f5b" },
};

const palette: PaletteOptions = {
  success: { main: "#009465", light: "#33b88d", dark: "#007a53", contrastText: "#fff" },
  error: { main: "#ed0a0a" },
  text: { primary: "#353b48", secondary: "#49596f", disabled: "#99a4b5" },
  background: { default: "#f9fafc", paper: "#fff" },
  divider: "rgba(52, 59, 72, 0.12)",
};

export type CreateAppThemeOptions = {
  /** Keep the single-page template in its stacked layout at any viewport width. */
  forceMobileLayout?: boolean;
};

export function createAppTheme(
  themeConfig: ClientThemeConfig | ThemeColorId = "default",
  { forceMobileLayout = false }: CreateAppThemeOptions = {},
) {
  const config: ClientThemeConfig = typeof themeConfig === "string"
    ? { type: "preset", preset: themeConfig }
    : themeConfig;
  if (config.type === "custom" && !/^#[\da-f]{3}([\da-f]{3})?$/i.test(config.primary)) {
    throw new Error(`Invalid custom theme primary color: ${config.primary}`);
  }

  const primaryAction = config.primaryAction;
  if (primaryAction && !/^#[\da-f]{3}([\da-f]{3})?$/i.test(primaryAction.main)) {
    throw new Error(`Invalid button override color: ${primaryAction.main}`);
  }
  const primary = config.type === "preset" ? presets[config.preset] ?? presets.default : { main: config.primary };
  const resolvedPalette: PaletteOptions = { ...palette, primary, secondary: primary };

  return responsiveFontSizes(createTheme({
    palette: resolvedPalette,
    shape: { borderRadius: 8 },
    ...(forceMobileLayout && {
      breakpoints: { values: { xs: 0, sm: 600, md: 1e6, lg: 1e6, xl: 1e6 } },
    }),
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: { fontSize: "2.25rem", fontWeight: 800 },
      h2: { fontSize: "1.75rem", fontWeight: 800 },
      h3: { fontSize: "1.5rem", fontWeight: 800 },
      h4: { fontSize: "1.375rem", fontWeight: 800 },
      h5: { fontSize: "1.125rem", fontWeight: 800 },
      h6: { fontSize: "1rem", fontWeight: 800 },
      button: { textTransform: "none" },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ theme, ownerState }) => ({
            ...(config.buttonShape !== "standard" && { borderRadius: 9999 }),
            ...(primaryAction && ownerState.variant === "contained" && ownerState.color === "primary" && {
              "&:not(.Mui-disabled)": {
                backgroundColor: primaryAction.main,
                color: primaryAction.tone === "light" ? theme.palette.text.primary : theme.palette.common.white,
                "&:hover": { backgroundColor: darken(primaryAction.main, 0.2) },
              },
            }),
          }),
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiToolbar: { styleOverrides: { root: { gap: 16 } } },
      MuiContainer: { defaultProps: { maxWidth: "md" } },
      MuiLink: {
        defaultProps: { underline: "always" },
        styleOverrides: { root: { textUnderlineOffset: "0.12em" } },
      },
      MuiFormLabel: {
        styleOverrides: {
          asterisk: ({ theme }) => ({ color: theme.palette.error.main }),
        },
      },
      // Keep entered answers distinct from labels and placeholder prompts.
      MuiInputBase: {
        styleOverrides: {
          input: { fontWeight: 700, "&::placeholder": { fontWeight: 400 } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: ({ theme }) => ({ borderColor: theme.palette.divider }),
        },
      },
      // Insurance option labels must remain readable in both the field and menu.
      MuiSelect: {
        styleOverrides: {
          select: { whiteSpace: "normal", textOverflow: "clip", overflow: "visible", height: "auto" },
        },
      },
      MuiMenuItem: {
        styleOverrides: { root: { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.3 } },
      },
    },
  }));
}

export default createAppTheme();
