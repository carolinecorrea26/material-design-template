import { createTheme } from "@mui/material/styles";

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    sectionLabel: true;
  }
}

const inputBorderRadius = "16px";

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
  },
  components: {
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
      variants: [
        {
          props: { variant: "sectionLabel" as const },
          style: {
            fontWeight: 800,
            fontSize: "0.75rem",
            lineHeight: 1,
            textTransform: "uppercase" as const,
            letterSpacing: "0.25px",
            color: "#4e6d9c",
            display: "block",
          },
        },
      ],
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
