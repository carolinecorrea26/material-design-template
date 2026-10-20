import type { PersistenceAdapter } from "../persistence/adapter";

/** Inspection metadata only. This contract deliberately has no decision resolver. */
export function createCanonicalMetadataRepository(adapter: PersistenceAdapter) {
  return {
    async forSite(siteKey: string) {
      const [underwriting, eligibility] = await Promise.all([
        adapter.list("underwritingBands"), adapter.list("eligibilityConstraints"),
      ]);
      return {
        underwriting: underwriting.filter(r => r.siteKey === siteKey),
        eligibility: eligibility.filter(r => r.siteKey === siteKey),
      };
    },
  };
}
