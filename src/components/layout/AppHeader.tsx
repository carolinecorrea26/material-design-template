import { useEffect, useState, useSyncExternalStore } from "react";

import {
  AppBar,
  Badge,
  Box,
  IconButton,
  LinearProgress,
  Slide,
  Stack,
  Toolbar,
  Typography,
  useScrollTrigger,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import AppMenu from "./AppMenu";
import AppDrawer from "../layout/AppDrawer";
import { getConfiguredPages, getPagePath } from "../../config/pages";
import { getFormProgressPercent, isFormPage } from "../../config/formFlow";
import type { ClientConfig } from "../../config/clients/types";
import type { PageId } from "../../types";
import { useApplicationForm } from "../../app/ApplicationFormContext";
import { useApplicationSession } from "../../app/ApplicationSessionContext";
import { router } from "../../app/router";
import CoverageCart, { useCoverageCartBadge } from "../../app/sections/ConfiguredCoverageCart";
import type { AppShellVariant } from "./AppShell";
import ClientHelpBanner from "./ClientHelpBanner";
import { getActiveSite, resolveEffectiveBranding } from "../../data";


type AppHeaderProps = {
  client: ClientConfig;
  /** Controls which header actions are shown. Defaults to "applicationForm". */
  variant?: AppShellVariant;
};

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
  const { values, activeAssociationId } = useApplicationForm();
  const { reviewSubmitted } = useApplicationSession();
  const effectiveBranding = resolveEffectiveBranding({
    siteId: getActiveSite().id,
    associationId: activeAssociationId,
  });
  const summaryBadgeCount = useCoverageCartBadge();

  const pathname = useSyncExternalStore(
    subscribeToPathname,
    getPathnameSnapshot,
    () => "/",
  );

  const trigger = useScrollTrigger({ threshold: 8 });

  useEffect(() => setImageError(false), [effectiveBranding.logo]);

  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const currentPage = getConfiguredPages().find((page) => page.path === normalizedPath);
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
    currentPageId !== "receipt" &&
    !reviewSubmitted;

  return (
    <>
      {variant !== 'recovery' && <ClientHelpBanner client={client} />}
      <Slide appear={false} direction="down" in={!trigger}>
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            backgroundColor: "background.paper",
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
                    sx={{ cursor: variant === 'recovery' ? 'default' : 'pointer' }}
                    onClick={variant === 'recovery' ? undefined : () => void router.navigate(getPagePath("home"))}
                  >
                    {effectiveBranding.name}
                  </Typography>
                ) : (
                  <Box
                    component="img"
                    src={effectiveBranding.logo}
                    alt={effectiveBranding.logoAlt}
                    onError={() => setImageError(true)}
                    onClick={variant === 'recovery' ? undefined : () => void router.navigate(getPagePath("home"))}
                    sx={{
                      height: "auto",
                      width: "auto",
                      maxWidth: { xs: 200, sm: 250 },
                      maxHeight: 35,
                      display: "block",
                      cursor: variant === 'recovery' ? 'default' : 'pointer',
                    }}
                  />
                )}
              </Box>

              <Box sx={{ ml: "auto", minWidth: 0, textAlign: "right" }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {showSummaryIcon && (
                    <IconButton
                      aria-label={
                        summaryBadgeCount
                          ? `Open coverage summary, ${summaryBadgeCount} item${
                              summaryBadgeCount === 1 ? "" : "s"
                            }`
                          : "Open coverage summary"
                      }
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
                        <ShoppingCartRoundedIcon sx={{ color: "primary.main" }} />
                      </Badge>
                    </IconButton>
                  )}

                  {showMenu && (
                    <IconButton
                      aria-label="Open application navigation menu"
                      onClick={() => setIsMenuOpen(true)}
                      size="small"
                    >
                      <MenuRoundedIcon />
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
        <AppMenu
          open={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          client={client}
        />
      )}

      <AppDrawer
        open={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        ariaLabel="Coverage summary"
        swipeable
      >
        <CoverageCart
          variant="drawer"
          source={summarySource}
          onClose={() => setIsSummaryOpen(false)}
        />
      </AppDrawer>
    </>
  );
}
