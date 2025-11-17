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
  const inAppFlow = currentIndex >= 0;

  return (
    <Stack spacing={{ xs: 2, md: 4 }} sx={commonStyles.marginBottom3}>
      {inAppFlow && (
        <ParityBreadcrumb
          variant="stepper"
          items={applicationPages.map(p => ({ label: p.title, to: p.path }))}
          currentIndex={currentIndex}
          numericSteps={false}
        />
      )}
      <Stack spacing={1} alignItems="center">
        <Typography
          ref={h1Ref}
          tabIndex={-1}
          component="h1"
          variant="h2"
          sx={{ ...commonStyles.noOutline, textAlign: "center" }}
        >
          {title}
        </Typography>
        {notes && (
          <Typography
            color="text.secondary"
            sx={commonStyles.maxWidthText}
          >
            {notes}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
