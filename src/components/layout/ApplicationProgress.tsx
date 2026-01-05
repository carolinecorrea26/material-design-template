import * as React from "react";
import { Box, Button, Typography, LinearProgress, useMediaQuery, useTheme } from "@mui/material";
import { ChevronLeft, ChevronRight, CheckCircle, LocationOn } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { getClientFeatures } from "../../config/clients";
import { useLayout } from "../../state/LayoutContext";

export default function ApplicationProgress() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const features = getClientFeatures();
  const { layoutMode } = useLayout();

  // Filter to application pages only
  const applicationPages = PAGES.filter(p => {
    if (p.section !== "application") return false;
    
    // Filter out membership page if not enabled
    if (p.path === "/membership" && !features.showMembershipPage) {
      return false;
    }
    
    return true;
  });

  // Find current page index
  const currentIndex = applicationPages.findIndex(p => p.path === location.pathname);
  
  // Don't show progress bar if not on an application page (unless in single-page mode)
  if (currentIndex === -1 && layoutMode !== 'single-page') {
    return null;
  }

  // In single-page mode, default to first step if no match found
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStep = effectiveIndex + 1;
  const totalSteps = applicationPages.length;
  const progressPercent = (currentStep / totalSteps) * 100;

  const handleBack = () => {
    if (effectiveIndex > 0) {
      navigate(applicationPages[effectiveIndex - 1].path);
    }
  };

  const handleNext = () => {
    // Try to submit the current form instead of navigating directly
    // This allows validation to run before navigation
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.click();
    } else {
      // Look for any continue/next button in the page navigation
      const continueButton = document.querySelector('.page-navigation button[variant="contained"]') as HTMLButtonElement;
      if (continueButton) {
        continueButton.click();
      } else if (effectiveIndex < applicationPages.length - 1) {
        // If no buttons found, navigate directly to next page
        navigate(applicationPages[effectiveIndex + 1].path);
      } else if (effectiveIndex === applicationPages.length - 1) {
        // If on last application page (Consent), navigate to DocuSign
        navigate('/docusign');
      }
    }
  };

  const canGoBack = effectiveIndex > 0;
  // Allow next button on last page to go to next step
  const canGoNext = effectiveIndex < applicationPages.length;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        // bgcolor: 'background.paper',
        bgcolor: 'rgb(255 255 255 / 95%)',
        borderBottom: 1,
        borderColor: 'divider',
        width: '100%'
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          px: 3,
          py: isMobile ? 1 : 1.5
        }}
      >
        {isMobile ? (
          // Mobile Layout
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1
              }}
            >
              {/* Back button */}
              <Button
                size="small"
                onClick={handleBack}
                disabled={!canGoBack}
                sx={{ 
                  minWidth: 'auto',
                  p: 0.5,
                  visibility: canGoBack ? 'visible' : 'hidden'
                }}
              >
                <ChevronLeft />
              </Button>

              {/* Step indicator */}
              <Typography variant="body2" fontWeight={500} sx={{ flex: 1, textAlign: 'center' }}>
                Step {currentStep} of {totalSteps}
              </Typography>

              {/* Next button */}
              <Button
                size="small"
                onClick={handleNext}
                sx={{ 
                  minWidth: 'auto',
                  p: 0.5
                }}
              >
                <ChevronRight />
              </Button>
            </Box>

            {/* Progress bar */}
            <LinearProgress 
              variant="determinate" 
              value={progressPercent}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                  bgcolor: 'primary.main'
                }
              }}
            />
          </Box>
        ) : (
          // Desktop Layout
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Left: Step labels */}
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                flex: 1
              }}
            >
              {applicationPages.map((page, index) => {
                const isActive = index === effectiveIndex;
                const isCompleted = index < effectiveIndex;
                const isUpcoming = index > effectiveIndex;

                return (
                  <Box
                    key={page.path}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      cursor: isCompleted ? 'pointer' : 'default',
                      '&:hover': isCompleted
                        ? {
                            '& .MuiTypography-root': {
                              color: 'primary.dark'
                            }
                          }
                        : {}
                    }}
                    onClick={() => {
                      if (isCompleted) {
                        navigate(page.path);
                      }
                    }}
                  >
                    {/* Reserve space for indicator/checkmark to prevent shifting */}
                    <Box sx={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {isCompleted && (
                        <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                      )}
                      {isActive && (
                        <LocationOn 
                          sx={{ 
                            fontSize: 18, 
                            color: 'primary.dark'
                          }} 
                        />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isCompleted 
                          ? 500
                          : isActive
                          ? 900
                          : 500,
                        color: isCompleted
                          ? 'primary.main'
                          : isActive
                          ? 'primary.main'
                          : 'text.secondary',
                        transition: 'color 0.2s'
                      }}
                    >
                      {page.title}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Right: Step counter with navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Back button */}
              <Button
                size="small"
                onClick={handleBack}
                disabled={!canGoBack}
                sx={{ 
                  minWidth: 'auto',
                  p: 0.5,
                  visibility: canGoBack ? 'visible' : 'hidden'
                }}
              >
                <ChevronLeft />
              </Button>

              <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                Step {currentStep} of {totalSteps}
              </Typography>

              {/* Next button */}
              <Button
                size="small"
                onClick={handleNext}
                sx={{ 
                  minWidth: 'auto',
                  p: 0.5
                }}
              >
                <ChevronRight />
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
