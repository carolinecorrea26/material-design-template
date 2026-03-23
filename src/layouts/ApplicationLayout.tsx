import * as React from "react";
import {
  Box,
  IconButton,
  Drawer,
  LinearProgress,
  Typography,
  Button,
  Snackbar,
  Alert,
  Badge,
  Popover,
  Stack,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Close,
  AssignmentIndOutlined,
  ChildCare,
  FavoriteBorder,
  PersonOutline,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { getClientFeatures, getClientBranding } from "../config/clients";
import ApplicationSidebar from "../components/layout/ApplicationSidebar";
import CoveragePortfolioDrawer from "../components/coverage/CoveragePortfolioDrawer";
import { useAppData } from "../state/AppDataContext";
import { usePageLoading } from "../state/PageLoadingContext";
import { getProducts } from "../api/client";
import type { Product, SelectedItem } from "../types/app";
import { getApplicationPages, findPageIndex } from "../utils/navigation";

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
  const [cartAnchorEl, setCartAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );
  const [products, setProducts] = React.useState<Product[]>([]);
  const wasLoadingRef = React.useRef(false);
  const previousPathRef = React.useRef<string | null>(null);
  const previousIndexRef = React.useRef<number | null>(null);

  // Filter to application pages only
  const applicationPages = getApplicationPages(features);

  // Find current page index
  const currentIndex = findPageIndex(applicationPages, location.pathname);
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStep = effectiveIndex + 1;
  const totalSteps = applicationPages.length;
  const progressPercent =
    totalSteps > 1
      ? Math.max(1, ((currentStep - 1) / (totalSteps - 1)) * 100)
      : 1;
  const [displayProgress, setDisplayProgress] = React.useState(progressPercent);
  const lastProgressRef = React.useRef(progressPercent);

  React.useEffect(() => {
    if (isPageLoading) {
      wasLoadingRef.current = true;
      setShowSaved(false);
      return;
    }

    if (wasLoadingRef.current) {
      const isBackNav = sessionStorage.getItem("nyl-last-nav") === "back";
      const movedForward =
        previousIndexRef.current !== null &&
        effectiveIndex > previousIndexRef.current;

      if (isBackNav) {
        sessionStorage.removeItem("nyl-last-nav");
      }

      if (!movedForward) {
        wasLoadingRef.current = false;
        previousIndexRef.current = effectiveIndex;
        return;
      }

      setShowSaved(true);
      wasLoadingRef.current = false;
      const timer = setTimeout(() => setShowSaved(false), 2500);
      previousIndexRef.current = effectiveIndex;
      return () => clearTimeout(timer);
    }

    previousIndexRef.current = effectiveIndex;
  }, [effectiveIndex, isPageLoading]);

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
  const isCoveragePage = location.pathname === "/coverage-options";
  const progressLabel = `${Math.round(progressPercent)}%`;

  React.useEffect(() => {
    let mounted = true;
    getProducts()
      .then((fetched) => {
        if (!mounted) return;
        if (Array.isArray(fetched)) {
          setProducts(fetched);
        }
      })
      .catch((error) => {
        console.error("Failed to load products", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const productNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => {
      map.set(product.id, product.name);
    });
    return map;
  }, [products]);
  const applicantLabelById = React.useMemo(
    () => ({ self: "Self", spouse: "Spouse", child: "Child" }),
    [],
  );
  const applicantIconById = React.useMemo(
    () => ({
      self: PersonOutline,
      spouse: FavoriteBorder,
      child: ChildCare,
    }),
    [],
  );

  const selectedProductIds = data.eligibility?.coverageProductSelections ?? [];
  const selectedCoverage = data.coverage ?? [];
  const hasCartSelections =
    selectedProductIds.length > 0 || selectedCoverage.length > 0;
  const isCartOpen = Boolean(cartAnchorEl);

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const formatMonthly = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  const renderCartSummary = () => {
    if (selectedCoverage.length > 0) {
      const groupedCoverage = selectedCoverage.reduce((map, item) => {
        const existing = map.get(item.productId) ?? [];
        existing.push(item);
        map.set(item.productId, existing);
        return map;
      }, new Map<string, SelectedItem[]>());

      return (
        <Stack spacing={1.5}>
          {Array.from(groupedCoverage.entries()).map(([productId, items]) => (
            <Box key={productId}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {productNameById.get(productId) ?? productId}
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {items.map((item) => {
                  const ApplicantIcon = applicantIconById[item.applicant];
                  return (
                    <Stack
                      key={`${item.productId}-${item.applicant}`}
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                    >
                      <ApplicantIcon
                        sx={{ fontSize: "0.9rem", color: "primary.main" }}
                      />
                      {/* <Typography
                        variant="caption"
                        color="primary.main"
                        sx={{ fontWeight: 600 }}
                      >
                        {applicantLabelById[item.applicant]}
                      </Typography> */}
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(item.amount)} ·{" "}
                        {formatMonthly(item.estMonthly)}
                        /mo
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      );
    }

    if (selectedProductIds.length > 0) {
      return (
        <Stack spacing={1}>
          {selectedProductIds.map((productId) => (
            <Typography key={productId} variant="body2">
              {productNameById.get(productId) ?? productId}
            </Typography>
          ))}
        </Stack>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary">
        No products selected yet.
      </Typography>
    );
  };

  React.useEffect(() => {
    previousPathRef.current = location.pathname;
  }, [location.pathname]);

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
      key={location.pathname}
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "white",
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
        <Box
          sx={{
            width: "100%",
            mt: { xs: "56px", sm: "56px" },
            px: { xs: 0, md: 2 },
          }}
        >
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
              <Snackbar
                open={showSaved}
                onClose={() => setShowSaved(false)}
                autoHideDuration={2500}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert severity="success" variant="filled">
                  Progress saved
                </Alert>
              </Snackbar>
            </Box>
            <Box
              component="div"
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                mb: "-8px",
                ml: "2.5rem",
                color: "text.secondary",
              }}
            >
              <Box
                component="span"
                sx={{ color: "primary.main", fontWeight: 900 }}
              >
                {progressLabel}
              </Box>{" "}
              done
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
          pt: { xs: "16px" },
          minHeight: { xs: "80vh", sm: "64vh" },
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
                {isCoveragePage && hasPortfolio && false && (
                  <Button
                    variant="outlined"
                    onClick={() => setPortfolioOpen(true)}
                    size="small"
                  >
                    Coverage Portfolio
                  </Button>
                )}
                <IconButton
                  aria-label="coverage summary"
                  onClick={(event) => setCartAnchorEl(event.currentTarget)}
                  size="small"
                >
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={!hasCartSelections}
                  >
                    <AssignmentIndOutlined />
                  </Badge>
                </IconButton>
                <IconButton
                  aria-label="menu"
                  onClick={() => setMobileMenuOpen(true)}
                  size="small"
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Popover
            open={isCartOpen}
            anchorEl={cartAnchorEl}
            onClose={() => setCartAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                width: "min(320px, 90vw)",
                p: 2,
                borderRadius: 2,
              },
            }}
          >
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Coverage Summary
              </Typography>
              <Divider />
              {renderCartSummary()}
            </Stack>
          </Popover>

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
