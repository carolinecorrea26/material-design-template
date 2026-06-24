import type { PageId } from "../types";
import type { PageGroupId } from "../types";

export const pageGroups = [
  { id: "get-started", pages: ["membership", "eligibility"] },
  {
    id: "coverage",
    pages: ["coverage", "beneficiary"],
  },
  { id: "profile", pages: ["contact", "profile"] },
  { id: "review", pages: ["review", "docusign"] },
  {
    id: "health",
    pages: ["health-si", "health-qd", "health-di", "health-cir"],
  },
  { id: "payment", pages: ["payment"] },
] satisfies { id: PageGroupId; pages: PageId[] }[];
