import type { CrosswalkRow } from "./requirementCrosswalk";
import { reviewedMembershipBasicsCodeMatches } from "./requirementCrosswalkMembershipReview";

/** Explicit clause-to-atom review. Clause numbers are tied to the pinned full
 * current source, including line guards; they are not a nearby-label heuristic. */
const specs: Array<{ cell: string; clauses: number[]; atoms: string[]; guard?: string; superseded?: boolean }> = [];
const add = (cell: string, clauses: number[], atoms: string[], guard?: string, superseded?: boolean) => specs.push({ cell, clauses, atoms, guard, superseded });
add("C3", [3], ["atomic.ama.membership.insurance-for-hidden"]);
add("C3", [5], ["atomic.ama.membership.spouse-option-label"]);
for (const [role, categoryClauses, dependentClauses, guard] of [
  ["physician", [9, 10, 11], [12, 13], "C3 clauses 7–9: applicant selected Physician"],
  ["resident", [15, 16, 17], [18, 19], "C3 clauses 7,15: applicant selected Resident"],
  ["student-retired-physician", [21, 22, 23], [24, 25], "C3 clauses 7,21: applicant selected Student / Retired Physician"],
  ["spouse", [27, 28, 29], [30, 31, 32], "C3 clauses 7,27: applicant selected Spouse"],
] as const) {
  add("C3", [...categoryClauses], [`atomic.ama.membership.${role}-categories`], guard);
  add("C3", [...dependentClauses], [`atomic.ama.membership.${role}-dependents`, ...(role === "spouse" ? ["atomic.ama.membership.spouse-physician-details"] : [])], guard);
}
add("C3", [7], ["atomic.adopted.ama.dependent-role-collection"], "Root role guard retained in each role-specific clause mapping");
add("C3", [34, 35], ["atomic.ama.membership.di-rate-choice-show"], "Legacy Membership selector; source URL guard remains literal", true);
add("C3", [36, 37], ["atomic.ama.membership.di-rate-choice-tooltip"], "Selector-only tooltip; separate Coverage card choices supersede it", true);
add("C3", [38], ["atomic.ama.membership.di-step-selection"]);
add("C3", [39], ["atomic.ama.membership.di-level-selection"]);
add("C3", [41, 42], ["atomic.ama.membership.di-single-url-hide-choice"], "Single-DI prods guard; approved template omits the duplicate selector", true);
add("C3", [43], ["atomic.ama.membership.di-single-url-product"]);
add("C7", [1], ["atomic.attestation.abe.member-question"]);
add("C7", [2], ["atomic.attestation.abe.spouse-question"]);
add("C9", [1], ["atomic.attestation.asce.member-question"]);
add("C9", [2], ["atomic.attestation.asce.spouse-question"]);
add("C38", [1, 2], ["atomic.attestation.avma.membership-question"]);
add("D38", [1], ["atomic.attestation.avma.graduation-year", "atomic.attestation.avma.occupation", "atomic.adopted.avma.college-text"], "Member-only guard applies to D38 clauses 2–4; approved college list remains deferred");
add("D38", [3], ["atomic.attestation.avma.graduation-year"], "D38 clause 1: If Member");
add("D38", [4], ["atomic.attestation.avma.occupation"], "D38 clause 1: If Member");
add("C98", [1], ["atomic.attestation.nso.nurse-question"]);
add("D98", [1, 2, 3, 4, 5], ["atomic.adopted.nso.nurse-type"], "Existing nurse Yes gate; D98 explicitly supplies RN/LPN/Other Nurse Professional Type");
add("C86", [3], ["atomic.attestation.isitrust.association-selector", "atomic.attestation.isitrust.atpe-rate-suppression"], "Member selector and its parenthetical ATPE-only rate suppression are separate atoms; neither implies a cap or hours policy");
add("C86", [4, 5, 6], ["atomic.attestation.isitrust.li-add-fencing-equestrian-cap"], "USA Fencing and US Equestrian Federation; member AD&D G-31132-0 only");
add("C86", [7, 8, 9], ["atomic.attestation.isitrust.li-group-term-fencing-equestrian-cap"], "USA Fencing and US Equestrian Federation; member Group Term G-31136-0 only");
add("C86", [11], ["atomic.adopted.work-hours.isitrust"], "User clarified DI/OO Coverage collection supersedes unconditional Membership placement; product minimums remain separate", true);
add("C86", [13, 14, 15], ["atomic.adopted.isitrust.spouse-election-notice"], "Visible spouse Eligibility section; informational notice only, without cross-application enrollment enforcement");
add("C69", [1, 2], ["atomic.csea.di-ltd.membership-gate"], "Captured combined membership/duties Yes gate; the standard combined control preserves both predicates");
add("C69", [3, 4], ["atomic.csea.di-ltd.duties-gate"], "Captured combined membership/duties Yes gate; No to either predicate prevents continuation");
add("C69", [5], ["atomic.csea.di-ltd.occupation-class", "atomic.csea.di-ltd.spouse-details"], "Separate clerical classification and spouse-selected collection atoms; the latter applies only when the spouse is selected");
add("C69", [6], ["atomic.adopted.csea.standard-spouse-fields"], "User retains standard First Name/Last Name/DOB; legacy title, MI and suffix are superseded", true);
add("C69", [7], ["atomic.csea.di-ltd.spouse-amounts"], "Captured optional spouse Accident Disability rider; member's CSEA DI selection remains the prerequisite");
add("C69", [9], ["atomic.csea.di-ltd.child-benefit-checkbox"], "Attached optional child benefit; individual child records remain separate");
add("C69", [10], ["atomic.csea.di-ltd.child-no-amount-selection"], "Attached fixed child benefit has no applicant-entered amount");
add("C69", [11], ["atomic.csea.di-ltd.child-benefit-disclosure", "atomic.csea.di-ltd.child-benefit-amount", "atomic.csea.di-ltd.child-benefit-settings"], "Application benefit description only; actual claims processing is outside the prototype");
add("C69", [12], ["atomic.csea.di-ltd.child-benefit-visit-limit"], "Source two-visit disclosure; no claims-history enforcement is inferred");
add("C122", [1], ["atomic.adopted.waepa.membership-notice-cleanup"], "User removed unconditional top-of-Membership notices; scoped Review notices remain separate", true);
add("C122", [4, 5], ["atomic.attestation.waepa.membership-selector"]);
add("C122", [7], ["atomic.attestation.waepa.current-member-no-entry-form"], "Current Member hides only the new-member form; shared identity/contact/military collection remains");
add("C122", [8], ["atomic.attestation.waepa.new-member-form"], "New Member displays the approved qualification/declaration form");
add("C122", [10], ["atomic.attestation.waepa.membership-form-title"], "Standard shared Additional Membership Information title supersedes the legacy second-form title", true);
add("C122", [11, 12, 13], ["atomic.attestation.waepa.membership-form-note"], "Note belongs inside the new-member qualification form; top-level notice cleanup does not suppress it");
add("C122", [15, 16], ["atomic.attestation.waepa.active-federal-qualification"], "The sentence spans clauses 15–16; both retain the active federal employee qualification guard");
add("C122", [17], ["atomic.attestation.waepa.active-federal-employer", "atomic.attestation.waepa.active-federal-start-date"], "New Member AND active federal employee; employer and start date are separate required fields");
add("C122", [18], ["atomic.attestation.waepa.former-federal-no-followups"]);
for (const [number, suffix] of [[19, "spouse"], [20, "parent"], [21, "sibling"], [24, "adult-child"]] as const) add("C122", [number], [`atomic.attestation.waepa.${suffix}-associate-qualification`], "New Member; the six user-approved qualifications supersede inconsistent source numbering");
add("C122", [22], ["atomic.adopted.waepa.associate-member-middle-initial"], "Each approved Associate Member qualification collects the reference member; the native notice uses the appropriate relationship, rather than calling every reference person a spouse");
add("C122", [23], ["atomic.attestation.waepa.associate-member-first-name", "atomic.attestation.waepa.associate-member-last-name", "atomic.attestation.waepa.associate-member-number-optional", "atomic.attestation.waepa.associate-member-middle-initial"], "New Associate Member reference details; applicant's own name remains separate");
add("C122", [25, 26, 27, 28], ["atomic.adopted.waepa.new-member-collection"], "User retains independent Adult Child/Step-Child Associate Member entry; the contradictory dependent 50%/spouse-icon/block route is superseded", true);
add("C122", [29, 30, 31, 32], ["atomic.attestation.waepa.truthfulness-acknowledgement", "atomic.attestation.waepa.unchecked-acknowledgement-error"], "User confirmed required declaration for every New Member, independent of qualification, hidden for Current Member; supersedes inconsistent Statement 4 applicability");
add("C122", [33, 34, 35], ["atomic.attestation.waepa.military-question-location"], "Standard Membership placement supersedes legacy Self Eligibility location; current/new visibility and Yes restriction are preserved", true);
add("C122", [36], ["atomic.attestation.waepa.military-yes-block"], "Military Yes prevents continuation; independent of qualification choice");
add("C122", [37, 38], ["atomic.adopted.work-hours.waepa"], "User restricts Standard WAEPA work-hour collection to selected DI on Coverage; unconditional Self Eligibility placement is superseded", true);
add("C122", [40, 41], ["atomic.attestation.waepa.spouse-membership-question"], "Selected dependent spouse only; independent Associate Member entry remains separate");
add("C122", [42], ["atomic.attestation.waepa.spouse-membership-yes-block"], "Selected dependent spouse Yes blocks this application role; no cross-application enforcement is inferred");
const structural: Record<string, number[]> = { C3: [1, 2, 4, 6, 8, 14, 20, 26, 33, 40], C86: [1, 2, 10, 12], C122: [2, 3, 6, 9, 14, 39] };

