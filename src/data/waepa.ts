import type { ClientConfig } from "../config/clients/types";
import { rangeAssignments } from "../config/coverages/amounts";
import { waepaTpaVerificationFlow } from "../config/clients/waepaFlowOverrides";
import type { Client, Site } from "./model";
import { compatibilityTpaId } from "./tpas";

const sharedRiders = [
  {
    id: "cir",
    name: "Chronic Illness Rider (CIR)",
    description:
      "Accelerate up to 50% of the portion of your life insurance subject to the Chronic Illness Rider should you be permanently unable to perform 2 out of 6 activities of daily living or require substantial care due to permanent cognitive impairment.",
    premiumFactor: 0.05,
  },
  {
    id: "abi",
    name: "Automatic Benefit Increase Rider (ABI)",
    description:
      "Automatic benefit increase of $25,000 per year for up to 10 years, with no additional medical underwriting required. Subject to increased premium due with each annual increase.",
    premiumFactor: 0.05,
  },
];

export const waepaClientEntity: Client = {
  id: "waepa",
  tpaId: compatibilityTpaId("waepa"),
  name: "Worldwide Assurance for Employees of Public Agencies",
  acronym: "WAEPA",
  branding: {
    name: "Worldwide Assurance for Employees of Public Agencies",
    acronym: "WAEPA",
    logo: "/client/waepa/logo.png",
    logoAlt: "WAEPA Logo",
  },
  support: {
    phone: "8003683484",
    phoneDisplay: "800-368-3484",
    phoneHours: "M-Th 8:30am - 6:30pm, F 8:30am - 5:00pm, ET",
    email: "support@waepa.org",
    website: "waepa.org",
    address: {
      street: "2806 N. Parham Road, Suite 200",
      city: "Richmond",
      state: "Virginia",
      zip: "23294",
    },
  },
  configurationDefaults: {
    theme: { type: "preset", preset: "dark-blue" },
    pages: { requirements: { beneficiary: "required", payment: "required" } },
    coverages: {
      categories: ["LI", "DI"],
      enabled: ["li-group-term", "di-short-term"],
      coverageAmounts: {
        "li-group-term": rangeAssignments({ member: [50000, 500000] }),
        "di-short-term": rangeAssignments({ member: [1000, 4000] }),
      },
      descriptions: {
        "li-group-term": "Coverage designed to provide protection for both you and your family.",
        "di-short-term":
          "This coverage can help safeguard against the potentially devastating consequences an illness or injury could have on your life.",
      },
      additionalCoverageWarning: "applyForTotal",
      overrides: {
        "li-group-term": {
          underwritingType: "QD",
          productWarning: {
            severity: "info",
            title: "",
            message: "Optional Chronic Illness Rider available.",
          },
          riders: sharedRiders,
        },
        "di-short-term": { underwritingType: "QD" },
      },
      allCategoriesExpanded: true,
    },
    fields: { coverage: { hidden: ["average-employees-6-months"] } },
    licenseInfo: ["CA Insurance License: #OH62489", "AR Insurance License: #94726"],
  },
};

export const waepaSites: Site[] = [
  {
    id: "waepa-standard",
    clientId: waepaClientEntity.id,
    name: "Standard Application",
    templateType: "multi",
    status: "active",
    legacyClientId: "waepa",
    associationSelection: { mode: "fixed", fixedAssociationId: "waepa" },
    configurationOverrides: {
      coverages: {
        hideSmokerQuestion: true,
        overrides: {
          "li-group-term": { name: "Group Term Life Insurance" },
          "di-short-term": { name: "Group Short-Term Disability Income Insurance" },
        },
      },
      flows: { overrides: { tpaVerification: waepaTpaVerificationFlow } },
    },
  },
  {
    id: "waepa-gi",
    clientId: waepaClientEntity.id,
    name: "Guaranteed Issue Application",
    templateType: "single",
    status: "active",
    legacyClientId: "waepagi",
    associationSelection: { mode: "fixed", fixedAssociationId: "waepa" },
    brandingOverride: { logo: "/client/waepagi/logo.png" },
    configurationOverrides: {
      features: { defaultTemplate: "single", homePageVariant: "hero-image" },
    },
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function merge<T>(base: T, override: Partial<T> | undefined): T {
  if (!override) return base;
  const result = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseValue = result[key];
    result[key] = isRecord(baseValue) && isRecord(value)
      ? merge(baseValue, value)
      : value;
  }
  return result as T;
}

export function buildWaepaLegacyConfig(siteId: "waepa-standard" | "waepa-gi"): ClientConfig {
  const site = waepaSites.find((entry) => entry.id === siteId)!;
  const configuration = merge(
    waepaClientEntity.configurationDefaults,
    site.configurationOverrides,
  );
  return {
    id: site.legacyClientId,
    branding: merge(waepaClientEntity.branding, site.brandingOverride),
    support: merge(waepaClientEntity.support, site.supportOverride),
    ...configuration,
  };
}
