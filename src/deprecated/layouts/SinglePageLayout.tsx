import * as React from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  Collapse,
  Button,
} from "@mui/material";
import { Check, Edit } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { getClientFeatures } from "../../config/clients";
import { useStepper } from "../../state/StepperContext";
import { useAppData } from "../../state/AppDataContext";
import Landing from "../../pages/Landing";
import Membership from "../../pages/Membership";
import Eligibility from "../../pages/Eligibility";
import CoverageOptions from "../../pages/CoverageOptions";
import Contact from "../../pages/Contact";
import Profile from "../../pages/Profile";
import HealthHistory from "../../pages/HealthHistory";
import Preview from "../../pages/Preview";
import Consent from "../../pages/Consent";

// Context to signal single-page layout mode and provide page index
interface SinglePageLayoutContextType {
  isSinglePage: boolean;
  pageIndex?: number;
}

const SinglePageLayoutContext =
  React.createContext<SinglePageLayoutContextType>({
    isSinglePage: false,
  });
export const useSinglePageLayout = () =>
  React.useContext(SinglePageLayoutContext);

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  "/membership": Membership,
  "/eligibility": Eligibility,
  "/coverage-options": CoverageOptions,
  "/contact": Contact,
  "/profile": Profile,
  "/health-history": HealthHistory,
  "/preview": Preview,
  "/consent": Consent,
};

interface PageSectionProps {
  path: string;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  onEdit: () => void;
  children: React.ReactNode;
  pageNumber: number;
}

function PageSection({
  path,
  title,
  isActive,
  isCompleted,
  onEdit,
  children,
  pageNumber,
}: PageSectionProps) {
  return (
    <Card
      sx={{
        mb: 3,
        border: 1,
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        {/* Section Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: { xs: 2, sm: 3 },
            bgcolor: isActive ? "rgba(25, 118, 210, 0.08)" : "grey.50",
            cursor: isCompleted && !isActive ? "pointer" : "default",
            transition: "background-color 0.2s",
            "&:hover":
              isCompleted && !isActive
                ? {
                    bgcolor: "rgba(25, 118, 210, 0.12)",
                  }
                : {},
          }}
          onClick={() => {
            if (isCompleted && !isActive) {
              onEdit();
            }
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Page Number / Checkmark - Smaller */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor:
                  isCompleted && !isActive
                    ? "success.main"
                    : isActive
                      ? "primary.main"
                      : "grey.300",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.875rem",
                flexShrink: 0,
              }}
            >
              {isCompleted && !isActive ? (
                <Check sx={{ fontSize: 20 }} />
              ) : (
                pageNumber
              )}
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: isActive ? "primary.main" : "text.primary",
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Edit Button (only show for completed sections) */}
          {isCompleted && !isActive && (
            <Button
              startIcon={<Edit />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              size="small"
              variant="outlined"
            >
              Edit
            </Button>
          )}
        </Box>

        {/* Section Content */}
        <Collapse in={isActive} timeout="auto" unmountOnExit>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function SinglePageLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const features = getClientFeatures();
  const { activeIndex, completed } = useStepper();
  const { data } = useAppData();

  // Filter application pages based on client configuration
  const applicationPages = React.useMemo(() => {
    return PAGES.filter((p) => {
      if (p.section !== "application") return false;

      // Filter out membership page if not enabled for this client
      if (p.path === "/membership" && !features.showMembershipPage) {
        return false;
      }

      return true;
    });
  }, [features.showMembershipPage]);

  // Determine which page is currently active
  const currentPageIndex = applicationPages.findIndex(
    (p) => p.path === location.pathname,
  );
  const activePageIndex =
    currentPageIndex >= 0 ? currentPageIndex : activeIndex;

  const handleEdit = (index: number) => {
    navigate(applicationPages[index].path);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#faf9f6" }}>
      {/* Landing Hero Section (simplified) - Full Width */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "none",
          mb: 4,
          mx: 0,
        }}
      >
        <Landing hideNonHero />
      </Box>

      {/* Form Sections - Constrained Width */}
      <Stack spacing={0} sx={{ maxWidth: "900px", mx: "auto", pb: 6 }}>
        {applicationPages.map((page, index) => {
          const PageComponent = PAGE_COMPONENTS[page.path];
          if (!PageComponent) return null;

          const isActive = index === activePageIndex;
          const isCompleted = completed.has(index);

          return (
            <PageSection
              key={page.path}
              path={page.path}
              title={page.title}
              isActive={isActive}
              isCompleted={isCompleted}
              onEdit={() => handleEdit(index)}
              pageNumber={index + 1}
            >
              <SinglePageLayoutContext.Provider
                value={{ isSinglePage: true, pageIndex: index }}
              >
                <PageComponent />
              </SinglePageLayoutContext.Provider>
            </PageSection>
          );
        })}
      </Stack>
    </Box>
  );
}
