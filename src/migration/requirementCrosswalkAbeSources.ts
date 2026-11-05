import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { DatabaseSchema } from "../persistence/types";
import { requirementClauses } from "./requirementCrosswalk";
import { sharedTobaccoOptionsDecisionKey } from "./sharedTobaccoOptionsDecision";
import type { buildRequirementCrosswalk, CrosswalkRow } from "./requirementCrosswalk";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { currentMcrSource } from "./currentMcr";
import { standardizedPlacementDecisionKey } from "./standardizedPlacementDecision";
import { externalQdQuestionnaireDecisionKey } from "./externalQdQuestionnaireDecision";
import { abeProcessingDecisionKey } from "./abeProcessingAdoption";
import evidence from "../../docs/project-review/step1-abe-source-review-evidence.json";
type Report = ReturnType<typeof buildRequirementCrosswalk>;
type Owner = { table: string; key: string };
export const abeSourceReviewFiles = ["src/migration/abeProcessingAdoption.ts", "src/migration/abeProcessingAdoption.test.ts", "src/domain/quickDecisionPolicy.ts", "src/domain/coverageJourneyPolicy.ts", "src/domain/coverageJourney.ts", "src/domain/coveragePortfolio.ts", "src/domain/portfolioHealthParticipation.ts", "src/app/useCoverageState.ts", "src/domain/reviewPolicy.ts", "src/pages/Review.tsx", "src/pages/Review.consent.test.tsx", "src/migration/requirementCrosswalkAbeSources.ts", "src/migration/abeSourceReview.test.ts", "src/migration/sources/mcr-v78.json", "src/migration/activeSiteScope.ts", "src/domain/effectiveSite.ts", "src/domain/effectiveConfiguration.ts", "src/domain/coverageJourneyUnderwriting.ts", "src/domain/coverageSelectionPolicy.ts", "src/domain/residencyPolicy.ts", "src/domain/coverageRuntime.ts", "src/domain/prototypeProductProjection.ts", "src/pages/Eligibility.tsx", "src/pages/Membership.tsx", "src/config/clientFields/getClientPageFields.ts", "src/utils/fieldValidation.ts", "src/migration/requirementCrosswalkFieldReview.ts", "src/migration/requirementCrosswalkMembershipReview.ts", "src/migration/requirementCrosswalkAbeReview.ts", "src/migration/externalQdQuestionnaireDecision.ts", "src/migration/standardizedPlacementDecision.ts", "src/migration/sharedTobaccoOptionsDecision.ts", "src/migration/sharedTobaccoOptionsDecision.test.ts", "src/config/fields/tobaccoProductOptions.ts", "src/config/fields/index.ts", "src/domain/applicantExperience.ts", "src/migration/abeCirQuestionnaireAdoption.ts", "src/migration/abeCirQuestionnaireAdoption.test.ts", "src/pages/HealthCir.tsx", "src/pages/HealthCir.test.tsx", "src/domain/configuredHealthQuestionnaire.ts", "src/config/flowGates.ts", "src/config/healthFollowUps.ts"];
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const unique = (owners: Owner[]) => owners.filter((owner, index) => owners.findIndex(other => owner.table === other.table && owner.key === other.key) === index);
export function abeSourceOwnerSnapshot(db: DatabaseSchema) {
  const site = resolveEffectiveSite(db, "abe");
  return { pages: site.configuration.pages.filter(page => ["membership", "eligibility", "profile", "contact", "review", "coverage"].includes(page.key)),
    reviewPolicies: site.configuration.reviewPolicies,
    healthQuestionnaires: site.configuration.healthQuestionnairePolicies,
    products: site.configuration.products.map(product => ({ productKey: product.productKey, applicants: product.applicantRules, selection: product.selectionPolicies, riders: product.riders, residency: product.residencyPolicies, journeys: product.journeyPolicies, eligibilityFacts: product.eligibilityFacts })),
    eligibility: site.products, lifeAggregates: site.configuration.lifeAggregates,
    definitions: db.configurationDefinitions.filter(row => ["product-selection-policy", "product-coverage-journey", "product-residency-policy"].includes(row.definition.target?.kind ?? "") && db.configurationValues.some(value => value.configurationKey === row.key && value.siteKey === "abe")),
    decisions: db.semanticRequirements.filter(row => row.subjectKey === "abe" && ["provisional-source-decision", "approved-business-decision"].includes(row.domain) || [standardizedPlacementDecisionKey, externalQdQuestionnaireDecisionKey, sharedTobaccoOptionsDecisionKey].includes(row.key)),
  };
}
export function captureAbeSourceEvidence(db: DatabaseSchema) {
  return { reviewedOn: "2026-10-23", scope: "ABE source applicability, collection, residency, rider, medical participation, approved v78 QD processing, inline CI attestation and supplied CHR questionnaire review. Accepted provisional exceptions remain explicitly labelled.", files: Object.fromEntries(abeSourceReviewFiles.map(path => [path, createHash("sha256").update(readFileSync(path)).digest("hex")])), native: hash(abeSourceOwnerSnapshot(db)) };
}
export function abeSourceReviewMatches(db: DatabaseSchema) {
  const files = evidence.files as Record<string, string>;
  return abeSourceReviewFiles.every(path => files[path] === createHash("sha256").update(readFileSync(path)).digest("hex")) && hash(abeSourceOwnerSnapshot(db)) === evidence.native;
}
export function reviewAbeSourceFollowThrough(db: DatabaseSchema, report: Report) {
  const site = resolveEffectiveSite(db, "abe"), matches = abeSourceReviewMatches(db);
  const source = (sheet: string, cell: string) => String(currentMcrSource.cells.find(row => row.sheet === sheet && row.cell === cell)?.value ?? "");
  const raw = (key: string): Owner[] => db.semanticRequirements.some(row => row.key === key) ? [{ table: "semanticRequirements", key }] : [];
  const provenance = (rows: Array<{ provenance: Owner[] }>) => rows.flatMap(row => row.provenance.map(({ table, key }) => ({ table, key })));
  const policyOwners = (values: Array<{ key: string; provenance: Owner[] }>) => unique([...provenance(values), ...db.configurationValues.filter(value => values.some(row => row.provenance.some(owner => owner.table === "configurationValues" && owner.key === value.key))).map(value => ({ table: "configurationDefinitions", key: value.configurationKey }))]);
  const pageOwners = (pageKey: string, fieldKeys?: string[]) => { const page = site.configuration.pages.find(page => page.key === pageKey)!; return unique([...page.provenance, ...page.fields.filter(field => !fieldKeys || fieldKeys.includes(field.key)).flatMap(field => field.provenance)].map(({ table, key }) => ({ table, key }))); };
  const records: Array<{ requirementId: string; sourceReferences: string[]; sourceText: string; fullCellContext: string; productKey: string | null; applicantKey: string | null; kind: string; disposition: string; status: string; owners: Owner[]; linkedRequirementIds: string[]; finding: string; verificationReferences: string[] }> = [];
  function emit(row: CrosswalkRow, kind: string, disposition: string, owners: Owner[], finding: string, linkedRequirementIds: string[] = [], nativeMatches = true) {
    const linked = linkedRequirementIds.map(id => report.requirements.find(row => row.id === id));
    const linksMatch = linked.every(row => row && (row.verificationStatus === "recorded-evidence" || row.disposition === "deferred"));
    const okay = matches && nativeMatches && linksMatch;
    records.push({ requirementId: row.id, sourceReferences: row.sourceReferences, sourceText: row.expectedBehavior, fullCellContext: source(...row.sourceReferences[0].split("!") as [string, string]), productKey: row.scope.productKeys[0] ?? null, applicantKey: row.scope.applicantKeys[0] ?? null, kind, disposition, status: okay ? "recorded-evidence" : "reverification-required", owners: unique(owners), linkedRequirementIds, finding, verificationReferences: ["src/migration/abeSourceReview.test.ts", ...linked.flatMap(row => row?.verificationReferences ?? [])] });
  }
  for (const row of report.requirements.filter(row => row.kind === "source-clause" && (row.scope.siteKeys.join() === "abe" || /^Smoker Question![ABC]20$/.test(row.sourceReferences[0])))) {
    if (/^Smoker Question![ABC]20$/.test(row.sourceReferences[0])) {
      emit(row, "smoker-question-and-shared-options", "reviewed-current-template", [...pageOwners("coverage", ["smoker", "spouse-smoker", "tobacco-last-used", "spouse-tobacco-last-used", "tobacco-products", "spouse-tobacco-products"]), ...raw(sharedTobaccoOptionsDecisionKey), ...raw(externalQdQuestionnaireDecisionKey)], "A20 explicitly identifies ABE and GMA-JI-L. Member/spouse retain the existing mutually exclusive Yes/No question. Yes reveals the date and multi-select product followups. The user approved the exact twelve source choices, without Other, as shared definitions across Sites. Existing supported stored values are retained; Other requires a current choice. This review changes no question wording, lookback or processing. The native date control represents the source calendar date; it does not add the unrelated duration question from another source variant."); continue;
    }
    if (row.sourceReferences[0] === "Attestation Online and PDF!E7") {
      emit(row, "pdf-membership", "deferred-existing-scope", [{ table: "sourceRequirements", key: "mcr.attestation-online-and-pdf.E7" }], "E7 is explicitly PDF, whereas C7/D7 describe the online active State/Local/Specialty Bar questions. Detailed PDF/XML remains deferred under the existing scope. Do not replace the online question with American Bar Association wording.", ["atomic.attestation.abe.pdf-membership-statement"]); continue;
    }
    const coordinate = /^Main!([A-Z]+)(\d+)$/.exec(row.sourceReferences[0]); if (!coordinate) continue;
    const [, column, number] = coordinate, sourceRow = Number(number), text = row.expectedBehavior;
    const productKey = Object.entries(activeSiteMainRows.abe).find(([, value]) => value === sourceRow)?.[0]; if (!productKey) continue;
    const product = site.configuration.products.find(row => row.productKey === productKey)!, applicant = ["I", "P", "S", "V"].includes(column) ? "spouse" : ["J", "Q", "T", "W"].includes(column) ? "child" : "member";
    const atom = (suffix: string) => `atomic.abe.${productKey}.${suffix}`;
    if (["R", "S"].includes(column) && text === "Membership ID optional") {
      const page = column === "R" ? "membership" : "eligibility";
      const absent = !site.configuration.pages.some(page => ["membership", "eligibility", "profile", "contact"].includes(page.key) && page.fields.some(field => field.included && field.definition.required && /member(?:ship)?\s*(?:id|number)/i.test(field.definition.label)));
      emit(row, "optional-membership-id", "reviewed-current-template", pageOwners(page), "Optional means no required ID collection. User decision October 22 adds optional ABE Membership ID on Membership. It is not required and no separate spouse ID is added. Membership attestations and SSNs remain separate.", productKey === "sh-critical-illness" ? [] : [atom("membership-id-optional")], absent);
    } else if (["R", "S"].includes(column) && text === "SS# required") {
      const fieldKey = column === "R" ? "social-security-number" : "spouse-social-security-number", field = site.configuration.pages.find(page => page.key === "profile")!.fields.find(field => field.key === fieldKey);
      emit(row, "required-ssn", "reviewed-current-template", pageOwners("profile", [fieldKey]), "The selected adult's SSN is required and validated as nine digits on Profile under standardized placement. Spouse section applicability is retained; no extra legacy Eligibility SSN control is added.", column === "R" && productKey !== "sh-critical-illness" ? [atom("ssn-required")] : [], field?.included === true && field.definition.required === true && field.definition.format === "ssn");
    } else if (column === "R" && text === "email mandatory on both Eligibility and Contact details page") {
      emit(row, "email-placement", "superseded-by-existing-decision", [...pageOwners("membership", ["email"]), ...raw(standardizedPlacementDecisionKey)], "The accepted new template requires member email on Membership and carries the answer forward. The legacy request to duplicate controls on Eligibility/Contact is superseded, with no change to substantive email requiredness.", productKey === "sh-critical-illness" ? [] : [atom("eligibility-email-required"), atom("contact-email-required")]);
    } else if (column === "R" && /^Online & PDF - Dividend/.test(text)) {
      emit(row, "dividend-online-pdf-split", "accepted-online-exception-pdf-deferred", [{ table: "configurationValues", key: "abe.review-policy" }, ...pageOwners("review")], "Split modes explicitly: online uses the independently accepted ABE dividend policy and captured fields, including its accepted replacement for legacy per-product new/change guards. Detailed PDF placement remains deferred. This does not approve unrelated consent or medical authorization wording.", productKey === "sh-critical-illness" ? ["atomic.unique-dividend-notice"] : [atom("dividend-paragraph-online"), atom("dividend-note-online"), atom("dividend-pdf")]);
    } else if (column === "S" && text === "Can be a Member,") {
      emit(row, "spouse-membership-role", "reviewed-current-template", pageOwners("eligibility", ["spouse-membership"]), "The selected dependent spouse retains a required Yes/No membership question; being a member does not itself disallow the ABE spouse role. This is not approval of another application or an exclusivity service.", ["atomic.attestation.abe.spouse-question"]);
    } else if (column === "N") {
      emit(row, "state-exclusions", "reviewed-current-template", policyOwners(product.residencyPolicies), "Exact Main N state exclusions are checked against all 50 states plus DC for every available applicant. The separately provisional country/territory scope is not approved by this state-list review.");
    } else if (column === "M" && sourceRow === 39) {
      emit(row, "country-territory-exception", "accepted-provisional", [...policyOwners(product.residencyPolicies), ...raw(`provisional-decision.abe.${productKey}.journey-residency`)], "Retain the previously authorized mainland-US/DC working scope. Canadian provinces, military-address regions and territories named by M39 are not activated. PR remains blocked through the restricted list, so the legacy PR selector popup is not exercised. Revisit these exact instructions when the full address scope is adopted; do not silently inherit M39 into absent M40–M49.");
    } else if (["H", "I", "J", "P", "Q", "S", "T", "V", "W"].includes(column) && /^(?:NA|N\/A)$/i.test(text)) {
      const unavailable = !site.products.find(product => product.productKey === productKey)!.applicants.some(row => row.applicantKey === applicant);
      emit(row, "unavailable-applicant", "reviewed-current-template", provenance(product.applicantRules), "N/A is reconciled only at this explicit product/applicant coordinate. The applicant is not offered by the native assignment; no availability is inferred from an absent source cell.", [], unavailable);
    } else if (column === "L" || column === "AT") {
      const hasR28 = productKey === "li-term" && /^(?:R28|Chronic Care Rider)/.test(text);
      const empty = /^(?:NA|N\/A)$/i.test(text);
      const provisionalKey = `provisional-decision.abe.${productKey}.selection-policy`;
      emit(row, hasR28 ? "r28-source-policy" : empty ? "no-source-rider" : "source-only-rider", hasR28 || empty ? "reviewed-current-template" : "accepted-provisional", [...policyOwners(product.selectionPolicies), ...provenance(product.riders), ...raw(provisionalKey)], hasR28 ? "R28 is the existing Term Life CIR: adult member/spouse only, base Term Life required, ages 17–64, with the exact Riders F32 exclusions. Source benefit name and native CIR identity are reconciled by R28 code, not by label similarity." : empty ? "The explicit N/A coordinate matches an empty native rider set for this product." : "The source names additional riders, but the existing authorized selection-policy decision preserves current assignments provisionally. This source-only requirement is retained for revisit; it is not implemented and no rider has been enabled. Exact current value and provisional decision are linked.", [], hasR28 ? product.riders.some(rider => rider.key === "rider.abe.r28") : empty ? product.riders.length === 0 : raw(provisionalKey).length === 1);
    } else if (column === "R" && (text === "Full-time work requirement: 30 hours" || text === "Full-time work at least 30 hours per week")) {
      emit(row, "member-work-hours", "reviewed-current-template", db.eligibilityConstraints.filter(owner => owner.siteKey === "abe" && owner.productKey === productKey && owner.applicantTypeKey === "member").map(owner => ({ table: "eligibilityConstraints", key: owner.key })), "The independent member minimum is 30 hours. Below 30 is ineligible; missing evidence cannot satisfy it. Professional Overhead's firm-count requirement remains a separate conjunct.");
    } else if (["R", "S"].includes(column) && text === "No Full-time work requirement") {
      emit(row, "no-work-threshold", "reviewed-current-template", db.eligibilityConstraints.filter(owner => owner.siteKey === "abe" && owner.productKey === productKey && owner.applicantTypeKey === applicant).map(owner => ({ table: "eligibilityConstraints", key: owner.key })), "ABE Critical Illness has no minimum-work-hours predicate; do not import DI/OO requirements into it.");
    } else if (column === "R" && sourceRow === 48 && ["5 or fewer members of the firm", "and"].includes(text)) {
      emit(row, "firm-work-conjunction", "reviewed-current-template", [{ table: "configurationValues", key: "abe.oo-professional.firm-member-eligibility" }, ...raw("business-decision.rules-review.abe-firm-member-count")], "Main R48 clauses 1–3 are conjunctive: the accepted whole-number firm count 1–5 AND the independent 30-hour work minimum. The word 'and' is structural, not another input or standalone eligibility predicate.", ["atomic.adopted.abe.firm-member-count"]);
    } else if (["U", "V", "W"].includes(column) && /^(?:Yes|No)$/i.test(text)) {
      emit(row, "medical-participation", "reviewed-current-template", policyOwners(product.journeyPolicies), "The explicit medical-participation flag matches the current adult pathway or child's NA override. Yes does not approve every age/amount processing band, and No does not suppress unrelated financial/tobacco collection.");
    } else if (column === "Z" && text === "Yes") {
      emit(row, "qd-availability", "reviewed-current-template", [...policyOwners(product.journeyPolicies), ...raw(externalQdQuestionnaireDecisionKey), ...raw(abeProcessingDecisionKey)], "The user confirmed v78 QD processing limits with FUW for otherwise eligible requests outside them. The native quickDecision policy owns the age, amount, state and fixed-term aggregate/dependent scopes. Main and approved entry ages remain separate. Explicit child NA and external QD loading are preserved.");
    } else if (["R", "S"].includes(column) && sourceRow === 47 && text.includes("I hereby attest")) {
      emit(row, "approved-inline-ci-attestation", "reviewed-current-template", [...site.configuration.reviewPolicies.flatMap(policy => policy.provenance), ...raw(abeProcessingDecisionKey)], "User approved the v78 Supplemental Health note inside the existing Read and Sign content for CI, not a separate section or answer. The captured block is conditional on CI and appended at 14pt; accepted dividend behavior is preserved.");
    } else if (column === "K" && text === "No") {
      emit(row, "no-cross-product-aggregate", "reviewed-current-template", [...policyOwners(site.configuration.lifeAggregates), ...policyOwners(product.benefitPolicies)], "This product is outside the configured cross-product Life/DI aggregate groups. Its own numeric maximum, dependent cap or Overhead expense cap remains independent.");
    }
  }
  const supportingScopes = [["QD LI", 6, 39], ["QD LI", 7, 40], ["QD LI", 8, 41], ["QD DI", 2, 44], ["QD DI", 3, 45], ["QD DI", 4, 46]].map(([sheet, row, main]) => {
    const name = String(sheet), number = Number(row), mainRow = Number(main), sourceIdentity = source(name, `D${number}`).match(/G-\d+-\d+/)?.[0], mainIdentity = source("Main", `E${mainRow}`).match(/G-\d+-\d+/)?.[0];
    const productKey = Object.entries(activeSiteMainRows.abe).find(([, row]) => row === mainRow)![0];
    return { sheet: name, row: number, productKey, gNumber: sourceIdentity, status: matches && sourceIdentity === mainIdentity ? "applicability-reviewed" : "reverification-required", basis: `${name}!D${number} and Main!E${mainRow} contain the same exact G-number. This is a product identity join, not inheritance from a blank nearby Site label.`, references: currentMcrSource.cells.filter(cell => cell.sheet === name && Number(cell.cell.match(/\d+$/)?.[0]) === number).map(cell => `${name}!${cell.cell}`), disposition: "Related ABE processing source. The user approved v78 age/amount/state processing bounds with FUW outside QD; Main and approved coverage eligibility remain separate. Other supporting clauses, collection conflicts and insurer-service instructions retain their individual queues." };
  });
  const supportingSources = supportingScopes.flatMap(scope => currentMcrSource.cells.filter(cell => scope.references.includes(`${cell.sheet}!${cell.cell}`)).map(cell => ({ reference: `${cell.sheet}!${cell.cell}`, productKey: scope.productKey, value: cell.value, formula: cell.formula, comment: cell.comment, hyperlink: cell.hyperlink,
    clauses: requirementClauses(String(cell.value ?? "")).map((span, index) => {
      const processing = /^[JKNOP]\d+$/.test(cell.cell);
      const owners = processing ? [{ table: "configurationValues", key: `abe.${scope.productKey}.journey-policy` }, ...raw(abeProcessingDecisionKey), ...(cell.cell.startsWith("N") ? raw(`provisional-decision.abe.${scope.productKey}.journey-residency`) : [])] : [];
      return { id: `abe.supporting.${cell.sheet.toLowerCase().replaceAll(" ", "-")}.${cell.cell}.${index + 1}`, start: span.start, end: span.end, text: span.text.trim(), status: processing ? matches ? "processing-reviewed" : "reverification-required" : cell.cell === `D${scope.row}` ? "identity-reference-reviewed" : "review-pending", fullCellGuard: `${cell.sheet}!${cell.cell}`, scopeBasis: scope.basis,
        owners, verificationReferences: processing ? ["src/migration/abeProcessingAdoption.test.ts", "src/pages/Review.consent.test.tsx", "src/migration/abeCoverageReview.test.ts"] : [],
        disposition: !processing ? "Separate supporting review remains open" : cell.cell.startsWith("N") ? "Literal mainland QD exclusions route to FUW; historical anticipated approvals are not adopted. Foreign/territory/military scope retains the independently documented provisional base-residency restriction; no source-equivalence claim for that restriction." : "User-approved v78 processing limits, source increments and applicant/aggregate guards; otherwise eligible requests use FUW. These QD limits do not replace Main coverage availability or approved entry ages.",
      };
    }) })));
  return { records, supportingScopes, supportingSources, verified: records.filter(row => row.status === "recorded-evidence").length, matches };
}
