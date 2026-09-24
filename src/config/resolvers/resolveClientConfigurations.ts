import type { ClientConfig } from "../clients/types";
import {
  configurationsData,
  getConfigurationDefaultDisplay,
  getConfigurationPage,
  type ConfigRow,
  type ConfigurationScope,
} from "../../content/docs/configurations";
import type { ResolutionStatus } from "./types";

export type ConfigurableKind = "client" | "global";

/** Maps the configuration schema's explicit two-value scope to resolver terminology. */
export function classifyConfigurable(scope: ConfigurationScope): ConfigurableKind {
  return scope === "Client Configurable" ? "client" : "global";
}

/**
 * Live-value accessors for the supported site configuration options. The
 * public configuration list is intentionally limited to rows with a direct
 * ClientConfig value so Global and Client views describe the same choices.
 */
const CONFIG_ACCESSORS: Partial<Record<string, (client: ClientConfig) => unknown>> = {
  "ClientConfig.branding": (c) => c.branding,
  "ClientConfig.theme": (c) => c.theme,
  "ClientConfig.applicantLabels": (c) => c.applicantLabels,
  "ClientConfig.support.phone / phoneDisplay / phoneHours": (c) => ({
    phone: c.support.phone,
    phoneDisplay: c.support.phoneDisplay,
    phoneHours: c.support.phoneHours,
  }),
  "ClientConfig.support.email / website / address": (c) => ({
    email: c.support.email,
    website: c.support.website,
    address: c.support.address,
  }),
  "ClientConfig.emailSupport.hideContactBox": (c) => c.emailSupport?.hideContactBox,
  "ClientConfig.emailSupport.supportOverride": (c) => c.emailSupport?.supportOverride,
  "ClientConfig.emailSupport.contactOverride": (c) => c.emailSupport?.contactOverride,
  "ClientConfig.licenseInfo[]": (c) => c.licenseInfo,
  "ClientConfig.features.homePageVariant": (c) => c.features?.homePageVariant,
  "ClientConfig.features.defaultTemplate": (c) => c.features?.defaultTemplate,
  "ClientConfig.features.chat / chatUrl": (c) => ({
    chat: c.features?.chat,
    chatUrl: c.features?.chatUrl,
  }),
  "ClientConfig.features.scheduleUrl": (c) => c.features?.scheduleUrl,
  "ClientConfig.features.linkUrl / linkLabel": (c) => ({
    linkUrl: c.features?.linkUrl,
    linkLabel: c.features?.linkLabel,
  }),
  "ClientConfig.pages.requirements.beneficiary / payment": (c) => c.pages.requirements,
  "ClientConfig.coverages.categories": (c) => c.coverages.categories,
  "ClientConfig.coverages.categorySectionLabels / allCategoriesExpanded": (c) => ({
    categorySectionLabels: c.coverages.categorySectionLabels,
    allCategoriesExpanded: c.coverages.allCategoriesExpanded,
  }),
  "ClientConfig.coverages.additionalCoverageWarning": (c) =>
    c.coverages.additionalCoverageWarning,
  "ClientConfig.coverages.enabled / overrides": (c) => ({
    enabled: c.coverages.enabled,
    overrides: c.coverages.overrides,
  }),
  "ClientConfig.coverages.coverageAmounts[productId]": (c) => c.coverages.coverageAmounts,
  "overrides[].waitingPeriodOptions / maxBenefitPeriodOptions": (c) => c.coverages.overrides,
  "overrides[].riders": (c) => c.coverages.overrides,
  "ClientConfig.estimatedRateDisplay": (c) => c.coverages.estimatedRateDisplay,
  "productEstimatedCostBreakdown / policyFee / childApplicantRider": (c) =>
    c.coverages.productEstimatedCostBreakdown,
  "ClientConfig.coverageQuestions": (c) => c.coverageQuestions,
  "ClientConfig.coverages.hideSmokerQuestion": (c) => c.coverages.hideSmokerQuestion,
  "ClientConfig.fields[pageId].extra / hidden / required / overrides": (c) => c.fields,
  "ClientConfig.fields.eligibility.extra": (c) => c.fields.eligibility?.extra,
};

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object")
    return Object.values(value).every((v) => isEmptyValue(v));
  return false;
}

/**
 * A handful of enum-like settings default to a literal value (rather than
 * `undefined`) even when the client hasn't meaningfully customized them —
 * e.g. a default preset theme. Without this, isEmptyValue would call every
 * client that explicitly sets the default value "overridden".
 */
export const CONFIG_DEFAULTS: Partial<Record<string, unknown>> = {
  "ClientConfig.theme": { type: "preset", preset: "default" },
  "ClientConfig.features.homePageVariant": "default",
  "ClientConfig.features.defaultTemplate": "multi",
  "ClientConfig.coverages.additionalCoverageWarning": "applyForAdditional",
};

export function getConfigurationDefaultValue(name: string): unknown {
  return CONFIG_DEFAULTS[name];
}

function isAtDefault(name: string, value: unknown): boolean {
  if (name in CONFIG_DEFAULTS)
    return JSON.stringify(value) === JSON.stringify(CONFIG_DEFAULTS[name]);
  return isEmptyValue(value);
}

export type ResolvedConfiguration = {
  configurationId: ConfigRow["id"];
  key: string;
  group: string;
  label: string;
  page: ReturnType<typeof getConfigurationPage>;
  global: Pick<ConfigRow, "description" | "sourcePath" | "usedIn"> & {
    defaultValue?: unknown;
    defaultDisplay: string;
  };
  kind: ConfigurableKind;
  /** True when a live accessor exists for this row's `name`; false rows are schema-description-only for now. */
  liveValueAvailable: boolean;
  override?: unknown;
  effective?: unknown;
  status: ResolutionStatus;
};

/**
 * Resolves every supported site configuration option against a client.
 */
export function resolveClientConfigurations(client: ClientConfig): ResolvedConfiguration[] {
  return configurationsData.map((row): ResolvedConfiguration => {
    const kind = classifyConfigurable(row.scope);
    const accessor = CONFIG_ACCESSORS[row.name];
    const value = accessor?.(client);
    const liveValueAvailable = Boolean(accessor);

    let status: ResolutionStatus;
    if (kind !== "client") {
      status = "inherited";
    } else if (!liveValueAvailable) {
      status = "inherited";
    } else {
      status = isAtDefault(row.name, value) ? "inherited" : "overridden";
    }

    return {
      configurationId: row.id,
      key: row.name,
      group: row.group,
      label: row.label,
      page: getConfigurationPage(row),
      global: {
        description: row.description,
        sourcePath: row.sourcePath,
        usedIn: row.usedIn,
        defaultValue: getConfigurationDefaultValue(row.name),
        defaultDisplay: getConfigurationDefaultDisplay(row),
      },
      kind,
      liveValueAvailable,
      override: liveValueAvailable ? value : undefined,
      effective:
        liveValueAvailable && status === "overridden"
          ? value
          : getConfigurationDefaultValue(row.name),
      status,
    };
  });
}
