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
        transition: theme.transitions.create(['background-color', 'border-color'], {
          duration: theme.transitions.duration.short,
        }),
        // Remove any background from Typography or other text elements
        '& .MuiTypography-root': {
          backgroundColor: 'transparent !important',
        },
        // Remove background from any nested elements
        '& *': {
          backgroundColor: 'transparent !important',
        },
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          border: `1px solid ${theme.palette.divider}`,
          // Ensure text elements remain transparent on hover
          '& *': {
            backgroundColor: 'transparent !important',
          }
        },
        '&.Mui-selected': {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText,
          border: `1px solid ${theme.palette.primary.light}`,
          // Ensure text elements remain transparent when selected
          '& *': {
            backgroundColor: 'transparent !important',
          },
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
            border: `1px solid ${theme.palette.primary.main}`,
            // Ensure text elements remain transparent on selected hover
            '& *': {
              backgroundColor: 'transparent !important',
            }
          }
        },
        '&:not(.Mui-selected)': {
          backgroundColor: 'white',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            // Ensure text elements remain transparent on unselected hover
            '& *': {
              backgroundColor: 'transparent !important',
            }
          }
        }
      })
    }
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        // Ensure no background interference
        backgroundColor: 'transparent',
        // Override any potential conflicts with high specificity
        '& .MuiToggleButton-root': {
          backgroundColor: 'white',
          border: `1px solid ${theme.palette.divider}`,
          // Force remove backgrounds from all nested elements
          '& *': {
            backgroundColor: 'transparent !important',
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            '& *': {
              backgroundColor: 'transparent !important',
            }
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            border: `1px solid ${theme.palette.primary.light}`,
            '& *': {
              backgroundColor: 'transparent !important',
            },
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
              border: `1px solid ${theme.palette.primary.main}`,
              '& *': {
                backgroundColor: 'transparent !important',
              }
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
          backgroundColor: 'white'
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
          backgroundColor: 'white'
        },
        '& .MuiSelect-select': {
          // color: theme.palette.primary.main,
          // fontWeight: 500
        }
      })
    }
  },
  MuiFormControl: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white'
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
