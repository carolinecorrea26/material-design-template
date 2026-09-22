import type { PageId } from "../../types";
import type { ClientConfig, ClientPageRequirement } from "../clients/types";
import { pages, getPageTitle, getPageNavTitle } from "../pages";
import { formFlow } from "../formFlow";
import { progressSteps, HEALTH_PAGE_IDS } from "../progressSteps";
import { getClientPageRequirement } from "../client/getClientPageRequirement";
import type { ResolutionStatus } from "./types";

export type PageCategory = "application" | "resume" | "advisor" | "internal";

/** Application-flow page order, derived from the runtime form flow rather than re-authored. */
export const applicationPageOrder: PageId[] = ["home", ...formFlow];
const siteDetailsCategoryOrder: PageCategory[] = ["application", "resume", "advisor", "internal"];

/**
 * Compact labels for the docs "Sequence" column, keyed by progress-step id
 * rather than by page id — the page→step *association* comes from
 * progressSteps.ts (so a page moved between steps stays correct here
 * automatically); only the short display wording is docs-specific, since
 * progressSteps' real labels are prose meant for the applicant-facing
 * progress bar, not a dense table column.
 */
const STEP_DISPLAY_LABELS: Record<string, string> = {
  "getting-started": "Getting Started",
  "coverage-options": "Coverage",
  profile: "Profile",
  "application-review": "Review & Sign",
  "esign-submit": "E-sign",
};

function findProgressStep(pageId: PageId) {
  return progressSteps.find((step) => step.pageIds.includes(pageId));
}

/** Sequence-group label for a page, or "N/A" when the page isn't part of the applicant progress bar. */
export function resolvePageStepLabel(pageId: PageId): string {
  const step = findProgressStep(pageId);
  return step ? (STEP_DISPLAY_LABELS[step.id] ?? step.label) : "N/A";
}

/**
 * Individual breadcrumb label for a page, or "N/A" when the page isn't part
 * of the applicant progress bar (matches VerticalStepperBreadcrumbs, which
 * only renders for pages within a progress step). Reuses the same content
 * source (getPageNavTitle) the real breadcrumb component reads from, so this
 * never drifts from what the applicant actually sees.
 */
export function resolvePageBreadcrumbLabel(pageId: PageId): string {
  if (!findProgressStep(pageId)) return "N/A";
  return getPageNavTitle(pageId);
}

export function getPageCategory(page: { id: string; type: string }): PageCategory {
  if (page.type === "internal") return "internal";
  if (page.id === "mock-email-preview") return "internal";
  if (page.id.startsWith("advisor") || page.id === "application-edit-confirmation")
    return "advisor";
  if (page.id.startsWith("resume") || page.type === "resume") return "resume";
  return "application";
}

/** Canonical page order used by the Site Details Pages table and related admin references. */
export function getSiteDetailsPageOrder(): PageId[] {
  return [...pages]
    .sort((a, b) => {
      const categoryA = getPageCategory(a);
      const categoryB = getPageCategory(b);
      const categoryDifference =
        siteDetailsCategoryOrder.indexOf(categoryA) - siteDetailsCategoryOrder.indexOf(categoryB);
      if (categoryDifference !== 0) return categoryDifference;

      if (categoryA === "application") {
        const indexA = applicationPageOrder.indexOf(a.id);
        const indexB = applicationPageOrder.indexOf(b.id);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      }

      return 0;
    })
    .map((page) => page.id);
}

export type GlobalPageInfo = {
  id: PageId;
  title: string;
  path: string;
  category: PageCategory;
  step: string;
  breadcrumb: string;
};

/**
 * The global (client-independent) page registry — every registered page's
 * title, path, category, and progress-bar position. Used both by
 * resolveClientPages (as the baseline it resolves overrides against) and
 * directly by global documentation (e.g. Site Details' Application section),
 * which must never need an active client to render its baseline.
 */
export function getGlobalPages(): GlobalPageInfo[] {
  return pages.map((page) => {
    const id = page.id as PageId;
    // Home's doc title is its hero copy, a distinct content field from content.pages.home.title.
    const title = id === "home" ? "Safeguard your financial future." : getPageTitle(id);
    return {
      id,
      title,
      path: page.path,
      category: getPageCategory(page),
      step: resolvePageStepLabel(id),
      breadcrumb: resolvePageBreadcrumbLabel(id),
    };
  });
}

export type ResolvedPage = {
  id: PageId;
  global: GlobalPageInfo;
  override?: {
    requirement?: ClientPageRequirement;
  };
  effective: {
    included: boolean;
    requirement: ClientPageRequirement;
    visibleWhen: string;
  };
  status: ResolutionStatus;
};

/**
 * Resolves a single page's Global → Override → Effective visibility for the
 * given client. Health pages are gated by coverage selection at runtime
 * (not by ClientConfig.pages), so they're always "inherited"/included here —
 * see coverageUnlocksPage in formFlow.ts for the actual gating logic.
 */
export function resolvePageVisibility(
  pageId: PageId,
  client: ClientConfig,
): Pick<ResolvedPage, "override" | "effective" | "status"> {
  if (HEALTH_PAGE_IDS.includes(pageId)) {
    return {
      effective: {
        included: true,
        requirement: "required",
        visibleWhen:
          "Shown when a selected coverage's underwriting type/rider unlocks this health page",
      },
      status: "inherited",
    };
  }

  const requirement = getClientPageRequirement(pageId, client);

  if (pageId === "beneficiary" || pageId === "payment") {
    const configuredRequirement = client.pages.requirements?.[pageId];
    const override = configuredRequirement
      ? { requirement: configuredRequirement }
      : undefined;
    if (requirement === "none")
      return {
        override,
        effective: {
          included: false,
          requirement,
          visibleWhen: "Excluded for this client (page requirement = none)",
        },
        status: "disabled",
      };
    if (requirement === "optional")
      return {
        override,
        effective: {
          included: true,
          requirement,
          visibleWhen: "Optional for this client — user may opt out",
        },
        status: "overridden",
      };
    return {
      override,
      effective: {
        included: true,
        requirement,
        visibleWhen:
          pageId === "beneficiary"
            ? "Shown when selected coverage requires beneficiary designation"
            : "Always shown",
      },
      status: "inherited",
    };
  }

  // Legacy pages.excluded/pages.optional arrays can still target any page id.
  if (requirement === "none")
    return {
      effective: {
        included: false,
        requirement,
        visibleWhen: "Excluded for this client (legacy client configuration)",
      },
      status: "disabled",
    };
  if (requirement === "optional")
    return {
      effective: {
        included: true,
        requirement,
        visibleWhen: "Optional for this client (legacy client configuration)",
      },
      status: "overridden",
    };
  return {
    effective: { included: true, requirement, visibleWhen: "Always shown" },
    status: "inherited",
  };
}

/** Resolves every registered page's Global → Override → Effective state for the given client. */
export function resolveClientPages(client: ClientConfig): ResolvedPage[] {
  return getGlobalPages().map((global) => {
    const { override, effective, status } = resolvePageVisibility(global.id, client);
    return { id: global.id, global, override, effective, status };
  });
}
