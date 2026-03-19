import * as React from "react";
import { Box, Stack, Skeleton, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { usePageLoading } from "../../state/PageLoadingContext";
import { PAGES } from "../../config/pages";
import { getClientFeatures } from "../../config/clients";

interface FormPageLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  navigation?: React.ReactNode;
}

function FormBodySkeleton() {
  return (
    <Stack spacing={2}>
      <Box>
        <Skeleton variant="text" width="55%" height={30} animation="wave" />
        <Skeleton variant="text" width="80%" height={20} animation="wave" />
      </Box>
      <Box>
        <Skeleton variant="text" width="30%" height={18} animation="wave" />
        <Skeleton variant="rounded" height={48} animation="wave" />
      </Box>
      <Box>
        <Skeleton variant="text" width="35%" height={18} animation="wave" />
        <Skeleton variant="rounded" height={48} animation="wave" />
      </Box>
      <Box>
        <Skeleton variant="text" width="45%" height={18} animation="wave" />
        <Skeleton variant="rounded" height={48} animation="wave" />
      </Box>
      <Box>
        <Skeleton variant="text" width="40%" height={18} animation="wave" />
        <Skeleton variant="rounded" height={48} animation="wave" />
      </Box>
      <Box>
        <Skeleton variant="text" width="28%" height={18} animation="wave" />
        <Skeleton variant="rounded" height={48} animation="wave" />
      </Box>
    </Stack>
  );
}

export default function FormPageLayout({
  header,
  children,
  navigation,
}: FormPageLayoutProps) {
  const { isPageLoading } = usePageLoading();
  const location = useLocation();
  const [messageIndex, setMessageIndex] = React.useState(0);

  const loadingMessages = React.useMemo(() => {
    if (sessionStorage.getItem("nyl-last-nav") === "back") {
      return ["Returning to last page..."];
    }
    const slowMessage = "Just a moment...";
    const customMessages: Record<string, [string, string]> = {
      "/get-started": [
        "Starting your application...",
        "Getting things ready...",
      ],
      "/eligibility": [
        "Saving association details...",
        "Preparing eligibility section...",
      ],
      "/coverage-options": [
        "Saving eligibility information...",
        "Getting available coverage options...",
      ],
    };
    const custom = customMessages[location.pathname];
    if (custom) {
      return [...custom, slowMessage];
    }

    const features = getClientFeatures();
    const applicationPages = PAGES.filter((page) => {
      if (page.section !== "application") return false;
      if (page.path === "/membership" && !features.showMembershipPage) {
        return false;
      }
      return true;
    });
    if (location.pathname === "/get-started") {
      return ["Getting things ready..."];
    }

    if (location.pathname === "/eligibility") {
      return ["Preparing eligibility information..."];
    }

    const currentPage = applicationPages.find(
      (page) => page.path === location.pathname,
    );

    if (!currentPage) {
      return ["Preparing your next step...", slowMessage];
    }

    const title = currentPage.title.toLowerCase();
    return [
      `Getting ${title} ready...`,
      `Loading the ${title} step...`,
      slowMessage,
    ];
  }, [location.pathname]);

  React.useEffect(() => {
    if (!isPageLoading) return;
    setMessageIndex(0);
    if (loadingMessages.length <= 1) {
      return undefined;
    }
    const secondTimer = setTimeout(() => setMessageIndex(1), 2000);
    const thirdTimer = setTimeout(() => setMessageIndex(2), 6000);
    return () => {
      clearTimeout(secondTimer);
      clearTimeout(thirdTimer);
    };
  }, [isPageLoading, loadingMessages.length]);

  React.useEffect(() => {
    if (isPageLoading) return;
    sessionStorage.removeItem("nyl-last-nav");
  }, [isPageLoading]);

  React.useEffect(() => {
    if (!isPageLoading) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPageLoading]);

  React.useEffect(() => {
    if (!isPageLoading) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [isPageLoading]);

  return (
    <Stack spacing={2} className="form-page" sx={{ position: "relative" }}>
      {!isPageLoading && <Box className="form-header">{header}</Box>}
      <Box
        className="form-body"
        sx={{
          background: "#f5f6fa",
          padding: { xs: "1.5rem 1rem", sm: "1.5rem 1.5rem" },
          borderRadius: "12px",
        }}
      >
        {isPageLoading ? (
          <Stack spacing={2}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 400, color: "text.secondary" }}
            >
              {loadingMessages[messageIndex]}
            </Typography>
            <FormBodySkeleton />
          </Stack>
        ) : (
          children
        )}
      </Box>
      {navigation && <Box className="form-nav">{navigation}</Box>}
      {isPageLoading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            cursor: "progress",
          }}
        />
      )}
    </Stack>
  );
}
