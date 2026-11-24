import { requirementPageHelpChips, requirementText } from "../domain/requirementContent";

/** Shared by rendered controls and Library inspection. These are element labels,
 * not analytics action descriptions. */
export const menuTools = {
  "how-applying-works": { label: "How Applying Works", title: "How does applying work?" },
  "about-coverage": { label: "About Coverage", title: "What are my coverage options?" },
  "quick-decision": { label: "About QuickDecision", title: "What is QuickDecision?" },
  "coverage-needs": { label: "Needs Calculator", title: "How much coverage do I need?" },
} as const;

export const pageHelpChips = requirementPageHelpChips();

export const coverageLinkUnavailableMessage = requirementText("coverage.no-coverage");
