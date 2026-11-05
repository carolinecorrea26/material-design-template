import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";
import { resolveEffectiveSite } from "../domain/effectiveSite";

const evidence: Record<string, string> = {
  "src/app/sections/ConfiguredMembershipHelp.tsx": "d6df8ebefc8a49c5c39be6fcc9d808341dd7367816c8fe0fd36c091aef2c7f5b",
  "src/components/membership/MembershipHelp.tsx": "03fae721ff1aa71c07f7e41e734396c25089b9861f3c327367a987f03cb0236b",
  "src/app/sections/ConfiguredEligibilitySections.tsx": "2e7733155e98410fdeb20012f370dabe4692e80e93c5285048fa0164175d048d",
  "src/components/eligibility/EligibilitySections.tsx": "f63eb1c61945367271323afb0b3538ff3f64146e7afffa7c63addfe7b2348dfb",
  "src/components/standaloneSections.test.tsx": "62dbc5b335825b62cdf70b324c786a3b0d1aee27f52b31ee8b9a1802dacdfdf1",

  "src/pages/Membership.tsx": "52eb267e2b19468da2760dba327e74d3ccf1e457f58a2b0aa1610da86f3a34d4",
  "src/config/clientFields/getClientPageFields.ts": "e5ec338bf8203e8fd6e8862f96107ef66e383667316a56c5b89a1305191592d1",
  "src/config/clientFields/membershipFollowUpVisibility.ts": "f0cf14ef8568286a4d8f7963fc9665a1522b3b6223bd7335ebddd164f0b4d8cb",
  "src/config/fields/resolvedFieldRegistry.ts": "39be0361bffcaf25aadc474948efd2da7005a759444c0d84e8d4fbb9d45c3cc3",
  "src/domain/effectiveConfiguration.ts": "643059204c92644dadf272c5a061355cd04199356ff0b52f311dcb6c7fe88efe",
  "src/domain/fieldDefinitionOwnership.ts": "0f0a7525ec7dff56f0b2a3a8d780c1c183a0e548adf507c2fdc8a60baa50ae49",
  "src/utils/fieldValidation.ts": "e482e3b197dcfc2354e436b386e4d99ef67fba90380be0ed3d69759324dbdb75",
  "src/pages/Membership.basicCollection.test.tsx": "ab7334783be253e225a29207a47029ee77311df46f6a4c1437a327a5425deeeb",
  "src/migration/sources/mcr-v78.json": "a93cb29e6ed20aa05b67e3bf22bb4554baf3a58ebf5d1df7b539a5466a49471a",
  "src/pages/Eligibility.tsx": "b43c2cd89a8a7e400318e8ea87458366306511d13b1c4602490864992029769b",
  "src/config/pageSections/getPageSections.ts": "40233410cd8a87cee592e0fec93fec715ea2ea8ebb5c2cb87ef79bba0f61974b",
  "src/migration/cseaDependentCollectionDecision.test.tsx": "7ef76c7b3ef77af5ffd1ddff0be2335e02478c0b0cdddaec9f6aed55fccf89ff",
  "src/migration/amaDependentCollectionAdoption.ts": "b6b67a848ddada791b6f19b45c7bd41a0e4369b5060fb32efddbbfcf73913bbd",
  "src/migration/amaDependentCollectionAdoption.test.tsx": "01d03acc2b9da6cf0ec57015173280c105a4eb09b49284b41b2ec51e2b14c196",
  "src/config/conditions/evaluateConditions.ts": "9b4e3daf4c5858e8893d7788b415e69124b796d591479d5176e79cd1429ab3f6",
  "src/config/conditions/resolveVisibility.ts": "1ec4566ddc2d43439d5904159febd6e61835ebf9a44a9262a10f4a1381525232",
  "src/migration/waepaMembershipCollectionReview.ts": "d9937118c4ca27e2c4cb852abbaecc51c27814484063f81723e13cca98634aaf",
  "src/migration/waepaMembershipCollectionReview.test.tsx": "8d57d6aa46c5190a7671007e577ba0b3b88256ec11a8c9250f0de1f9b8a0c88d",
  "src/migration/mcrReviewDecisions.test.ts": "4e70a164851b61fb01941b45a176951da52eec5c0546c287e270be917cd1cd51",
  "src/pages/Membership.test.tsx": "97576da1621b04ae1f596fcfcb82844ffb87509edc0dbe52d9156d3697470a84",
  "src/domain/membershipQualifications.ts": "c2d6cd387a5425c4414a6810e0c2fd38ce7691e37a7acc1273793afdaa2a9cc3",
  "src/domain/applicantExperience.ts": "3e5598f13e9cdd8db95035adb847ceced7fedf1518cb2bc81f204d6f20939747"
};
export function reviewedMembershipBasicsCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence).length > 0 && Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}

