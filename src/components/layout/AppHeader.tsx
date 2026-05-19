import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AppBar,
  Badge,
  Box,
  Button,
  ClickAwayListener,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  InputAdornment,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Slide,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useScrollTrigger,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
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
import type { CoverageDefinition } from "../../config/coverages/types";
import { getActiveClientCoverages } from "../../client/getActiveClientCoverages";
import { coverageCategories } from "../../config/coverageCategories";
import { isFormPage } from "../../config/formFlow";
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

type SearchResult = {
  label: string;
  description: string;
  action: "navigate" | "drawer";
  target: string;
  /** Optional: coverage category to show in drawer */
  categoryId?: string;
};

function buildSearchItems(): SearchResult[] {
  const items: SearchResult[] = [];

  // Coverage categories
  for (const category of coverageCategories) {
    items.push({
      label: category.label,
      description: `Browse ${category.label} coverage options`,
      action: "drawer",
      target: "coverage",
      categoryId: category.id,
    });
  }

  // Individual coverages from active client
  const clientCoverages = getActiveClientCoverages();
  for (const coverage of clientCoverages) {
    const category = coverageCategories.find(
      (c) => c.id === coverage.categoryId,
    );
    items.push({
      label: coverage.name,
      description: coverage.definition,
      action: "drawer",
      target: "coverage",
      categoryId: category?.id,
    });
  }

  // General coverage-related items
  items.push(
    {
      label: "Coverage Options",
      description: "View available coverage categories and products",
      action: "drawer",
      target: "coverage",
    },
    {
      label: "Needs Calculator",
      description: "Calculate how much coverage you need",
      action: "drawer",
      target: "needs-calc",
    },
    {
      label: "QuickDecision",
      description: "Learn about instant underwriting decisions",
      action: "drawer",
      target: "quick-decision",
    },
    {
      label: "Resume Application",
      description: "Continue a previously started application",
      action: "navigate",
      target: "/resume",
    },
    {
      label: "How does applying work?",
      description: "Learn about the application process and steps involved",
      action: "drawer",
      target: "how-applying-works",
    },
    {
      label: "How much does it cost?",
      description: "Estimate coverage costs based on your profile",
      action: "drawer",
      target: "cost-estimate",
    },
    {
      label: "What is QuickDecision?",
      description: "Get an instant underwriting decision on eligible products",
      action: "drawer",
      target: "quick-decision",
    },
    {
      label: "Contact support",
      description: "Get help from our support team",
      action: "drawer",
      target: "contact",
    },
  );

  return items;
}

