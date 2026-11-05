import type { DatabaseSchema } from "../persistence/types";
import { isRateModifierPolicy, applyRateModifiers } from "../domain/rateModifiers";
import { currentMcrSource } from "./currentMcr";
import { reviewedLookupAndLandingCodeMatches } from "./requirementCrosswalkLookupReview";
import type { CrosswalkRow } from "./requirementCrosswalk";
/** Exact leaf aliases only. A matching adoption never closes the parent cell. */
export function reviewAdoptedSourceAliases(db: DatabaseSchema, rows: CrosswalkRow[]) {
  for (const [sourceId, adoptionId] of [
    ...["membership-selector", "current-member-no-entry-form", "new-member-form", "membership-form-title", "membership-form-note", "active-federal-qualification", "active-federal-employer", "active-federal-start-date", "former-federal-no-followups", "spouse-associate-qualification", "parent-associate-qualification", "sibling-associate-qualification", "adult-child-associate-qualification", "truthfulness-acknowledgement", "unchecked-acknowledgement-error", "military-question-location", "military-yes-block"].map(suffix => [`atomic.attestation.waepa.${suffix}`, "atomic.adopted.waepa.new-member-collection"]),
    ...["member-number-optional", "active-duty-excluded"].map(suffix => [`atomic.waepa.li-group-term.${suffix}`, "atomic.adopted.waepa.new-member-collection"]),
    ...["insurance-for-hidden", "spouse-option-label", "physician-dependents", "resident-dependents", "student-retired-physician-dependents", "spouse-dependents", "spouse-physician-details"].map(suffix => [`atomic.ama.membership.${suffix}`, "atomic.adopted.ama.dependent-role-collection"]),
    ["atomic.csea.di-ltd.spouse-details", "atomic.adopted.csea.standard-spouse-fields"],
    ["atomic.csea.di-ltd.child-no-person-records", "atomic.adopted.csea.no-child-records"],
    ["atomic.attestation.isitrust.weekly-hours", "atomic.adopted.work-hours.isitrust"],
    ["atomic.attestation.waepa.weekly-hours-location", "atomic.adopted.work-hours.waepa"],
    ["atomic.abe.oo-professional.firm-size", "atomic.adopted.abe.firm-member-count"],
    ["atomic.attestation.isitrust.spouse-no-attestation", "atomic.adopted.isitrust.spouse-election-notice"],
    ["atomic.attestation.isitrust.spouse-election-notice", "atomic.adopted.isitrust.spouse-election-notice"],
    ["atomic.csea.di-ltd.spouse-amounts", "atomic.adopted.csea.optional-dependent-benefits"],
    ["atomic.csea.di-ltd.child-benefit-checkbox", "atomic.adopted.csea.optional-dependent-benefits"],
    ["atomic.csea.di-ltd.child-no-amount-selection", "atomic.adopted.csea.optional-dependent-benefits"],
    ...["disclosure", "amount", "settings", "visit-limit"].map(suffix => [`atomic.csea.di-ltd.child-benefit-${suffix}`, "atomic.adopted.csea.optional-dependent-benefits"]),
    ...["physician", "resident", "student-retired-physician", "spouse"].map(role => [`atomic.ama.membership.${role}-categories`, "coverage-review.ama.membership-category-eligibility"]),
    ["atomic.attestation.nso.nurse-type", "atomic.adopted.nso.nurse-type"],
    ["atomic.attestation.waepa-gi.military-yes-block", "coverage-review.waepa-gi.military-answer"],
    ["atomic.attestation.waepa-gi.military-no-proceed", "coverage-review.waepa-gi.military-answer"],
    ["atomic.attestation.isitrust.li-add-fencing-equestrian-cap", "atomic.adopted.isitrust.sport-member-cap.li-add"],
    ["atomic.attestation.isitrust.li-group-term-fencing-equestrian-cap", "atomic.adopted.isitrust.sport-member-cap.li-group-term"],
    ...["first-name", "last-name", "number-optional"].map(suffix => [`atomic.attestation.waepa.associate-member-${suffix}`, "atomic.adopted.waepa.associate-member-middle-initial"]),
    ["atomic.attestation.waepa.associate-member-middle-initial", "atomic.adopted.waepa.associate-member-middle-initial"],
    ["atomic.attestation.isitrust.atpe-rate-suppression", "atomic.adopted.atpe.rate-suppression"],
    ["atomic.waepa.li-group-term.phone-on-eligibility", "atomic.adopted.waepa.contact.telephone-placement"],
    ["atomic.attestation.waepa.spouse-membership-question", "atomic.adopted.waepa.dependent-spouse.question"],
    ["atomic.attestation.waepa.spouse-membership-yes-block", "atomic.adopted.waepa.dependent-spouse.yes-block"],
  ]) {
    const source = rows.find(row => row.id === sourceId), adopted = rows.find(row => row.id === adoptionId);
    if (!source || !adopted) continue;
    source.executionOwners = structuredClone(adopted.executionOwners); source.ownerCandidates = []; source.ownerResolution = adopted.ownerResolution;
    source.scope.associationKeys = [...(adopted.scope.associationKeys ?? [])]; source.scope.unresolved = [];
    source.implementationReferences = [...adopted.implementationReferences]; source.verificationReferences = [...adopted.verificationReferences];
    source.verificationStatus = adopted.verificationStatus; source.disposition = adopted.verificationStatus === "recorded-evidence" ? "reviewed-current-template-functionality" : "review-pending";
    source.finding = sourceId.endsWith("phone-on-eligibility") ? "User explicitly retained telephone on Membership under the standardized placement decision. The separately verified telephone owner supersedes the legacy Eligibility location; no duplicate field is added." : `This exact source leaf is reconciled with ${adoptionId}, including its native scope and edit-sensitive owner comparison. Other clauses in the source remain separate.`;
    if (/^atomic\.csea\.di-ltd\.child-benefit-(disclosure|amount|settings|visit-limit)$/.test(sourceId)) source.finding = "The captured CSEA child rider displays the source benefit terms: $50, under age 19, two visits per year, and the four covered outpatient settings. Rendered catalog evidence covers the disclosure. These are application benefit descriptions; no claims-visit tracking is inferred. Optional selection and the separately accepted age-note exception keep their own scope.";
    if (sourceId === "atomic.attestation.waepa.membership-form-title") { source.codeOwner = "Membership shared Additional Membership Information section title"; source.ownerResolution = "code-owned"; source.disposition = source.verificationStatus === "recorded-evidence" ? "superseded-by-user-decision" : "review-pending"; source.finding = "The new template uses its shared Additional Membership Information section title. The legacy Membership Form title does not introduce a second form. Qualification fields and source explanatory copy have separately captured owners; the user's standardized shared page structure remains in force."; }
    if (sourceId === "atomic.attestation.waepa.truthfulness-acknowledgement" || sourceId === "atomic.attestation.waepa.unchecked-acknowledgement-error") source.finding = "User explicitly confirmed established behavior: the truthfulness checkbox is required whenever New Member is selected, independently of qualification choice, and hidden for current members. Do not reopen that setup from inconsistent legacy statement numbering. Shared required-checkbox validation supplies the existing error.";
    if (sourceId === "atomic.attestation.waepa.military-question-location") source.finding = "Retain the captured shared Membership placement and always-visible military question for current/new members. The source's legacy Self Eligibility location is superseded by standardized template placement; the separate Yes disqualification remains active.";
  }
  for (const [productKey, sourceRow] of [["di-step-rated", 118], ["di-level-rated", 119]] as const) {
    const row = rows.find(row => row.id === `atomic.ama.${productKey}.nonmember-surcharge`), key = `ama.${productKey}.rate-modifier-policy`;
    if (!row) continue;
    const policy = db.configurationValues.find(value => value.key === key)?.value;
    const source = String(currentMcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === `AR${sourceRow}`)?.value ?? "");
    const matches = reviewedLookupAndLandingCodeMatches() && source.includes("annual $55") && isRateModifierPolicy(policy) && policy.rules.filter(rule => rule.when.membership === false && rule.effect.kind === "annual-fee").length === 1 && policy.rules.some(rule => rule.when.membership === false && rule.effect.kind === "annual-fee" && rule.effect.value === 55) && applyRateModifiers(policy, 1000, { membership: false, jurisdiction: "US-PA", method: "bank-account", frequency: "monthly" }).annualPremium === 1055;
    row.executionOwners = [{ table: "configurationValues", key, column: "value" }]; row.ownerCandidates = []; row.ownerResolution = "code-owned";
    row.codeOwner = "applyRateModifiers and prototypeRateRequest, with current mock lookup membership facts";
    row.implementationReferences = ["src/domain/rateModifiers.ts", "src/app/usePrototypeRates.ts", "src/domain/membershipLookup.ts"];
    row.verificationReferences = ["src/migration/reviewAndRateAcceptance.test.ts", "src/migration/membershipLookupAndLandingAdoption.test.ts"];
    row.sourceReferences = [...new Set([...row.sourceReferences, `Main!AR${sourceRow}`])];
    row.verificationStatus = matches ? "recorded-evidence" : "not-verified"; row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = matches ? "The sourced $55 annual nonmember fee is present in each native AMA Disability modifier policy and applies to the mock base using the current lookup membership fact. Member credits, state factors and synthetic base pricing remain separate; this does not certify production premium rates or the other clauses in AR." : "Source, captured annual-fee owner or verified lookup/rate code changed; repeat this bounded surcharge review.";
  }

}

