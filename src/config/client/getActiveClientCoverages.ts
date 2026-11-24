import type { EffectiveSite } from '../../domain/effectiveSite';
import { activeCoverageApplicantRestriction, resolveAvailableApplicants, restrictCoverageApplicants } from './coverageApplicantScope';
import { activeFirstCoverageCategory, activeFeaturedProduct, activeCoverageProductRestriction, restrictCoverageProducts } from "./coverageProductScope";
import { orderCoveragePresentation } from "../../domain/coveragePresentation";
import { getPrototypeLibrary, type PrototypeLibrary } from "../../domain/prototypeLibrary";
import { resolveSiteId } from "../../data/activeSite";
import { activeCoverageCategoryRestriction, restrictCoverageCategories } from "./coverageCategoryScope";
import { coverages } from "../coverages";
import { getActiveClient } from "./getActiveClient";
import type { ClientConfig } from "../clients/types";
import { mergeCoverageAmountAssignments } from "../coverages/amounts";
import type { CoverageDefinition, ProductIdentifierSet, ScopedIdentifierSet } from "../coverages/types";

function mergeIdentifiers<T extends ProductIdentifierSet>(
  globalValue: ScopedIdentifierSet<T> | undefined,
  clientValue: ScopedIdentifierSet<T> | undefined,
): ScopedIdentifierSet<T> | undefined {
  if (!clientValue) return globalValue;
  if (!globalValue) return clientValue;
  const scopeKey = (item: { scope?: { applicantType?: string; applicantClassId?: string } }) =>
    `${item.scope?.applicantType ?? "*"}:${item.scope?.applicantClassId ?? "*"}`;
  const clientKeys = new Set((clientValue.scoped ?? []).map(scopeKey));
  return {
    ...globalValue,
    ...clientValue,
    scoped: [
      ...(globalValue.scoped ?? []).filter((item) => !clientKeys.has(scopeKey(item))),
      ...(clientValue.scoped ?? []),
    ],
  } as ScopedIdentifierSet<T>;
}

/** One entry-context projection for runtime and internal scenario consumers. */
export function getEntryScopedCoverages(library: PrototypeLibrary) {
  return entryScopedCoverages(library.products, library.client, library.site.siteKey, library.site);
}
function entryScopedCoverages(offering: CoverageDefinition[], client: ClientConfig, siteKey: string, site?: EffectiveSite) {
  const featured = activeFeaturedProduct(siteKey);
  const categories = restrictCoverageCategories(offering, activeCoverageCategoryRestriction(siteKey));
  const scoped = restrictCoverageProducts(categories, activeCoverageProductRestriction(siteKey), site);
  const products = restrictCoverageApplicants(scoped, resolveAvailableApplicants(client.applicantExperience?.coveredPeople, activeCoverageApplicantRestriction(siteKey)));
  return orderCoveragePresentation(products, client.coverages, featured, activeFirstCoverageCategory(siteKey)).products;
}
export function getActiveClientCoverages() {
  const siteKey = resolveSiteId(), library = getPrototypeLibrary(siteKey);
  return library ? getEntryScopedCoverages(library) : entryScopedCoverages(getClientCoverages(getActiveClient()), getActiveClient(), siteKey);
}

/** Same merging logic as {@link getActiveClientCoverages}, for an arbitrary client. */
export function getClientCoverages(client: ClientConfig) {
  const enabledCoverageIds = new Set(client.coverages.enabled ?? []);
  const coverageAmounts = client.coverages.coverageAmounts ?? {};
  const descriptions = client.coverages.descriptions ?? {};
  const overrides = client.coverages.overrides ?? {};

  return coverages
    .filter((coverage) => enabledCoverageIds.has(coverage.id))
    .map((coverage) => {
      const amountOverride = coverageAmounts[coverage.id];
      const description = descriptions[coverage.id];
      const override = overrides[coverage.id];

      return {
        ...coverage,
        requirements: override?.requirements ? { ...coverage.requirements, ...override.requirements } : coverage.requirements,
        underwritingBands: override?.underwritingBands ?? coverage.underwritingBands,
        underwritingBandsStatus: override?.underwritingBandsStatus ?? coverage.underwritingBandsStatus,
        name: override?.name ?? coverage.name,
        brochureUrl: override?.brochureUrl ?? coverage.brochureUrl,
        categoryId: override?.categoryId ?? coverage.categoryId,
        coverageAmounts: mergeCoverageAmountAssignments(
          coverage.coverageAmounts,
          amountOverride,
        ),
        gNumber: mergeIdentifiers(coverage.gNumber, override?.gNumber),
        planCode:
          mergeIdentifiers(coverage.planCode, override?.planCode) ??
          coverage.planCode,
        groupPolicySitus:
          override?.groupPolicySitus ?? coverage.groupPolicySitus,
        description: description ?? coverage.description,
        featured: override?.featured ?? coverage.featured,
        coverageNote: override?.coverageNote ?? coverage.coverageNote,
        applicantNotes: override?.applicantNotes ?? coverage.applicantNotes,
        productWarning: override?.productWarning ?? coverage.productWarning,
        productContent: override?.productContent ?? coverage.productContent,
        riders: override?.riders ?? coverage.riders,
        waitingPeriodOptions:
          override?.waitingPeriodOptions ?? coverage.waitingPeriodOptions,
        waitingPeriodOptionsByApplicant:
          override?.waitingPeriodOptionsByApplicant ??
          coverage.waitingPeriodOptionsByApplicant,
        maxBenefitPeriodOptions:
          override?.maxBenefitPeriodOptions ?? coverage.maxBenefitPeriodOptions,
        maxBenefitPeriodOptionsByApplicant:
          override?.maxBenefitPeriodOptionsByApplicant ??
          coverage.maxBenefitPeriodOptionsByApplicant,
        applicants: override?.applicants ?? coverage.applicants,
        underwritingType:
          override?.underwritingType ?? coverage.underwritingType,
      };
    });
}
