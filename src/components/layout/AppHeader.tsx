import { useMemo, useState, useSyncExternalStore } from "react";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Link,
  Slide,
  Stack,
  Toolbar,
  Typography,
  useScrollTrigger,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { pages } from "../../config/pages";
import { coverageCategories } from "../../config/coverageCategories";
import { getActiveClientCoverages } from "../../client/getActiveClientCoverages";
import type { CoverageDefinition } from "../../config/coverages/types";
import { getActiveFormFlow, isFormPage } from "../../config/formFlow";
import { progressSteps } from "../../config/progressSteps";
import type { ClientConfig } from "../../config/clients/types";
import type { PageId } from "../../types/page";
import { useApplicationForm } from "../../state/ApplicationFormContext";
import { router } from "../../app/router";
import FormProgress from "../form/FormProgress";

type AppHeaderProps = {
  client: ClientConfig;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function toPageLabel(pageId: PageId) {
  const acronymWords = new Set(["SI", "QD", "DI", "CIR"]);

  return pageId
    .split("-")
    .map((segment) => {
      const upper = segment.toUpperCase();
      if (acronymWords.has(upper)) {
        return upper;
      }

      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(" ");
}

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
  const [activeCoverage, setActiveCoverage] =
    useState<CoverageDefinition | null>(null);
  const { values } = useApplicationForm();

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
  const activeFlow = useMemo(() => getActiveFormFlow(values), [values]);
  const activeFlowSet = useMemo(() => new Set(activeFlow), [activeFlow]);
  const pageById = useMemo(
    () => new Map(pages.map((page) => [page.id, page])),
    [],
  );

  const currentPageId = currentPage?.id as PageId | undefined;
  const currentFlowIndex =
    currentPageId && activeFlowSet.has(currentPageId)
      ? activeFlow.indexOf(currentPageId)
      : -1;

  const maxReachedPageIndex =
    currentPageId === "receipt"
      ? activeFlow.length - 1
      : Math.max(currentFlowIndex, 0);

  let completionPercent = 0;
  if (currentPageId === "receipt") {
    completionPercent = 100;
  } else if (currentPageId && activeFlowSet.has(currentPageId)) {
    completionPercent =
      activeFlow.length > 0
        ? Math.round(((currentFlowIndex + 1) / activeFlow.length) * 100)
        : 0;
  }

  const groupedApplicationMenuItems = useMemo(
    () =>
      progressSteps
        .map((step) => ({
          ...step,
          pageIds: step.pageIds.filter((pageId) => activeFlowSet.has(pageId)),
        }))
        .filter((step) => step.pageIds.length > 0),
    [activeFlowSet],
  );

  const groupedCoverageItems = useMemo(() => {
    const activeCoverages = getActiveClientCoverages();

    return coverageCategories
      .map((category) => ({
        category,
        coverages: activeCoverages.filter(
          (coverage) => coverage.categoryId === category.id,
        ),
      }))
      .filter((group) => group.coverages.length > 0);
  }, []);

  const showProgress =
    !!currentPage &&
    isFormPage(currentPage.id as PageId) &&
    currentPage.id !== "receipt";

  const phone = client.support.phone;

  function handleNavigate(path: string) {
    setIsMenuOpen(false);
    void router.navigate(path);
  }

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <>
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            backgroundColor: "#fff",
            borderBottom: "none",
            boxShadow: "none",
            pt: 2,
            pb: 1,
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
                  <Typography variant="h6" noWrap>
                    {client.branding.name}
                  </Typography>
                ) : (
                  <Box
                    component="img"
                    src={client.branding.logo}
                    alt={client.branding.logoAlt}
                    onError={() => setImageError(true)}
                    sx={{
                      height: "auto",
                      width: "auto",
                      maxWidth: { xs: 200, sm: 250 },
                      maxHeight: 40,
                      display: "block",
                    }}
                  />
                )}
              </Box>

              {phone && (
                <Box
                  sx={{
                    ml: "auto",
                    minWidth: 0,
                    textAlign: "right",
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Link
                      href={`tel:${phone}`}
                      underline="hover"
                      color="inherit"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        fontSize: 14,
                        fontWeight: 600,
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <PhoneOutlinedIcon
                        sx={{ fontSize: 18, color: "primary.main" }}
                      />
                      Call Us
                    </Link>

                    <IconButton
                      aria-label="Open application navigation menu"
                      onClick={() => setIsMenuOpen(true)}
                      size="small"
                    >
                      <MenuIcon />
                    </IconButton>
                  </Stack>
                </Box>
              )}
            </Box>

            {showProgress && (
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <FormProgress />
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="right"
          open={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: { xs: "100%", sm: 420 },
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
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Application Menu
              </Typography>

              <IconButton
                aria-label="Close application navigation menu"
                onClick={() => setIsMenuOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider />

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "grey.100",
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Your Application
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    <Box
                      component="span"
                      sx={{ color: "primary.main", fontWeight: 700 }}
                    >
                      {completionPercent}%
                    </Box>{" "}
                    complete
                  </Typography>
                </Box>

                {groupedApplicationMenuItems.map((step) => (
                  <Stack key={step.id} spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {step.label}
                    </Typography>

                    <Stack spacing={0.4}>
                      {step.pageIds.map((pageId) => {
                        const page = pageById.get(pageId);

                        if (!page) return null;

                        const pageIndex = activeFlow.indexOf(pageId);
                        const isDisabled =
                          pageIndex === -1 || pageIndex > maxReachedPageIndex;
                        const isActive = currentPageId === pageId;

                        if (isDisabled) {
                          return (
                            <Typography
                              key={pageId}
                              variant="body2"
                              sx={{
                                color: "text.disabled",
                                fontWeight: 500,
                                pl: 0.25,
                              }}
                            >
                              {toPageLabel(pageId)}
                            </Typography>
                          );
                        }

                        return (
                          <Link
                            key={pageId}
                            component="button"
                            type="button"
                            underline={isActive ? "always" : "hover"}
                            color={isActive ? "primary" : "inherit"}
                            onClick={() => handleNavigate(page.path)}
                            sx={{
                              textAlign: "left",
                              fontSize: "0.9rem",
                              fontWeight: isActive ? 700 : 500,
                              lineHeight: 1.35,
                            }}
                          >
                            {toPageLabel(pageId)}
                          </Link>
                        );
                      })}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "grey.100",
              }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  About Coverage
                </Typography>

                {groupedCoverageItems.map(({ category, coverages }) => (
                  <Stack key={category.id} spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {category.label}
                    </Typography>

                    <Stack spacing={0.25}>
                      {coverages.map((coverage) => (
                        <Link
                          key={coverage.id}
                          component="button"
                          type="button"
                          underline="hover"
                          color="primary"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setActiveCoverage(coverage);
                          }}
                          sx={{
                            textAlign: "left",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                          }}
                        >
                          {coverage.name}
                        </Link>
                      ))}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box sx={{ mt: "auto", pt: 1 }}>
              <Stack
                spacing={1.25}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "grey.100",
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Started an earlier application? Resume it below.
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
          </Stack>
        </Drawer>

        <Dialog
          open={Boolean(activeCoverage)}
          onClose={() => setActiveCoverage(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {activeCoverage?.name ?? "Coverage Details"}
          </DialogTitle>

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
      </>
    </Slide>
  );
}
