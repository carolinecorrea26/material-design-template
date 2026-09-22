import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Breadcrumbs, Link, Typography } from "@mui/material";
import type { PageId } from "../../types";
import { getPagePath } from "../../config/pages";
import { getInternalBreadcrumbTrail } from "../../config/internalBreadcrumbs";

type InternalPageShellProps = {
  pageId: PageId;
  children: ReactNode;
};

/**
 * Chrome for internal documentation/admin pages (Portal Admin and everything
 * nested under it): a red "internal documentation" banner and a breadcrumb
 * trail, instead of the consumer-facing AppHeader/AppFooter.
 */
export default function InternalPageShell({ pageId, children }: InternalPageShellProps) {
  const trail = getInternalBreadcrumbTrail(pageId);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          bgcolor: "error.main",
          color: "error.contrastText",
          py: 0.75,
          px: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.4 }}>
          INTERNAL DOCUMENTATION
        </Typography>
      </Box>
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "0.8125rem" }}>
          {trail.map((crumb, i) =>
            i === trail.length - 1 ? (
              <Typography key={crumb.id} color="text.primary" sx={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={crumb.id}
                component={RouterLink}
                to={getPagePath(crumb.id)}
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: "0.8125rem" }}
              >
                {crumb.label}
              </Link>
            ),
          )}
        </Breadcrumbs>
      </Box>
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
