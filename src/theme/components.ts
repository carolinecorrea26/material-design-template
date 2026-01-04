import type { Components, Theme } from "@mui/material/styles";

export const components: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: { 
        borderRadius: 8, 
        fontWeight: 500 // Reduced from 600 to 500 for more natural appearance
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: { 
        borderRadius: 12 
      }
    }
  },
  MuiContainer: {
    defaultProps: {
      maxWidth: "md"
    },
    styleOverrides: {
      root: ({ theme }) => ({
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        [theme.breakpoints.up('xs')]: {
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
        },
        [theme.breakpoints.up('sm')]: {
          paddingLeft: theme.spacing(3),
          paddingRight: theme.spacing(3),
        },
        [theme.breakpoints.up('md')]: {
          paddingLeft: theme.spacing(4),
          paddingRight: theme.spacing(4),
        },
      })
    }
  },
  MuiToolbar: {
    styleOverrides: {
      root: ({ theme }) => ({
        gap: theme.spacing(2)
      })
    }
  },
  MuiCardContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(3),
        "&:last-child": {
          paddingBottom: theme.spacing(3)
        }
      })
    }
  },
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`
      })
    }
  },
  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderColor: theme.palette.divider
      })
    }
  },
  MuiLink: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline'
        }
      })
    }
  },
  MuiStack: {
    defaultProps: {
      useFlexGap: true
    }
  },
  MuiListSubheader: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: 'transparent',
        color: theme.palette.primary.main,
        fontWeight: 600,
        fontSize: '0.875rem'
      })
    }
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        '&.Mui-selected': {
          fontWeight: 600
        }
      }
    }
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8
      }
    }
  },
  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.text.secondary,
        fontWeight: 400,
        '&.Mui-focused': {
          color: theme.palette.primary.main
        }
      }),
      asterisk: {
        color: '#D32F2F'
      }
    }
  },
  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: 'rgba(0, 0, 0, 0.7)',
        // fontSize: '0.875rem',
        fontWeight: 500,
        marginBottom: '8px',
        display: 'block',
        '&.Mui-focused': {
          color: theme.palette.primary.main
        }
      }),
      asterisk: {
        color: '#D32F2F'
      }
    }
  },
  MuiTypography: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        // Don't override color if a specific color prop is provided
        ...(!ownerState.color && { color: theme.palette.text.primary })
      }),
      h6: ({ theme, ownerState }) => ({
        ...(!ownerState.color && { color: theme.palette.text.primary })
      }),
      subtitle1: ({ theme, ownerState }) => ({
        ...(!ownerState.color && { color: theme.palette.text.primary })
      })
    }
  },
  MuiFormControlLabel: {
    styleOverrides: {
      label: ({ theme }) => ({
        color: theme.palette.text.primary
      })
    }
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: 'white',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '16px !important',
        transition: theme.transitions.create(['background-color', 'border-color'], {
          duration: theme.transitions.duration.short,
        }),
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          border: `1px solid ${theme.palette.divider}`,
        },
        '&.Mui-selected': {
          backgroundColor: 'transparent',
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            border: `1px solid ${theme.palette.divider}`,
          }
        },
        '&:not(.Mui-selected)': {
          backgroundColor: 'white',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          }
        }
      })
    }
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: 'transparent',
        gap: theme.spacing(1.5),
        '& .MuiToggleButton-root': {
          backgroundColor: 'white',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '16px !important',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          '&.Mui-selected': {
            backgroundColor: 'transparent',
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
            }
          }
        }
      })
    }
  },
  MuiTextField: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white',
          borderRadius: '16px'
        },
        '& .MuiOutlinedInput-input': {
          // color: theme.palette.primary.main,
          // fontWeight: 500
        }
      })
    }
  },
  MuiSelect: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white',
          borderRadius: '16px'
        },
        '& .MuiSelect-select': {
          // color: theme.palette.primary.main,
          // fontWeight: 500
        }
      })
    }
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        backgroundColor: 'white',
        borderRadius: '16px'
      }
    }
  },
  MuiFormControl: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white',
          borderRadius: '16px'
        },
        '& .MuiOutlinedInput-input': {
          // color: theme.palette.primary.main,
          // fontWeight: 500
        }
      })
    }
  },

  MuiRadio: {
    styleOverrides: {
      root: {
        backgroundColor: 'white'
      }
    }
  }
};