function searchItems(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  const items = buildSearchItems();
  // Deduplicate by label
  const seen = new Set<string>();
  return items
    .filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower),
    )
    .filter((item) => {
      const key = `${item.label}-${item.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <Box key={i} component="span" sx={{ backgroundColor: "#fff9c4" }}>
            {part}
          </Box>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function AppHeader({ client }: AppHeaderProps) {
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isCoverageDrawerOpen, setIsCoverageDrawerOpen] = useState(false);
  const [isNeedsCalcOpen, setIsNeedsCalcOpen] = useState(false);
  const [activeCoverage, setActiveCoverage] =
    useState<CoverageDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchDrawerOpen, setMobileSearchDrawerOpen] = useState(false);
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const { values } = useApplicationForm();
  const summaryBadgeCount = useApplicationSummaryBadge();

  const searchResults = useMemo(() => searchItems(searchQuery), [searchQuery]);

  const pathname = useSyncExternalStore(
    subscribeToPathname,
    getPathnameSnapshot,
    () => "/",
  );

  const trigger = useScrollTrigger({
    disableHysteresis: true,
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

  const showSummaryIcon =
    currentPageId !== undefined &&
    currentPageId !== "home" &&
    currentPageId !== "receipt";

  // Auto-open coverage requested drawer when a coverage is added on the coverage page
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

  function handleSearchSelect(result: SearchResult) {
    setSearchQuery("");
    setSearchOpen(false);
    setMobileSearchDrawerOpen(false);

    if (result.action === "navigate") {
      void router.navigate(result.target);
    } else {
      switch (result.target) {
        case "coverage":
          setIsCoverageDrawerOpen(true);
          break;
        case "needs-calc":
          setIsNeedsCalcOpen(true);
          break;
        case "quick-decision":
          setIsCoverageDrawerOpen(true);
          break;
        case "how-applying-works":
          setIsCoverageDrawerOpen(true);
          break;
        case "cost-estimate":
          setIsNeedsCalcOpen(true);
          break;
        case "contact":
          setIsMenuOpen(true);
          break;
        case "faq":
          setIsMenuOpen(true);
          break;
      }
    }
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
            pb: 2,
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

              {/* Site Search - inline on sm+, hidden on xs (shown below) */}
              <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
                <Box
                  ref={searchAnchorRef}
                  sx={{
                    flex: 1,
                    maxWidth: 280,
                    display: { xs: "none", sm: "block" },
                    position: "relative",
                  }}
                >
                  <TextField
                    size="small"
                    placeholder="Search coverages…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchOpen(e.target.value.trim().length > 0);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim()) setSearchOpen(true);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon
                            sx={{ fontSize: "1.2rem", color: "text.secondary" }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Clear search"
                            onClick={() => {
                              setSearchQuery("");
                              setSearchOpen(false);
                            }}
                            sx={{ p: 0.25 }}
                          >
                            <CloseIcon sx={{ fontSize: "1rem" }} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={{
                      width: "100%",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "999px",
                        height: 36,
                        fontSize: "0.85rem",
                      },
                    }}
                  />
                  {searchOpen && searchResults.length > 0 && (
                    <Paper
                      elevation={8}
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        mt: 0.5,
                        borderRadius: 2,
                        overflow: "hidden",
                        zIndex: 1300,
                      }}
                    >
                      <List dense disablePadding>
                        {searchResults.map((result) => (
                          <ListItemButton
                            key={`${result.action}-${result.target}-${result.label}`}
                            onClick={() => handleSearchSelect(result)}
                          >
                            <ListItemText
                              primary={highlightMatch(
                                result.label,
                                searchQuery,
                              )}
                              secondary={result.description}
                              primaryTypographyProps={{
                                variant: "body2",
                                fontWeight: 600,
                              }}
                              secondaryTypographyProps={{ variant: "caption" }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
              </ClickAwayListener>

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
                        color="primary"
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

            {/* Site Search - full width on xs */}
            <Box
              sx={{
                width: "100%",
                display: { xs: "block", sm: "none" },
                position: "relative",
              }}
            >
              <TextField
                size="small"
                placeholder="Search coverages…"
                value={searchQuery}
                onFocus={() => setMobileSearchDrawerOpen(true)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{ fontSize: "1.2rem", color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                  readOnly: true,
                }}
                sx={{
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "999px",
                    height: 36,
                    fontSize: "0.85rem",
                  },
                }}
              />
            </Box>

            {showProgress && (
              <Box sx={{ width: "100%", minWidth: 0 }}>
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

          {/* Resume Application Section */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: "grey.100",
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

          {/* Application Tools Section */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: "grey.100",
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

          {/* Contact Us Section */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: "grey.100",
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

      {/* Mobile Search Drawer */}
      <Drawer
        anchor="bottom"
        open={mobileSearchDrawerOpen}
        onClose={() => {
          setMobileSearchDrawerOpen(false);
          setSearchQuery("");
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            height: "75vh",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Search
            </Typography>
            <IconButton
              onClick={() => {
                setMobileSearchDrawerOpen(false);
                setSearchQuery("");
              }}
              aria-label="Close search"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <TextField
            size="small"
            placeholder="Search coverages, help topics…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{ fontSize: "1.2rem", color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    sx={{ p: 0.25 }}
                  >
                    <CloseIcon sx={{ fontSize: "1rem" }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: "100%",
              mb: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: "999px",
                height: 36,
                fontSize: "0.85rem",
              },
            }}
          />
          <Box sx={{ overflowY: "auto", flex: 1 }}>
            {searchResults.length > 0 ? (
              <List dense disablePadding>
                {searchResults.map((result) => (
                  <ListItemButton
                    key={`${result.action}-${result.target}-${result.label}`}
                    onClick={() => handleSearchSelect(result)}
                  >
                    <ListItemText
                      primary={highlightMatch(result.label, searchQuery)}
                      secondary={result.description}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: 600,
                      }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : searchQuery.trim() ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ p: 2, textAlign: "center" }}
              >
                No results found for "{searchQuery}"
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ p: 2, textAlign: "center" }}
              >
                Type to search coverages, help topics, and more
              </Typography>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
