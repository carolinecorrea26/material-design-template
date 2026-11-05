import { ComponentContentContext } from "../content/ComponentContentContext";
import { getContent } from "../../content";
import { ClientIconContext } from "../content/ClientIconContext";
import { useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import { getActiveClient } from "../../config/client/getActiveClient";
import CookieDialog from "./CookieDialog";
import DevTools from "../../dev/DevTools";
import AppHeader from "./AppHeader";
import AppBody from "./AppBody";
import AppFooter from "./AppFooter";
import { showSinglePageArtwork } from "../../config/homepagePresentation";
import FormUmbrella from "../home/FormUmbrella";
import { getFormTemplate } from "../../config/template/resolveTemplate";
import ApplicationSessionGuard from '../../app/ApplicationSessionGuard';
import OfflineBanner from '../feedback/OfflineBanner';

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
  | "resumeEmailCode"
  | "recovery";

type AppShellProps = {
  children: ReactNode;
  variant?: AppShellVariant;
  sessionActive?: boolean;
};

export default function AppShell({
  children,
  variant = "applicationForm",
  sessionActive = variant === 'applicationForm' || variant === 'homepage' && getFormTemplate() === 'single',
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
    <ComponentContentContext value={getContent()}><ClientIconContext value={client.branding}><Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      <OfflineBanner />
      {variant === "homepage" && showSinglePageArtwork(getFormTemplate(), client.features) && <FormUmbrella />}
      {showCookieBanner && <CookieDialog onClose={handleCloseCookieBanner} />}
      <AppHeader client={client} variant={variant} />
      <AppBody><ApplicationSessionGuard active={sessionActive}>{children}</ApplicationSessionGuard></AppBody>
      <AppFooter client={client} />
      <DevTools />
    </Box></ClientIconContext></ComponentContentContext>
  );
}
