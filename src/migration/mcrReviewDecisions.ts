import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { waepaQualifications } from "../domain/membershipQualifications";
import { activeSiteMigrationScope } from "./activeSiteScope";

/** Explicit October 20 decisions. No legacy source expression is promoted here. */
export function addMcrReviewDecisions(db: DatabaseSchema) {
  const decisions = [
    { suffix: "current-workbook", site: "waepa", predicate: "current-mcr-review-authority", selected: activeSiteMigrationScope.sources.currentMcr,
      sourceReferences: [activeSiteMigrationScope.sources.currentMcr.name], destination: null },
    { suffix: "waepa-qualifications", site: "waepa", predicate: "membership-qualification-options",
      selected: { options: waepaQualifications, independentAdultChildLifeEntry: true, productEligibilityRemainsSeparate: true },
      sourceReferences: ["Attestation Online and PDF!C122", "Main!Q379", "User six-option list October 20, 2026"], destination: { table: "fields", key: "waepa-attestation", column: "definition" } },
    { suffix: "new-template-interpretation", site: "waepa", predicate: "requirement-interpretation",
      selected: { sourceIsNotOneToOneMigration: true, reviewLegacyWorkaroundsWithUser: true, documentActualNewTemplateFunctionality: true, globalDefinitionsWithScopedAssignments: true, ruleHierarchyAndTraceabilityRequired: true },
      sourceReferences: ["User clarification October 20, 2026"], destination: null },
    { suffix: "isitrust-overhead-yt", site: "isitrust", predicate: "residency-source-token",
      selected: { token: "YT", jurisdiction: "Yukon", productKey: "oo-professional", policyActivation: "reviewed-seed", countryScopeUnchanged: true },
      sourceReferences: ["Main!N280", "User clarification October 20, 2026: Yukon — keep YT"], destination: null },
    { suffix: "isitrust-atpe-restrictions", site: "isitrust", predicate: "association-residency-exception",
      selected: { sourceAssociationKey: "mcr.association.atpe.388", associationKey: "association-of-texas-professional-educators", gNumber: "G-31139-0", excludedJurisdictions: ["US-FL", "US-MT", "US-NV", "US-VT"], historicalExcludedJurisdictions: "FL KS MS MO MT NV NH TN UT VT".split(" ").map(code => `US-${code}`), historicalListDisposition: "superseded-by-current-ATPE-N179", separateFromGeneralList: true, requestedSiteKey: "isitrust", activationRequested: true, activation: "reviewed-seed", portfolio: "All seven ATPE products at Main!179:185" },
      sourceReferences: ["Historical Main!N278", "Main!N179", "Main!N288", "Associations!A388:C388", "User approval October 20, 2026: retain separate restrictions for ATPE and add ATPE to the current ISITRUST application"], destination: null },
    { suffix: "custom-consent-deferral", site: "waepa", predicate: "custom-consent-deferral",
      selected: { disposition: "deferred-by-user", completionBlocking: false, missing: ["Custom Consent source text", "Applicable Site assignments"], revisitTrigger: "User supplies the missing information", preserveExistingReviewBehavior: true },
      sourceReferences: ["Legal Disclosures!A6", "Legal Disclosures!B6", "Legal Disclosures!D6", "User approval October 20, 2026: defer as a flagged requirement; does not block task completion"], destination: null },
  ];
  for (const decision of decisions) {
    const key = `business-decision.rules-review.${decision.suffix}`;
    const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, "User clarification October 20, 2026; docs/project-review/rules-coverage-plan.md"),
      domain: "approved-business-decision", subjectTable: decision.destination ? "fields" : decision.suffix === "isitrust-overhead-yt" ? "sites" : "configurationDefinitions", subjectKey: decision.destination?.key ?? (decision.suffix === "isitrust-overhead-yt" ? "isitrust" : "ownership.shared-field-definitions"), predicate: decision.predicate, status: "documented",
      value: { authority: "User clarification October 20, 2026", approvalStatus: "approved", selected: decision.selected, sourceReferences: decision.sourceReferences,
        ...(decision.destination ? { destination: decision.destination } : {}),
        ...(decision.suffix === "isitrust-overhead-yt" ? { productKeys: ["oo-professional"] } : {}),
        scope: ["waepa-qualifications", "isitrust-overhead-yt", "isitrust-atpe-restrictions"].includes(decision.suffix) ? [decision.site] : decision.suffix === "custom-consent-deferral" ? [] : activeSiteMigrationScope.sites.filter(site => site.mcrRequired).map(site => site.key),
      } as unknown as Json };
    const index = db.semanticRequirements.findIndex(row => row.key === key);
    if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
  }
}
