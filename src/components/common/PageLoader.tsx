import * as React from "react";
import { Backdrop } from "@mui/material";
import { useLocation } from "react-router-dom";
import { PAGES } from "../../config/pages";

interface PageLoaderProps {
  open: boolean;
}

export function PageLoader({ open }: PageLoaderProps) {
  const location = useLocation();
  const isApplicationPage = React.useMemo(
    () =>
      PAGES.some(
        (page) =>
          page.section === "application" && page.path === location.pathname,
      ),
    [location.pathname],
  );

  if (!open || !isApplicationPage) {
    return null;
  }

  return (
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
        bgcolor: "transparent",
      }}
      open={open}
    ></Backdrop>
  );
}
