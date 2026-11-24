import type { PageId } from "../../types";
import type { FieldId } from "../fields/types";
import type { ApplicantSectionId } from "../formSectionTitle";
import type { ConditionId } from "../conditions/types";

export type PageSectionId =
  | "receiptConfirmation" | "receiptDecisions"
  | "paymentOptIn" | "paymentElections" | "paymentBanking"
  | "hero" | "how-applying-works" | "coverage-options" | "about"
  | "default"
  | "membershipInformation"
  | "coveragePortfolio" | "coverageCategories" | "coverageReveal" | "coverageProducts" | "coverageSummary"
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
  role?: 'questions' | 'categories' | 'portfolio' | 'reveal' | 'products' | 'summary';
  components?: string[];
  composition?: PageSectionComponent[];
  display?: { label: string; templates: Array<'single' | 'multi'>; excludeVariants?: string[] };
  coverageCategories?: string[];
  /** Shared configuration controlling this complete section; resolved during projection. */
  enabledByConfiguration?: string;
  id: PageSectionId;
  pageId: PageId;
  title?: string;
  description?: string;
  applicant?: ApplicantSectionId;
  /** Always collect owner/household sections even without a coverage election. */
  applicantParticipation?: 'applying' | 'always';
  fieldIds: FieldId[];
  /** Persisted repeatable form collection restored with this section. */
  collectionName?: string;
  /** Canonical executable WHEN; the section itself is the WHAT target. */
  visibilityConditionId?: ConditionId;
  /** Rendering treatment owned by the section, independent of its condition ID. */
  presentation?: "default" | "conditional";
};

export type PageSectionComponent = { type: string; partOf?: string; fieldIds?: string[]; components?: PageSectionComponent[] };
