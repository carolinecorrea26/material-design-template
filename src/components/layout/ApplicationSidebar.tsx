import * as React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Divider,
  Link,
  Collapse,
} from "@mui/material";
import {
  Phone,
  CalendarMonth,
  ExpandMore,
  ExpandLess,
  AdjustRounded,
  CheckCircleRounded,
  PanoramaFishEyeRounded,
  QueryBuilderRounded,
  ReplayRounded,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { getClientFeatures, getClientBranding } from "../../config/clients";
import { ScheduleCallModal } from "../common/ScheduleCallModal";
import { getProducts } from "../../api/client";
import { COVERAGE_CATEGORY_LABELS } from "../../constants/coverage";
import type { Product, CoverageCategory } from "../../types/app";
import ResumeConfirmationDialog from "./ResumeConfirmationDialog";
import { useLayout } from "../../state/LayoutContext";
import { COVERAGE_CARDS } from "../../constants/getStartedProducts";
import { commonStyles } from "../../theme/commonStyles";

const PAGE_TIME_ESTIMATES: Record<string, number> = {
  "/membership": 2,
  "/eligibility": 3,
  "/get-started": 1,
  "/coverage": 5,
  "/contact": 3,
  "/profile": 4,
  "/health-history": 5,
  "/preview": 4,
  "/consent": 2,
};

/**
 * Application sidebar component for desktop layout
 *
 * Contains:
 * 1. Progress Section: Visual progress bar and page steps
 * 2. Navigation Controls: Back/Next buttons with step counter
 * 3. Help Toolbar: Phone support and appointment scheduling
 *
 * This sidebar is fixed/sticky on scroll and always visible on desktop.
 * On mobile, it's rendered inside a drawer that opens via hamburger menu.
 */
export default function ApplicationSidebar({
  hideLogo = false,
}: {
  hideLogo?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const features = getClientFeatures();
  const branding = getClientBranding();
  const logoMaxWidth = branding.logoMaxWidth ?? 250;
  const { layoutMode } = useLayout();
  const [showScheduleCall, setShowScheduleCall] = React.useState(false);
  const [coverageExpanded, setCoverageExpanded] = React.useState(false);
  const [showResumeDialog, setShowResumeDialog] = React.useState(false);

  const handleCoverageToggle = () => {
    setCoverageExpanded(!coverageExpanded);
  };

  const handleResumeClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Determine if we should show the modal
    const isOnLandingPage =
      location.pathname === "/" || location.pathname === "/landing";
    const shouldShowModal =
      layoutMode === "single-page" ||
      (layoutMode === "multi-page" && !isOnLandingPage);

    if (shouldShowModal) {
      setShowResumeDialog(true);
    } else {
      // Multi-page layout on landing page: navigate directly
      navigate("/resume");
    }
  };

  const handleResumeConfirm = () => {
    setShowResumeDialog(false);
    navigate("/resume");
  };

  // Get products and group by category
  const { data: products = [] } = getProducts();
  const productsByCategory = React.useMemo(() => {
    let allProducts = products;

    // If no products from API, use the ones from GetStarted as fallback
    if (products.length === 0) {
      allProducts = COVERAGE_CARDS.flatMap((card) =>
        card.products.map((product) => ({
          id: product.id,
          name: product.name,
          category: card.id as CoverageCategory,
          eligibleApplicants: product.applicants.map(
            (a) => a.toLowerCase() as Applicant,
          ),
          amounts: [],
          quickDecision: product.quickDecision,
        })),
      );
    }

    const grouped: Record<CoverageCategory, Product[]> = {
      LI: [],
      DI: [],
      OO: [],
      SH: [],
    };

    allProducts.forEach((product) => {
      if (grouped[product.category]) {
        grouped[product.category].push(product);
      }
    });

    return grouped;
  }, [products]);

  // Filter to application pages only
  const applicationPages = PAGES.filter((p) => {
    if (p.section !== "application") return false;

    // Filter out membership page if not enabled
    if (p.path === "/membership" && !features.showMembershipPage) {
      return false;
    }

    return true;
  });

  // Find current page index
  const currentIndex = applicationPages.findIndex(
    (p) => p.path === location.pathname,
  );

  // Don't show if not on an application page
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
  const canGoNext = effectiveIndex < applicationPages.length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Logo - Hidden in mobile drawer */}
      {!hideLogo && (
        <Box
          sx={{
            mb: 4,
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <Box
            component="img"
            src={branding.logo}
            alt={branding.logoAlt}
            sx={{
              maxWidth: `${logoMaxWidth}px`,
              maxHeight: "35px",
              height: "auto",
              display: "block",
              //   padding: '10px',
              //   background: 'white',
              //   borderRadius: '14px',
              //   boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </Box>
      )}

      {/* Page Steps */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                gap: 0.5,
                py: 1.25,
                px: 1.5,
                borderRadius: 1.5,
                cursor: isCompleted ? "pointer" : "default",
                bgcolor: isActive ? "rgba(25, 118, 210, 0.08)" : "transparent",
                transition: "all 0.2s",
                "&:hover": isCompleted
                  ? {
                      bgcolor: "rgba(25, 118, 210, 0.12)",
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
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted && (
                      <CheckCircleRounded
                        sx={{ fontSize: 20, color: "success.main" }}
                      />
                    )}
                    {isActive && (
                      <AdjustRounded
                        sx={{ fontSize: 20, color: "primary.main" }}
                      />
                    )}
                    {isUpcoming && (
                      <PanoramaFishEyeRounded
                        sx={{ fontSize: 20, color: "text.disabled" }}
                      />
                    )}
                  </Box>

                  {/* Text */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 600 : isCompleted ? 600 : 400,
                      color: isCompleted
                        ? "success.main"
                        : isActive
                          ? "primary.main"
                          : "text.secondary",
                      transition: "color 0.2s",
                      fontSize: "0.875rem",
                    }}
                  >
                    {page.title}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <QueryBuilderRounded
                    sx={{ fontSize: 14, color: "text.disabled" }}
                  />
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    {estimatedMinutes} min
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Toolbar Section */}
      <Box>
        <Typography
          variant="overline"
          sx={{
            display: "block",
            mb: 2,
            fontWeight: 700,
            fontSize: "0.7rem",
            color: "text.secondary",
            letterSpacing: 1,
          }}
        >
          GET HELP
        </Typography>

        {/* Resume Application Link */}
        <Box>
          <Link
            component="button"
            onClick={handleResumeClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 1.5,
              px: 1.5,
              borderRadius: 1.5,
              textDecoration: "none",
              color: "text.primary",
              width: "100%",
              textAlign: "left",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            {/* <ReplayRounded sx={{ fontSize: 20, color: 'primary.main' }} /> */}
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Resume Application
              </Typography>
              {/* <Typography variant="caption" color="text.secondary">
                Continue a previously saved application
              </Typography> */}
            </Box>
          </Link>
        </Box>

        {/* Coverage Details - Collapsible */}
        <Box>
          <Button
            fullWidth
            variant="text"
            endIcon={coverageExpanded ? <ExpandLess /> : <ExpandMore />}
            onClick={handleCoverageToggle}
            sx={{
              justifyContent: "space-between",
              py: 1.5,
              px: 1.5,
              borderRadius: 1.5,
              textTransform: "none",
              color: "text.primary",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="body2" fontWeight={600}>
                Coverage Details
              </Typography>
              {/* <Typography variant="caption" color="text.secondary" display="block">
                View product information
              </Typography> */}
            </Box>
          </Button>

          {/* Collapsible Product List */}
          <Collapse in={coverageExpanded}>
            <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
              {(Object.keys(productsByCategory) as CoverageCategory[]).map(
                (category) => {
                  const categoryProducts = productsByCategory[category];
                  if (categoryProducts.length === 0) return null;

                  return (
                    <Box key={category} sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        sx={commonStyles.coverageCategoryLabel}
                      >
                        {COVERAGE_CATEGORY_LABELS[category]}
                      </Typography>
                      {categoryProducts.map((product) => (
                        <Link
                          key={product.id}
                          href={`https://example.com/brochures/${product.id}.pdf`}
                          target="_blank"
                          sx={{
                            display: "block",
                            py: 0.75,
                            //   px: 1,
                            fontSize: "0.875rem",
                            color: "text.primary",
                            textDecoration: "none",
                            borderRadius: 1,
                            "&:hover": {
                              bgcolor: "rgba(0, 0, 0, 0.04)",
                              color: "primary.main",
                            },
                          }}
                        >
                          {product.name}
                        </Link>
                      ))}
                    </Box>
                  );
                },
              )}
            </Box>
          </Collapse>
        </Box>

        {/* Call Support */}
        <Link
          href={`tel:${branding.phone || "8006218981"}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            py: 1.5,
            px: 1.5,
            borderRadius: 1.5,
            textDecoration: "none",
            color: "text.primary",
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          {/* <Phone sx={{ fontSize: 20, color: 'primary.main' }} /> */}
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {branding.phoneDisplay || "(800) 621-8981"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              M-F 8:30am-5:00pm CST
            </Typography>
          </Box>
        </Link>

        {/* Schedule Call with Advisor */}
        {branding.scheduleCallUrl && (
          <Button
            fullWidth
            variant="text"
            // startIcon={<CalendarMonth />}
            onClick={() => setShowScheduleCall(true)}
            sx={{
              justifyContent: "flex-start",
              py: 1.5,
              px: 1.5,
              borderRadius: 1.5,
              textTransform: "none",
              color: "text.primary",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="body2" fontWeight={600}>
                Schedule Appointment
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Talk to an advisor
              </Typography>
            </Box>
          </Button>
        )}
      </Box>

      {/* Schedule Call Modal */}
      <ScheduleCallModal
        open={showScheduleCall}
        onClose={() => setShowScheduleCall(false)}
      />

      {/* Resume Confirmation Dialog */}
      <ResumeConfirmationDialog
        open={showResumeDialog}
        onClose={() => setShowResumeDialog(false)}
        onConfirm={handleResumeConfirm}
      />
    </Box>
  );
}
