import type React from "react";
import { createTheme } from "@mui/material/styles";

type ResponsiveCSSProperties = React.CSSProperties & {
  [key: `@media ${string}`]: React.CSSProperties;
};

declare module "@mui/material/styles" {
  interface TypographyVariants {
    formPageTitle: ResponsiveCSSProperties;
    formPageTitleCompact: ResponsiveCSSProperties;
    formSectionLabel: React.CSSProperties;
    formApplicantSectionLabel: React.CSSProperties;
    formBackLink: React.CSSProperties;
    formTransitionStatus: React.CSSProperties;
    formBreadcrumb: React.CSSProperties;
    formVerticalStepLabel: React.CSSProperties;
    formVerticalStepLabelMobile: React.CSSProperties;
    formProgressStepNumber: ResponsiveCSSProperties;
    formProgressStepLabel: React.CSSProperties;
    formProgressPercent: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    formPageTitle?: ResponsiveCSSProperties;
    formPageTitleCompact?: ResponsiveCSSProperties;
    formSectionLabel?: React.CSSProperties;
    formApplicantSectionLabel?: React.CSSProperties;
    formBackLink?: React.CSSProperties;
    formTransitionStatus?: React.CSSProperties;
    formBreadcrumb?: React.CSSProperties;
    formVerticalStepLabel?: React.CSSProperties;
    formVerticalStepLabelMobile?: React.CSSProperties;
    formProgressStepNumber?: ResponsiveCSSProperties;
    formProgressStepLabel?: React.CSSProperties;
    formProgressPercent?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    sectionLabel: false;
    formPageTitle: true;
    formPageTitleCompact: true;
    formSectionLabel: true;
    formApplicantSectionLabel: true;
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

const inputBorderRadius = "16px";

/** Reusable color tokens for hardcoded values used across components */
export const colors = {
  /** Light panel/accordion background */
  panelBg: "#f5f8fd",
  /** Success/green highlight background */
  successBg: "#eef6ee",
  /** Subtle info box background */
  infoBoxBg: "rgba(0, 22, 57, 0.04)",
  /** Subtle info box/divider border */
  infoBoxBorder: "rgba(0, 22, 57, 0.08)",
} as const;

/** Reusable sx style fragments for common patterns */
export const sxPresets = {
  /** Subtle info/summary box: light bg + faint border + rounded */
  infoBox: {
    p: 2,
    borderRadius: 2,
    backgroundColor: colors.infoBoxBg,
    border: `1px solid ${colors.infoBoxBorder}`,
  },
  /** Success highlight box (green tint background) */
  successBox: {
    p: 2,
    borderRadius: 2,
    backgroundColor: colors.successBg,
  },
} as const;

const theme = createTheme({
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  palette: {
    primary: {
      main: "#0768ff",
      light: "#5c94ff",
      dark: "#034cba",
      contrastText: "#ffffff",
    },
    success: {
      main: "#009465",
      light: "#3ec097",
      dark: "#00724e",
      contrastText: "#ffffff",
    },
    text: {
      primary: "#343b48",
    },
  },
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: "2.25rem",
      fontWeight: 700,
      lineHeight: 1.167,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.167,
    },
    h4: {
      fontSize: "1.375rem",
      fontWeight: 700,
      lineHeight: 1.235,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 700,
      lineHeight: 1.334,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 700,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
    formPageTitle: {
      fontSize: "1rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      "@media (min-width:900px)": {
        fontSize: "1.25rem",
      },
    },
    formPageTitleCompact: {
      fontSize: "1rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      "@media (min-width:900px)": {
        fontSize: "1.25rem",
      },
    },
    formSectionLabel: {
      fontSize: "0.75rem",
      fontWeight: 800,
      lineHeight: 1,
      letterSpacing: "0.25px",
      textTransform: "uppercase",
    },
    formApplicantSectionLabel: {
      fontSize: "0.75rem",
      fontWeight: 700,
      lineHeight: 2.66,
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
    formBackLink: {
      fontSize: "0.8rem",
      fontWeight: 700,
      lineHeight: 1.5,
    },
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
      fontSize: "0.9rem",
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: "-0.25px",
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
      "@media (min-width:600px)": {
        fontSize: "1rem",
      },
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
  components: {
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: "#e1e7ec",
          "&::after": {
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent)",
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          backgroundColor: "rgb(241 245 249)",
        },
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
          backgroundColor: "#ed0a0a",
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: "#8fa1b9",

          "&.Mui-active": {
            color: "#0668ff",
          },

          "&.Mui-completed": {
            color: "#0668ff",
          },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        root: {
          padding: 3,
          color: "#62748e",
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        root: {
          marginLeft: 15,
        },
        line: {
          borderColor: "#d7dee8",
        },
      },
    },
    MuiStepContent: {
      styleOverrides: {
        root: {
          marginLeft: 15,
          borderColor: "#d7dee8",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: inputBorderRadius,
          // border: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "white",
            borderRadius: inputBorderRadius,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(52, 59, 72, 0.23)",
              borderWidth: "1px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#343b48",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#0768ff",
              borderWidth: "1px",
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor: "#ed0a0a",
            },
          },
          "& .MuiPickersOutlinedInput-root": {
            backgroundColor: "white",
            borderRadius: inputBorderRadius,
            "& .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: "rgba(52, 59, 72, 0.23)",
              borderWidth: "1px",
            },
            "&:hover .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: "#343b48",
            },
            "&.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: "#0768ff",
              borderWidth: "1px",
            },
            "&.Mui-error .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: "#ed0a0a",
            },
          },
          "& .MuiOutlinedInput-input": {},
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "white",
            borderRadius: inputBorderRadius,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(52, 59, 72, 0.23)",
              borderWidth: "1px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#343b48",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#0768ff",
              borderWidth: "1px",
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor: "#ed0a0a",
            },
          },
          "& .MuiPickersOutlinedInput-root": {
            backgroundColor: "white",
            borderRadius: inputBorderRadius,
            "& .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: "rgba(52, 59, 72, 0.23)",
              borderWidth: "1px",
            },
            "&:hover .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: "#343b48",
            },
            "&.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: "#0768ff",
              borderWidth: "1px",
            },
            "&.Mui-error .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: "#ed0a0a",
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "white",
          borderRadius: inputBorderRadius,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(52, 59, 72, 0.23)",
            borderWidth: "1px",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#343b48",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#0768ff",
            borderWidth: "1px",
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ed0a0a",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "white",
            borderRadius: inputBorderRadius,
          },
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
        root: {
          fontWeight: 400,
          "&.Mui-focused": {
            color: "#0768ff",
          },
        },
        asterisk: {
          color: "#ed0a0a",
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: "#343b48",
          fontWeight: 500,
          marginBottom: "8px",
          display: "block",
          "&.Mui-focused": {
            color: "#0768ff",
          },
        },
        asterisk: {
          color: "#ed0a0a",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 600,
          textTransform: "none",
          transition: "transform 180ms ease, box-shadow 180ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: inputBorderRadius,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          "&:last-child": {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme: activeTheme }) => ({
          backgroundColor: activeTheme.palette.background.paper,
          color: activeTheme.palette.text.primary,
          borderBottom: `1px solid ${activeTheme.palette.divider}`,
          boxShadow: "none",
        }),
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: "md",
      },
      styleOverrides: {
        root: ({ theme: activeTheme }) => ({
          paddingTop: activeTheme.spacing(3),
          paddingBottom: activeTheme.spacing(3),
          paddingLeft: activeTheme.spacing(2),
          paddingRight: activeTheme.spacing(2),
          [activeTheme.breakpoints.up("sm")]: {
            paddingLeft: activeTheme.spacing(3),
            paddingRight: activeTheme.spacing(3),
          },
          [activeTheme.breakpoints.up("md")]: {
            paddingLeft: activeTheme.spacing(4),
            paddingRight: activeTheme.spacing(4),
          },
        }),
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          gap: 16,
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          padding: "0 0.5rem",
          // margin: "0.5rem 0",

          "& .MuiBreadcrumbs-separator": {
            // marginLeft: "0.5rem",
            // marginRight: "0.5rem",
            color: "#94a3b8",
            cursor: "default",
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme: activeTheme }) => ({
          color: activeTheme.palette.primary.main,
          fontWeight: 700,
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        }),
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          formPageTitle: "h1",
          formPageTitleCompact: "h1",
          formSectionLabel: "span",
          formApplicantSectionLabel: "span",
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
        root: {
          width: "100%",
          //   alignItems: "flex-start",
          marginLeft: 0,
          marginRight: 0,
          gap: 8,
        },
      },
    },
    MuiFormGroup: {
      styleOverrides: {
        root: {
          display: "flex",
          flexDirection: "column",
          gap: 8,
          "&.MuiFormGroup-row": {
            flexDirection: "column",
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme: activeTheme }) => ({
          backgroundColor: "#ffffff",
          border: `1px solid ${activeTheme.palette.divider}`,
          borderRadius: inputBorderRadius,
          textTransform: "none",
          "&:hover": {
            backgroundColor: activeTheme.palette.action.hover,
          },
          "&.Mui-selected": {
            backgroundColor: "#ffffff",
            color: activeTheme.palette.text.primary,
          },
          "&.Mui-selected:hover": {
            backgroundColor: activeTheme.palette.action.hover,
          },
        }),
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: "transparent",
          gap: theme.spacing(1.5),
          "& .MuiToggleButtonGroup-grouped": {
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${inputBorderRadius} !important`,
          },
        }),
      },
    },
  },
});

export default theme;
