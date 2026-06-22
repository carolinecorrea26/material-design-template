import { useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Breadcrumbs,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowRightRoundedIcon from "@mui/icons-material/ArrowRightRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { useNavigate } from "react-router-dom";
import {
  getActiveProgressSteps,
  getActiveProgressStepIndex,
  HEALTH_PAGE_IDS,
} from "../../config/progressSteps";
import type { PageId } from "../../types/page";
import { useApplicationForm } from "../../state/ApplicationFormContext";

import { getPageNavTitle, STEP_LABELS } from "../../config/pages";

const PENDING_BREADCRUMB_COMPLETION_EVENT = "form:pendingbreadcrumbcompletion";

export function getVerticalStepperStepLabel(step: {
  id: string;
  label: string;
}) {
  return STEP_LABELS[step.id] ?? step.label;
}

type FormVerticalStepperProps = {
  pageId: PageId;
  children: ReactNode;
};

/**
 * Builds a breadcrumb-friendly list of page entries for a step.
 * Health pages are consolidated into a single "Health" entry.
 */
type BreadcrumbEntry = {
  id: string;
  label: string;
  /** The page to navigate to when clicking this breadcrumb */
  navigateTo: PageId;
  /** Whether this entry represents the current page */
  containsCurrentPage: boolean;
};

function getBreadcrumbEntries(
  stepPageIds: PageId[],
  currentPageId: PageId,
): BreadcrumbEntry[] {
  const entries: BreadcrumbEntry[] = [];
  let healthConsolidated = false;

  for (const pid of stepPageIds) {
    if (HEALTH_PAGE_IDS.includes(pid)) {
      if (!healthConsolidated) {
        healthConsolidated = true;
        const activeHealthPages = stepPageIds.filter((p) =>
          HEALTH_PAGE_IDS.includes(p),
        );
        const firstHealthPage = activeHealthPages[0] ?? pid;
        entries.push({
          id: "health",
          label: "Health",
          navigateTo: firstHealthPage,
          containsCurrentPage: activeHealthPages.includes(currentPageId),
        });
      }
    } else {
      entries.push({
        id: pid,
        label: getPageNavTitle(pid),
        navigateTo: pid,
        containsCurrentPage: pid === currentPageId,
      });
    }
  }

  return entries;
}

export function VerticalStepperBreadcrumbs({ pageId }: { pageId: PageId }) {
  const navigate = useNavigate();
  const { values } = useApplicationForm();
  const [pendingCompletedPageId, setPendingCompletedPageId] =
    useState<PageId | null>(null);

  // Clear pending state when the page changes (the new page's index handles completion naturally)
  useEffect(() => {
    setPendingCompletedPageId(null);
  }, [pageId]);

  useEffect(() => {
    function handlePendingCompletion(event: Event) {
      const customEvent = event as CustomEvent<PageId | null>;
      setPendingCompletedPageId(customEvent.detail ?? null);
    }

    window.addEventListener(
      PENDING_BREADCRUMB_COMPLETION_EVENT,
      handlePendingCompletion,
    );

    return () => {
      window.removeEventListener(
        PENDING_BREADCRUMB_COMPLETION_EVENT,
        handlePendingCompletion,
      );
    };
  }, []);

  const activeSteps = getActiveProgressSteps(values);
  const activeStepIndex = getActiveProgressStepIndex(pageId, values);
  const currentStepConfig = activeSteps[activeStepIndex];

  const breadcrumbEntries = currentStepConfig
    ? getBreadcrumbEntries(currentStepConfig.pageIds, pageId)
    : [];

  if (breadcrumbEntries.length <= 1) {
    return null;
  }

  const currentEntryIndex = breadcrumbEntries.findIndex(
    (entry) => entry.containsCurrentPage,
  );

  return (
    <Breadcrumbs
      separator={
        <ArrowRightRoundedIcon sx={{ fontSize: 16, display: "block" }} />
      }
      sx={{
        my: 1,
        "& .MuiBreadcrumbs-ol": {
          alignItems: "center",
        },
        "& .MuiBreadcrumbs-li": {
          lineHeight: 1,
        },
        "& .MuiBreadcrumbs-separator": {
          mx: 0.5,
          color: "#94a3b8",
          cursor: "default",
          lineHeight: 1,
        },
      }}
    >
      {breadcrumbEntries.map((entry, index) => {
        const isCurrentEntry = index === currentEntryIndex;
        const isPendingCompletedEntry =
          pendingCompletedPageId === entry.navigateTo ||
          (entry.id === "health" &&
            pendingCompletedPageId !== null &&
            HEALTH_PAGE_IDS.includes(pendingCompletedPageId));
        const isCompleted =
          index < currentEntryIndex || isPendingCompletedEntry;
        const isClickable = isCompleted;

        return (
          <Box
            key={entry.id}
            component={isClickable ? "button" : "span"}
            onClick={
              isClickable ? () => navigate(`/${entry.navigateTo}`) : undefined
            }
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              background: "none",
              border: "none",
              padding: 0,
              cursor: isClickable ? "pointer" : "default",
            }}
          >
            <Typography
              variant="formBreadcrumb"
              sx={{
                color:
                  isCompleted || isCurrentEntry ? "primary.main" : "#94a3b8",
                fontWeight: isCompleted || isCurrentEntry ? undefined : 500,
              }}
            >
              {entry.label}
            </Typography>
            {isCompleted && (
              <CheckCircleRoundedIcon
                sx={{ fontSize: 14, color: "success.main" }}
              />
            )}
          </Box>
        );
      })}
    </Breadcrumbs>
  );
}

