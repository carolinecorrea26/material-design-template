import * as React from "react";
import {
  Box,
  IconButton,
  Drawer,
  LinearProgress,
  Typography,
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Close,
  Cached,
  CheckCircleRounded,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { PAGES } from "../config/pages";
import { getClientFeatures, getClientBranding } from "../config/clients";
import ApplicationSidebar from "../components/layout/ApplicationSidebar";
import CoveragePortfolioDrawer from "../components/coverage/CoveragePortfolioDrawer";
import { useAppData } from "../state/AppDataContext";
import { usePageLoading } from "../state/PageLoadingContext";

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

/**
 * Modern application layout with sidebar navigation
 *
 * Features:
 * - Desktop: Fixed sidebar (300px) with progress, navigation, and help tools
 * - Mobile: Top bar with progress + hamburger menu for sidebar drawer
 * - Full-width container with centered content (max 900px)
 *
 * Used for: Application form pages (eligibility, coverage, contact, etc.)
 * Not used for: Landing page, decision, receipt, other non-application pages
 */
export default function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [portfolioOpen, setPortfolioOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const features = getClientFeatures();
  const { data } = useAppData();
  const { isPageLoading } = usePageLoading();
  const [showSaved, setShowSaved] = React.useState(false);
  const wasLoadingRef = React.useRef(false);
  const previousPathRef = React.useRef<string | null>(null);
  const [isBackNav, setIsBackNav] = React.useState(false);

  React.useEffect(() => {
    if (isPageLoading) {
      wasLoadingRef.current = true;
      setShowSaved(false);
      return;
    }

    if (wasLoadingRef.current) {
      if (isBackNav) {
        wasLoadingRef.current = false;
        return;
      }
      setShowSaved(true);
      wasLoadingRef.current = false;
      const timer = setTimeout(() => setShowSaved(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isBackNav, isPageLoading]);

  // Filter to application pages only
  const applicationPages = PAGES.filter((p) => {
    if (p.section !== "application") return false;
    if (p.path === "/membership" && !features.showMembershipPage) {
      return false;
    }
    return true;
  });

  // Find current page index
  const currentIndex = applicationPages.findIndex(
    (p) => p.path === location.pathname,
  );
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStep = effectiveIndex + 1;
  const totalSteps = applicationPages.length;
  const progressPercent =
    totalSteps > 1
      ? Math.max(1, ((currentStep - 1) / (totalSteps - 1)) * 100)
      : 1;
  const [displayProgress, setDisplayProgress] = React.useState(progressPercent);
  const lastProgressRef = React.useRef(progressPercent);

  const handleBack = () => {
    sessionStorage.setItem("nyl-last-nav", "back");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    if (effectiveIndex > 0) {
      navigate(applicationPages[effectiveIndex - 1].path);
    }
  };

  const handleNext = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    const submitButton = document.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    if (submitButton) {
      submitButton.click();
      return;
    }

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

    if (effectiveIndex < applicationPages.length - 1) {
      navigate(applicationPages[effectiveIndex + 1].path);
    } else if (effectiveIndex === applicationPages.length - 1) {
      navigate("/docusign");
    }
  };

  const canGoBack = effectiveIndex > 0;
  const isOnApplicationPage = currentIndex !== -1;
  const branding = getClientBranding();
  const hasPortfolio = (data.coverage ?? []).length > 0;
  const isCoveragePage = location.pathname === "/coverage";
  const progressLabel = `${Math.round(progressPercent)}%`;

  React.useEffect(() => {
    const previousPath = previousPathRef.current;
    const previousIndex = previousPath
      ? applicationPages.findIndex((p) => p.path === previousPath)
      : -1;
    const backNav =
      previousIndex !== -1 && currentIndex !== -1
        ? currentIndex < previousIndex
        : false;
    setIsBackNav(backNav);
    previousPathRef.current = location.pathname;
  }, [applicationPages, currentIndex, location.pathname]);

  React.useEffect(() => {
    if (isPageLoading) {
      setDisplayProgress(lastProgressRef.current);
      return;
    }
    lastProgressRef.current = progressPercent;
    setDisplayProgress(progressPercent);
  }, [isPageLoading, progressPercent]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        // background: "linear-gradient(45deg, #f3fbfa, #f2f7ff)",
        background: "linear-gradient(45deg, #eefffd, #fbfffc)",
      }}
    >
      {/* Hidden sidebar placeholder (desktop layout parity) */}
      <Box
        sx={{
          width: 0,
          flexShrink: 0,
          display: "none",
          bgcolor: "#f4f5f9",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <ApplicationSidebar />
      </Box>

      {/* Progress header */}
      {isOnApplicationPage && (
        <Box sx={{ width: "100%", mt: "64px", px: { xs: 0, md: 2 } }}>
          <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                ml: "2.5rem",
                mr: "2.5rem",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              >
                Progress:{" "}
                <Box
                  component="span"
                  sx={{ color: "primary.main", fontWeight: 900 }}
                >
                  {progressLabel}
                </Box>
              </Typography>
              {effectiveIndex > 0 &&
                !isBackNav &&
                (isPageLoading || showSaved) && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {isPageLoading ? (
                      <Cached
                        sx={{
                          color: "primary.main",
                          fontSize: "1rem",
                          animation: "spin 1.2s linear infinite",
                          "@keyframes spin": {
                            from: { transform: "rotate(0deg)" },
                            to: { transform: "rotate(360deg)" },
                          },
                        }}
                      />
                    ) : (
                      <CheckCircleRounded
                        sx={{ color: "success.main", fontSize: "1rem" }}
                      />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "0.75rem", md: "0.75rem" },
                        color: isPageLoading ? "text.primary" : "success.main",
                      }}
                    >
                      {isPageLoading ? "Saving" : "Saved"}
                    </Typography>
                  </Box>
                )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={handleBack}
                disabled={!canGoBack}
                size="small"
              >
                <ChevronLeft />
              </IconButton>
              <LinearProgress
                variant="determinate"
                value={displayProgress}
                sx={{
                  flex: 1,
                  height: 12,
                  borderRadius: 999,
                  bgcolor: "rgb(0 0 0 / 4%)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "primary.main",
                    borderRadius: 999,
                  },
                }}
              />
              <IconButton onClick={handleNext} size="small">
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}

      {/* Right Content Area - Form Pages */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: "750px",
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 3 },
          pt: { xs: "32px" },
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>

      <CoveragePortfolioDrawer
        open={portfolioOpen}
        onClose={() => setPortfolioOpen(false)}
      />

      {/* Mobile header and menu */}
      {isOnApplicationPage && (
        <>
          {/* Mobile Top Bar */}
          <Box
            sx={{
              display: "flex",
              position: "fixed",
              top: 0, // No header on application pages
              left: 0,
              right: 0,
              bgcolor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
              zIndex: 1000,
              flexDirection: "column",
            }}
          >
            {/* Navigation Controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1,
                width: "100%",
                maxWidth: "1400px",
                mx: "auto",
              }}
            >
              <Box
                component="img"
                src={branding.logo}
                alt={branding.logoAlt}
                onClick={() => navigate("/")}
                sx={{
                  height: "28px",
                  width: "auto",
                  cursor: "pointer",
                }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {isCoveragePage && hasPortfolio && (
                  <Button
                    variant="outlined"
                    onClick={() => setPortfolioOpen(true)}
                    size="small"
                  >
                    Coverage Portfolio
                  </Button>
                )}
                <Button
                  onClick={() => setMobileMenuOpen(true)}
                  size="small"
                  startIcon={<MenuIcon />}
                  sx={{ fontWeight: 600 }}
                >
                  Menu
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Mobile Menu Drawer */}
          <Drawer
            anchor="right"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            sx={{
              display: "block",
              "& .MuiDrawer-paper": {
                width: "85%",
                maxWidth: "320px",
              },
            }}
          >
            {/* Drawer Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Application Menu
              </Typography>
              <IconButton onClick={() => setMobileMenuOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>

            {/* Sidebar Content (without logo in mobile drawer) */}
            <ApplicationSidebar hideLogo={true} />
          </Drawer>
        </>
      )}
    </Box>
  );
}
