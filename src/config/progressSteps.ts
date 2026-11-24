import navigation from '../../requirements/global/navigation.json';
import type { PageId } from "../types";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { getResolvedFormFlow, shouldSkipPage } from "./formFlow";
import { getContent } from "../content";

export type ProgressStep = {
  id: string;
  label: string;
  pageIds: PageId[];
};

/** Structure is global JSON; wording resolves when read, after a revision is installed. */
export const progressSteps: ProgressStep[] = navigation.progressSteps.map(step => ({
  id: step.id,
  get label() {
    const value = getContent().navigation.progressStepLabels[step.id];
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing progress-step wording: ${step.id}`);
    return value;
  },
  pageIds: step.pages as PageId[],
}));

/** Health consolidation uses the same global navigation placements. */
export const HEALTH_PAGE_IDS = progressSteps.flatMap(step => step.pageIds).filter(page => page.startsWith('health-'));

export function getProgressStepIndex(pageId: PageId) {
  return progressSteps.findIndex((step) => step.pageIds.includes(pageId));
}

/**
 * Returns progress steps with skipped pages removed.
 * Steps that end up with no active pages are excluded entirely.
 */
export function getActiveProgressSteps(
  values: ApplicationFormValues,
  currentPageId?: PageId,
): ProgressStep[] {
  const journey = getResolvedFormFlow();
  return progressSteps
    .map((step) => ({
      ...step,
      pageIds: step.pageIds.filter(id => journey.includes(id) && (id === currentPageId || !shouldSkipPage(id, values))).sort((a, b) => journey.indexOf(a) - journey.indexOf(b)),
    }))
    .filter((step) => step.pageIds.length > 0)
    .sort((a, b) => journey.indexOf(a.pageIds[0]) - journey.indexOf(b.pageIds[0]));
}

/**
 * Returns the index of the active step within filtered progress steps.
 */
export function getActiveProgressStepIndex(
  pageId: PageId,
  values: ApplicationFormValues,
): number {
  const activeSteps = getActiveProgressSteps(values, pageId);
  return activeSteps.findIndex((step) => step.pageIds.includes(pageId));
}
