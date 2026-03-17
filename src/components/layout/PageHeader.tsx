import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { commonStyles } from "../../theme/commonStyles";
import { getClientFeatures } from "../../config/clients";
import { useLayout } from "../../state/LayoutContext";
import { usePageLoading } from "../../state/PageLoadingContext";
interface PageHeaderProps {
  title: string;
  notes?: string | React.ReactNode;
  beforeNotes?: React.ReactNode;
  hideTitle?: boolean;
  centered?: boolean;
  icon?: React.ReactNode;
  animatedIcon?: boolean;
  timeEstimate?: number; // in minutes
  titleWeight?: number;
}

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
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
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
  titleWeight = 600,
}: PageHeaderProps) {
  const location = useLocation();
  const { layoutMode } = useLayout();
  const { isPageLoading } = usePageLoading();
  const h1Ref = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => h1Ref.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const applicationPages = React.useMemo(() => {
    const features = getClientFeatures();
    return PAGES.filter((p) => {
      if (p.section !== "application") return false;

      if (p.path === "/membership" && !features.showMembershipPage) {
        return false;
      }

      return true;
    });
  }, []);
  const currentIndex = applicationPages.findIndex(
    (p) => p.path === location.pathname,
  );

  const effectiveIndex =
    currentIndex >= 0
      ? currentIndex
      : location.pathname === "/health-history"
        ? applicationPages.findIndex((p) => p.path === "/profile")
        : -1;

  const inAppFlow = effectiveIndex >= 0;

  const shouldHideTitle = hideTitle || layoutMode === "single-page";

  return (
    <Stack
      spacing={{ xs: 4, md: 6 }}
      // sx={commonStyles.marginBottom3}
      className="page-header"
    >
      <Stack spacing={2} alignItems={centered ? "center" : "flex-start"}>
        {!shouldHideTitle && (
          <Stack spacing={1} alignItems={centered ? "center" : "flex-start"}>
            <Stack
              direction="row"
              spacing={1}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
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
                    fontSize: { xs: "1.25rem", md: "1.5rem" },
                    fontWeight: titleWeight,
                  }}
                >
                  {title}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        )}
        {(beforeNotes || notes) && (
          <Stack spacing={1} sx={{ width: "100%" }}>
            {beforeNotes}
            {notes &&
              (typeof notes === "string" ? (
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
              ) : (
                notes
              ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
