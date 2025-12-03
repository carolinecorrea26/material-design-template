import * as React from "react";
import { Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { ParityBreadcrumb } from "../parity";
import { commonStyles } from "../../theme/commonStyles";

interface PageHeaderProps {
  title: string;
  notes?: string;
}

export default function PageHeader({ title, notes }: PageHeaderProps) {
  const location = useLocation();
  const h1Ref = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    // Move focus to the H1 on route change
    const t = setTimeout(() => h1Ref.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const applicationPages = React.useMemo(() => PAGES.filter(p => p.section === "application"), []);
  const currentIndex = applicationPages.findIndex(p => p.path === location.pathname);
  
  // Special handling for sub-pages like health-history (child of profile)
  const effectiveIndex = currentIndex >= 0 
    ? currentIndex 
    : location.pathname === "/health-history" 
      ? applicationPages.findIndex(p => p.path === "/profile")
      : -1;
  
  const inAppFlow = effectiveIndex >= 0;

  return (
    <Stack spacing={{ xs: 4, md: 6 }} sx={commonStyles.marginBottom3}>
      {inAppFlow && (
        <ParityBreadcrumb
          variant="stepper"
          items={applicationPages.map(p => ({ label: p.title, to: p.path }))}
          currentIndex={effectiveIndex}
          numericSteps={false}
        />
      )}
      <Stack spacing={1} alignItems="flex-start">
        <Typography
          ref={h1Ref}
          tabIndex={-1}
          component="h1"
          variant="h2"
          sx={{ ...commonStyles.noOutline, textAlign: "left" }}
        >
          {title}
        </Typography>
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