export function reviewAttestationSourceLeaves(rows: CrosswalkRow[]) {
  const codeMatches = reviewedMembershipBasicsCodeMatches();
  for (const spec of specs) {
    const atoms = spec.atoms.map(id => rows.find(row => row.id === id));
    const matches = codeMatches && atoms.every(atom => atom?.verificationStatus === "recorded-evidence");
    for (const number of spec.clauses) {
      const row = rows.find(row => row.id === `requirement.mcr.attestation-online-and-pdf.${spec.cell}.${number}`);
      if (!row) continue;
      row.atomization = "reviewed"; row.scope.unresolved = [];
      row.executionOwners = atoms.flatMap(atom => atom?.executionOwners ?? []).filter((ref, index, refs) => refs.findIndex(other => other.table === ref.table && other.key === ref.key && other.column === ref.column) === index);
      row.ownerCandidates = []; row.ownerResolution = "recorded-review";
      row.implementationReferences = [...new Set(atoms.flatMap(atom => atom?.implementationReferences ?? []))];
      row.verificationReferences = [...new Set(atoms.flatMap(atom => atom?.verificationReferences ?? []))];
      row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
      row.disposition = matches ? spec.superseded ? "superseded-by-user-decision" : "reviewed-current-template-functionality" : "review-pending";
      if (spec.superseded) row.codeOwner = "Shared Membership structure and separate native Coverage choices under the approved template interpretation";
      row.context = `Reviewed exact leaf mapping: ${spec.atoms.join(", ")}. Guard: ${spec.guard ?? "Exact dedicated Site question; other clauses retain separate scope"}. Full original cell and offsets remain in sourceCells/clauseSpans.`;
      row.finding = "Reviewed attestation source leaf: this clause is reconciled only with the named, separately verified atomic requirements and explicit guard. Source numbering, other fields, output modes and adjacent client variants do not inherit this review.";
    }
  }
  for (const [cell, numbers] of Object.entries(structural)) for (const number of numbers) {
    const row = rows.find(row => row.id === `requirement.mcr.attestation-online-and-pdf.${cell}.${number}`); if (!row) continue;
    row.atomization = "reviewed"; row.executionOwners = []; row.ownerCandidates = []; row.ownerResolution = "recorded-review";
    row.verificationStatus = codeMatches ? "recorded-evidence" : "not-verified"; row.disposition = codeMatches ? "source-reference" : "review-pending";
    row.scope.unresolved = []; row.implementationReferences = []; row.verificationReferences = ["src/migration/requirementCrosswalk.test.ts"];
    row.finding = "Reviewed attestation structural marker: this is a Rules heading, list number or letter. It has no independent runtime instruction. The actual role and URL guards and their behavioral clauses have separate explicit mappings; source text/offsets are preserved.";
  }
}
