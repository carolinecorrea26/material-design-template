/** Shared by rendered controls and Library inspection. These are element labels,
 * not analytics action descriptions. */
export const menuTools = {
  "how-applying-works": { label: "How Applying Works", title: "How does applying work?" },
  "about-coverage": { label: "About Coverage", title: "What are my coverage options?" },
  "quick-decision": { label: "About QuickDecision", title: "What is QuickDecision?" },
  "coverage-needs": { label: "Needs Calculator", title: "How much coverage do I need?" },
} as const;

export const helpChipDefinitions = {
  coverageOptions: { id: "coverage-options-available", label: "What are my coverage options?" },
  applying: { id: "application-process", label: "How does applying work?" },
  beneficiaryBasics: { id: "beneficiary-basics", label: "What is a beneficiary?" },
  beneficiaryShare: { id: "beneficiary-share", label: "What is the % share?" },
  payment: { id: "payment-handling", label: "How is my payment information handled?" },
  health: { id: "health-info-use", label: "How is my health information used?" },
} as const;

export const pageHelpChips: Record<string, readonly { id: string; label: string }[]> = {
  membership: [helpChipDefinitions.coverageOptions, helpChipDefinitions.applying],
  coverage: [],
  beneficiary: [helpChipDefinitions.beneficiaryBasics, helpChipDefinitions.beneficiaryShare],
  payment: [helpChipDefinitions.payment],
  "health-si": [helpChipDefinitions.health],
  "health-di": [helpChipDefinitions.health],
  "health-li": [helpChipDefinitions.health],
  "health-ci": [helpChipDefinitions.health],
  "health-cir": [helpChipDefinitions.health],
  "health-qd": [helpChipDefinitions.health],
};

export const coverageLinkUnavailableMessage = "No coverage is available through this link. Please contact your plan administrator for help.";