/** Exact named positions in AMA's explicitly reviewed source section. */
export function reviewAmaProductOrderSource(rows: CrosswalkRow[]) {
  const adopted = rows.find(row => row.id === "atomic.adopted.ama.source-product-order");
  if (!adopted) return;
  const products: Record<string, string[]> = { A27: ["li-20yr"], A28: ["li-15yr"], A29: ["li-10yr"], A30: ["li-term"], A31: ["li-preferred"], A32: ["li-premier-accident"], A34: ["di-step-rated", "di-level-rated"], A35: ["oo-office-overhead"], A37: ["sh-hospital-income"] };
  for (const row of rows.filter(row => row.kind === "source-clause" && row.sourceReferences[0]?.startsWith("Order of Products Across Site!"))) {
    const key = row.sourceReferences[0].split("!")[1]; if (!products[key]) continue;
    row.area = "Coverage"; row.atomization = "reviewed"; row.scope.siteKeys = ["ama"]; row.scope.productKeys = products[key]; row.scope.unresolved = [];
    row.scope.basis = "Exact named position in the bounded AMA A25:A37 source section, validated by the source adoption and user decision. Other product-order sections keep their own scope.";
    row.executionOwners = structuredClone(adopted.executionOwners); row.ownerCandidates = []; row.ownerResolution = adopted.ownerResolution;
    row.implementationReferences = [...adopted.implementationReferences]; row.verificationReferences = [...adopted.verificationReferences]; row.verificationStatus = adopted.verificationStatus;
    row.disposition = adopted.verificationStatus === "recorded-evidence" ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = "Reviewed AMA product order: this named position maps to the captured optional client order. Shared presentation keeps category ordering and featured URL precedence separate. Existing Step/Level cards remain distinct; other source clauses are not inherited.";
  }
}
