import type React from "react";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import type { ThemeColorId } from "../config/clients/types";

type ResponsiveCSSProperties = React.CSSProperties & {
  [key: `@media ${string}`]: React.CSSProperties;
};

declare module "@mui/material/styles" {
  interface Palette {
    panel: { main: string; border: string };
    notice: { main: string; border: string };
    support: { main: string; border: string };
  }
  interface PaletteOptions {
    panel?: { main: string; border: string };
    notice?: { main: string; border: string };
    support?: { main: string; border: string };
  }
  interface TypeBackground {
    subtle: string;
    surface: string;
    iconBadge: string;
  }
  interface TypeText {
    tertiary: string;
  }
  interface TypographyVariants {
    formPageTitle: ResponsiveCSSProperties;
    formSectionLabel: React.CSSProperties;
    formBackLink: React.CSSProperties;
    formTransitionStatus: React.CSSProperties;
    formBreadcrumb: React.CSSProperties;
    formVerticalStepLabel: ResponsiveCSSProperties;
    formVerticalStepLabelMobile: React.CSSProperties;
    formProgressStepNumber: ResponsiveCSSProperties;
    formProgressStepLabel: React.CSSProperties;
    formProgressPercent: React.CSSProperties;
    productNameLabel: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    formPageTitle?: ResponsiveCSSProperties;
    formSectionLabel?: React.CSSProperties;
    formBackLink?: React.CSSProperties;
    formTransitionStatus?: React.CSSProperties;
    formBreadcrumb?: React.CSSProperties;
    formVerticalStepLabel?: ResponsiveCSSProperties;
    formVerticalStepLabelMobile?: React.CSSProperties;
    formProgressStepNumber?: ResponsiveCSSProperties;
    formProgressStepLabel?: React.CSSProperties;
    formProgressPercent?: React.CSSProperties;
    productNameLabel?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    formPageTitle: true;
    formSectionLabel: true;
    formBackLink: true;
    formTransitionStatus: true;
    formBreadcrumb: true;
    formVerticalStepLabel: true;
    formVerticalStepLabelMobile: true;
    formProgressStepNumber: true;
    formProgressStepLabel: true;
    formProgressPercent: true;
    productNameLabel: true;
  }
}

/** Shared border-radius for card-level surfaces, inputs, and alerts. */
export const CARD_RADIUS = "16px";

/** Single source-of-truth body/header/input text color. */
export const TEXT_PRIMARY = "#353b48";

/** Single source-of-truth border color for all field inputs. */
export const FIELD_BORDER_COLOR = "rgba(52, 59, 72, 0.23)";

/** Unselected label/floating-label color. */
export const LABEL_COLOR = "rgb(52, 59, 72)";

const themeColorPalettes: Record<
  ThemeColorId,
  { main: string; light: string; dark: string; contrastText: string }
> = {
  default: {
    main: "#0668ff",
    light: "#5c94ff",
    dark: "#034cba",
    contrastText: "#ffffff",
  },
  teal: {
    main: "#0882a1",
    light: "#39a4bf",
    dark: "#005b70",
    contrastText: "#ffffff",
  },
  purple: {
    main: "#3f51b5",
    light: "#7986cb",
    dark: "#283593",
    contrastText: "#ffffff",
  },
  "dark-blue": {
    main: "#045aab",
    light: "#316493",
    dark: "#002f5b",
    contrastText: "#ffffff",
  },
};

export type CreateAppThemeOptions = {
  /**
   * Forces the "md"/"lg"/"xl" breakpoints to an unreachable width, so every
   * `useMediaQuery(breakpoints.up("md"))` desktop/mobile structural check
   * (e.g. ProgressStep's sidebar-vs-stepper branch) resolves to its
   * narrow-screen variant regardless of the actual viewport width. "sm"
   * (600px) is intentionally left at its default so components that only
   * bump padding/spacing at "sm" (e.g. FormRoutePage's FormShell) still get
   * that breathing room on an actual desktop-width browser instead of
   * staying pinned to their tightest "xs" values.
   */
  forceMobileLayout?: boolean;
};

