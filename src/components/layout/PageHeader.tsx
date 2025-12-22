import * as React from "react";
import { Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { ParityBreadcrumb } from "../parity";
import { commonStyles } from "../../theme/commonStyles";
import { getClientFeatures } from "../../config/clients";
import { useLayout } from "../../state/LayoutContext";

interface PageHeaderProps {
  title: string;
  notes?: string;
  hideTitle?: boolean;
}

export default function PageHeader({ title, notes, hideTitle = false }: PageHeaderProps) {
  const location = useLocation();
  const { layoutMode } = useLayout();
  const h1Ref = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    // Move focus to the H1 on route change
    const t = setTimeout(() => h1Ref.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Filter pages based on client configuration (same logic as StepperContext)
  const applicationPages = React.useMemo(() => {
    const features = getClientFeatures();
    return PAGES.filter(p => {
      if (p.section !== "application") return false;
      
      // Filter out membership page if not enabled for this client
      if (p.path === "/membership" && !features.showMembershipPage) {
        return false;
      }
      
      return true;
    });
  }, []);
  const currentIndex = applicationPages.findIndex(p => p.path === location.pathname);
  
  // Special handling for sub-pages like health-history (child of profile)
  const effectiveIndex = currentIndex >= 0 
    ? currentIndex 
    : location.pathname === "/health-history" 
      ? applicationPages.findIndex(p => p.path === "/profile")
      : -1;
  
  const inAppFlow = effectiveIndex >= 0;

  // In single-page mode, hide the title (it's shown in section header)
  const shouldHideTitle = hideTitle || layoutMode === 'single-page';

  return (
    <Stack spacing={{ xs: 4, md: 6 }} sx={commonStyles.marginBottom3}>
      {/* ParityBreadcrumb stepper removed - replaced by ApplicationProgress component */}
      <Stack spacing={1} alignItems="flex-start">
        {!shouldHideTitle && (
          <Typography
            ref={h1Ref}
            tabIndex={-1}
            component="h1"
            variant="h2"
            sx={{ ...commonStyles.noOutline, textAlign: "left" }}
          >
            {title}
          </Typography>
        )}
        {notes && (
          <Typography
            color="text.secondary"
            sx={{ ...commonStyles.maxWidthText, textAlign: "left" }}
          >
            {notes}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
