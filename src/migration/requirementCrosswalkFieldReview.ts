import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";
import { resolveSnapshotSite as resolveEffectiveSite } from "../domain/effectiveSite";
import { standardizedPlacementDecisionKey } from "./standardizedPlacementDecision";

/** A bounded existing-behavior review, not whole-cell adoption. Native field
 * requiredness, page placement and effective Site overrides are inspected. */
export function reviewSsnCollectionRequirements(db: DatabaseSchema, rows: CrosswalkRow[]) {
  for (const siteKey of ["abe", "waepa"]) {
    const site = resolveEffectiveSite(db, siteKey);
    const page = site.configuration.pages.find(page => page.key === "profile");
    const field = page?.fields.find(field => field.key === "social-security-number");
    const matches = page?.requirement !== "none" && field?.included === true && field.definition.required === true && field.definition.format === "ssn" && !field.definition.visibilityConditionId;
    const owners = [...(field?.provenance ?? []), ...(page?.provenance ?? [])].map(({ table, key }) => ({ table, key }));
    for (const row of rows.filter(row => row.kind === "source-requirement" && row.scope.siteKeys.join() === siteKey && row.id.endsWith(".ssn-required"))) {
      row.executionOwners = owners;
      row.ownerCandidates = [];
      row.ownerResolution = "recorded-review";
      row.implementationReferences = ["src/domain/effectiveConfiguration.ts", "src/config/clientFields/getClientPageFields.ts", "src/pages/Profile.tsx", "src/utils/fieldValidation.ts"];
      row.verificationReferences = ["src/migration/profileCollectionReview.test.ts", "src/utils/fieldValidation.test.ts"];
      row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
      row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
      row.finding = matches ? "Source-required member SSN matches the reusable captured field, required Profile assignment and effective Site overrides. Shared form validation rejects missing or malformed SSNs. No new collection or whole-cell adoption is inferred." : "The required SSN field/format/Profile assignment changed; re-review the effective collection before accepting this requirement.";
    }
  }
}

export function reviewAbeEmailPlacement(db: DatabaseSchema, rows: CrosswalkRow[]) {
  const page = resolveEffectiveSite(db, "abe").configuration.pages.find(page => page.key === "membership");
  const field = page?.fields.find(field => field.key === "email");
  const matches = db.semanticRequirements.some(row => row.key === standardizedPlacementDecisionKey) && page?.requirement !== "none" && field?.included === true && field.definition.required === true && field.definition.format === "email" && !field.definition.visibilityConditionId;
  for (const row of rows.filter(row => row.scope.siteKeys.join() === "abe" && /\.(?:contact|eligibility)-email-required$/.test(row.id))) {
    row.executionOwners = [...(field?.provenance ?? []), ...(page?.provenance ?? [])].map(({ table, key }) => ({ table, key }));
    row.ownerCandidates = []; row.ownerResolution = "recorded-review";
    row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = "User explicitly retained required ABE email on Membership. Shared field/page placement is standardized across clients; legacy Eligibility/Contact duplication is superseded. Substantive required email collection remains in force.";
    row.sourceReferences.push("User clarification October 20, 2026: standardized shared-field placement");
    row.implementationReferences = ["src/pages/Membership.tsx", "src/config/clientFields/getClientPageFields.ts", "src/utils/fieldValidation.ts"];
    row.verificationReferences = ["src/migration/profileCollectionReview.test.ts"];
  }
}