export function createAppTheme(
  colorId: ThemeColorId = "default",
  { forceMobileLayout = false }: CreateAppThemeOptions = {},
) {
  const primaryPalette =
    themeColorPalettes[colorId] ?? themeColorPalettes.default;

  let theme = createTheme({
    spacing: 8,
    shape: { borderRadius: 8 },

    ...(forceMobileLayout && {
      breakpoints: {
        values: { xs: 0, sm: 600, md: 1e6, lg: 1e6, xl: 1e6 },
      },
    }),

    palette: {
      primary: primaryPalette,
      success: {
        main: "#009465",
        light: "#33b88d",
        dark: "#007a53",
        contrastText: "#ffffff",
      },
      error: { main: "#ed0a0a" },
      text: {
        primary: TEXT_PRIMARY,
        secondary: "#49596f",
        disabled: "#99a4b5",
        tertiary: "#5b7090",
      },
      background: {
        default: "#f9fafc",
        paper: "#ffffff",
        subtle: "#f5f8fd",
        surface: "#eef1f4",
        iconBadge: "#c9d6eb",
      },
      action: { selected: "#eef1f4" },
      divider: "rgba(52, 59, 72, 0.12)",
      panel: { main: "#f5f8fd", border: "rgba(0, 22, 57, 0.08)" },
      notice: { main: "#fffcf0", border: "#e9e3cb" },
      support: { main: "#ecf3ff", border: "#c8d5ea" },
    },

    typography: {
      fontFamily:
        'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontSize: "2.25rem",
        fontWeight: 800,
        // lineHeight: 1.167,
        color: TEXT_PRIMARY,
      },
      h2: {
        fontSize: "1.75rem",
        fontWeight: 800,
        // lineHeight: 1.2,
        letterSpacing: "-0.025em",
        color: TEXT_PRIMARY,
      },
      h3: {
        fontSize: "1.5rem",
        fontWeight: 800,
        // lineHeight: 1.167,
        color: TEXT_PRIMARY,
      },
      h4: {
        fontSize: "1.375rem",
        fontWeight: 800,
        // lineHeight: 1.235,
        color: TEXT_PRIMARY,
      },
      h5: {
        fontSize: "1.125rem",
        fontWeight: 800,
        // lineHeight: 1.334,
        color: TEXT_PRIMARY,
      },
      h6: {
        fontSize: "1rem",
        fontWeight: 800,
        // lineHeight: 1.6,
        color: TEXT_PRIMARY,
      },
      body1: { color: TEXT_PRIMARY },
      body2: { color: TEXT_PRIMARY },
      subtitle1: { fontWeight: 500, color: TEXT_PRIMARY },
      subtitle2: { fontWeight: 600, color: TEXT_PRIMARY },
      overline: { fontWeight: 700, letterSpacing: "0.5px", color: "#00388c" },
      button: { textTransform: "none", fontWeight: 700 },

      formPageTitle: {
        fontSize: "1.25rem",
        fontWeight: 800,
        letterSpacing: "-0.025em",
        lineHeight: 1.3,
        color: TEXT_PRIMARY,
        "@media (min-width:900px)": { fontSize: "1.5rem" },
      },
      formSectionLabel: {
        fontSize: "0.75rem",
        lineHeight: "1.66",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: "#00388c",
      },
      formBackLink: { fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.5 },
      formTransitionStatus: {
        fontSize: "0.875rem",
        fontWeight: 400,
        lineHeight: 1.4,
      },
      formBreadcrumb: {
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1.5,
        letterSpacing: "-0.25px",
      },
      formVerticalStepLabel: {
        fontSize: "1rem",
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: "-0.25px",
        "@media (min-width:900px)": { fontSize: "0.9rem" },
      },
      formVerticalStepLabelMobile: {
        fontSize: "1rem",
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: "-0.25px",
      },
      formProgressStepNumber: {
        fontSize: "0.95rem",
        fontWeight: 700,
        lineHeight: 1,
        "@media (min-width:600px)": { fontSize: "1rem" },
      },
      formProgressStepLabel: {
        fontSize: "0.75rem",
        fontWeight: 500,
        lineHeight: 1.3,
      },
      formProgressPercent: {
        fontSize: "0.68rem",
        fontWeight: 700,
        lineHeight: 1,
      },
      productNameLabel: {
        fontSize: "0.875rem",
        fontWeight: 700,
        lineHeight: 1.4,
        color: TEXT_PRIMARY,
      },
    },

    components: {
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: "#e1e7ec",
            "&::after": {
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: 6, backgroundColor: "rgb(241 245 249)" },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            height: "16px",
            minWidth: "16px",
            padding: "0 4px",
            fontSize: "0.65rem",
            fontWeight: 800,
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            color: "#8fa1b9",
            "&.Mui-active": { color: t.palette.primary.main },
            "&.Mui-completed": { color: t.palette.primary.main },
          }),
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          root: {
            padding: "8px 0",
            color: "#49596f",
            "@media (min-width:900px)": { padding: 3 },
          },
        },
      },
      MuiStepConnector: {
        styleOverrides: {
          root: { marginLeft: 15 },
          line: { borderColor: "#d7dee8" },
        },
      },
      MuiStepContent: {
        styleOverrides: { root: { marginLeft: 15, borderColor: "#d7dee8" } },
      },
      MuiAlert: { styleOverrides: { root: { borderRadius: CARD_RADIUS } } },

      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            backgroundColor: t.palette.background.paper,
            borderRadius: CARD_RADIUS,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: FIELD_BORDER_COLOR,
              borderWidth: "1px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: t.palette.text.primary,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: t.palette.primary.main,
              borderWidth: "1px",
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor: t.palette.error.main,
            },
          }),
          // Entered text is bold; empty/placeholder stays at default weight
          input: {
            "&:not(:placeholder-shown)": { fontWeight: 700 },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            "& .MuiSelect-select": {
              whiteSpace: "normal",
              textOverflow: "clip",
              overflow: "visible",
              height: "auto",
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            lineHeight: 1.3,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            color: LABEL_COLOR,
            fontWeight: 500,
            "&.Mui-focused": { color: t.palette.primary.main },
            "&.MuiInputLabel-shrink": { color: LABEL_COLOR, fontWeight: 500 },
            "&.MuiInputLabel-shrink.Mui-focused": {
              color: t.palette.primary.main,
            },
          }),
          asterisk: ({ theme: t }) => ({ color: t.palette.error.main }),
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            color: LABEL_COLOR,
            fontWeight: 500,
            marginBottom: "8px",
            display: "block",
            "&.Mui-focused": { color: t.palette.primary.main },
          }),
          asterisk: ({ theme: t }) => ({ color: t.palette.error.main }),
        },
      },
      MuiFormHelperText: { styleOverrides: { root: { fontSize: ".825rem" } } },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            fontWeight: 700,
            textTransform: "none",
            transition: "transform 180ms ease, box-shadow 180ms ease",
            "&:hover": { transform: "translateY(-2px)" },
          },
          sizeLarge: {
            padding: "16px 24px",
          },
          contained: ({ theme: t }) => ({
            boxShadow: `0 8px 18px ${t.palette.primary.main}3d`,
            "&:hover": { boxShadow: `0 8px 18px ${t.palette.primary.main}3d` },
          }),
        },
      },
      MuiCard: { styleOverrides: { root: { borderRadius: CARD_RADIUS } } },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 24, "&:last-child": { paddingBottom: 24 } },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            backgroundColor: t.palette.background.paper,
            color: t.palette.text.primary,
            borderBottom: `1px solid ${t.palette.divider}`,
            boxShadow: "none",
          }),
        },
      },
      MuiContainer: {
        defaultProps: { maxWidth: "md" },
        styleOverrides: {
          root: ({ theme: t }) => ({
            paddingTop: t.spacing(3),
            paddingBottom: t.spacing(3),
            paddingLeft: t.spacing(2),
            paddingRight: t.spacing(2),
            [t.breakpoints.up("sm")]: {
              paddingLeft: t.spacing(3),
              paddingRight: t.spacing(3),
            },
            [t.breakpoints.up("md")]: {
              paddingLeft: t.spacing(4),
              paddingRight: t.spacing(4),
            },
          }),
        },
      },
      MuiToolbar: { styleOverrides: { root: { gap: 16 } } },
      MuiBreadcrumbs: {
        styleOverrides: {
          root: {
            "& .MuiBreadcrumbs-separator": {
              color: "#94a3b8",
              cursor: "default",
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            color: t.palette.primary.main,
            fontWeight: 700,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }),
        },
      },
      MuiTypography: {
        defaultProps: {
          variantMapping: {
            formPageTitle: "h2",
            formSectionLabel: "span",
            formBackLink: "span",
            formTransitionStatus: "p",
            formBreadcrumb: "span",
            formVerticalStepLabel: "span",
            formVerticalStepLabelMobile: "span",
            formProgressStepNumber: "span",
            formProgressStepLabel: "span",
            formProgressPercent: "span",
            productNameLabel: "span",
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          // SelectionGroup font-weight rules. All border/background/color selected
          // states are handled in SelectionGroup's sx prop so they use the correct
          // theme primary color per client.
          ".SelectionGroup-root .SelectionGroup-label": {
            fontWeight: 700,
            fontSize: "0.875rem",
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            width: "100%",
            marginLeft: 0,
            marginRight: 0,
            gap: 8,
            // When the child input is checked, bold the label
            "&:has(.Mui-checked) .MuiFormControlLabel-label": {
              fontWeight: 900,
            },
          },
          label: {
            fontWeight: 700,
          },
        },
      },
      MuiFormGroup: {
        styleOverrides: {
          root: {
            display: "flex",
            flexDirection: "column",
            gap: 8,
            "&.MuiFormGroup-row": { flexDirection: "column" },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            padding: "16.5px 14px",
            backgroundColor: t.palette.background.paper,
            border: `1px solid ${FIELD_BORDER_COLOR}`,
            borderRadius: CARD_RADIUS,
            textTransform: "none",
            fontWeight: 700,
            color: TEXT_PRIMARY,
            "&:hover": { backgroundColor: t.palette.action.hover },
            "&.Mui-selected": {
              borderColor: t.palette.primary.main,
              backgroundColor: `${t.palette.primary.main}1A`,
              color: TEXT_PRIMARY,
              fontWeight: 900,
            },
            "&.Mui-selected:hover": {
              backgroundColor: `${t.palette.primary.main}33`,
            },
          }),
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            backgroundColor: "transparent",
            gap: t.spacing(1.5),
            "& .MuiToggleButtonGroup-grouped": {
              border: `1px solid ${FIELD_BORDER_COLOR}`,
              borderRadius: `${CARD_RADIUS} !important`,
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            "& .MuiChip-icon": {
              marginLeft: "5px",
              marginRight: "-5px",
            },
          },
          colorDefault: ({ ownerState }) => ({
            ...(ownerState.variant === "filled" && {
              backgroundColor: "#eef1f4",
            }),
          }),
        },
      },
    },
  });

  return responsiveFontSizes(theme);
}

const theme = createAppTheme();
export default theme;

export const SECTION_SURFACE_BG = "#eef1f4";
export const APP_MENU_SECTION_TITLE_SX = {
  typography: "subtitle2",
  color: "text.primary",
};
