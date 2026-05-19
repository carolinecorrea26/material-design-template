import { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { pages } from "../../config/pages";
import type { PageId } from "../../types/page";
import {
  getFormProgressPercent,
  getNextFormPageId,
  getPreviousFormPageId,
  isFormPage,
} from "../../config/formFlow";
import {
  getActiveProgressSteps,
  getActiveProgressStepIndex,
} from "../../config/progressSteps";
import type { ProgressVariant } from "../../types/progress";
import {
  type ApplicationFormValues,
  useApplicationForm,
} from "../../state/ApplicationFormContext";
import { router } from "../../app/router";

const PROGRESS_VARIANT_STORAGE_KEY = "devtools:progressVariant";

function getCurrentPageId(pathname: string): PageId | null {
  const match = pages.find((page) => page.path === pathname);
  return match?.id ?? null;
}

function readProgressVariant(): ProgressVariant {
  const urlParams = new URLSearchParams(window.location.search);
  const urlProgress = urlParams.get("progress");
  if (urlProgress === "hstep") return "stepper";
  if (urlProgress === "vstep") return "vertical-stepper";
  if (urlProgress === "bar") return "bar";
  const stored = window.sessionStorage.getItem(PROGRESS_VARIANT_STORAGE_KEY);
  if (stored === "bar") return "bar";
  if (stored === "stepper") return "stepper";
  return "vertical-stepper";
}

function emitProgressSnapshot(values: ApplicationFormValues) {
  window.dispatchEvent(
    new CustomEvent<ApplicationFormValues>("form:progresssnapshot", {
      detail: values,
    }),
  );
}

export default function FormProgress() {
  const pageId = getCurrentPageId(window.location.pathname);
  const { values } = useApplicationForm();

  const [progressVariant, setProgressVariant] = useState<ProgressVariant>(
    readProgressVariant(),
  );
  const [progressSnapshotValues, setProgressSnapshotValues] =
    useState<ApplicationFormValues>(values);

  useEffect(() => {
    function handleSnapshotChange(event: Event) {
      const customEvent = event as CustomEvent<ApplicationFormValues>;
      setProgressSnapshotValues(customEvent.detail ?? values);
    }

    window.addEventListener("form:progresssnapshot", handleSnapshotChange);

    return () => {
      window.removeEventListener("form:progresssnapshot", handleSnapshotChange);
    };
  }, [values]);

  useEffect(() => {
    function handleVariantChange(event: Event) {
      const customEvent = event as CustomEvent<ProgressVariant>;
      setProgressVariant(customEvent.detail ?? readProgressVariant());
    }

    window.addEventListener(
      "devtools:progressvariantchange",
      handleVariantChange,
    );

    return () => {
      window.removeEventListener(
        "devtools:progressvariantchange",
        handleVariantChange,
      );
    };
  }, []);

  if (!pageId || !isFormPage(pageId) || pageId === "receipt") {
    return null;
  }

  if (progressVariant === "vertical-stepper") {
    return null;
  }

  const percent = getFormProgressPercent(pageId, progressSnapshotValues);
  const roundedPercent = Math.round(percent);
  const filteredSteps = getActiveProgressSteps(progressSnapshotValues);
  const activeStep = getActiveProgressStepIndex(pageId, progressSnapshotValues);
  const previousPageId = getPreviousFormPageId(pageId, progressSnapshotValues);
  const nextPageId = getNextFormPageId(pageId, progressSnapshotValues);
  const hasNextAction = Boolean(nextPageId) || pageId === "payment";

  const content =
    progressVariant === "stepper" ? (
      <Stack spacing={3} sx={{ alignItems: "center", mt: 1, mb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            width: "100%",
            maxWidth: "1200px",
            mx: "auto",
            justifyContent: "space-between",
            pt: 1,
          }}
        >
          {filteredSteps.map((step, index) => {
            const isActive = index === activeStep;
            const isComplete = index < activeStep;
            const isLast = index === filteredSteps.length - 1;

            let nextStepPercent = 0;
            if (index < activeStep) {
              nextStepPercent = 100;
            } else if (index === activeStep) {
              const currentStep = filteredSteps[activeStep];
              const currentPageIndexInStep = currentStep
                ? Math.max(0, currentStep.pageIds.indexOf(pageId))
                : 0;
              const pagesInCurrentStep = currentStep
                ? currentStep.pageIds.length
                : 1;

              nextStepPercent =
                (currentPageIndexInStep / pagesInCurrentStep) * 100;
            } else {
              nextStepPercent = 0;
            }

            return (
              <Box
                key={step.id}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  position: "relative",
                }}
              >
                {!isLast && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: { xs: 16, sm: 20 },
                      left: "calc(50% + 16px)",
                      right: { xs: "-30%", sm: "-50%" },
                      height: 2,
                      borderRadius: 999,
                      backgroundColor: "divider",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${nextStepPercent}%`,
                        borderRadius: 999,
                        backgroundColor: "primary.main",
                        transition: "width 260ms ease",
                      }}
                    />
                  </Box>
                )}

                <Box
                  onClick={
                    isActive || isComplete
                      ? () => {
                          const firstPageId = step.pageIds[0];
                          if (firstPageId) {
                            emitProgressSnapshot(progressSnapshotValues);
                            void router.navigate(`/${firstPageId}`);
                          }
                        }
                      : undefined
                  }
                  sx={{
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid",
                    borderColor:
                      isActive || isComplete ? "primary.main" : "divider",
                    backgroundColor:
                      isActive || isComplete
                        ? "primary.main"
                        : "background.paper",
                    color:
                      isActive || isComplete
                        ? "primary.contrastText"
                        : "text.secondary",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                    transition:
                      "border-color 260ms ease, background-color 260ms ease, color 260ms ease",
                    fontWeight: 700,
                    fontSize: { xs: "0.95rem", sm: "1rem" },
                    cursor: isActive || isComplete ? "pointer" : "default",
                    // "&:hover": isActive || isComplete ? { opacity: 0.85 } : {},
                  }}
                >
                  {index + 1}
                </Box>

                <Typography
                  variant="caption"
                  onClick={
                    isActive || isComplete
                      ? () => {
                          const firstPageId = step.pageIds[0];
                          if (firstPageId) {
                            emitProgressSnapshot(progressSnapshotValues);
                            void router.navigate(`/${firstPageId}`);
                          }
                        }
                      : undefined
                  }
                  sx={{
                    mt: 1,
                    textAlign: "center",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    maxWidth: 70,
                    lineHeight: 1.3,
                    cursor: isActive || isComplete ? "pointer" : "default",
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Stack>
    ) : (
      (() => {
        function handleBack() {
          const backButton = document.querySelector(
            `button[form="${pageId}-form"][type="button"]`,
          ) as HTMLButtonElement | null;

          if (backButton) {
            backButton.click();
            return;
          }

          if (previousPageId) {
            emitProgressSnapshot(progressSnapshotValues);
            void router.navigate(`/${previousPageId}`);
          }
        }

        function handleNext() {
          const submitButton = document.querySelector(
            `button[type="submit"][form="${pageId}-form"]`,
          ) as HTMLButtonElement | null;

          if (submitButton) {
            submitButton.click();
            return;
          }

          if (nextPageId) {
            emitProgressSnapshot(progressSnapshotValues);
            void router.navigate(`/${nextPageId}`);
          }
        }

        return (
          <Stack spacing={0} sx={{ pb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
              <IconButton
                onClick={handleBack}
                disabled={!previousPageId}
                size="small"
              >
                <ChevronLeft />
              </IconButton>

              <Box
                sx={{
                  flex: 1,
                  position: "relative",
                  mx: 0.5,
                }}
              >
                <LinearProgress
                  variant="determinate"
                  value={percent}
                  sx={{
                    height: 12,
                    borderRadius: 999,
                    bgcolor: "rgb(0 0 0 / 4%)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "primary.main",
                      borderRadius: 999,
                    },
                  }}
                />

                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: `clamp(16px, ${percent}%, calc(100% - 16px))`,
                    transform: "translateX(-50%)",
                    transition: "left 260ms ease",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    lineHeight: 1,
                    color: "primary.main",
                    userSelect: "none",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {roundedPercent}%
                </Typography>
              </Box>

              <IconButton
                onClick={handleNext}
                size="small"
                disabled={!hasNextAction}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Stack>
        );
      })()
    );

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      <Box
        sx={{
          mx: "auto",
          width: "100%",
        }}
      >
        {content}
      </Box>
    </Box>
  );
}