/** Existing collection only: exact fields/labels, explicit Site provenance and
 * the shared Yes/No gate. No parent Attestation/Main cell is adopted here. */
export function reviewMembershipBasics(db: DatabaseSchema, rows: CrosswalkRow[]) {
  const codeMatches = reviewedMembershipBasicsCodeMatches();
  const sites = new Map<string, ReturnType<typeof resolveEffectiveSite>>();
  const site = (key: string) => { if (!sites.has(key)) sites.set(key, resolveEffectiveSite(db, key)); return sites.get(key)!; };
  const specs = [
    { id: "atomic.attestation.abe.member-question", site: "abe", page: "membership", field: "membership", label: "Are you an active member of a State, Local, or Specialty Bar Association?" },
    { id: "atomic.attestation.abe.spouse-question", site: "abe", page: "eligibility", field: "spouse-membership", label: "Is your spouse also an active member of a State, Local, or Specialty Bar Association?" },
    { id: "atomic.attestation.asce.member-question", site: "asce", page: "membership", field: "membership", label: "Are you a member of the American Society of Civil Engineers?" },
    { id: "atomic.attestation.asce.spouse-question", site: "asce", page: "eligibility", field: "spouse-membership", label: "Is your spouse also an active member?" },
    { id: "atomic.attestation.avma.membership-question", site: "avma", page: "membership", field: "membership", label: "Are you a member of the American Veterinary Medical Association?" },
    { id: "atomic.attestation.nso.nurse-question", site: "nso", page: "membership", field: "membership", label: "Are you a nurse?" },
    ...["membership-gate", "duties-gate"].map(suffix => ({ id: `atomic.csea.di-ltd.${suffix}`, site: "csea", page: "membership", field: "membership", label: "Are you a member of the CSEA and presently performing all the duties of your occupation according to your regular schedule?" })),
    { id: "atomic.csea.di-ltd.occupation-class", site: "csea", page: "membership", field: "csea-occupation-group", label: "Are you solely engaged in office or clerical work?" },
    { id: "atomic.attestation.avma.graduation-year", site: "avma", page: "membership", field: "avma-graduation-year", label: "Year of Graduation" },
    { id: "atomic.attestation.avma.occupation", site: "avma", page: "membership", field: "avma-occupation", label: "Occupation" },
  ];
  for (const spec of specs) {
    const row = rows.find(row => row.id === spec.id); if (!row) continue;
    const page = site(spec.site).configuration.pages.find(page => page.key === spec.page);
    const field = page?.fields.find(field => field.key === spec.field);
    const f = field?.definition;
    const choices = spec.field === "csea-occupation-group" ? [{ label: "Yes (Group 1 Clerical)", value: "group-1-clerical" }, { label: "No (Group 2 Non-Clerical)", value: "group-2-non-clerical" }] : [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
    const matches = codeMatches && page?.requirement !== "none" && field?.included === true && f?.required === true && f.label === spec.label && !f.visibilityConditionId && (spec.field.startsWith("avma-") ? f.inputType === "text" && (spec.field !== "avma-occupation" || f.helperText === "Please specify type of practice or other occupation if not practicing.") : f.inputType === "radio" && JSON.stringify(f.options) === JSON.stringify(choices));
    row.executionOwners = [...(field?.provenance ?? []), ...(page?.provenance ?? [])].map(({ table, key }) => ({ table, key }));
    row.ownerCandidates = []; row.ownerResolution = "recorded-review"; row.verificationStatus = matches ? "recorded-evidence" : "not-verified"; row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.scope.unresolved = []; row.implementationReferences = ["src/pages/Membership.tsx", "src/config/clientFields/getClientPageFields.ts", "src/config/clientFields/membershipFollowUpVisibility.ts", "src/utils/fieldValidation.ts"];
    row.verificationReferences = ["src/pages/Membership.basicCollection.test.tsx"];
    row.finding = matches ? spec.site === "csea" && spec.field === "membership" ? "Existing combined CSEA question requires Yes to membership AND regular occupation duties. No blocks advancement. Both source predicates retain separate atoms and share this captured collection/gate; occupation class and attached benefits remain separate." : "Exact existing field label, requiredness, choices and explicit Site/page provenance match this source leaf. Rendered Yes/No gating and member-only follow-ups have bounded evidence. Shared standardized placement does not duplicate legacy fields or accept other instructions in this cell." : "Membership field, Site assignment or implementation/test evidence changed; repeat this bounded collection review.";
  }
  const abePage = site("abe").configuration.pages.find(page => page.key === "membership");
  const noRequiredId = codeMatches && abePage?.requirement !== "none" && !abePage?.fields.some(field => field.included && field.definition.required && /member(?:ship)?\s*(?:id|number)/i.test(field.definition.label));
  for (const row of rows.filter(row => /^atomic\.abe\.[^.]+\.membership-id-optional$/.test(row.id))) {
    row.executionOwners = [...(abePage?.provenance ?? []), ...(abePage?.fields.flatMap(field => field.provenance) ?? [])].map(({ table, key }) => ({ table, key })).filter((ref, index, refs) => refs.findIndex(other => other.table === ref.table && other.key === ref.key) === index);
    row.ownerCandidates = []; row.ownerResolution = "code-owned"; row.codeOwner = "Membership and effective captured Membership field assignments";
    row.verificationStatus = noRequiredId ? "recorded-evidence" : "not-verified"; row.disposition = noRequiredId ? "reviewed-current-template-functionality" : "review-pending";
    row.implementationReferences = ["src/pages/Membership.tsx", "src/config/clientFields/getClientPageFields.ts"];
    row.verificationReferences = ["src/pages/Membership.basicCollection.test.tsx"];
    row.finding = noRequiredId ? "ABE does not collect a required Membership ID in the shared Membership step. This satisfies the source's optional/not-required instruction for each listed product; it does not invent an optional ID field or change the required membership attestation." : "ABE now has required Membership ID collection or the reviewed code changed; reconcile this source leaf again.";
  }
  const cseaPage = site("csea").configuration.pages.find(page => page.key === "eligibility");
  const names = ["spouse-first-name", "spouse-last-name", "spouse-birth-date"];
  const spouseMatches = names.every(key => cseaPage?.fields.some(field => field.key === key && field.included && field.definition.required)) && !cseaPage?.fields.some(field => field.included && ["spouse-title", "spouse-middle-initial", "spouse-suffix"].includes(field.key));
  const childExperience = db.configurationValues.find(row => row.key === "csea.applicant-experience")?.value as { childEligibility?: { mode?: string } } | undefined;
  for (const row of rows.filter(row => ["atomic.adopted.csea.standard-spouse-fields", "atomic.adopted.csea.no-child-records"].includes(row.id))) if (!codeMatches || row.verificationStatus !== "recorded-evidence" || (row.id.endsWith("standard-spouse-fields") ? !spouseMatches : childExperience?.childEligibility?.mode !== "notice-only")) {
    row.verificationStatus = "not-verified"; row.disposition = "review-pending"; row.finding = "CSEA dependent collection settings, effective fields or rendered/test evidence changed; repeat this bounded review.";
  }
  const ama = rows.find(row => row.id === "atomic.adopted.ama.dependent-role-collection");
  const amaPages = site("ama").configuration.pages.filter(page => ["membership", "eligibility"].includes(page.key));
  const noDuplicateInsuranceFor = !amaPages.some(page => page.fields.some(field => field.included && /this insurance is for/i.test(field.definition.label)));
  const physicianFieldsIncluded = ["ama-physician-type", "ama-physician-first-name", "ama-physician-last-name", "ama-physician-birth-date", "ama-physician-email"].every(key => amaPages.some(page => page.key === "membership" && page.fields.some(field => field.key === key && field.included && field.definition.visibilityConditionId === "condition-membership-ama-spouse")));
  if (ama && (!codeMatches || !noDuplicateInsuranceFor || !physicianFieldsIncluded)) { ama.verificationStatus = "not-verified"; ama.disposition = "review-pending"; ama.finding = "AMA source dependent collection or effective physician fields changed; repeat the bounded role/placement review."; }
}
