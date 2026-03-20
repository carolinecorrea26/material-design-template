import type { Components, Theme } from "@mui/material/styles";

export const components: Components<Theme> = {
  MuiTextField: {
    defaultProps: {
      size: "small",
    },
  },
  MuiFormControl: {
    defaultProps: {
      size: "small",
    },
  },
  MuiSelect: {
    defaultProps: {
      size: "small",
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500, // Reduced from 600 to 500 for more natural appearance
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiContainer: {
    defaultProps: {
      maxWidth: "md",
    },
    styleOverrides: {
      root: ({ theme }) => ({
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        [theme.breakpoints.up("xs")]: {
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
        },
        [theme.breakpoints.up("sm")]: {
          paddingLeft: theme.spacing(3),
          paddingRight: theme.spacing(3),
        },
        [theme.breakpoints.up("md")]: {
          paddingLeft: theme.spacing(4),
          paddingRight: theme.spacing(4),
        },
      }),
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: ({ theme }) => ({
        gap: theme.spacing(2),
      }),
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(3),
        "&:last-child": {
          paddingBottom: theme.spacing(3),
        },
      }),
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderColor: theme.palette.divider,
      }),
    },
  },
  MuiLink: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.primary.main,
        fontWeight: 600,
        textDecoration: "none",
        "&:hover": {
          textDecoration: "underline",
          fontWeight: 600,
        },
      }),
    },
  },
  MuiStack: {
    defaultProps: {
      useFlexGap: true,
    },
  },
  MuiListSubheader: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: "transparent",
        color: theme.palette.primary.main,
        fontWeight: 600,
        fontSize: "0.875rem",
      }),
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        "&.Mui-selected": {
          fontWeight: 600,
        },
      },
    },
  },
  // MuiAlert: {
  //   styleOverrides: {
  //     root: ({ ownerState }) => ({
  //       borderRadius: 8,
  //       ...(ownerState.severity === "info"
  //         ? {
  //             backgroundColor: "#eef5ff",
  //             color: "rgb(53 59 72)",
  //             "& .MuiAlert-icon": {
  //               color: "#0044ae",
  //             },
  //           }
  //         : {}),
  //     }),
  //   },
  // },
  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: "theme.palette.text.secondary",
        fontWeight: 400,
        "&.Mui-focused": {
          color: theme.palette.primary.main,
        },
      }),
      asterisk: {
        color: "#D32F2F",
      },
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: "#343b48",
        fontWeight: 500,
        marginBottom: "8px",
        display: "block",
        "&.Mui-focused": {
          color: theme.palette.primary.main,
        },
      }),
      asterisk: {
        color: "#D32F2F",
      },
    },
  },
  MuiTypography: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        ...(!ownerState.color && { color: theme.palette.text.primary }),
      }),
      h6: ({ theme, ownerState }) => ({
        ...(!ownerState.color && { color: theme.palette.text.primary }),
      }),
      subtitle1: ({ theme, ownerState }) => ({
        ...(!ownerState.color && { color: theme.palette.text.primary }),
      }),
    },
  },
  MuiFormControlLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        marginLeft: 0,
        marginRight: 0,
        width: "100%",
        alignItems: "flex-start",
        gap: theme.spacing(1),
      }),
      label: ({ theme }) => ({
        color: theme.palette.text.primary,
      }),
    },
  },
  MuiFormGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        "&.MuiFormGroup-row": {
          flexDirection: "column",
        },
      }),
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: "white",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px !important",
        transition: theme.transitions.create(
          ["background-color", "border-color"],
          {
            duration: theme.transitions.duration.short,
          },
        ),
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          border: `1px solid ${theme.palette.divider}`,
        },
        "&.Mui-selected": {
          backgroundColor: "transparent",
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            border: `1px solid ${theme.palette.divider}`,
          },
        },
        "&:not(.Mui-selected)": {
          backgroundColor: "white",
          border: `1px solid ${theme.palette.divider}`,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        },
      }),
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: "transparent",
        gap: theme.spacing(1.5),
        "& .MuiToggleButton-root": {
          backgroundColor: "white",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "8px !important",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
          "&.Mui-selected": {
            backgroundColor: "transparent",
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
            },
          },
        },
      }),
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: ({ theme }) => ({
        "& .MuiOutlinedInput-root": {
          backgroundColor: "white",
          borderRadius: "8px",
        },
        "& .MuiOutlinedInput-input": {},
      }),
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: ({ theme }) => ({
        "& .MuiOutlinedInput-root": {
          backgroundColor: "white",
          borderRadius: "8px",
        },
        "& .MuiSelect-select": {
          whiteSpace: "normal",
          textOverflow: "clip",
          overflow: "visible",
          height: "auto",
        },
      }),
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
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        backgroundColor: "white",
        borderRadius: "8px",
      },
    },
  },
  MuiFormControl: {
    styleOverrides: {
      root: ({ theme }) => ({
        "& .MuiOutlinedInput-root": {
          backgroundColor: "white",
          borderRadius: "8px",
        },
        "& .MuiOutlinedInput-input": {},
      }),
    },
  },

  MuiRadio: {
    styleOverrides: {
      root: {
        backgroundColor: "white",
      },
    },
  },
};
