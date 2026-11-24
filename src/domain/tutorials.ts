import type { FlowId } from './flows';
import currentAdvisor from '../../requirements/global/tutorials/advisor-current.json';
import advisor from '../../requirements/global/tutorials/advisor.json';
import applicationAccess from '../../requirements/global/tutorials/application-access.json';
import type { PageId } from '../types';
import type { MockEmailType } from '../utils/mockEmail';
export type TutorialPreview = { pageId: PageId; mode: string };
export type TutorialStep = { flowNodeIds?: string[]; title: string; paragraphs: string[]; actor: string; activeUser: string; accessStage: keyof typeof applicationAccess.stages | 'Current person'; preview?: TutorialPreview; emailType?: MockEmailType; note?: string; placeholder?: string; screens?: string[]; recovery?: { label: string; pageId?: PageId; mode?: string; emailType?: MockEmailType } };
export type TutorialSection = { id: string; title: string; actor: string; description: string; entries: Array<string | { sequence: string }> };
export type TutorialDefinition = { flowId?: FlowId; variant?: 'new' | 'current'; referenceNote?: string; exampleParticipants?: Record<string, { name?: string; email: string }>; referenceScreens?: Record<string, { path: string; caption: string; source: string; sha256: string }>; notificationReferences?: Record<string, { whenNotified: string; screens: Record<string, string[]>; notes?: Record<string, string> }>; id: string; title: string; summary: string; audience: string; ownership: string; source: { workbook: string; sheet: string; range: string }; steps: Record<string, TutorialStep>; sequences: Record<string, string[]>; sections: TutorialSection[] };
export const tutorials = [advisor as TutorialDefinition, currentAdvisor as TutorialDefinition];
export function tutorialSectionSteps(tutorial: TutorialDefinition, section: TutorialSection) {
  return section.entries.flatMap(entry => typeof entry === 'string' ? [entry] : tutorial.sequences[entry.sequence]).map(id => ({ id, ...tutorial.steps[id] }));
}

/** Tutorial guidance only; these indicators do not grant application access. */
export function tutorialApplicationAccess(step: TutorialStep, actor: string) {
  const stageId = step.accessStage === 'Current person' ? (actor === 'Advisor' ? 'Advisor' : 'Applicant') : step.accessStage;
  const stage = applicationAccess.stages[stageId];
  const availablePeople: readonly string[] = stage.canAccess;
  return {
    explanation: stage.explanation,
    legend: applicationAccess.legend,
    people: ['Advisor', 'Applicant'].map(person => {
      const status = !availablePeople.includes(person) ? 'unavailable' : step.activeUser === person ? 'active' : 'available';
      return { person, status, label: `${person}: ${applicationAccess.labels[status]}` };
    }),
  };
}
