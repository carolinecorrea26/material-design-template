import { createTheme, darken, alpha, responsiveFontSizes, type PaletteOptions } from "@mui/material/styles";
import type { ClientThemeConfig, ThemeColorId } from "../config/clients/types";
import controlPresentation from '../../requirements/global/presentation-tokens.json';
const actionPresentation = controlPresentation.controls;

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
      caption: { fontSize: "0.875rem" },
      overline: { fontSize: "0.875rem" },
      button: { textTransform: "none", fontWeight: actionPresentation.fontWeight },
    },
    components: {
      MuiIconButton: {
        styleOverrides: { root: ({ theme }) => ({
          '&.StepEditButton-root': { fontSize: theme.typography.pxToRem(20), border: 'none', borderRadius: '50%', color: theme.palette.primary.dark, backgroundColor: alpha(theme.palette.primary.main, 0.10), padding: theme.spacing(0.5), '&.Mui-disabled': { color: theme.palette.action.disabled, backgroundColor: theme.palette.action.disabledBackground }, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.18) } },
        }) },
      },
      MuiChip: {
        styleOverrides: { root: ({ theme }) => ({
          fontSize: theme.typography.caption.fontSize,
          '&.PageHelpChip-root': { backgroundColor: theme.palette.action.hover, '&:hover': { backgroundColor: theme.palette.action.selected } },
        }) },
      },
      MuiBreadcrumbs: {
        styleOverrides: { root: ({ theme }) => ({
          ...theme.typography.caption,
          '& [aria-current="page"], & [data-completed="true"]': { fontWeight: 500 },
        }) },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: ({ theme }) => ({ fontSize: theme.typography.caption.fontSize }) },
      },
      MuiBadge: {
        styleOverrides: { badge: ({ theme }) => ({ fontSize: theme.typography.caption.fontSize }) },
      },
      MuiToggleButton: {
        styleOverrides: { sizeSmall: ({ theme }) => ({ fontSize: theme.typography.button.fontSize }) },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme, ownerState }) => ({
            fontWeight: actionPresentation.fontWeight,
            ...(ownerState.size === "small" && { fontSize: theme.typography.button.fontSize }),
            '&.ClientHelpBanner-action': {
              color: theme.palette.getContrastText(theme.palette.primary.dark),
              borderColor: alpha(theme.palette.getContrastText(theme.palette.primary.dark), 0.6),
              '&:hover': { borderColor: theme.palette.getContrastText(theme.palette.primary.dark), backgroundColor: alpha(theme.palette.getContrastText(theme.palette.primary.dark), 0.08) },
            },
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
      MuiLink: {
        defaultProps: { underline: "none" },
        styleOverrides: { root: { fontWeight: actionPresentation.fontWeight, textDecoration: actionPresentation.linkDecoration, '&:hover, &:focus': { textDecoration: actionPresentation.linkDecoration } } },
      },
      MuiCssBaseline: {
        styleOverrides: theme => ({ a: { fontWeight: actionPresentation.fontWeight, textDecoration: actionPresentation.linkDecoration, '&:hover, &:focus': { textDecoration: actionPresentation.linkDecoration } }, button: { fontWeight: actionPresentation.fontWeight }, 'sup, sub, small': { fontSize: theme.typography.caption.fontSize } }),
      },
      MuiFormHelperText: {
        styleOverrides: { root: { lineHeight: 1.2, marginBottom: 0 } },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: { fontWeight: 500 },
          asterisk: ({ theme }) => ({ color: theme.palette.error.main }),
        },
      },
      MuiInputLabel: {
        // MUI scales floating labels to 75%; preserve the minimum visible text size.
        styleOverrides: { shrink: ({ theme }) => ({ fontSize: `calc(${theme.typography.caption.fontSize} / 0.75)` }) },
      },
      MuiFormControlLabel: {
        styleOverrides: { label: { fontWeight: 500 } },
      },
      // Keep entered answers distinct from labels and placeholder prompts.
      MuiInputBase: {
        styleOverrides: {
          root: ({ theme }) => ({ backgroundColor: theme.palette.common.white }),
          input: { fontWeight: 700, "&::placeholder": { fontWeight: 400 } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          // Match resting text/select outlines to the shared selection-row border.
          // MUI still owns hover, focus, error and disabled border states.
          notchedOutline: ({ theme }) => ({ borderColor: theme.palette.divider, '& legend': { fontSize: theme.typography.caption.fontSize } }),
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
  // h3 is the shared page-title scale and remains 1.5rem at every breakpoint.
  }), { variants: ["h1", "h2", "h4", "h5", "h6", "subtitle1", "subtitle2", "body1", "body2", "caption", "button", "overline"] });
}

export default createAppTheme();
