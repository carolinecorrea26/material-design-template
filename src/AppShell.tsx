import * as React from "react";
import {
  Button,
  Box,
  Container,
  Alert,
  Link,
  IconButton,
  Typography,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import {
  Phone as PhoneIcon,
  CalendarMonth as CalendarIcon,
  LocalOffer as LocalOfferIcon,
  Close as CloseIcon,
  CookieRounded,
} from "@mui/icons-material";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import DevTools from "./components/dev/DevTools";
import { PrivacyNotice } from "./components/common/PrivacyNotice";
import { PageLoader } from "./components/common/PageLoader";
import { ScheduleCallModal } from "./components/common/ScheduleCallModal";
import { usePageTransition } from "./hooks/usePageTransition";
import { getClientBranding, getClientConfig } from "./config/clients";
import { commonStyles } from "./theme/commonStyles";
import { useLayout } from "./state/LayoutContext";
import { PageLoadingProvider } from "./state/PageLoadingContext";
import { PAGES } from "./config/pages";

type AppShellProps = { children: React.ReactNode };

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const { layoutMode } = useLayout();
  const [showPrivacyNotice, setShowPrivacyNotice] = React.useState(false);
  const [showScheduleCall, setShowScheduleCall] = React.useState(false);
  const [showCookieBanner, setShowCookieBanner] = React.useState(() => {
    // Check localStorage for cookie consent
    return localStorage.getItem("cookieConsent") !== "accepted";
  });
  const [showCalbarBanner, setShowCalbarBanner] = React.useState(() => {
    // Check localStorage for calbar banner dismissal
    return localStorage.getItem("calbarBannerDismissed") !== "true";
  });
  const isLoadingPage = usePageTransition();
  const branding = getClientBranding();
  const clientConfig = getClientConfig();
  const isCalbar = clientConfig.id === "calbar";

  // Check if current route is an application page
  const isApplicationPage = PAGES.some(
    (page) => page.section === "application" && page.path === location.pathname,
  );

  const handleAcceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setShowCookieBanner(false);
  };

  const handleDismissCalbarBanner = () => {
    localStorage.setItem("calbarBannerDismissed", "true");
    setShowCalbarBanner(false);
  };

  return (
    <PageLoadingProvider isLoading={isLoadingPage}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor:
            location.pathname === "/" || layoutMode === "single-page"
              ? "#faf9f6"
              : "white",
          background: "linear-gradient(45deg, #eefffd, #edf7ff)",
          display: "flex",
          flexDirection: "column",
          pb: showCookieBanner ? "80px" : 0, // padding only for cookie banner (fixed)
        }}
      >
        {/* Calbar Special Offer Banner */}
        {isCalbar && showCalbarBanner && (
          <Box
            sx={{
              bgcolor: "#fffbea",
              borderBottom: 1,
              borderColor: "divider",
              py: { xs: 1.5, sm: 0.5 },
            }}
          >
            <Container maxWidth={false} sx={{ maxWidth: 1400 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: { xs: 1, sm: 2 },
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "flex-start" },
                    gap: { xs: 1, sm: 4 },
                    flex: 1,
                    flexDirection: { xs: "column", sm: "row" },
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#f59e0b",
                      color: "white",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <LocalOfferIcon
                      sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                    />
                    50% PREMIUM CREDIT
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        lineHeight: 1.4,
                        fontSize: { xs: "0.875rem", sm: "0.875rem" },
                      }}
                    >
                      Special offer for attorneys admitted to the bar in 2025 —
                      receive a 50% premium credit for one year.
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        mt: 0.5,
                        display: "block",
                        fontSize: { xs: "0.75rem", sm: "0.75rem" },
                      }}
                    >
                      Credit will be applied to your premium bill and is not
                      reflected in displayed costs.
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={handleDismissCalbarBanner}
                  sx={{
                    flexShrink: 0,
                    alignSelf: { xs: "flex-end", sm: "center" },
                    position: { xs: "absolute", sm: "relative" },
                    top: { xs: 8, sm: "auto" },
                    right: { xs: 8, sm: "auto" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Container>
          </Box>
        )}

        {/* Contact Bar - Hidden on application pages (now in sidebar) */}
        {!isApplicationPage && (
          <Alert
            severity="info"
            icon={false}
            sx={{
              borderRadius: 0,
              bgcolor: "primary.dark",
              color: "common.white",
              "& .MuiAlert-message": {
                width: "100%",
                textAlign: "center",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                flexWrap: "wrap",
              },
            }}
          >
            <PhoneIcon fontSize="small" />
            <Box component="span" sx={{ fontWeight: "normal" }}>
              Need help? Call{" "}
            </Box>
            <Link
              href={`tel:${branding.phone || "8006218981"}`}
              sx={{ ...commonStyles.contactBannerLink, ml: 0.5 }}
            >
              {branding.phoneDisplay || "(800) 621-8981"}
            </Link>
            {branding.phoneHours && (
              <Box component="span" sx={{ ml: 0.5, fontWeight: "normal" }}>
                ({branding.phoneHours})
              </Box>
            )}
            {branding.scheduleCallUrl && (
              <>
                <Box component="span" sx={{ mx: 1 }}>
                  •
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowScheduleCall(true)}
                  startIcon={<CalendarIcon />}
                  sx={{
                    color: "common.white",
                    borderColor: "rgba(255, 255, 255, 0.5)",
                    textTransform: "none",
                    fontSize: "inherit",
                    py: 0.25,
                    px: 1.5,
                    "&:hover": {
                      borderColor: "common.white",
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  Schedule Your Appointment
                </Button>
              </>
            )}
          </Alert>
        )}

        {/* Header - Hidden on application pages (logo and links moved to sidebar) */}
        {!isApplicationPage && <Header />}

        <Container
          disableGutters={isApplicationPage}
          sx={{
            flex: 1,
            maxWidth:
              location.pathname === "/" || layoutMode === "single-page"
                ? "1600px !important"
                : isApplicationPage
                  ? "none !important"
                  : "900px !important",
            p: isApplicationPage ? 0 : undefined,
            px: isApplicationPage ? "0 !important" : undefined,
          }}
        >
          {children}
        </Container>
        <Footer />

        {/* Developer Tools - Available in all builds for prototype testing */}
        <DevTools />

        <PageLoader open={isLoadingPage} />
        {showCookieBanner && (
          <Alert
            severity="info"
            icon={false}
            sx={{
              borderRadius: 0,
              bgcolor: "rgba(0, 0, 0, 0.9)",
              color: "common.white",
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1200,
              py: 2,
              px: 3,
              display: "flex",
              alignItems: "flex-start",
              "& .MuiAlert-message": {
                width: "100%",
                fontSize: "0.875rem",
                display: "block",
              },
              "& .MuiAlert-action": {
                color: "common.white",
                "& .MuiIconButton-root": {
                  color: "common.white",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                gap: { xs: 3, md: 3 },
                width: "100%",
                maxWidth: 1400,
                mx: "auto",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  flex: 1,
                }}
              >
                <Box
                  component="img"
                  src="/brand/nyl/logo-cookie.svg"
                  alt="New York Life Logo"
                  sx={{ height: "50px", width: "auto" }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "justify",
                    color: "common.white",
                    // maxWidth: 720,
                  }}
                >
                  New York Life uses cookies to enhance your experience and
                  analyze site performance and traffic. By continuing to use
                  this site, you agree to our use of cookies.
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "flex-end", sm: "flex-end" },
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowPrivacyNotice(true)}
                  sx={{
                    color: "common.white",
                    borderColor: "rgba(255, 255, 255, 0.7)",
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: "common.white",
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  Privacy Notice
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleAcceptCookies}
                  endIcon={
                    <CookieRounded
                      sx={{ fontSize: 18, color: "primary.contrastText" }}
                    />
                  }
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  Accept
                </Button>
              </Box>
            </Box>
          </Alert>
        )}

        <PrivacyNotice
          open={showPrivacyNotice}
          onClose={() => setShowPrivacyNotice(false)}
        />

        {branding.scheduleCallUrl && (
          <ScheduleCallModal
            open={showScheduleCall}
            onClose={() => setShowScheduleCall(false)}
            calendlyUrl={branding.scheduleCallUrl}
            clientName={`Schedule Your Appointment - ${branding.name}`}
          />
        )}
      </Box>
    </PageLoadingProvider>
  );
}
