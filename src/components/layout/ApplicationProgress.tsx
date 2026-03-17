import * as React from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  QueryBuilderRounded,
  AdjustRounded,
  CheckCircleRounded,
  PanoramaFishEyeRounded,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { getClientFeatures } from "../../config/clients";
import { getApplicationPages, findPageIndex } from "../../utils/navigation";

const PAGE_TIME_ESTIMATES: Record<string, number> = {
  "/membership": 2,
  "/eligibility": 6,
  "/get-started": 4,
  "/coverage-options": 5,
  "/contact": 3,
  "/profile": 4,
  "/health-history": 5,
  "/preview": 4,
  "/consent": 2,
};

/**
 * Legacy horizontal progress bar component
 *
 * NOTE: This component is being phased out for application pages in favor of
 * the new sidebar layout (ApplicationSidebar). It is still used for:
 * - Single-page layout mode (returns null)
 * - Non-application pages where the horizontal bar is still relevant
 *
 * For application pages (eligibility, coverage, contact, etc.), the new
 * ApplicationLayout with sidebar is used instead.
 */
export default function ApplicationProgress() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const features = getClientFeatures();

  // Filter to application pages only
  const applicationPages = getApplicationPages(features);

  // Find current page index
  const currentIndex = findPageIndex(applicationPages, location.pathname);

  // Don't show progress bar if not on an application page
  if (currentIndex === -1) {
    return null;
  }

  const effectiveIndex = currentIndex;
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
    const submitButton = document.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    if (submitButton) {
      submitButton.click();
      return;
    }

    // Look for PageNavigation continue button (the contained button in page-navigation)
    const pageNavigation = document.querySelector(".page-navigation");
    if (pageNavigation) {
      const continueButton = pageNavigation.querySelector(
        "button.MuiButton-contained",
      ) as HTMLButtonElement;
      if (continueButton) {
        continueButton.click();
        return;
      }
    }

    // Fallback: navigate directly if no buttons found
    if (effectiveIndex < applicationPages.length - 1) {
      navigate(applicationPages[effectiveIndex + 1].path);
    } else if (effectiveIndex === applicationPages.length - 1) {
      // If on last application page (Consent), navigate to DocuSign
      navigate("/docusign");
    }
  };

  const canGoBack = effectiveIndex > 0;
  // Allow next button on last page to go to next step
  const canGoNext = effectiveIndex < applicationPages.length;

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        // bgcolor: 'background.paper',
        bgcolor: "rgb(255 255 255 / 95%)",
        borderBottom: 1,
        borderColor: "divider",
        width: "100%",
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          px: 3,
          py: isMobile ? 1 : 1.5,
        }}
      >
        {isMobile ? (
          // Mobile Layout
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              {/* Back button */}
              <Button
                size="small"
                onClick={handleBack}
                disabled={!canGoBack}
                sx={{
                  minWidth: "auto",
                  p: 0.5,
                  visibility: canGoBack ? "visible" : "hidden",
                }}
              >
                <ChevronLeft />
              </Button>

              {/* Step indicator */}
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ flex: 1, textAlign: "center" }}
              >
                Step {currentStep} of {totalSteps}
              </Typography>

              {/* Next button */}
              <Button
                size="small"
                onClick={handleNext}
                sx={{
                  minWidth: "auto",
                  p: 0.5,
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
                bgcolor: "grey.200",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                  bgcolor: "primary.main",
                },
              }}
            />
          </Box>
        ) : (
          // Desktop Layout
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Left: Step labels */}
            <Box
              sx={{
                display: "flex",
                gap: 3,
                flex: 1,
              }}
            >
              {applicationPages.map((page, index) => {
                const isActive = index === effectiveIndex;
                const isCompleted = index < effectiveIndex;
                const isUpcoming = index > effectiveIndex;
                const estimatedMinutes = PAGE_TIME_ESTIMATES[page.path] ?? 3;

                return (
                  <Box
                    key={page.path}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.25,
                      cursor: isCompleted ? "pointer" : "default",
                      "&:hover": isCompleted
                        ? {
                            "& .MuiTypography-root": {
                              color: "primary.dark",
                            },
                          }
                        : {},
                    }}
                    onClick={() => {
                      if (isCompleted) {
                        navigate(page.path);
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        {/* Status icon */}
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isCompleted && (
                            <CheckCircleRounded
                              sx={{ fontSize: 18, color: "success.main" }}
                            />
                          )}
                          {isActive && (
                            <AdjustRounded
                              sx={{ fontSize: 18, color: "primary.main" }}
                            />
                          )}
                          {isUpcoming && (
                            <PanoramaFishEyeRounded
                              sx={{ fontSize: 10, color: "text.disabled" }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isCompleted
                              ? 900
                              : isActive
                                ? 900
                                : 500,
                            color: isCompleted
                              ? "success.main"
                              : isActive
                                ? "primary.main"
                                : "text.secondary",
                            transition: "color 0.2s",
                          }}
                        >
                          {page.title}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        <QueryBuilderRounded
                          sx={{ fontSize: 14, color: "text.disabled" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "text.disabled" }}
                        >
                          {estimatedMinutes} min
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Right: Step counter with navigation */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Back button */}
              <Button
                size="small"
                onClick={handleBack}
                disabled={!canGoBack}
                sx={{
                  minWidth: "auto",
                  p: 0.5,
                  visibility: canGoBack ? "visible" : "hidden",
                }}
              >
                <ChevronLeft />
              </Button>

              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ whiteSpace: "nowrap" }}
              >
                Step {currentStep} of {totalSteps}
              </Typography>

              {/* Next button */}
              <Button
                size="small"
                onClick={handleNext}
                sx={{
                  minWidth: "auto",
                  p: 0.5,
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
