export type TemplateChangeEntry = {
  area: string;
  current: string;
  next: string;
};

/**
 * Current-template vs. new-template comparison. Moved verbatim from
 * InformationArchitecture.tsx into the Portal Template Project resources —
 * this tracks client-specific differences that must be preserved or retired
 * during migration, not "how the app works" documentation.
 */
export const templateChanges: TemplateChangeEntry[] = [
  {
    area: "Design system",
    current: "Bootstrap-based UI.",
    next: "Google Material Design-based UI.",
  },
  {
    area: "Add-item interactions",
    current:
      "Beneficiaries, children, companies, and similar repeatable entries are added inline on the page.",
    next: "Repeatable entries are added and edited within a modal/dialog.",
  },
  {
    area: "Beneficiary allocation guidance",
    current: "No real-time indication of remaining beneficiary allocation.",
    next: "Displays assigned and remaining beneficiary allocation in real time.",
  },
  {
    area: "Autosave initiation",
    current: "Autosave begins after the third application page.",
    next: "Autosave begins after the first application page.",
  },
  {
    area: "Resume process",
    current: "Three-step resume process.",
    next: "Three-step resume process: email link, delivery method selection (Text or Call), then phone verification code.",
  },
  {
    area: "Quote tool product support",
    current:
      "Quote functionality limited to approximately three Life products or one Disability product.",
    next: "Quote tool supports all applicable products.",
  },
  {
    area: "Standardized client flow",
    current:
      "Page flow can vary significantly by client; some clients have unique pages such as Membership.",
    next: "All client sites use a standardized page structure and flow, with client differences handled through configuration rather than unique client pages.",
  },
  {
    area: "Page length / field distribution",
    current:
      "Large pages such as Eligibility and Profile contain many fields and require significant scrolling.",
    next: "Large pages are broken into smaller, task-focused pages with fewer fields per page.",
  },
  {
    area: "Review and signature flow",
    current: "Preview and Read & Sign are separate pages.",
    next: "Review/Preview and Read & Sign functionality is consolidated where appropriate into a single stage/page experience.",
  },
  {
    area: "Decision and confirmation flow",
    current: "Decision and Receipt are separate pages.",
    next: "Decision and Receipt are consolidated into a single final confirmation/Receipt experience.",
  },
  {
    area: "Responsive design",
    current: "Desktop-oriented layouts adapted for smaller screens.",
    next: "Mobile-first responsive layouts and components.",
  },
  {
    area: "Contextual help",
    current: "Help content is limited or presented separately from the task.",
    next: "Pages provide contextual helper chips and progressive-disclosure help relevant to the current task.",
  },
  {
    area: "Loading feedback",
    current: "Primarily spinner-based loading states.",
    next: "Uses skeleton loaders, progress indicators, and other contextual loading feedback.",
  },
  {
    area: "Applicant-first flow",
    current:
      "Applicants may need to explicitly identify/select themselves as an applicant.",
    next: "Common member-only scenario is assumed first, with dependents added only when needed.",
  },
  {
    area: "Page content density",
    current:
      "Pages contain more instructional text and content competing with form tasks.",
    next: "Content is reduced and structured for faster scanning and lower cognitive load.",
  },
  {
    area: "Application navigation",
    current:
      "Navigation and progress patterns vary with the existing page structure.",
    next: "Standardized navigation and progress pattern across client implementations.",
  },
];
