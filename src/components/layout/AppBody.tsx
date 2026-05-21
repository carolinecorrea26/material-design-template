import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Box } from "@mui/material";

type AppBodyProps = {
  children: ReactNode;
};

function patchHistoryForLocationChangeEvents() {
  if (typeof window === "undefined") return;
  if (
    (window as typeof window & { __historyPatchedForAppBody__?: boolean })
      .__historyPatchedForAppBody__
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
    window as typeof window & { __historyPatchedForAppBody__?: boolean }
  ).__historyPatchedForAppBody__ = true;
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

export default function AppBody({ children }: AppBodyProps) {
  const pathname = useSyncExternalStore(
    subscribeToPathname,
    getPathnameSnapshot,
    () => "/",
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <Box
      component="main"
      sx={{
        width: "100%",
        marginLeft: "auto",
        marginRight: "auto",
        px: { xs: 2, sm: 3, md: 4 },
        pt: 2,
        pb: 4,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "60vh",
        boxSizing: "border-box",
        // backgroundColor: "#f9fafc",
      }}
    >
      {children}
    </Box>
  );
}
