import * as React from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { ParityBreadcrumb } from "../parity";
import { commonStyles } from "../../theme/commonStyles";
import { getClientFeatures } from "../../config/clients";
import { useLayout } from "../../state/LayoutContext";
import { usePageLoading } from "../../state/PageLoadingContext";
import { Schedule } from "@mui/icons-material";

interface PageHeaderProps {
  title: string;
  notes?: string | React.ReactNode;
  beforeNotes?: React.ReactNode;
  hideTitle?: boolean;
  centered?: boolean;
  icon?: React.ReactNode;
  animatedIcon?: boolean;
  timeEstimate?: number; // in minutes
}

// Animated icon component with expand and wiggle animation
const AnimatedIcon: React.FC<{ icon: React.ReactNode }> = ({ icon }) => {
  return (
    <motion.div
      initial={{ scale: 1, rotate: 0 }}
      animate={{
        scale: [1, 1.15, 1],
        rotate: [0, 0, -2, 2, -1, 1, 0],
      }}
      transition={{
        duration: 1.2,
        ease: "easeInOut",
        times: [0, 0.35, 0.65, 0.8, 0.9, 0.95, 1],
      }}
    >
      <Box
        sx={{
          // width: { xs: 32, md: 48 },
          // height: { xs: 32, md: 48 },
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          // pt: 0.5
        }}
      >
        {icon}
      </Box>
    </motion.div>
  );
};

export default function PageHeader({
  title,
  notes,
  beforeNotes,
  hideTitle = false,
  centered = false,
  icon,
  animatedIcon = false,
  timeEstimate,
}: PageHeaderProps) {
  const location = useLocation();
  const { layoutMode } = useLayout();
  const { isPageLoading } = usePageLoading();
  const h1Ref = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    // Move focus to the H1 on route change
    const t = setTimeout(() => h1Ref.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Filter pages based on client configuration (same logic as StepperContext)
  const applicationPages = React.useMemo(() => {
    const features = getClientFeatures();
    return PAGES.filter((p) => {
      if (p.section !== "application") return false;

      // Filter out membership page if not enabled for this client
      if (p.path === "/membership" && !features.showMembershipPage) {
        return false;
      }

      return true;
    });
  }, []);
  const currentIndex = applicationPages.findIndex(
    (p) => p.path === location.pathname,
  );

  // Special handling for sub-pages like health-history (child of profile)
  const effectiveIndex =
    currentIndex >= 0
      ? currentIndex
      : location.pathname === "/health-history"
        ? applicationPages.findIndex((p) => p.path === "/profile")
        : -1;

  const inAppFlow = effectiveIndex >= 0;

  // In single-page mode, hide the title (it's shown in section header)
  const shouldHideTitle = hideTitle || layoutMode === "single-page";

  const timeByPath: Record<string, number> = {
    "/get-started": 1,
    "/eligibility": 3,
    "/coverage": 6,
    "/contact": 3,
    "/profile": 6,
    "/health-history": 6,
    "/preview": 3,
    "/consent": 2,
  };
  const effectiveTimeEstimate =
    typeof timeEstimate === "number"
      ? timeEstimate
      : inAppFlow
        ? (timeByPath[location.pathname] ?? undefined)
        : undefined;

  return (
    <Stack
      spacing={{ xs: 4, md: 6 }}
      sx={commonStyles.marginBottom3}
      className="page-header"
    >
      {/* ParityBreadcrumb stepper removed - replaced by ApplicationProgress component */}
      <Stack spacing={2} alignItems={centered ? "center" : "flex-start"}>
        {!shouldHideTitle && (
          <Stack spacing={1} alignItems={centered ? "center" : "flex-start"}>
            <Stack direction="row" spacing={1} alignItems="center">
              {animatedIcon && icon ? (
                !isPageLoading ? (
                  <AnimatedIcon icon={icon} />
                ) : null
              ) : icon ? (
                <Box
                  sx={{
                    width: { xs: 32, md: 48 },
                    height: { xs: 32, md: 48 },
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    position: "relative",
                    pt: 0.5,
                  }}
                >
                  {icon}
                </Box>
              ) : null}
              <Typography
                ref={h1Ref}
                tabIndex={-1}
                component="h1"
                variant="h2"
                sx={{
                  ...commonStyles.noOutline,
                  textAlign: centered ? "center" : "left",
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                {title}
              </Typography>
            </Stack>
            {effectiveTimeEstimate !== undefined && (
              <Chip
                icon={
                  <Schedule
                  // sx={{ fontSize: "0.875rem", color: "primary.main" }}
                  />
                }
                label={
                  <Box
                    component="span"
                    // sx={{ color: "primary.main", fontWeight: 900 }}
                  >
                    {effectiveTimeEstimate} min
                  </Box>
                }
                size="small"
                // variant="outlined"
                sx={{
                  bgcolor: "rgb(0 0 0 / 4%)",
                  fontWeight: 600,
                  height: "auto",
                  py: 0.5,
                  "& .MuiChip-label": { px: 1 },
                  // "& .MuiChip-icon": { ml: 0.5, color: "primary.main" },
                }}
              />
            )}
          </Stack>
        )}
        {(beforeNotes || notes) && (
          <Stack spacing={1}>
            {beforeNotes}
            {notes && (
              <Typography
                color="text.primary"
                sx={{
                  ...commonStyles.maxWidthText,
                  textAlign: centered ? "center" : "left",
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                {notes}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
