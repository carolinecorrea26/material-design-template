// ---------------------------------------------------------------------------
// Health Routing
//
// A condition→page lookup table, not a sequence — rows are independent
// (mutually exclusive-ish) conditions, not a chain, so this stays a plain
// table rather than being modeled as a FlowDefinition.
// ---------------------------------------------------------------------------

export type HealthRoutingRow = {
  condition: string;
  pageLabel: string;
  purpose: string;
  implemented: boolean;
};

export const healthRoutingRows: HealthRoutingRow[] = [
  {
    condition: "LI (SI) or DI (SI) selected",
    pageLabel: "SI",
    purpose: "Simplified Issue health questions",
    implemented: true,
  },
  {
    condition: "WL (SI + UW) selected",
    pageLabel: "WAEPAWL",
    purpose: "Whole Life health questions",
    implemented: false,
  },
  {
    condition: "LI (UW), DI (UW), or OO (UW) selected",
    pageLabel: "TELE SUPP",
    purpose: "Tele-Supplemental health questions",
    implemented: true,
  },
  {
    condition: "CI product selected",
    pageLabel: "CI",
    purpose: "Critical Illness health questions",
    implemented: false,
  },
  {
    condition: "LI (UW) + CIR, or CIR standalone",
    pageLabel: "UW CIR",
    purpose: "Chronic Illness Rider health questions",
    implemented: true,
  },
  {
    condition: "LI (QD) and/or DI (QD) selected",
    pageLabel: "QD LI / QD DI / QD LI+DI",
    purpose: "Magnum QuickDecision (LI/DI/LI+DI) health questions",
    implemented: true,
  },
  {
    condition: "LI (QD) + CIR selected",
    pageLabel: "QD CIR",
    purpose: "Magnum Chronic Illness Rider health questions",
    implemented: false,
  },
  {
    condition: "LI (QD) + DI (UW) selected",
    pageLabel: "DI SUPP",
    purpose: "Supplemental Disability health questions",
    implemented: false,
  },
];
