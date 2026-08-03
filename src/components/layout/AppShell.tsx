import { useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import { getActiveClient } from "../../config/client/getActiveClient";
import CookieDialog from "./CookieDialog";
import DevTools from "../../dev/DevTools";
import AppHeader from "./AppHeader";
import AppBody from "./AppBody";
import AppFooter from "./AppFooter";

/**
 * Controls which chrome elements AppLayout renders:
 *
 * - "applicationForm"  Full chrome: header with hamburger menu + cart icon +
 *   progress bar, footer. Used for all application form pages.
 *
 * - "homepage"  Marketing chrome: header with hamburger menu (no progress bar),
 *   footer. Used for the Home/Landing page.
 *
 * - "advisorLogin" | "advisorSend"  Utility chrome: header with logo only,
 *   no menu, no progress bar. Used for advisor flow pages.
 *
 * - "resumeEmailCode"  Utility chrome: header with logo only, no menu,
 *   no progress bar. Used for the resume magic-link / phone-code pages.
 */
export type AppShellVariant =
  | "applicationForm"
  | "homepage"
  | "advisorLogin"
  | "advisorSend"
  | "resumeEmailCode";

type AppShellProps = {
  children: ReactNode;
  variant?: AppShellVariant;
};

export default function AppShell({
  children,
  variant = "applicationForm",
}: AppShellProps) {
  const client = getActiveClient();

  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    return localStorage.getItem("cookieConsent") !== "accepted";
  });

  function handleCloseCookieBanner() {
    localStorage.setItem("cookieConsent", "accepted");
    setShowCookieBanner(false);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      <AppHeader client={client} variant={variant} />
      <AppBody>{children}</AppBody>
      <AppFooter client={client} />
      <DevTools />
      {showCookieBanner && <CookieDialog onClose={handleCloseCookieBanner} />}
    </Box>
  );
}
