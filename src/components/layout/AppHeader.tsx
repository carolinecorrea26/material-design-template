import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  AppBar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Link,
  Slide,
  Stack,
  Toolbar,
  Typography,
  useScrollTrigger,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ChatIcon from "@mui/icons-material/Chat";
import AppMenuDrawer from "./AppMenuDrawer";
import AppDrawer from "../ui/AppDrawer";
import { pages } from "../../config/pages";
import type { CoverageDefinition } from "../../config/coverages/types";
import { getFormProgressPercent, isFormPage } from "../../config/formFlow";
import type { ClientConfig } from "../../config/clients/types";
import type { PageId } from "../../types";
import { useApplicationForm } from "../../app/ApplicationFormContext";
import { router } from "../../app/router";
import CoverageSummary, {
  useApplicationSummaryBadge,
} from "../CoverageSummary";
import type { AppLayoutVariant } from "./AppLayout";
import ClientHelpBanner from "./ClientHelpBanner";

type AppHeaderProps = {
  client: ClientConfig;
  /** Controls which header actions are shown. Defaults to "applicationForm". */
  variant?: AppLayoutVariant;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatCoverageRange(coverage: CoverageDefinition) {
  if (coverage.minAmount == null && coverage.maxAmount == null) {
    return "Amount varies by selection.";
  }
  if (coverage.minAmount != null && coverage.maxAmount != null) {
    return `${currencyFormatter.format(coverage.minAmount)} - ${currencyFormatter.format(coverage.maxAmount)}`;
  }
  if (coverage.minAmount != null) {
    return `Starting at ${currencyFormatter.format(coverage.minAmount)}`;
  }
  return `Up to ${currencyFormatter.format(coverage.maxAmount ?? 0)}`;
}

function formatApplicants(applicants: CoverageDefinition["applicants"]) {
  const labels: Record<CoverageDefinition["applicants"][number], string> = {
    member: "Member",
    spouse: "Spouse",
    child: "Child",
  };
  return applicants.map((applicant) => labels[applicant]).join(", ");
}

function patchHistoryForLocationChangeEvents() {
  if (typeof window === "undefined") return;
  if (
    (window as typeof window & { __historyPatched__?: boolean })
      .__historyPatched__
  ) {
    return;
  }

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (...args) {
    originalPushState.apply(this, args);
    window.dispatchEvent(new Event("locationchange"));
  };

  window.history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    window.dispatchEvent(new Event("locationchange"));
  };

  (
    window as typeof window & { __historyPatched__?: boolean }
  ).__historyPatched__ = true;
}

function subscribeToPathname(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  patchHistoryForLocationChangeEvents();
  window.addEventListener("popstate", callback);
  window.addEventListener("locationchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("locationchange", callback);
  };
}

function getPathnameSnapshot() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname;
}

