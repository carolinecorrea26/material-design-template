import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const waepaMembershipInterpretationKey = "business-decision.rules-review.waepa-membership-interpretation";
export function applyWaepaMembershipInterpretation(db: DatabaseSchema) {
  const authority = "User decisions October 21, 2026: remove unconditional Membership notices; keep independent Adult Child/Step-Child Associate Member entry and current child coverage rules";
  const note = db.contentValues.find(row => row.key === "site:waepa.pages.membership.infoNote");
  if (!note) throw new Error("Missing Standard WAEPA Membership notice owner");
  note.value = "";
  const key = waepaMembershipInterpretationKey;
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "membership-qualification-interpretation", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", scope: ["waepa"],
    sourceReferences: ["Attestation Online and PDF!C122", "Read & Sign!C75"],
    selected: { membershipInfoNote: "", adultChildRoute: "independent-associate-member", dependentChildRules: "preserved", noticePlacement: "review-life-and-ny-life" },
    owners: [{ table: "contentValues", key: note.key, column: "value", reviewedValue: "" }],
    destinations: [{ table: "contentValues", key: note.key, column: "value" }],
    supersededRequirementIds: ["atomic.attestation.waepa.adult-child-dependent-cap", "atomic.attestation.waepa.adult-child-dependent-request"],
    interpretation: "The approved independent Adult Child/Step-Child Associate Member applies for member coverage under the existing product eligibility and amount rules. Supersede C122's contradictory dependent 50%-of-member/spouse-icon route; preserve existing child coverage. Remove unconditional Membership copies of the accelerated-death-benefit/NY war notices; their separately approved Review Life/NY Life guards remain active.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(record => record.key === key);
  if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
