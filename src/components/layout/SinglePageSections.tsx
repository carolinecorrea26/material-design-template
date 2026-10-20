import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import StepEditButton from "../navigation/StepEditButton";
import { getResolvedFormFlow } from "../../config/formFlow";
import { getActiveProgressSteps } from "../../config/progressSteps";
import { useApplicationForm } from "../../app/ApplicationFormContext";
import { useApplicationSession } from "../../app/ApplicationSessionContext";
import { SinglePageFlowContext } from "../../app/SinglePageFlowContext";
import type { PageId } from "../../types";

/** A persistent application embedded in the landing page. */
export default function SinglePageSections({ initialPageId = "membership", renderPage }: {
  initialPageId?: PageId;
  renderPage: (pageId: PageId) => ReactNode;
}) {
  const { values } = useApplicationForm();
  const { reviewSubmitted, advisorApplicantFlow } = useApplicationSession();
  const [pageId, setPageId] = useState(initialPageId);
  const [furthestPageId, setFurthestPageId] = useState(initialPageId);
  const [scrollTarget, setScrollTarget] = useState<PageId | null>(null);
  const [lastCompleted, setLastCompleted] = useState<Partial<Record<PageId, boolean>>>({});
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const [navigationPending, setNavigationPending] = useState(false);
  const flow = getResolvedFormFlow();
  const furthestIndex = Math.max(flow.indexOf(pageId), flow.indexOf(furthestPageId));
  const steps = getActiveProgressSteps(values);
  const activeStepIndex = steps.findIndex(step => step.pageIds.includes(pageId));
  const goToSection = useCallback((next: PageId, target: PageId = next) => {
    setPageId(next);
    setFurthestPageId(current => flow.indexOf(current) > flow.indexOf(next) ? current : next);
    setScrollTarget(target);
  }, [flow]);

  const scrollTargetStepId = steps.find(step => step.pageIds.includes(scrollTarget ?? pageId))?.id ?? "receipt";

  useEffect(() => {
    if (!scrollTarget) return;
    const frame = requestAnimationFrame(() => {
      const section = sectionRefs.current.get(scrollTargetStepId);
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      section?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pageId, scrollTarget, scrollTargetStepId]);

  const completeSection = useCallback((completed: PageId, next: PageId) => {
    setNavigationPending(false);
    setLastCompleted(previous => ({ ...previous, [completed]: true }));
    goToSection(next, completed);
  }, [goToSection]);

  return (
    <SinglePageFlowContext value={{ pageId, goToSection, completeSection, navigationPending, setNavigationPending }}>
      <Stepper orientation="vertical" activeStep={activeStepIndex} sx={{
        width: "100%", "& .MuiStepConnector-line": { display: "none" },
        "& .MuiStepLabel-root": { py: 2 },
        "& .MuiStepIcon-root.Mui-completed": { color: "success.main" },
      }}>
        {steps.map((step) => {
          const expanded = step.pageIds.includes(pageId);
          const completed = !expanded && step.pageIds.every(id => lastCompleted[id] || (flow.indexOf(id) >= 0 && flow.indexOf(id) < furthestIndex));
          const reachedPages = step.pageIds.filter(id => flow.indexOf(id) >= 0 && flow.indexOf(id) <= furthestIndex);
          const lastCompletedPage = [...step.pageIds].reverse().find(id => lastCompleted[id] || (flow.indexOf(id) >= 0 && flow.indexOf(id) < furthestIndex));
          const editPage = lastCompletedPage ?? reachedPages.at(-1);
          return (
            <Step key={step.id} completed={completed}>
              <Box component="section" ref={(element: HTMLElement | null) => {
                if (element) sectionRefs.current.set(step.id, element);
                else sectionRefs.current.delete(step.id);
              }} tabIndex={-1} aria-label={step.label} data-single-page-step={step.id}
                sx={{ scrollMarginTop: "120px", outline: "none" }}>
                <StepLabel>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="formVerticalStepLabel" sx={{
                      flex: 1, fontWeight: expanded ? 700 : 500,
                      color: expanded ? "text.primary" : completed ? "text.secondary" : "#94a3b8",
                    }}>{step.label}</Typography>
                    {!expanded && editPage && !reviewSubmitted && !advisorApplicantFlow && (
                      <StepEditButton label={step.label} disabled={navigationPending} onClick={() => goToSection(editPage)} />
                    )}
                  </Stack>
                </StepLabel>
                {expanded && renderPage(pageId)}
              </Box>
            </Step>
          );
        })}
      </Stepper>
      {pageId === "receipt" && <Box ref={(element: HTMLElement | null) => {
        if (element) sectionRefs.current.set("receipt", element);
      }} tabIndex={-1} sx={{ scrollMarginTop: "120px" }}>{renderPage("receipt")}</Box>}
    </SinglePageFlowContext>
  );
}
