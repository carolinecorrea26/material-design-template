import { useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Breadcrumbs,
  Link,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { useNavigate } from "react-router-dom";
import {
  getActiveProgressSteps,
  getActiveProgressStepIndex,
  HEALTH_PAGE_IDS,
} from "../../config/progressSteps";
import type { PageId } from "../../types/page";
import { useApplicationForm } from "../../state/ApplicationFormContext";

import { getPageNavTitle } from "../../config/pages";

const PENDING_BREADCRUMB_COMPLETION_EVENT = "form:pendingbreadcrumbcompletion";

export const STEP_LABELS: Record<string, string> = {
  "getting-started": "Start your application",
  "coverage-options": "Choose your coverage",
  "about-applicant": "Your application profile",
  "application-review": "Review your application",
  "esign-submit": "E-sign and submit",
};

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

  const currentEntryIndex = breadcrumbEntries.findIndex(
    (entry) => entry.containsCurrentPage,
  );

  return (
    <Breadcrumbs
      separator="›"
      sx={{
        mb: 1,
        "& .MuiBreadcrumbs-separator": {
          mx: { xs: 1, lg: 1 },
          color: "#62748e",
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

        if (isCompleted) {
          return (
            <Link
              key={entry.id}
              component="button"
              underline="hover"
              onClick={() => {
                navigate(`/${entry.navigateTo}`);
              }}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "primary.main",
                cursor: "pointer",
                paddingBottom: 0.25,
              }}
            >
              {entry.label}
              <DoneRoundedIcon
                sx={{
                  fontSize: 14,
                  color: "success.main",
                  opacity: 1,
                }}
              />
            </Link>
          );
        }

        if (isCurrentEntry) {
          return (
            <Typography
              key={entry.id}
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                color: "primary.main",
                letterSpacing: "-0.2px",
              }}
            >
              {entry.label}
            </Typography>
          );
        }

        return (
          <Typography
            key={entry.id}
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "#62748e",
              letterSpacing: "-0.2px",
            }}
          >
            {entry.label}
          </Typography>
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
          display: { xs: "block", md: "grid" },
          gridTemplateColumns: {
            md: "200px minmax(0, 1fr)",
            lg: "280px minmax(0, 1fr)",
          },
          columnGap: { md: 6, lg: 3 },
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "sticky",
            top: 12,
            borderRadius: "24px",
          }}
        >
          <Stepper activeStep={activeStep} orientation="vertical">
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
                      sx={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.9rem",
                        letterSpacing: "-0.25px",
                        color: stepLabelColor,
                      }}
                    >
                      {getVerticalStepperStepLabel(step)}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <Stepper activeStep={activeStep} orientation="vertical">
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
                      sx={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "1rem",
                        color: stepLabelColor,
                      }}
                    >
                      {getVerticalStepperStepLabel(step)}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    {isActive && <Box sx={{ width: "100%" }}>{children}</Box>}
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "block" },
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
