import type { PageId } from "../../types";
import type { FieldId } from "../fields/types";
import type { ApplicantSectionId } from "../formSectionTitle";

export type PageSectionId =
  | "default"
  | "selfEligibility"
  | "dependentSelection"
  | "spouseSection"
  | "childSection"
  | "selfCoverageQuestions"
  | "selfCoverageTobacco"
  | "selfCoverageWorkIncome"
  | "selfCoverageBusinessExpenses"
  | "spouseCoverageQuestions"
  | "spouseCoverageTobacco"
  | "spouseCoverageWorkIncome"
  | "contactResidentialAddress"
  | "contactBusinessInfo"
  | "contactSpouse"
  | "profilePersonalSelf"
  | "profilePersonalSelfDriversLicense"
  | "profilePersonalSelfOutsideUs"
  | "profilePersonalSelfTravelOutsideUs"
  | "profilePersonalSelfPhysician"
  | "profilePersonalSpouse"
  | "profilePersonalSpouseDriversLicense"
  | "profilePersonalSpouseOutsideUs"
  | "profilePersonalSpouseTravelOutsideUs"
  | "profilePersonalSpousePhysician"
  | "profileFinancialSelf"
  | "profileFinancialSpouse"
  | "advisorLoginNew"
  | "advisorLoginSaved";

export type SectionVisibilityRule =
  | {
      fieldId: FieldId;
      equals: string | boolean | number;
    }
  | {
      fieldId: FieldId;
      notEquals: string | boolean | number;
    }
  | {
      fieldId: FieldId;
      includes: string;
    };

export type PageSectionConfig = {
  id: PageSectionId;
  pageId: PageId;
  title?: string;
  description?: string;
  applicant?: ApplicantSectionId;
  fieldIds: FieldId[];
  visibleWhen?: SectionVisibilityRule[];
};
