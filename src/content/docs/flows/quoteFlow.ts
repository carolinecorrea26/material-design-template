import type { FlowDefinition } from "./types";

export const quoteFlow: FlowDefinition = {
  id: "quote",
  title: "Quote Flow",
  intro:
    "Available through configured entry points (drawer/modal, not a standalone page). Collects minimum information to determine available products and estimated premiums.",
  nodes: [
    {
      id: "quote-entry",
      kind: "start",
      label: "Entry Point",
      description: "Available from Landing Page and Membership page (drawer/modal, not standalone page).",
    },
    {
      id: "quote-collect-inputs",
      kind: "action",
      label: "Collect Inputs",
      description:
        "Collects minimum information required: DOB, gender, tobacco status, category-specific inputs.",
    },
    {
      id: "quote-calculate-estimates",
      kind: "action",
      label: "Calculate Estimates",
      description: "Calculates estimated premiums for supported categories (LI, AD, DI, OO, SH).",
    },
    {
      id: "quote-product-selection",
      kind: "action",
      label: "Product Selection",
      description:
        "At least one product must be selected before continuing into application — a validation gate, not a routing branch.",
    },
    {
      id: "quote-carry-into-application",
      kind: "end",
      label: "Carry into Application",
      description: "Applicable quote inputs and selected products carry into the application fields.",
    },
  ],
  edges: [
    { id: "quote-e1", source: "quote-entry", target: "quote-collect-inputs" },
    { id: "quote-e2", source: "quote-collect-inputs", target: "quote-calculate-estimates" },
    { id: "quote-e3", source: "quote-calculate-estimates", target: "quote-product-selection" },
    { id: "quote-e4", source: "quote-product-selection", target: "quote-carry-into-application" },
  ],
};
