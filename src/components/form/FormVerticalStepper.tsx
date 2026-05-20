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
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";
import {
  getActiveProgressSteps,
  getActiveProgressStepIndex,
  HEALTH_PAGE_IDS,
} from "../../config/progressSteps";
import type { PageId } from "../../types/page";
import { useApplicationForm } from "../../state/ApplicationFormContext";

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
`;

const PENDING_BREADCRUMB_COMPLETION_EVENT = "form:pendingbreadcrumbcompletion";

const ACRONYM_WORDS = new Set(["SI", "QD", "DI", "CIR"]);

function toPageLabel(pageId: string) {
  return pageId
    .split("-")
    .map((segment) => {
      const upper = segment.toUpperCase();
      if (ACRONYM_WORDS.has(upper)) return upper;
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(" ");
}

const STEP_LABELS: Record<string, string> = {
  "getting-started": "Start your insurance journey",
  "coverage-options": "Choose your coverage",
  "about-applicant": "Your application profile",
  "application-review": "Review your application",
  "esign-submit": "E-sign and submit",
};

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
        label: toPageLabel(pid),
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
          mx: 0.5,
          color: "text.disabled",
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
        const isJustCompleted =
          index === currentEntryIndex - 1 || isPendingCompletedEntry;

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
                fontWeight: 600,
                color: "primary.main",
                cursor: "pointer",
              }}
            >
              {entry.label}
              <CheckCircleRoundedIcon
                sx={{
                  fontSize: 14,
                  color: "success.main",
                  ...(isJustCompleted
                    ? { animation: `${fadeIn} 0.3s ease forwards` }
                    : { opacity: 1 }),
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
                fontWeight: 600,
                fontSize: "0.75rem",
                color: "primary.main",
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
              color: "text.disabled",
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
    <Box sx={{ width: "100%", maxWidth: 800, mx: "auto" }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {activeSteps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;

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
                  }}
                >
                  {STEP_LABELS[step.id] ?? step.label}
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
  );
}
