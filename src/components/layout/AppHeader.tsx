import { useState, useSyncExternalStore } from "react";
import {
  AppBar,
  Box,
  Link,
  Slide,
  Stack,
  Toolbar,
  Typography,
  useScrollTrigger,
} from "@mui/material";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { pages } from "../../config/pages";
import { isFormPage } from "../../config/formFlow";
import type { ClientConfig } from "../../config/clients/types";
import type { PageId } from "../../types/page";
import FormProgress from "../form/FormProgress";

type AppHeaderProps = {
  client: ClientConfig;
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

export default function AppHeader({ client }: AppHeaderProps) {
  const [imageError, setImageError] = useState(false);

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
  const showProgress =
    !!currentPage &&
    isFormPage(currentPage.id as PageId) &&
    currentPage.id !== "receipt";

  const phone = client.support.phone;
  const phoneDisplay = client.support.phoneDisplay ?? client.support.phone;

  return (
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

            {phone && phoneDisplay && (
              <Box
                sx={{
                  ml: "auto",
                  minWidth: 0,
                  textAlign: "right",
                }}
              >
                <Stack spacing={0.25} alignItems="flex-end">
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
                    {phoneDisplay}
                  </Link>

                  {/* {phoneHours && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        lineHeight: 1.2,
                      }}
                    >
                      {phoneHours}
                    </Typography>
                  )} */}
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
    </Slide>
  );
}
