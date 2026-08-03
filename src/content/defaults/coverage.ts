import type { CoverageContent } from "../types";
import { applicantLabels } from "../../config/formSectionTitle";

export const coverageDefaults: CoverageContent = {
  categoryDescriptions: {
    LI: "Life coverage can help provide financial protection for the people who depend on you.",
    AD: "Accidental death and dismemberment coverage can help protect against covered accidental loss or injury.",
    DI: "Disability coverage can help replace income if a covered disability affects your ability to work.",
    OO: "Office overhead coverage can help keep eligible business expenses paid during a covered disability.",
    SH: "Supplemental health coverage can help with out-of-pocket costs tied to covered health events.",
  },
  applicantLabels: { ...applicantLabels },
  applicantCheckboxLabels: {
    member: "Select for myself",
    spouse: "Select for my spouse",
    child: "Select for my child",
  },
};
