import type { PageId } from "../../types";
import type { FieldId } from "../fields/types";
import type { ApplicantSectionId } from "../formSectionTitle";
import type { ConditionId } from "../conditions/types";

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
  | "profileFinancialQuestionnaireSelf"
  | "profileFinancialSpouse"
  | "advisorLoginNew"
  | "advisorLoginSaved";

export type PageSectionConfig = {
  id: PageSectionId;
  pageId: PageId;
  title?: string;
  description?: string;
  applicant?: ApplicantSectionId;
  fieldIds: FieldId[];
  /** Canonical executable WHEN; the section itself is the WHAT target. */
  visibilityConditionId?: ConditionId;
  /** Rendering treatment owned by the section, independent of its condition ID. */
  presentation?: "default" | "conditional";
};
