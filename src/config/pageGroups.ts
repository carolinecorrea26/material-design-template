import type { PageId } from "../types/page";
import type { PageGroupId } from "../types/pageGroup";

export const pageGroups = [
  { id: "get-started", pages: ["membership", "eligibility"] },
  {
    id: "coverage",
    pages: [
      "coverage",
      "coverage-questions",
      "coverage-options",
      "beneficiary",
    ],
  },
  { id: "profile", pages: ["contact", "personal", "financial"] },
  { id: "review", pages: ["review", "docusign"] },
  {
    id: "health",
    pages: ["health-si", "health-qd", "health-di", "health-cir"],
  },
  { id: "payment", pages: ["payment"] },
] satisfies { id: PageGroupId; pages: PageId[] }[];