export default function AppHeader({
  client,
  variant = "applicationForm",
}: AppHeaderProps) {
  // "applicationForm" and "homepage" both show the menu icon.
  // Utility variants (advisorLogin, advisorSend, resumeEmailCode) show logo only.
  const showMenu = variant === "applicationForm" || variant === "homepage";

  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summarySource, setSummarySource] = useState<
    "cart-icon" | "coverage-page"
  >("cart-icon");
  const [_addedSnackbarOpen, setAddedSnackbarOpen] = useState(false);
  const [activeCoverage, setActiveCoverage] =
    useState<CoverageDefinition | null>(null);
  const { values } = useApplicationForm();
  const summaryBadgeCount = useApplicationSummaryBadge();

  const pathname = useSyncExternalStore(
    subscribeToPathname,
    getPathnameSnapshot,
    () => "/",
  );

  const trigger = useScrollTrigger({ threshold: 8 });

  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const currentPage = pages.find((page) => page.path === normalizedPath);
  const currentPageId = currentPage?.id as PageId | undefined;

  // Progress bar only on applicationForm variant, not homepage
  const showProgress =
    variant === "applicationForm" &&
    !!currentPage &&
    isFormPage(currentPage.id as PageId) &&
    currentPage.id !== "receipt";

  const overallProgressPercent =
    showProgress && currentPageId
      ? getFormProgressPercent(currentPageId, values)
      : 0;

  const showSummaryIcon =
    variant === "applicationForm" &&
    currentPageId !== undefined &&
    currentPageId !== "home" &&
    currentPageId !== "receipt";

  const prevCoverageCountRef = useRef<number>(
    Array.isArray(values.coverageSelections)
      ? values.coverageSelections.length
      : 0,
  );

  useEffect(() => {
    const currentCount = Array.isArray(values.coverageSelections)
      ? values.coverageSelections.length
      : 0;
    const prevCount = prevCoverageCountRef.current;
    prevCoverageCountRef.current = currentCount;

    if (
      currentPageId === "coverage" &&
      currentCount > prevCount &&
      prevCount >= 0
    ) {
      setAddedSnackbarOpen(true);
    }
  }, [values.coverageSelections, currentPageId]);

  return (
    <>
      <ClientHelpBanner client={client} />
      <Slide appear={false} direction="down" in={!trigger}>
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            backgroundColor: "#fff",
            borderBottom: "none",
            boxShadow: "none",
            pt: 2,
          }}
        >
          <Toolbar
            sx={{
              width: "100%",
              marginLeft: "auto",
              marginRight: "auto",
              minHeight: "40px !important",
              px: { xs: 2, sm: 3, md: 4 },
              gap: 1,
              alignItems: "stretch",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                {imageError ? (
                  <Typography
                    variant="h6"
                    noWrap
                    sx={{ cursor: "pointer" }}
                    onClick={() => void router.navigate("/")}
                  >
                    {client.branding.name}
                  </Typography>
                ) : (
                  <Box
                    component="img"
                    src={client.branding.logo}
                    alt={client.branding.logoAlt}
                    onError={() => setImageError(true)}
                    onClick={() => void router.navigate("/")}
                    sx={{
                      height: "auto",
                      width: "auto",
                      maxWidth: { xs: 200, sm: 250 },
                      maxHeight: 35,
                      display: "block",
                      cursor: "pointer",
                    }}
                  />
                )}
              </Box>

              <Box sx={{ ml: "auto", minWidth: 0, textAlign: "right" }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {showMenu && client.features?.chat && showSummaryIcon && (
                    <IconButton
                      aria-label="Open chat"
                      size="small"
                      sx={{ borderRadius: 1, gap: 0.5 }}
                    >
                      <ChatIcon sx={{ color: "primary.main" }} />
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{
                          color: "primary.main",
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        Chat
                      </Typography>
                    </IconButton>
                  )}

                  {showSummaryIcon && (
                    <IconButton
                      aria-label="Open coverage requested"
                      onClick={() => {
                        setSummarySource("cart-icon");
                        setIsSummaryOpen(true);
                      }}
                      size="small"
                      sx={{ borderRadius: 1, gap: 0.5 }}
                    >
                      <Badge
                        badgeContent={summaryBadgeCount}
                        color="error"
                        max={99}
                      >
                        <ShoppingCartIcon sx={{ color: "primary.main" }} />
                      </Badge>
                    </IconButton>
                  )}

                  {showMenu && (
                    <IconButton
                      aria-label="Open application navigation menu"
                      onClick={() => setIsMenuOpen(true)}
                      size="small"
                    >
                      <MenuIcon />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            </Box>

            {showProgress && (
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <LinearProgress
                  variant="determinate"
                  value={overallProgressPercent}
                  aria-label="Overall application progress"
                  sx={{
                    width: {
                      xs: "calc(100% + 32px)",
                      sm: "calc(100% + 48px)",
                      md: "calc(100% + 64px)",
                    },
                    mx: { xs: -2, sm: -3, md: -4 },
                    mt: 2,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "primary.main",
                    },
                  }}
                />
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </Slide>

      {showMenu && (
        <AppMenuDrawer
          open={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          client={client}
        />
      )}

      {/* Coverage details dialog (triggered from CoverageSummary or ProductCatalog) */}
      <Dialog
        open={Boolean(activeCoverage)}
        onClose={() => setActiveCoverage(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{activeCoverage?.name ?? "Coverage Details"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {activeCoverage?.description ?? activeCoverage?.definition}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 700 }}>
                Benefit amount:
              </Box>{" "}
              {activeCoverage ? formatCoverageRange(activeCoverage) : "-"}
            </Typography>
            {activeCoverage?.coverageNote ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Coverage note:
                </Box>{" "}
                {activeCoverage.coverageNote}
              </Typography>
            ) : null}
            {activeCoverage ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Eligible applicants:
                </Box>{" "}
                {formatApplicants(activeCoverage.applicants)}
              </Typography>
            ) : null}
            {activeCoverage?.waitingPeriodOptions?.length ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Waiting periods:
                </Box>{" "}
                {activeCoverage.waitingPeriodOptions
                  .map((option) => option.label)
                  .join(", ")}
              </Typography>
            ) : null}
            {activeCoverage?.maxBenefitPeriodOptions?.length ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Max benefit periods:
                </Box>{" "}
                {activeCoverage.maxBenefitPeriodOptions
                  .map((option) => option.label)
                  .join(", ")}
              </Typography>
            ) : null}
            {activeCoverage?.riders?.length ? (
              <Stack spacing={0.75}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Available riders
                </Typography>
                {activeCoverage.riders.map((rider) => (
                  <Typography
                    key={rider.id}
                    variant="body2"
                    color="text.secondary"
                  >
                    {rider.name}: {rider.description}
                  </Typography>
                ))}
              </Stack>
            ) : null}
            <Link
              component="button"
              type="button"
              underline="hover"
              color="primary"
              sx={{ alignSelf: "flex-start", fontWeight: 700 }}
            >
              View full coverage details
            </Link>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveCoverage(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <AppDrawer
        open={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        swipeable
      >
        <CoverageSummary
          onClose={() => setIsSummaryOpen(false)}
          source={summarySource}
        />
      </AppDrawer>
    </>
  );
}
