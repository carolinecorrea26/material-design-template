import type { CoverageId, PageId } from "../../types";
import type {
  ClientConfig,
  ClientCoverageOverrides,
} from "../clients/types";
import type { CoverageAmountAssignment } from "../coverages/types";
import type { CoverageDefinition } from "../coverages/types";
import { coverages } from "../coverages";
import { getClientCoverages } from "../client/getActiveClientCoverages";
import { coverageUnlocksPage } from "../formFlow";
import { HEALTH_PAGE_IDS } from "../progressSteps";
import type { ResolutionStatus } from "./types";

export type ResolvedCoverage = {
  id: CoverageId;
  global: CoverageDefinition;
  /** Present only when this client configures a range, description, and/or property override for this coverage. */
  override?: (ClientCoverageOverrides & { description?: string }) & {
    coverageAmounts?: CoverageAmountAssignment[];
  };
  /** Merged result — same shape getClientCoverages returns, reused rather than re-derived here. */
  effective: CoverageDefinition;
  status: ResolutionStatus;
  /** Health-* pages this coverage's (effective) underwriting type/riders unlock. */
  healthPagesUnlocked: PageId[];
  /** Names of the effective properties this client's override/range/description changed. */
  clientDiffs: string[];
};

/**
 * Resolves the full global coverage catalog against the given client's
 * ClientConfig.coverages, including coverages the client hasn't enabled
 * (status "disabled") — getClientCoverages only returns enabled coverages,
 * so it's reused here for the merge arithmetic and combined with the full
 * catalog to also surface what's excluded.
 */
export function resolveClientCoverage(client: ClientConfig): ResolvedCoverage[] {
  const effectiveById = new Map(
    getClientCoverages(client).map((coverage) => [coverage.id, coverage]),
  );
  const enabledIds = new Set(client.coverages.enabled ?? []);

  return coverages.map((base): ResolvedCoverage => {
    const id = base.id as CoverageId;
    const enabled = enabledIds.has(id);
    const override = client.coverages.overrides?.[id];
    const coverageAmounts = client.coverages.coverageAmounts?.[id];
    const description = client.coverages.descriptions?.[id];
    const effective = effectiveById.get(id) ?? base;

    const clientDiffs: string[] = [];
    if (override) {
      clientDiffs.push(
        ...Object.keys(override).filter(
          (key) =>
            JSON.stringify(effective[key as keyof CoverageDefinition]) !==
            JSON.stringify(base[key as keyof CoverageDefinition]),
        ),
      );
    }
    if (
      coverageAmounts &&
      JSON.stringify(effective.coverageAmounts) !== JSON.stringify(base.coverageAmounts)
    ) clientDiffs.push("coverageAmounts");
    if (description && description !== base.description) clientDiffs.push("description");
    const healthPagesUnlocked = HEALTH_PAGE_IDS.filter((pageId) =>
      coverageUnlocksPage(pageId, effective),
    );

    return {
      id,
      global: base,
      override:
        clientDiffs.length > 0
          ? { ...override, coverageAmounts, description }
          : undefined,
      effective,
      status: !enabled ? "disabled" : clientDiffs.length > 0 ? "overridden" : "inherited",
      healthPagesUnlocked,
      clientDiffs,
    };
  });
}
