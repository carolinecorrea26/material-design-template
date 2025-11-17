import * as React from "react";
import { Box, Container, Alert, Link } from "@mui/material";
import { Phone as PhoneIcon, CalendarMonth as CalendarIcon } from "@mui/icons-material";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import DevTools from "./components/dev/DevTools";
import { PrivacyNotice } from "./components/common/PrivacyNotice";
import { PageLoader } from "./components/common/PageLoader";
import { ScheduleCallModal } from "./components/common/ScheduleCallModal";
import { usePageTransition } from "./hooks/usePageTransition";
import { getClientBranding } from "./config/clients";
import { commonStyles } from "./theme/commonStyles";

type AppShellProps = { children: React.ReactNode };

export function AppShell({ children }: AppShellProps) {
  const [showPrivacyNotice, setShowPrivacyNotice] = React.useState(false);
  const [showScheduleCall, setShowScheduleCall] = React.useState(false);
  const [showCookieBanner, setShowCookieBanner] = React.useState(() => {
    // Check localStorage for cookie consent
    return localStorage.getItem('cookieConsent') !== 'accepted';
  });
  const isLoadingPage = usePageTransition();
  const branding = getClientBranding();

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieBanner(false);
  };

  return (
    <Box
      sx={{ 
        minHeight: "100vh", 
        bgcolor: "background.default", 
        display: "flex", 
        flexDirection: "column",
        pt: "48px", // height of the top banner
        pb: showCookieBanner ? "80px" : 0 // padding only for cookie banner (fixed)
      }}
    >
      <Alert 
        severity="info"
        icon={false}
        sx={{
          borderRadius: 0,
          bgcolor: "primary.dark",
          color: "common.white",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          "& .MuiAlert-message": {
            width: "100%",
            textAlign: "center",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            flexWrap: "wrap"
          }
        }}
      >
        <PhoneIcon fontSize="small" /> 
        <Box component="span" sx={{ fontWeight: "normal" }}>
          Need help? Call{" "}
        </Box>
        <Link 
          href={`tel:${branding.phone || '8006218981'}`} 
          sx={{ ...commonStyles.contactBannerLink, ml: 0.5 }}
        >
          {branding.phoneDisplay || '(800) 621-8981'}
        </Link>
        {branding.phoneHours && (
          <Box component="span" sx={{ ml: 0.5, fontWeight: "normal" }}>
            ({branding.phoneHours})
          </Box>
        )}
        {branding.scheduleCallUrl && (
          <>
            <Box component="span" sx={{ mx: 1 }}>•</Box>
            <Link 
              component="button"
              onClick={() => setShowScheduleCall(true)}
              sx={{ 
                ...commonStyles.contactBannerLink,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                border: "none",
                background: "none",
                fontSize: "inherit",
                fontFamily: "inherit"
              }}
            >
              <CalendarIcon fontSize="small" />
              Schedule Your Appointment
            </Link>
          </>
        )}
      </Alert>
      <Header />
      <Container sx={{ flex: 1 }}>
        {children}
      </Container>
      <Footer />
      
      {/* Developer Tools - Only shown in development mode, part of page flow */}
      {import.meta.env.DEV && <DevTools />}
      
      <PageLoader open={isLoadingPage} />
      {showCookieBanner && (
        <Alert 
          severity="info"
          icon={false}
          sx={{
            borderRadius: 0,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            color: "common.white",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            py: 2,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            "& .MuiAlert-message": {
              width: "100%",
              textAlign: "center",
              fontSize: "0.875rem",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexWrap: 'wrap'
            },
            "& .MuiAlert-action": {
              color: "common.white",
              "& .MuiIconButton-root": {
                color: "common.white",
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }
            }
          }}
          onClose={handleAcceptCookies}
        >
          <span>
            New York Life uses cookies to offer you a better experience and to analyze site interactions and traffic. 
            By continuing to browse this site you consent to our use of cookies.{" "}
          </span>
          <Link 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setShowPrivacyNotice(true);
            }}
            sx={{ 
              color: "common.white",
              textDecoration: "underline",
              '&:hover': {
                color: "grey.300"
              }
            }}
          >
            See our Privacy Notice
          </Link>
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
  );
}
