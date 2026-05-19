import type { CoverageCategoryId } from "../coverageCategories";
import type { CoverageId } from "../../types/coverage";
import type { PageId } from "../../types/page";
import type { ClientId } from "../../types/client";
import type { FieldDefinition } from "../fields/types";

export type FieldId = string;

export type ClientBranding = {
  name: string;
  acronym: string;
  logo: string;
  logoAlt: string;
};

export type ClientSupport = {
  phone?: string;
  phoneDisplay?: string;
  phoneHours?: string;
  email?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

export type ClientPages = {
  excluded?: PageId[];
  optional?: PageId[];
};

export type ClientRiderConfig = {
  id: string;
  name: string;
  description: string;
  hasAmount?: boolean;
  minAmount?: number;
  maxAmount?: number;
  premiumFactor: number;
};

export type ClientWaitingPeriodConfig = {
  label: string;
  value: string;
  days: number;
};

export type ClientMaxBenefitPeriodConfig = {
  label: string;
  value: string;
};

export type ClientCoverageOverrides = {
  riders?: ClientRiderConfig[];
  waitingPeriodOptions?: ClientWaitingPeriodConfig[];
  maxBenefitPeriodOptions?: ClientMaxBenefitPeriodConfig[];
  applicants?: ("member" | "spouse" | "child")[];
  coverageNote?: string;
  featured?: boolean;
  underwritingType?: "FUW" | "GI" | "NA" | "QD" | "SI";
};

export type ClientCoverages = {
  categories?: CoverageCategoryId[];
  enabled?: CoverageId[];
  ranges?: Partial<Record<CoverageId, { min: number; max: number }>>;
  descriptions?: Partial<Record<CoverageId, string>>;
  overrides?: Partial<Record<CoverageId, ClientCoverageOverrides>>;
  /** When true, all coverage category accordions are expanded by default. Otherwise only the first is expanded. */
  allCategoriesExpanded?: boolean;
};

export type ClientFields = Partial<
  Record<
    PageId,
    {
      extra?: FieldId[];
      hidden?: FieldId[];
      required?: FieldId[];
      overrides?: Partial<Record<FieldId, Partial<FieldDefinition>>>;
    }
  >
>;

export type ClientContent = {
  global?: {
    banners?: string[];
    disclaimers?: string[];
  };
  pages?: Partial<
    Record<
      PageId,
      {
        intro?: string;
        help?: string[];
        banners?: string[];
        disclaimers?: string[];
      }
    >
  >;
};

export type ClientConfig = {
  id: ClientId;
  branding: ClientBranding;
  support: ClientSupport;
  pages: ClientPages;
  coverages: ClientCoverages;
  fields: ClientFields;
  content: ClientContent;
};
