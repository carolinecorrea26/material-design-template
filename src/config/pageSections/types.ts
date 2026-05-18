import type { PageId } from "../../types/page";
import type { FieldId } from "../fields/types";
import type { ApplicantSectionId } from "../formSectionTitle";

export type PageSectionId =
  | "default"
  | "selfEligibility"
  | "dependentSelection"
  | "spouseSection"
  | "childSection"
  | "selfCoverageQuestions"
  | "spouseCoverageQuestions"
  | "contactResidentialAddress"
  | "contactBusinessInfo"
  | "contactSpouse"
  | "personalSelf"
  | "personalSelfDriversLicense"
  | "personalSelfOutsideUs"
  | "personalSelfTravelOutsideUs"
  | "personalSelfPhysician"
  | "personalSpouse"
  | "personalSpouseDriversLicense"
  | "personalSpouseOutsideUs"
  | "personalSpouseTravelOutsideUs"
  | "personalSpousePhysician"
  | "financialSelfOtherCoverage"
  | "financialSelfFinancialProfile"
  | "financialSelfEmploymentDetails"
  | "financialSpouseOtherCoverage"
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