export default function FormVerticalStepper({
  pageId,
  children,
}: FormVerticalStepperProps) {
  const navigate = useNavigate();
  const { values } = useApplicationForm();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const activeSteps = getActiveProgressSteps(values);
  const activeStep = getActiveProgressStepIndex(pageId, values);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1100,
        mx: "auto",
      }}
    >
      <Box
        sx={{
          display: isDesktop ? "grid" : "block",
          gridTemplateColumns: isDesktop
            ? {
                md: "200px minmax(0, 1fr)",
                lg: "280px minmax(0, 1fr)",
              }
            : undefined,
          columnGap: isDesktop ? { md: 6, lg: 3 } : undefined,
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={
            isDesktop
              ? { position: "sticky", top: 12, borderRadius: "24px" }
              : undefined
          }
        >
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            sx={
              !isDesktop
                ? {
                    "& .MuiStepConnector-line": {
                      display: "none",
                    },
                    "& .MuiStepContent-root": {
                      marginLeft: 0,
                      paddingLeft: 0,
                      borderLeft: "none",
                    },
                    "& .MuiStep-root": {
                      paddingLeft: 0,
                    },
                  }
                : undefined
            }
          >
            {activeSteps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const stepLabelColor = isActive
                ? "text.primary"
                : isCompleted
                  ? "#62748e"
                  : "#94a3b8";

              return (
                <Step key={step.id} completed={isCompleted}>
                  <StepLabel
                    onClick={
                      isCompleted
                        ? () => {
                            const firstPage = step.pageIds[0];
                            if (firstPage) {
                              navigate(`/${firstPage}`);
                            }
                          }
                        : undefined
                    }
                    sx={isCompleted ? { cursor: "pointer" } : undefined}
                  >
                    <Typography
                      variant="formVerticalStepLabel"
                      sx={{
                        fontWeight: isActive ? 700 : 500,
                        color: stepLabelColor,
                      }}
                    >
                      {getVerticalStepperStepLabel(step)}
                    </Typography>
                  </StepLabel>
                  {!isDesktop && (
                    <StepContent>
                      {isActive && (
                        <Box sx={{ width: "100%", mt: 1 }}>{children}</Box>
                      )}
                    </StepContent>
                  )}
                </Step>
              );
            })}
          </Stepper>
        </Box>

        {isDesktop && <Box sx={{ minWidth: 0 }}>{children}</Box>}
      </Box>
    </Box>
  );
}
