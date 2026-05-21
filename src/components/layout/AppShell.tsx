import { useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import { getActiveClient } from "../../client/getActiveClient";
import CookieBanner from "../common/CookieBanner";
import DevTools from "../../dev/DevTools";
import AppHeader from "./AppHeader";
import AppBody from "./AppBody";
import AppFooter from "./AppFooter";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
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
        // backgroundColor: "#f9fafc",
        // pb: showCookieBanner ? "80px" : 0,
      }}
    >
      <AppHeader client={client} />
      <AppBody>{children}</AppBody>
      <AppFooter client={client} />
      <DevTools />
      {showCookieBanner && <CookieBanner onClose={handleCloseCookieBanner} />}
    </Box>
  );
}
