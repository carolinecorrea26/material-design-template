import type React from "react";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// ---------------------------------------------------------------------------
// Type augmentations
// ---------------------------------------------------------------------------

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
  }
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const INPUT_RADIUS = "16px";

// ---------------------------------------------------------------------------
// Theme definition
// ---------------------------------------------------------------------------

let theme = createTheme({
  spacing: 8,
  shape: { borderRadius: 8 },

  // -- Palette --
  palette: {
    primary: {
      main: "#0768ff",
      light: "#5c94ff",
      dark: "#034cba",
      contrastText: "#ffffff",
    },
    success: {
      main: "#009465",
      light: "#33b88d",
      dark: "#007a53",
      contrastText: "#ffffff",
    },
    error: { main: "#ed0a0a" },
    text: {
      primary: "#343b48",
      secondary: "#62748e",
      tertiary: "#5b7090",
    },
    background: {
      default: "#f9fafc",
      paper: "#ffffff",
      subtle: "#f5f8fd",
    },
    divider: "rgba(52, 59, 72, 0.12)",
    panel: { main: "#f5f8fd", border: "rgba(0, 22, 57, 0.08)" },
    notice: { main: "#fffcf0", border: "#e9e3cb" },
    support: { main: "#ecf3ff", border: "#c8d5ea" },
  },

  // -- Typography --
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.167 },
    h2: { fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.2 },
    h3: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.167 },
    h4: { fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.235 },
    h5: { fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.334 },
    h6: { fontSize: "1rem", fontWeight: 700, lineHeight: 1.6 },
    body1: { fontSize: "1rem", fontWeight: 400 },
    body2: { fontSize: "0.875rem", fontWeight: 400 },
    caption: { fontSize: "0.75rem", fontWeight: 400 },
    overline: {
      fontSize: "0.75rem",
      lineHeight: 1.66,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    button: { textTransform: "none", fontWeight: 700 },

    // -- Form-specific variants --
    formPageTitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      "@media (min-width:900px)": { fontSize: "1.5rem" },
    },
    formSectionLabel: {
      fontSize: "0.75rem",
      fontWeight: 700,
      lineHeight: 1.66,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    formBackLink: { fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.5 },
    formTransitionStatus: {
      fontSize: "0.825rem",
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
  },

  // -- Components --
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
        root: { height: 4, backgroundColor: "rgb(241 245 249)" },
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
          color: "#62748e",
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
      styleOverrides: {
        root: { marginLeft: 15, borderColor: "#d7dee8" },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: INPUT_RADIUS } },
    },

    // Input styling — single source of truth via MuiOutlinedInput
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundColor: t.palette.background.paper,
          borderRadius: INPUT_RADIUS,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(52, 59, 72, 0.23)",
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
          fontWeight: 400,
          "&.Mui-focused": { color: t.palette.primary.main },
        }),
        asterisk: ({ theme: t }) => ({ color: t.palette.error.main }),
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          color: t.palette.text.primary,
          fontWeight: 500,
          marginBottom: "8px",
          display: "block",
          "&.Mui-focused": { color: t.palette.primary.main },
        }),
        asterisk: ({ theme: t }) => ({ color: t.palette.error.main }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 600,
          textTransform: "none",
          transition: "transform 180ms ease, box-shadow 180ms ease",
          "&:hover": { transform: "translateY(-2px)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: INPUT_RADIUS } },
    },
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
    MuiToolbar: {
      styleOverrides: { root: { gap: 16 } },
    },
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
          formPageTitle: "h1",
          formSectionLabel: "span",
          formBackLink: "span",
          formTransitionStatus: "p",
          formBreadcrumb: "span",
          formVerticalStepLabel: "span",
          formVerticalStepLabelMobile: "span",
          formProgressStepNumber: "span",
          formProgressStepLabel: "span",
          formProgressPercent: "span",
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: { width: "100%", marginLeft: 0, marginRight: 0, gap: 8 },
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
          border: `1px solid ${t.palette.divider}`,
          borderRadius: INPUT_RADIUS,
          textTransform: "none",
          "&:hover": { backgroundColor: t.palette.action.hover },
          "&.Mui-selected": {
            backgroundColor: t.palette.background.paper,
            color: t.palette.text.primary,
          },
          "&.Mui-selected:hover": { backgroundColor: t.palette.action.hover },
        }),
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundColor: "transparent",
          gap: t.spacing(1.5),
          "& .MuiToggleButtonGroup-grouped": {
            border: `1px solid ${t.palette.divider}`,
            borderRadius: `${INPUT_RADIUS} !important`,
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          "& .MuiChip-icon": { marginLeft: "5px", marginRight: "-5px" },
          "&.coverageCategoryChip": {
            padding: "16px 8px",
            height: "auto",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            minWidth: "100px",
            fontSize: "0.875rem",
            fontWeight: 600,
            border: "1px solid transparent",
            "&.MuiChip-outlined": { border: "1px solid #bdbdbd" },
            "& .MuiChip-icon": { marginLeft: 0, marginRight: 0 },
            "& .MuiChip-label": { paddingTop: 4 },
          },
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;

// ---------------------------------------------------------------------------
// Shared style tokens (previously in components/utils/sectionStyles)
// ---------------------------------------------------------------------------

export const SECTION_SURFACE_BG = "rgb(0 22 57 / 4%)";

export const APP_MENU_SECTION_TITLE_SX = {
  fontWeight: 600,
  fontSize: "0.875rem",
  color: "text.primary",
};
