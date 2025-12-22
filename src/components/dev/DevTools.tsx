import * as React from "react";
import { Box, Button, Stack, IconButton, Drawer, Typography, Divider, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Settings } from "@mui/icons-material";
import ClientSwitcher from "./ClientSwitcher";
import { useLayout } from "../../state/LayoutContext";

export default function DevTools() {
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const { layoutMode, setLayoutMode } = useLayout();

  const handleResetApp = () => {
    // Clear all localStorage data
    localStorage.clear();
    // Clear all sessionStorage data (including form data)
    sessionStorage.clear();
    // Reload the page to reset all states
    window.location.reload();
  };

  const handleFillOutPage = () => {
    // Dispatch a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('devtools:fillform'));
  };

  // Only show Fill Out Page button on form pages
  // In single-page layout, always show it since form pages are on the same page
  const isFormPage = layoutMode === 'single-page' || 
    ['/membership', '/eligibility', '/coverage', '/contact', '/profile', '/payment', '/health-history'].includes(location.pathname);

  return (
    <>
      {/* Toggle Button - Fixed to right side */}
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          right: open ? 320 : 0, // Shift left when drawer is open
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'grey.100',
          color: 'text.primary',
          borderRadius: '8px 0 0 8px',
          padding: '12px 8px',
          zIndex: 1300,
          transition: 'right 0.3s ease',
          '&:hover': {
            bgcolor: 'grey.200',
          },
        }}
      >
        <Settings />
      </IconButton>

      {/* Sidebar Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 320,
            bgcolor: 'grey.50',
            color: 'text.primary',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
              Dev Tools
            </Typography>
            {/* <IconButton 
              onClick={() => setOpen(false)}
              size="small"
              sx={{ color: 'common.white' }}
            >
              <ChevronLeft />
            </IconButton> */}
          </Stack>

          <Divider sx={{ borderColor: 'divider', mb: 2 }} />

          {/* Content */}
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                CLIENT
              </Typography>
              <ClientSwitcher />
            </Box>

            <Divider sx={{ borderColor: 'divider' }} />

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                LAYOUT MODE
              </Typography>
              <ToggleButtonGroup
                value={layoutMode}
                exclusive
                onChange={(_e, value) => value && setLayoutMode(value)}
                fullWidth
                size="small"
              >
                <ToggleButton value="multi-page">Multi-Page</ToggleButton>
                <ToggleButton value="single-page">Single-Page</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider sx={{ borderColor: 'divider' }} />

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                FORM ACTIONS
              </Typography>
              <Stack spacing={1}>
                {isFormPage && (
                  <Button
                    onClick={handleFillOutPage}
                    fullWidth
                    variant="outlined"
                    sx={{
                      color: 'text.primary',
                      borderColor: 'divider',
                      justifyContent: 'flex-start',
                      '&:hover': {
                        borderColor: 'success.main',
                        bgcolor: 'success.lighter',
                      },
                    }}
                  >
                    Fill Out Page
                  </Button>
                )}
                <Button
                  onClick={handleResetApp}
                  fullWidth
                  variant="outlined"
                  sx={{
                    color: 'text.primary',
                    borderColor: 'divider',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      borderColor: 'error.main',
                      bgcolor: 'error.lighter',
                    },
                  }}
                >
                  Reset App
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ borderColor: 'divider' }} />

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                DOCUMENTATION
              </Typography>
              <Stack spacing={1}>
                <Button
                  component={RouterLink}
                  to="/styleguide"
                  fullWidth
                  variant="outlined"
                  sx={{
                    color: 'text.primary',
                    borderColor: 'divider',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'grey.50',
                    },
                  }}
                >
                  Styleguide
                </Button>
                <Button
                  component={RouterLink}
                  to="/project-structure"
                  fullWidth
                  variant="outlined"
                  sx={{
                    color: 'text.primary',
                    borderColor: 'divider',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'grey.50',
                    },
                  }}
                >
                  Project Structure
                </Button>
                <Button
                  component={RouterLink}
                  to="/site-requirements"
                  fullWidth
                  variant="outlined"
                  sx={{
                    color: 'text.primary',
                    borderColor: 'divider',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'grey.50',
                    },
                  }}
                >
                  Site Requirements
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
