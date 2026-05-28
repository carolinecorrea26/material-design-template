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
  Drawer,
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
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { CoverageOptionsDrawerContent } from "../../pages/Coverage";
import { CoverageNeedsCalculator } from "../../pages/CoverageOptions";
import FormHelpDrawer from "../form/FormHelpDrawer";
import { pages } from "../../config/pages";
// import { getActiveClientCoverages } from "../../client/getActiveClientCoverages";
// import { coverageCategories } from "../../config/coverageCategories";
import type { CoverageDefinition } from "../../config/coverages/types";
import { getFormProgressPercent, isFormPage } from "../../config/formFlow";
import type { ClientConfig } from "../../config/clients/types";
import type { PageId } from "../../types/page";
import { useApplicationForm } from "../../state/ApplicationFormContext";
import { router } from "../../app/router";
import FormProgress from "../form/FormProgress";
import { APP_MENU_SECTION_TITLE_SX } from "../form/sectionStyles";
import ApplicationSummaryDrawer, {
  useApplicationSummaryBadge,
} from "./ApplicationSummaryDrawer";

type AppHeaderProps = {
  client: ClientConfig;
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

export default function AppHeader({ client }: AppHeaderProps) {
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isCoverageDrawerOpen, setIsCoverageDrawerOpen] = useState(false);
  const [isNeedsCalcOpen, setIsNeedsCalcOpen] = useState(false);
  const [activeCoverage, setActiveCoverage] =
    useState<CoverageDefinition | null>(null);
  const { values } = useApplicationForm();
  const summaryBadgeCount = useApplicationSummaryBadge();

  const pathname = useSyncExternalStore(
    subscribeToPathname,
    getPathnameSnapshot,
    () => "/",
  );

  const trigger = useScrollTrigger({
    // disableHysteresis: true,
    threshold: 8,
  });

  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const currentPage = pages.find((page) => page.path === normalizedPath);

  const currentPageId = currentPage?.id as PageId | undefined;

  const showProgress =
    !!currentPage &&
    isFormPage(currentPage.id as PageId) &&
    currentPage.id !== "receipt";

  const overallProgressPercent =
    showProgress && currentPageId
      ? getFormProgressPercent(currentPageId, values)
      : 0;

  const showSummaryIcon =
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
      setIsSummaryOpen(true);
    }
  }, [values.coverageSelections, currentPageId]);

  const phone = client.support.phone;

  function handleNavigate(path: string) {
    setIsMenuOpen(false);
    void router.navigate(path);
  }

  return (
    <>
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
            // pb: 2,
          }}
        >
          <Toolbar
            sx={{
              width: "100%",
              // maxWidth: 1400,
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

              <Box
                sx={{
                  ml: "auto",
                  minWidth: 0,
                  textAlign: "right",
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {showSummaryIcon && (
                    <IconButton
                      aria-label="Open coverage requested"
                      onClick={() => setIsSummaryOpen(true)}
                      size="small"
                    >
                      <Badge
                        badgeContent={summaryBadgeCount}
                        color="error"
                        max={99}
                      >
                        <ShoppingCartOutlinedIcon
                          sx={{ color: "primary.main" }}
                        />
                      </Badge>
                    </IconButton>
                  )}

                  <IconButton
                    aria-label="Open application navigation menu"
                    onClick={() => setIsMenuOpen(true)}
                    size="small"
                  >
                    <MenuIcon />
                  </IconButton>
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
                    height: 8,
                    mx: { xs: -2, sm: -3, md: -4 },
                    mt: 2,
                    bgcolor: "rgb(0 0 0 / 6%)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "primary.main",
                    },
                  }}
                />

                <FormProgress />
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </Slide>

      <Drawer
        anchor="right"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "80vw", sm: 420 },
            maxWidth: "100%",
            p: 2,
          },
        }}
      >
        <Stack spacing={2} sx={{ height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Menu
            </Typography>

            <IconButton
              aria-label="Close application navigation menu"
              onClick={() => setIsMenuOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,

              bgcolor: "#f5f8fd",
            }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={APP_MENU_SECTION_TITLE_SX}>
                Resume Application
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                If you started an earlier application, you can resume it below.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleNavigate("/resume")}
              >
                Resume Application
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,

              bgcolor: "#f5f8fd",
            }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={APP_MENU_SECTION_TITLE_SX}>
                Application Tools
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<InfoOutlinedIcon />}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsCoverageDrawerOpen(true);
                  }}
                  sx={{ justifyContent: "flex-start", textTransform: "none" }}
                >
                  About Coverage
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RequestQuoteOutlinedIcon />}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSummaryOpen(true);
                  }}
                  sx={{ justifyContent: "flex-start", textTransform: "none" }}
                >
                  Get Quote
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CalculateOutlinedIcon />}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsNeedsCalcOpen(true);
                  }}
                  sx={{ justifyContent: "flex-start", textTransform: "none" }}
                >
                  Needs Calculator
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HelpOutlineIcon />}
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                  sx={{ justifyContent: "flex-start", textTransform: "none" }}
                >
                  FAQ
                </Button>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,

              bgcolor: "#f5f8fd",
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={APP_MENU_SECTION_TITLE_SX}>
                Contact Us
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonOutlineIcon
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                  <Typography variant="body2">
                    {client.branding.name}
                  </Typography>
                </Stack>
                {client.support.email && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailOutlinedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Link
                      href={`mailto:${client.support.email}`}
                      underline="hover"
                      variant="body2"
                    >
                      {client.support.email}
                    </Link>
                  </Stack>
                )}
                {phone && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneOutlinedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Link
                      href={`tel:${phone}`}
                      underline="hover"
                      variant="body2"
                    >
                      {client.support.phoneDisplay ?? phone}
                    </Link>
                  </Stack>
                )}
                {client.support.phoneHours && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeOutlinedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {client.support.phoneHours}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ mt: "auto" }} />
        </Stack>
      </Drawer>

      <FormHelpDrawer
        open={isCoverageDrawerOpen}
        title="What coverage options are available?"
        onClose={() => setIsCoverageDrawerOpen(false)}
      >
        <CoverageOptionsDrawerContent />
      </FormHelpDrawer>

      <FormHelpDrawer
        open={isNeedsCalcOpen}
        title="How much coverage do I need?"
        onClose={() => setIsNeedsCalcOpen(false)}
      >
        <CoverageNeedsCalculator />
      </FormHelpDrawer>

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
                Coverage amount:
              </Box>
              {activeCoverage ? formatCoverageRange(activeCoverage) : "-"}
            </Typography>

            {activeCoverage?.coverageNote ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Coverage note:
                </Box>
                {activeCoverage.coverageNote}
              </Typography>
            ) : null}

            {activeCoverage ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Eligible applicants:
                </Box>
                {formatApplicants(activeCoverage.applicants)}
              </Typography>
            ) : null}

            {activeCoverage?.waitingPeriodOptions?.length ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Waiting periods:
                </Box>
                {activeCoverage.waitingPeriodOptions
                  .map((option) => option.label)
                  .join(", ")}
              </Typography>
            ) : null}

            {activeCoverage?.maxBenefitPeriodOptions?.length ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Max benefit periods:
                </Box>
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

      <ApplicationSummaryDrawer
        open={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
      />
    </>
  );
}
