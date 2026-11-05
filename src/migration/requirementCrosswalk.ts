import { reviewAttestationSourceLeaves } from "./requirementCrosswalkAttestationReview";
import { reviewNamedOwnerRequirements } from "./requirementCrosswalkOwnerReview";
import { reviewNavigationRequirements } from "./requirementCrosswalkNavigationReview";
import { reviewAgeSourceStatements } from "./requirementCrosswalkAgeReview";
import { waepaCirQuestionnaireDeferralKey } from "./waepaCirQuestionnaireDeferral";
import { reviewMembershipBasics } from "./requirementCrosswalkMembershipReview";
import { reviewTobaccoSourceLookbacks } from "./requirementCrosswalkTobaccoReview";
import { reviewAdoptedSourceAliases, reviewAmaProductOrderSource } from "./requirementCrosswalkAdoptionAliases";
import { coverageNoticeDeferralKey } from "./coverageNoticeDeferral";
import { reviewAcceptedAbeDividendRequirements } from "./requirementCrosswalkAbeReview";
import { reviewLookupAndLandingRequirements } from "./requirementCrosswalkLookupReview";
import { reviewOutsideCurrentVariants } from "./requirementCrosswalkVariantScope";
import { reviewEntryRequirements } from "./requirementCrosswalkEntryReview";
import { importantNoticeDeferralKey } from "./importantNoticeDeferral";
import { reviewBeneficiaryRequirements } from "./requirementCrosswalkBeneficiaryReview";
import { reviewPersistenceRequirements } from "./requirementCrosswalkPersistence";
import { createHash } from "node:crypto";
import type { DatabaseSchema } from "../persistence/types";
import { ruleAuthority } from "../domain/ruleAuthority";
import { requirementCoverageRows } from "../domain/requirementCoverage";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { reviewActiveSiteIdentities } from "./activeSiteIdentity";
import { currentMcrSource as mcrSource, currentMcrReviewData } from "./currentMcr";
import { organizeRule, ruleDependencyFindings } from "../domain/ruleOrganization";
import { crosswalkAtoms } from "./requirementCrosswalkAtoms";
import { membershipCrosswalkAtoms } from "./requirementCrosswalkMembership";
import workbookDrawingsReview from "../../docs/project-review/step1-workbook-drawings.json";
import { decisionWordingSourceScopes } from "./requirementCrosswalkDecisionScope";
import { attestationSourceScopes } from "./requirementCrosswalkSourceScope";
import { explicitUniqueMcrRequirements, reusableConfigurationPlan } from "./requirementCrosswalkConfiguration";
import { approvedIsitrustResidency, isitrustResidencyDecisionKey } from "./isitrustResidencyAdoption";
import { atpeAssociationKey, atpePortfolioDecisionKey, atpeProducts } from "./atpeAssociationAdoption";
import { reviewedAdoptionRequirements, reviewedAtpeOwnersMatch } from "./requirementCrosswalkAdoptions";
import { reviewedRecoveryServiceMatches } from "./requirementCrosswalkServiceReview";
import { readSignSourceScopes } from "./requirementCrosswalkReviewScope";
import { reviewSourceMetadata } from "./requirementCrosswalkMetadata";
import { reviewProfileRequirements } from "./requirementCrosswalkProfileReview";
import { reviewContactRequirements } from "./requirementCrosswalkContactReview";
import { qdStateVariationDeferralKey } from "./qdStateVariationDeferral";
import { financialQuestionnaireSourceReview } from "./requirementCrosswalkFinancialScope";
import { reviewSsnCollectionRequirements, reviewAbeEmailPlacement } from "./requirementCrosswalkFieldReview";

const allCrosswalkAtoms = [...crosswalkAtoms, ...membershipCrosswalkAtoms];

/** Offline Step 1 inventory. This module never seeds, promotes or activates data. */
type Owner = { table: string; key: string; column?: string };
type Scope = {
  siteKeys: string[]; productKeys: string[]; applicantKeys: string[]; modes: string[]; associationKeys?: string[];
  basis: string; unresolved: string[];
};
export type CrosswalkRow = {
  id: string; kind: "reviewed-requirement" | "source-requirement" | "source-clause" | "template-behavior" | "decision";
  area: string; scope: Scope; sourceReferences: string[]; sourceKey: string | null;
  expectedBehavior: string; context: string; ruleKeys: string[]; rationale: string | null;
  atomization: "reviewed" | "clause-review-pending";
  executionOwners: Owner[]; ownerCandidates: Owner[]; serviceOwner: string | null; codeOwner?: string;
  ownerResolution: "recorded-review" | "identified-records" | "service-owned" | "code-owned" | "discovery-pending";
  implementationReferences: string[]; verificationReferences: string[];
  verificationStatus: "recorded-evidence" | "not-verified";
  disposition: string; finding: string;
  completionBlocking?: boolean;
  decision?: { key: string; authority: string | null; sourceReconciliation: string | null; recordedStatus: string };
};
const unique = <T,>(values: T[]) => [...new Set(values)];
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const paths = (value: string) => unique([...value.matchAll(/(?:src|scripts)\/[\w./-]+\.(?:tsx|ts|mjs)(?![\w])/g)].map(match => match[0]));
const businessSites = activeSiteMigrationScope.sites.filter(site => site.mcrRequired).map(site => site.key);

/** Lossless line/sentence segmentation, not an assertion of semantic atomicity.
 * Keep full cell/rule context on every clause: an If/Except/Only guard may span lines.
 * Do not split conjunctions, decimal amounts, abbreviations or identifier lists.
 */
export function requirementClauses(text: string): Array<{ start: number; end: number; text: string }> {
  const result: Array<{ start: number; end: number; text: string }> = [];
  const boundary = /(?:\r?\n+|;\s+|[.!?]\s+(?=[A-Z]))/g;
  let start = 0;
  for (const match of text.matchAll(boundary)) {
    const end = match.index! + match[0].length;
    if (text.slice(start, end).trim()) result.push({ start, end, text: text.slice(start, end) });
    else if (result.length) { result[result.length - 1].end = end; result[result.length - 1].text = text.slice(result[result.length - 1].start, end); }
    else continue;
    start = end;
  }
  if (text.slice(start).trim()) result.push({ start, end: text.length, text: text.slice(start) });
  else if (result.length) { result[result.length - 1].end = text.length; result[result.length - 1].text = text.slice(result[result.length - 1].start); }
  return result;
}

const mainAreas: Record<string, string> = {
  H: "Coverage", I: "Coverage", J: "Coverage", K: "Coverage", L: "Coverage", AT: "Coverage",
  M: "Eligibility", N: "Eligibility", O: "Eligibility", P: "Eligibility", Q: "Eligibility",
  R: "Eligibility", S: "Eligibility", T: "Eligibility", U: "Health", V: "Health", W: "Health", X: "Health",
  Y: "Profile", Z: "Health", AA: "Review and consent", AB: "Beneficiary", AC: "Payment and rates", AD: "Payment and rates",
  AE: "Payment and rates", AF: "Payment and rates", AG: "Payment and rates", AH: "Payment and rates", AI: "Payment and rates",
  AJ: "Payment and rates", AK: "Payment and rates", AL: "Health", AM: "Payment and rates", AN: "Payment and rates",
  AO: "Payment and rates", AP: "Payment and rates", AQ: "Payment and rates", AR: "Payment and rates", AS: "Payment and rates",
};
const sheetAreas: Record<string, string> = {
  "qd-li": "Health", "qd-di": "Health", disability: "Coverage", "overhead-expense": "Coverage", riders: "Coverage",
  "attestation-online-and-pdf": "Membership", "sup-di-health-questions": "Health", "financial-questions": "Profile",
  "health-questions": "Health", "waepa-cir-questions": "Health", "read-sign": "Review and consent",
  "smoker-question": "Payment and rates", "beneficiary-note": "Beneficiary", "order-of-products-across-site": "Coverage",
  "standard-decision-wording": "Review and consent", underwriting: "Health", electrconsent: "Review and consent", "legal-disclosures": "Review and consent",
};
const headerSheets = new Set(["main", "qd-li", "qd-di", "disability", "overhead-expense", "riders", "attestation-online-and-pdf", "health-questions", "waepa-cir-questions", "smoker-question", "beneficiary-note", "read-sign", "underwriting", "legal-disclosures", "order-of-products-across-site", "standard-decision-wording"]);
const sharedInstructionSheets = new Set(["financial-questions", "read-sign", "smoker-question", "beneficiary-note", "order-of-products-across-site", "standard-decision-wording", "underwriting", "electrconsent", "legal-disclosures", "waepa-cir-questions"]);
const areas: Record<string, string> = {
  Rates: "Payment and rates", Payment: "Payment and rates", Review: "Review and consent", "Read & Sign": "Review and consent",
  Persistence: "Save and resume", "Applicant display": "Eligibility", "Home / Quote tool": "Coverage", "Coverage cart": "Coverage",
};
const areaOfRule = (area: string) => areas[area] ?? (["Membership", "Eligibility", "Coverage", "Health", "Beneficiary", "Profile", "Contact"].includes(area) ? area : "Navigation and validation");
const consumers: Record<string, string[]> = {
  Membership: ["src/pages/Membership.tsx", "src/domain/applicantExperience.ts"],
  Eligibility: ["src/domain/coverageRequirements.ts", "src/domain/coverageRuntime.ts", "src/pages/Eligibility.tsx"],
  Coverage: ["src/domain/effectiveSite.ts", "src/domain/coverageRuntime.ts", "src/pages/Coverage.tsx"],
  Health: ["src/config/formFlow.ts", "src/domain/coverageRuntime.ts"],
  Profile: ["src/pages/Profile.tsx"], Beneficiary: ["src/pages/Beneficiary.tsx"], Contact: ["src/pages/Contact.tsx"],
  "Review and consent": ["src/domain/reviewPolicy.ts", "src/pages/Review.tsx"],
  "Payment and rates": ["src/domain/mockRating.ts", "src/domain/paymentPolicy.ts", "src/pages/Payment.tsx"],
  "Navigation and validation": ["src/app/RoutePage.tsx", "src/config/formFlow.ts"],
  "Save and resume": ["scripts/applicant-saves.mjs", "src/services/applicantSaveService.ts"],
};

// Explicit decomposition of the initial named cross-application gaps. These are
// observed mock contracts, not new business decisions or Library-editable values.
const serviceClauses = [
  ["retention", "Saved applications expire ten days after creation; ordinary updates do not extend the original expiry."],
  ["link-expiry", "A resume link expires ten minutes after it is issued."],
  ["code-expiry", "A verification code expires five minutes after it is issued."],
  ["attempt-limit", "After five incorrect code attempts, require a new resume link."],
  ["challenge-limit", "Allow at most five code challenges for a recovery link."],
  ["request-limit", "Allow at most five resume requests per saved application in a rolling minute."],
  ["revocation", "Issuing a new resume link revokes earlier recovery links for that application."],
  ["single-use", "Successful verification consumes the recovery and revokes application recovery links."],
  ["capability-rotation", "Successful verification rotates the application's write capability; earlier capabilities cannot update it."],
  ["recovery-isolation", "Recovery must match the saved application, Site and normalized recipient; updates also match environment and write capability."],
] as const;

function unknownScope(basis: string): Scope {
  return { siteKeys: [], productKeys: [], applicantKeys: [], modes: [], basis,
    unresolved: ["Site/product/applicant applicability and mode require review; an empty list does not mean global applicability."] };
}

export function buildRequirementCrosswalk(db: DatabaseSchema) {
  const currentEvidence = currentMcrReviewData(db);
  db = currentEvidence.data;
  const librarySiteKeys = db.sites.filter(site => site.status === "active" && !site.deletedAt).map(site => site.key);
  if (businessSites.some(site => !librarySiteKeys.includes(site))) throw new Error("Review scope includes a Site absent from the active Library");
  const tables = db as unknown as Record<string, Array<{ key: string } & Record<string, unknown>>>;
  const records = new Map(Object.entries(tables).map(([table, rows]) => [table, new Map(rows.map(row => [row.key, row]))]));
  const exists = (owner: Owner) => {
    const record = records.get(owner.table)?.get(owner.key);
    return !!record && (!owner.column || Object.hasOwn(record, owner.column));
  };
  const sourceNames = new Map(db.sourceSheets.map(sheet => [sheet.key, sheet.name]));
  const supportingScopes = new Map([...attestationSourceScopes(mcrSource.cells)].map(([reference, scope]) => [reference, { ...scope, siteKeys: [scope.siteKey], modes: [scope.mode] }]));
  const reviewScopes = readSignSourceScopes(mcrSource.cells, businessSites);
  const decisionScopes = decisionWordingSourceScopes(mcrSource.cells, businessSites);
  const identities = reviewActiveSiteIdentities(db, mcrSource.cells).assignments;
  const mainScopes = new Map<number, { siteKey: string; productKey: string; provisional?: boolean; associationKey?: string }>(identities.filter(row => row.row !== null).map(row => [row.row!, row]));
  if (db.semanticRequirements.some(row => row.key === atpePortfolioDecisionKey)) for (const slice of atpeProducts) mainScopes.set(slice.row, { siteKey: "isitrust", productKey: slice.productKey, associationKey: atpeAssociationKey });
  const targets = new Map<string, Owner[]>();
  for (const target of db.requirementTargets) {
    const owner = { table: target.targetTable, key: target.targetKey, column: target.targetColumn };
    // Archived source models are evidence, never inferred execution owners.
    if (!exists(owner) || owner.key.startsWith("mcr.") || ["semanticRequirements", "sourceRequirements", "questionDefinitions", "identityResolutions"].includes(owner.table)) continue;
    targets.set(target.requirementKey, [...(targets.get(target.requirementKey) ?? []), owner]);
  }
  const reviews = requirementCoverageRows(db);
  const rows: CrosswalkRow[] = reviews.map(review => ({
    id: review.id, kind: "reviewed-requirement", area: review.area,
    scope: { siteKeys: [review.siteKey], productKeys: review.productKey ? [review.productKey] : [], applicantKeys: review.applicantKey ? [review.applicantKey] : [], modes: [],
      basis: "Existing atomic coverage review; exact scope retained.", unresolved: ["Mode applicability was not recorded by the earlier review."] },
    sourceReferences: review.sourceReferences, sourceKey: null, expectedBehavior: review.expectedBehavior, context: review.title,
    ruleKeys: review.ruleKeys, rationale: null, atomization: "reviewed", executionOwners: review.owners.map(({ table, key, column }) => ({ table, key, ...(column ? { column } : {}) })),
    ownerCandidates: [], serviceOwner: null, ownerResolution: "recorded-review", implementationReferences: review.implementationReferences,
    verificationReferences: review.verificationReferences, verificationStatus: review.status === "verified" ? "recorded-evidence" : "not-verified",
    disposition: review.status, finding: review.finding,
  }));
  for (const atom of allCrosswalkAtoms) {
    const source = db.sourceRequirements.find(source => `${sourceNames.get(source.sheetKey)}!${source.cell}` === atom.source);
    if (!source) throw new Error(`Missing atomic source: ${atom.id}/${atom.source}`);
    for (const owner of [...(atom.ownerCandidates ?? []), ...(atom.executionOwners ?? [])]) if (!exists(owner)) throw new Error(`Missing atomic owner reference: ${atom.id}/${owner.table}/${owner.key}`);
    rows.push({ id: atom.id, kind: "source-requirement", area: atom.area,
      scope: { siteKeys: [atom.site], productKeys: atom.product ? [atom.product] : [], applicantKeys: atom.applicant ? [atom.applicant] : [], modes: atom.modes,
        basis: `Manually decomposed ${atom.source}; condition and applicant-class context retained in the expected behavior.`,
        unresolved: [...(!atom.product ? ["Per-product applicability must be read with the source's category/URL conditions."] : []), "Quote/advisor parity is not established by this source clause."] },
      sourceReferences: [atom.source], sourceKey: source.key, expectedBehavior: atom.expected, context: atom.context ?? `Read with the full cell ${atom.source}; existing accepted decisions take precedence at their exact scope.`,
      ruleKeys: atom.ruleKeys ?? [], rationale: null, atomization: atom.deferred ? "clause-review-pending" : "reviewed",
      executionOwners: atom.executionOwners ?? [], ownerCandidates: atom.ownerCandidates ?? [], serviceOwner: null, ownerResolution: atom.executionOwners?.length ? "identified-records" : "discovery-pending",
      implementationReferences: atom.implementationReferences ?? consumers[atom.area] ?? [], verificationReferences: [], verificationStatus: "not-verified",
      disposition: atom.deferred ? "deferred" : "review-pending", finding: atom.deferred ? "Detailed PDF/XML work is explicitly deferred. Preserve the source instruction for later decomposition and acceptance."
        : "Atomic source instruction enumerated by inspection. Candidate owners identify records to reconcile; no behavior change or verification is claimed.",
    });
  }
  for (const requirement of explicitUniqueMcrRequirements) rows.push({
    id: `atomic.${requirement.key}`, kind: "source-requirement", area: "area" in requirement ? requirement.area : "Review and consent",
    scope: { siteKeys: [...requirement.activeSiteKeys], productKeys: [], applicantKeys: [], modes: ["online", "application"],
      basis: requirement.sourceReferences.join("; "), unresolved: ["Block/applicant/product/mode predicates require reconciliation with the current Review policy.", ...(!requirement.activeSiteKeys.length ? ["No approved active Site assignment established."] : [])] },
    sourceReferences: [...requirement.sourceReferences], sourceKey: `mcr.legal-disclosures.${requirement.sourceReferences[0].split("!")[1]}`,
    expectedBehavior: requirement.expectedBehavior, context: requirement.finding, ruleKeys: ["rule-review-conditional-consent-blocks"],
    rationale: "User clarification: MCR-specific behavior belongs in reusable global definitions/configuration with explicit Site assignments.", atomization: "reviewed",
    executionOwners: requirement.key === "unique-dividend-notice" ? [{ table: "configurationValues", key: "abe.review-policy", column: "value" }] : [],
    ownerCandidates: [], serviceOwner: null, ownerResolution: requirement.key === "unique-dividend-notice" ? "identified-records" : "discovery-pending",
    implementationReferences: ["src/domain/reviewPolicy.ts", "src/content/reviewPolicies.ts", "src/pages/Review.tsx"], verificationReferences: [], verificationStatus: "not-verified",
    disposition: requirement.disposition, finding: requirement.finding,
    ...(["unique-custom-consent", "unique-hi-ci-coverage-notice"].includes(requirement.key) ? { completionBlocking: false } : {}),
  });

  for (const slice of approvedIsitrustResidency) {
    const ownerKey = `isitrust.${slice.productKey}.journey-residency`;
    const ownerValue = db.configurationValues.find(row => row.key === ownerKey)?.value;
    const approval = db.semanticRequirements.find(row => row.key === `${isitrustResidencyDecisionKey}.${slice.productKey}`)?.value as { selected?: unknown } | undefined;
    const generalValue = structuredClone(ownerValue) as Record<string, unknown> | undefined;
    if (generalValue) delete generalValue.associationAllowedJurisdictions;
    const matchesApproval = approval?.selected !== undefined && digest(approval.selected) === digest(generalValue);
    rows.push({
    id: `atomic.residency.isitrust.${slice.productKey}`, kind: "source-requirement", area: "Eligibility",
    scope: { siteKeys: ["isitrust"], productKeys: [slice.productKey], applicantKeys: db.siteProductApplicants.filter(row => row.siteKey === "isitrust" && row.productKey === slice.productKey).map(row => row.applicantKey), modes: ["new", "increase", "rider-only"],
      basis: "User approved v78 exclusions October 20, 2026; existing resolver applies the product policy to each offered applicant and application mode.", unresolved: ["Country/territory scope retains its earlier provisional disposition."] },
    sourceReferences: [`Main!${slice.cell}`], sourceKey: `mcr.main.${slice.cell}`,
    expectedBehavior: `Exclude ${slice.excluded.split(" ").join(", ")} for ISITRUST ${slice.productKey}; retain mainland US plus DC scope.${slice.cell === "N280" ? " YT means Yukon, not Utah; Canada remains outside the existing country scope." : ""}`,
    context: "Explicit approval adopts the general product exclusion list only. ATPE uses its separately adopted current lists at Main!N179:N185. Country scope is unchanged.",
    ruleKeys: ["rule-coverage-product-policy-owners"], rationale: null, atomization: "reviewed",
    executionOwners: [{ table: "configurationValues", key: `isitrust.${slice.productKey}.journey-residency`, column: "value" }], ownerCandidates: [], serviceOwner: null, ownerResolution: "recorded-review",
    implementationReferences: ["src/domain/residencyPolicy.ts", "src/domain/prototypeCoverageDecision.ts", "src/domain/coverageJourney.ts"], verificationReferences: ["src/migration/isitrustResidencyAdoption.test.ts"], verificationStatus: matchesApproval ? "recorded-evidence" : "not-verified",
    disposition: "adopted-user-decision", finding: matchesApproval ? `Approved product list is stored through a reusable global definition and an explicit ISITRUST assignment. Decision: ${isitrustResidencyDecisionKey}.${slice.productKey}.` : "The owning residency policy changed or its approval is unavailable. Preserve the source decision and reverify the edited behavior.",
  });
  }
  for (const slice of atpeProducts) rows.push({
    id: `atomic.residency.atpe.${slice.productKey}`, kind: "source-requirement", area: "Eligibility",
    scope: { siteKeys: ["isitrust"], productKeys: [slice.productKey], associationKeys: [atpeAssociationKey], applicantKeys: db.siteProductApplicants.filter(row => row.siteKey === "isitrust" && row.productKey === slice.productKey).map(row => row.applicantKey), modes: ["new", "increase", "rider-only"],
      basis: `Explicit ATPE association assignment; Main!B${slice.row}=ATPE. This source does not change other ISITRUST Associations.`, unresolved: ["Other ATPE benefit/age/health/rating requirements require separate reconciliation; country scope stays provisional."] },
    sourceReferences: [`Main!N${slice.row}`, `Main!B${slice.row}`], sourceKey: `mcr.main.N${slice.row}`,
    expectedBehavior: `For ATPE (${atpeAssociationKey}), exclude ${slice.excluded.split(" ").join(", ")} on ${slice.productKey}; retain mainland US plus DC scope.`,
    context: "The explicit current ATPE list replaces the general product list for the ATPE selection. Group Term uses four states at N179; the older ten-state exception remains superseded evidence.",
    ruleKeys: ["rule-coverage-product-policy-owners"], rationale: null, atomization: "reviewed", executionOwners: [{ table: "configurationValues", key: `isitrust.${slice.productKey}.journey-residency`, column: "value" }], ownerCandidates: [], serviceOwner: null, ownerResolution: "recorded-review",
    implementationReferences: ["src/domain/residencyPolicy.ts", "src/domain/prototypeCoverageDecision.ts", "src/domain/coverageJourney.ts"], verificationReferences: ["src/migration/atpeAssociationAdoption.test.ts"], verificationStatus: reviewedAtpeOwnersMatch(db, [{ table: "configurationValues", key: `isitrust.${slice.productKey}.journey-residency`, column: "value" }]) ? "recorded-evidence" : "not-verified",
    disposition: "adopted-user-decision", finding: "The selected Association chooses its explicitly assigned residency list; missing and invalid Association facts cannot fall through to the general list.",
  });

  rows.push(...reviewedAdoptionRequirements(db));
  if (db.semanticRequirements.some(row => row.key === qdStateVariationDeferralKey)) rows.push({
    id: "atomic.health.qd-state-variation-document", kind: "source-requirement", area: "Health", scope: { siteKeys: [...businessSites], productKeys: [], applicantKeys: [], modes: ["Quick Decision source reconciliation"], basis: "Linked document unavailable; explicit user-approved nonblocking deferral. Existing state-specific behavior remains active at its native scope.", unresolved: [] },
    sourceReferences: ["Health Questions!A4", "Health Questions!B4", "User decision October 20, 2026"], sourceKey: "mcr.health-questions.B4", expectedBehavior: "Flag the unavailable Jet Issue State Variations Updated Sep,2018.docx and retain current state-specific behavior until the user supplies authoritative content.", context: "The workbook contains a local Windows file link, not the linked document's contents. Do not fabricate source instructions or activate unreviewed state variations.", ruleKeys: [], rationale: null, atomization: "reviewed", executionOwners: [], ownerCandidates: [], serviceOwner: null, ownerResolution: "discovery-pending", implementationReferences: ["src/domain/coverageJourney.ts", "src/domain/configuredHealthQuestionnaire.ts"], verificationReferences: ["src/migration/requirementCrosswalk.test.ts"], verificationStatus: "not-verified", disposition: "deferred-by-user", completionBlocking: false, finding: "User explicitly deferred this missing source document as nonblocking October 20, 2026. Revisit when its content or an authoritative replacement is provided.",
  });


  if (db.semanticRequirements.some(row => row.key === waepaCirQuestionnaireDeferralKey)) rows.push({
    id: "atomic.health.waepa-cir-incomplete-form", kind: "source-requirement", area: "Health", scope: { siteKeys: ["waepa"], productKeys: ["li-group-term"], applicantKeys: ["member", "spouse"], modes: ["CIR questionnaire"], basis: "Dedicated source is incomplete; explicit user-approved nonblocking deferral", unresolved: [] },
    sourceReferences: ["WAEPA CIR questions!A2", "WAEPA CIR questions!B2", "WAEPA CIR questions!A9", "User decision October 21, 2026"], sourceKey: null, expectedBehavior: "Flag the incomplete dedicated WAEPA CIR questionnaire and retain the current shared Life health flow provisionally until the complete form is supplied.", context: "The sheet stops at question 7 while its explanation instructions refer to questions 9 and 10. Preserve supplied questions without inventing the remainder or activating a partial form.", ruleKeys: [], rationale: null, atomization: "reviewed", executionOwners: [], ownerCandidates: [], serviceOwner: null, ownerResolution: "discovery-pending", implementationReferences: ["src/domain/configuredHealthQuestionnaire.ts"], verificationReferences: ["src/migration/requirementCrosswalk.test.ts"], verificationStatus: "not-verified", disposition: "deferred-by-user", completionBlocking: false, finding: "User explicitly deferred the complete dedicated CIR form as nonblocking October 21, 2026. Approved current processing and participation remain separate native owners.",
  });

  const sourceLedger: Array<{
    key: string; reference: string; classification: string; promotionState: string; disposition: string;
    reason: string; contentHash: string; clauseIds: string[]; relatedReviewedRequirementIds: string[]; atomicRequirementIds: string[];
  }> = [];
  const financialSourceReview = financialQuestionnaireSourceReview(db, mcrSource.cells, businessSites);
  const sourceCells: Array<{ key: string; reference: string; value: unknown; formula: string | null; comment: string | null; hyperlink: string | null; checklistNotes: string | null }> = [];
  const clauseSpans: Array<{ requirementId: string; sourceKey: string; start: number; end: number }> = [];
  const atomicIdsBySource = new Map<string, string[]>();
  for (const row of rows.filter(row => row.kind === "source-requirement")) for (const reference of row.sourceReferences) {
    atomicIdsBySource.set(reference, [...(atomicIdsBySource.get(reference) ?? []), row.id]);
  }
  for (const source of db.sourceRequirements) {
    const sheet = sourceNames.get(source.sheetKey) ?? source.sheetKey;
    const reference = `${sheet}!${source.cell}`;
    const supportingScope = supportingScopes.get(reference) ?? reviewScopes.get(reference) ?? decisionScopes.get(reference);
    const text = String(source.value ?? "");
    const column = source.cell.replace(/\d+/g, "");
    const number = Number(source.cell.replace(/[A-Z]+/g, ""));
    const identity = source.sheetKey === "main" ? mainScopes.get(number) : undefined;
    const related = reviews.filter(review => review.sourceReferences.includes(reference)).map(review => review.id);
    let disposition: string;
    let reason: string;
    if (!text.trim() && !source.comment && !source.formula && !source.hyperlink && !source.checklistNotes) {
      disposition = "empty-source"; reason = "No content, formula, comment or link to enumerate.";
    } else if (source.cell === "embedded-images" || source.classification === "IMAGE_REVIEW_REQUIRED") {
      const reviewed = workbookDrawingsReview.workbookSha256 === mcrSource.sha256 && workbookDrawingsReview.drawings.filter(drawing => drawing.sheet === sheet).length === Number(source.value);
      disposition = reviewed ? "reviewed-drawing-source-scope" : "image-review-pending";
      reason = reviewed ? "Pinned original workbook anchors and all media hashes are accounted in step1-workbook-drawings.json. Current-Site imagery is branding reference; historical UX and explicit other-Site instructions retain their separate scope. No application-rule activation is inferred from images." : "Embedded content needs separate visual review; text extraction cannot enumerate it.";
    } else if (source.sheetKey.startsWith("new-ux-")) {
      disposition = "source-reference"; reason = "Historical UX reference; the current prototype owns page/field/flow/layout behavior. No adoption inferred.";
    } else if (number === 1 && headerSheets.has(source.sheetKey)) {
      disposition = "source-heading"; reason = "Column heading retained as source context.";
    } else if (source.sheetKey === "main" && !identity) {
      disposition = "outside-approved-site-scope"; reason = "Main row is outside the explicit active Site/product crosswalk; preserve source evidence without assigning another Site variant.";
    } else if (source.sheetKey === "main" && !mainAreas[column]) {
      disposition = "identity-reference"; reason = "Identity and source context; behavioral requirements use columns H through AT.";
    } else if (source.sheetKey === "associations" || source.sheetKey === "urls") {
      disposition = "identity-reference-review-pending"; reason = "Identity, content and environment reference; applicable membership/contact/link behavior still needs classification.";
    } else if (source.sheetKey === "main" || sheetAreas[source.sheetKey]) {
      disposition = source.sheetKey === "main" ? "enumerated-clauses-review-pending" : supportingScope ? "scoped-supporting-clauses-review-pending" : "shared-source-scope-review-pending";
      reason = source.sheetKey === "main" ? "Source-linked product; clauses require semantic atomization, scope and owner review. Earlier reviewed clauses do not close the cell."
        : "Potential shared/supporting evidence. Exact Site/product/question-set/variant applicability has not been inferred from nearby text.";
    } else {
      disposition = "source-review-pending"; reason = "Unclassified evidence remains visible for requirement enumeration.";
    }
    const clauseIds: string[] = [];
    const enumerate = ["enumerated-clauses-review-pending", "scoped-supporting-clauses-review-pending"].includes(disposition) || disposition === "shared-source-scope-review-pending" &&
      (sharedInstructionSheets.has(source.sheetKey) || ["Attestation Online and PDF!C3", "Attestation Online and PDF!C69", "Attestation Online and PDF!C125"].includes(reference) || source.sheetKey === "sup-di-health-questions" && column === "A" && number <= 4);
    if (enumerate) {
      sourceCells.push({ key: source.key, reference, value: source.value, formula: source.formula, comment: source.comment, hyperlink: source.hyperlink, checklistNotes: source.checklistNotes });
      for (const [index, clause] of requirementClauses(text).entries()) {
        const id = `requirement.${source.key}.${index + 1}`;
        clauseIds.push(id); clauseSpans.push({ requirementId: id, sourceKey: source.key, start: clause.start, end: clause.end });
        const area = mainAreas[column] && source.sheetKey === "main" ? mainAreas[column] : sheetAreas[source.sheetKey];
        const applicant = source.sheetKey === "main" ? ({ H: "member", O: "member", R: "member", U: "member", I: "spouse", P: "spouse", S: "spouse", V: "spouse", J: "child", Q: "child", T: "child", W: "child" } as Record<string, string>)[column] : undefined;
        rows.push({ id, kind: "source-clause", area,
          scope: identity ? { siteKeys: [identity.siteKey], productKeys: [identity.productKey], applicantKeys: applicant ? [applicant] : [], modes: [], ...(identity.associationKey ? { associationKeys: [identity.associationKey] } : {}),
            basis: `${reference}; explicit active Site/product identity${"provisional" in identity ? "; CSEA identity remains provisional" : ""}`,
            unresolved: ["Application/quote/advisor and new/increase/rider-only mode applicability needs review.", ...(applicant ? [] : ["Applicant applicability needs review."])] }
            : supportingScope ? { siteKeys: supportingScope.siteKeys, productKeys: [], applicantKeys: [], modes: supportingScope.modes, basis: supportingScope.basis,
              unresolved: ["Per-clause product, applicant and new/increase/rider-only applicability requires review. Site scope does not establish semantic coverage."] }
              : unknownScope("Shared/supporting MCR sheet; row and question-set ownership review pending."),
          sourceReferences: [reference, ...(supportingScope?.evidence ?? [])], sourceKey: source.key, expectedBehavior: clause.text.trim(), context: `Use the full source cell ${reference}, including all guards, lists and exceptions.`,
          ruleKeys: [], rationale: null, atomization: "clause-review-pending", executionOwners: [], ownerCandidates: targets.get(source.key) ?? [],
          serviceOwner: null, ownerResolution: "discovery-pending", implementationReferences: consumers[area] ?? [], verificationReferences: [], verificationStatus: "not-verified",
          disposition: "review-pending", finding: "Verbatim clause candidate. Consumer paths are discovery entry points; cell target links are owner candidates, not proof that this clause executes. Related accepted decisions remain separate rows.",
        });
      }
      if (source.comment || source.formula || source.hyperlink || source.checklistNotes) {
        reason += " Formula/comment/link/checklist evidence also requires review; clause segmentation covers cell text only.";
      }
    }
    if (["Legal Disclosures!A6", "Legal Disclosures!B6", "Legal Disclosures!D6"].includes(reference)) {
      disposition = "deferred-by-user";
      reason = "Custom consent is a flagged, nonblocking deferred requirement until the user supplies wording and applicable Site assignments. Preserve its source and clause evidence.";
    }
    if (source.sheetKey === "financial-questions" && financialSourceReview.status === "reviewed-no-current-assignment") {
      disposition = "reviewed-source-no-current-assignment";
      reason = financialSourceReview.finding;
      for (const id of clauseIds) {
        const row = rows.find(row => row.id === id)!;
        row.disposition = "source-reference";
        row.finding = financialSourceReview.finding;
        row.codeOwner = "Profile financial questionnaire and captured ABE Site/product/amount policy";
        row.ownerResolution = "code-owned";
        row.executionOwners = [{ table: "configurationValues", key: "abe.profile-financial-questionnaire" }, { table: "pageSections", key: "profile.profileFinancialQuestionnaireSelf" }];
        row.scope.basis = financialSourceReview.finding;
        row.scope.unresolved = [];
        row.implementationReferences = financialSourceReview.implementationReferences;
        row.verificationReferences = financialSourceReview.verificationReferences;
        row.verificationStatus = "recorded-evidence";
      }
    }
    if (source.sheetKey === "financial-questions" && ["reviewed-abe-decision-pending", "reviewed-abe-assignment"].includes(financialSourceReview.status)) {
      const adopted = financialSourceReview.status === "reviewed-abe-assignment";
      disposition = adopted ? "reviewed-abe-financial-assignment" : "reviewed-abe-financial-decision-pending";
      reason = financialSourceReview.finding;
      for (const id of clauseIds) {
        const row = rows.find(row => row.id === id)!;
        row.disposition = adopted ? "reviewed-current-template-functionality" : "review-pending";
        row.verificationStatus = adopted ? "recorded-evidence" : "not-verified";
        row.finding = financialSourceReview.finding;
        row.scope.siteKeys = ["abe"];
        row.scope.productKeys = ["di-ltd-plus", "di-ltd", "di-mtd"];
        row.scope.applicantKeys = ["member"];
        row.scope.basis = financialSourceReview.finding;
        row.scope.unresolved = adopted ? [] : ["ABE-07: financial questionnaire with or without QD Life"];
        row.implementationReferences = financialSourceReview.implementationReferences;
        row.verificationReferences = ["src/migration/abeApprovedDecisions.test.ts", "src/pages/Profile.test.tsx"];
      }
    }
    if (reference === "Health Questions!B4" && db.semanticRequirements.some(row => row.key === qdStateVariationDeferralKey)) {
      disposition = "deferred-by-user"; reason = "Unavailable linked QD variation document explicitly flagged as nonblocking by the user; current state behavior is retained.";
    }
    sourceLedger.push({ key: source.key, reference, classification: source.classification, promotionState: source.promotionState, disposition, reason,
      contentHash: digest({ value: source.value, formula: source.formula, comment: source.comment, hyperlink: source.hyperlink, checklistNotes: source.checklistNotes }), clauseIds,
      relatedReviewedRequirementIds: related, atomicRequirementIds: atomicIdsBySource.get(reference) ?? [] });
  }

  const catalog = db.rules.map(rule => {
    const authority = ruleAuthority(rule);
    const assignments = db.ruleAssignments.filter(assignment => assignment.ruleKey === rule.key);
    const siteKeys = unique(assignments.flatMap(assignment => assignment.scope === "global" ? [...activeSiteMigrationScope.sites.map(site => site.key)]
      : assignment.siteKey ? [assignment.siteKey] : activeSiteMigrationScope.sites.filter(site => site.clientKey === assignment.clientKey).map(site => site.key)));
    const rationale = authority.kind === "source-pattern" || authority.kind === "source-reference"
      ? "Preserve the imported canonical/source model as a reference. Its catalog presence does not activate its predicates/actions or establish runtime coverage."
      : authority.kind === "planned" ? "Retain the documented future behavior and planned status. An implementation and explicit applicable assignments are still required."
        : "Current prototype behavior baseline. Retain until a source-backed or accepted decision changes it; execution remains with the referenced implementation or stored policy.";
    const ruleRows: CrosswalkRow[] = requirementClauses(rule.definition.behavior).map((clause, index) => ({
      id: `template.${rule.key}.${index + 1}`, kind: "template-behavior", area: areaOfRule(rule.definition.area),
      scope: { siteKeys, productKeys: [], applicantKeys: [], modes: [], basis: "Catalog assignments captured literally; assignments alone do not prove effective applicability.",
        unresolved: ["Product/applicant/mode predicates must be read with the full rule and its owning implementation.", ...(!assignments.length ? ["No catalog assignment; do not infer global scope."] : [])] },
      sourceReferences: [rule.sourceReference ?? "src/content/docs/siteRules.ts", rule.definition.ref], sourceKey: null,
      expectedBehavior: clause.text.trim(), context: rule.definition.behavior, ruleKeys: [rule.key], rationale, atomization: "clause-review-pending",
      executionOwners: authority.kind === "routing" ? [{ table: "rules", key: rule.key, column: "definition" }] : [],
      ownerCandidates: db.ruleConditions.filter(link => link.ruleKey === rule.key).map(link => ({ table: "conditions", key: link.conditionKey, column: "definition" })),
      serviceOwner: null, ownerResolution: authority.kind === "routing" ? "recorded-review" : "discovery-pending",
      implementationReferences: paths(rule.definition.ref), verificationReferences: [], verificationStatus: "not-verified",
      disposition: authority.kind === "planned" ? "planned" : ["source-pattern", "source-reference"].includes(authority.kind) ? "source-reference" : "review-pending",
      finding: "Catalog linkage and existing implementation references only. Semantic clause, effective scope, actual execution owner and verification remain under review.",
    }));
    if (rule.key === "rule-persistence-resume-verification") for (const [suffix, expectedBehavior] of serviceClauses) ruleRows.push({
      id: `template.resume.${suffix}`, kind: "template-behavior", area: "Save and resume",
      scope: { siteKeys: [...activeSiteMigrationScope.sites.map(site => site.key)], productKeys: [], applicantKeys: [], modes: ["mock saved-application service"],
        basis: "createApplicantSaves service contract; availableSite callback restricts requests.", unresolved: ["Production recovery service acceptance remains separate."] },
      sourceReferences: ["scripts/applicant-saves.mjs"], sourceKey: null, expectedBehavior, context: "Observed mock service behavior; delivery is simulated.", ruleKeys: [rule.key],
      rationale: "Preserve the existing recovery contract. These constants belong to the local applicant-save service and are not Library-editable.", atomization: "reviewed",
      executionOwners: [], ownerCandidates: [], serviceOwner: "createApplicantSaves in scripts/applicant-saves.mjs (local mock service)", ownerResolution: "service-owned",
      implementationReferences: ["scripts/applicant-saves.mjs", "src/services/applicantSaveService.ts"], verificationReferences: ["scripts/applicant-saves.test.mjs", "src/services/applicantSaveService.test.ts", "src/pages/ResumeFlow.test.tsx"],
      verificationStatus: reviewedRecoveryServiceMatches() ? "recorded-evidence" : "not-verified", disposition: "reviewed-mock-service-contract", finding: reviewedRecoveryServiceMatches() ? "Mock recovery boundary, restart, isolation, client-save and rendered resume checks passed October 20, 2026. Source and test fingerprints match that review. Production service assurance remains outside this contract." : "Service code or tests changed since the recorded recovery review; reverify this contract.",
    });
    rows.push(...ruleRows);
    const linked = rows.filter(row => row.ruleKeys.includes(rule.key)).map(row => row.id);
    return { key: rule.key, catalogStatus: authority.kind, documentationStatus: rule.definition.documentationStatus,
      organization: rule.definition.organization ?? organizeRule(rule.definition), documentedBehavior: rule.definition.behavior,
      currentTemplateFunctionality: ["planned", "source-pattern", "source-reference"].includes(authority.kind) ? null : rule.definition.behavior,
      dependsOn: rule.definition.dependsOn ?? [],
      requirementIds: linked, rationale, assignments, conditionKeys: db.ruleConditions.filter(link => link.ruleKey === rule.key).map(link => link.conditionKey),
      sourcePredicateKeys: db.rulePredicates.filter(predicate => predicate.ruleKey === rule.key).map(predicate => predicate.key),
      sourceActionKeys: db.structuredRuleActions.filter(action => action.ruleKey === rule.key).map(action => action.key) };
  });

  // Retain accepted provisional choices independently of literal source clauses.
  // Whole-cell/source reconciliation is never inherited from a decision's status.
  const decisions = db.semanticRequirements.filter(record => ["provisional-source-decision", "approved-business-decision"].includes(record.domain));
  for (const decision of decisions) {
    const value = decision.value as { authority?: string; issue?: string; selected?: unknown; sourceReference?: string; sourceReferences?: string[]; destinations?: Owner[]; destination?: Owner; sourceReconciliation?: string; scope?: string[]; productKeys?: string[] };
    const owners = [...(value.destinations ?? []), ...(value.destination ? [value.destination] : [])].filter(exists);
    const sites = unique(owners.flatMap(owner => {
      const record = records.get(owner.table)?.get(owner.key);
      return typeof record?.siteKey === "string" ? [record.siteKey] : [];
    }));
    const siteKey = businessSites.find(site => decision.subjectKey === site || decision.key.startsWith(`provisional-decision.${site}.`));
    rows.push({ id: `decision.${decision.key}`, kind: "decision", area: /qualification/.test(decision.predicate) ? "Membership" : /rate|billing|payment/.test(decision.predicate) ? "Payment and rates" : /eligibility|age|work|residency/.test(decision.predicate) ? "Eligibility" : "Coverage",
      scope: { ...unknownScope("Existing accepted decision; exact destination references retained."), siteKeys: unique([...sites, ...(siteKey ? [siteKey] : []), ...(value.scope ?? [])]), productKeys: value.productKeys ?? [] },
      sourceReferences: unique([...(value.sourceReferences ?? []), ...(value.sourceReference ? [value.sourceReference] : []), ...(decision.sourceReference ? [decision.sourceReference] : []), value.authority ?? "docs/step3-provisional-decisions.md"]),
      sourceKey: null, expectedBehavior: `Preserve the accepted ${decision.predicate} choice recorded in semanticRequirements/${decision.key}. Selected-value hash: ${digest(value.selected ?? decision.value)}.`, context: value.issue ?? decision.predicate, ruleKeys: [],
      rationale: "Retain the accepted working choice and its revisit/source-reconciliation disposition. Do not ask again merely because the source remains incomplete.",
      atomization: "clause-review-pending", executionOwners: owners, ownerCandidates: [], serviceOwner: null,
      ownerResolution: owners.length ? "recorded-review" : "discovery-pending", implementationReferences: [], verificationReferences: [], verificationStatus: "not-verified",
      disposition: value.sourceReconciliation === "superseded" ? "superseded-decision" : decision.domain === "approved-business-decision" ? "accepted-decision" : "accepted-provisional", finding: "Imported decision evidence; semantic decomposition, source reconciliation and journey verification remain open.",
      decision: { key: decision.key, authority: value.authority ?? null, sourceReconciliation: value.sourceReconciliation ?? null, recordedStatus: decision.status },
    });
  }
  const countBy = <T,>(items: T[], key: (item: T) => string) => Object.fromEntries(unique(items.map(key)).sort().map(value => [value, items.filter(item => key(item) === value).length]));
  const mainSource = new Set(db.sourceRequirements.filter(source => source.sheetKey === "main").map(source => source.cell));
  const sourceAbsences = [...mainScopes.entries()].flatMap(([row, identity]) => Object.keys(mainAreas).filter(column => !mainSource.has(`${column}${row}`)).map(column => ({
    reference: `Main!${column}${row}`, siteKey: identity.siteKey, productKey: identity.productKey, area: mainAreas[column],
    disposition: "source-absence-review-pending", reason: "No extracted source record at this behavioral coordinate. Do not infer N/A, availability or a default value from the absence; inspect related sources and accepted decisions.",
  })));
  if (db.semanticRequirements.some(record => record.key === "business-decision.rules-review.csea-optional-dependent-benefits")) {
    const row = rows.find(row => row.id === "atomic.csea.di-ltd.spouse-selected-locked");
    if (row) { row.disposition = "superseded-by-user-decision"; row.finding = "October 21 user decision keeps spouse and child attached benefits optional, preserving current defaults and independent opt-outs. The legacy prechecked-and-disabled spouse control is superseded; benefit amounts, child age attestation and program identity retain their own review scope."; }
    const age = rows.find(row => row.id === "atomic.csea.di-ltd.child-age-attestation");
    if (age) { age.disposition = "accepted-exception"; age.completionBlocking = false; age.finding = "October 21 user decision explicitly retains the displayed under-19 note without collecting a confirmation checkbox as a provisional exception. The literal source attestation is not implemented. Revisit if the user requests confirmation or corrected requirements; do not synthesize an attested answer."; }

  }
  const waepaRouteDecision = db.semanticRequirements.find(record => record.key === "business-decision.rules-review.waepa-membership-interpretation")?.value as { supersededRequirementIds?: string[] } | undefined;
  for (const row of rows.filter(row => waepaRouteDecision?.supersededRequirementIds?.includes(row.id))) {
    row.disposition = "superseded-by-user-decision";
    row.finding = "October 21 user decision keeps independent Adult Child/Step-Child Associate Member entry and existing child coverage rules. The contradictory dependent 50%-of-member/spouse-icon route is superseded. Independent member eligibility and benefit limits remain in their separate native policies.";
  }
  const supersededAdultBlock = rows.find(row => row.id === "atomic.attestation.waepa.adult-child-entry-block");
  if (supersededAdultBlock) {
    supersededAdultBlock.disposition = "superseded-by-user-decision";
    supersededAdultBlock.finding = "October 20 user decision permits adult-child Associate Member Life entry. The legacy C122 entry block is superseded; per-product eligibility and dependent coverage remain separate.";
  }
  const interpretation = (row: CrosswalkRow) => ({
    sourceIntent: row.kind === "template-behavior" ? null : row.expectedBehavior,
    newTemplateFunctionality: catalog.filter(rule => row.ruleKeys.includes(rule.key) && rule.currentTemplateFunctionality !== null).map(rule => ({ ruleKey: rule.key, behavior: rule.currentTemplateFunctionality })),
    decision: row.disposition === "superseded-by-user-decision" ? "accepted-replacement" : ["adopted-user-decision", "adopted-source-requirement", "deferred-by-user"].includes(row.disposition) ? row.disposition : row.kind === "decision" ? row.disposition : row.disposition === "planned" ? "planned-not-current-functionality" : row.disposition === "source-reference" ? "source-reference-only" : row.disposition === "reviewed-current-template-functionality" || row.kind === "template-behavior" && row.verificationStatus === "recorded-evidence" ? "reviewed-current-template-functionality" : row.kind === "template-behavior" ? "current-functionality-documented-pending-verification" : "interpretation-review-pending",
    legacyWorkaroundReview: row.kind === "source-clause" || row.kind === "source-requirement" ? "Review necessity with the user; no automatic one-to-one adoption." : null,
  });
  for (const row of rows.filter(row => row.sourceReferences.some(reference => ["Legal Disclosures!A6", "Legal Disclosures!B6", "Legal Disclosures!D6"].includes(reference)))) {
    if (row.kind !== "source-clause" && row.id !== "atomic.unique-custom-consent") continue;
    row.disposition = "deferred-by-user"; row.completionBlocking = false;
    row.finding = "User explicitly deferred custom consent October 20, 2026. Flag missing text and Site assignments for later; this requirement does not block task completion.";
  }
  if (db.semanticRequirements.some(record => record.key === waepaCirQuestionnaireDeferralKey)) {
    for (const row of rows.filter(row => row.kind === "source-clause" && row.sourceReferences[0]?.startsWith("WAEPA CIR questions!"))) {
      row.area = "Health"; row.disposition = "deferred-by-user"; row.completionBlocking = false;
      row.scope.siteKeys = ["waepa"]; row.scope.productKeys = ["li-group-term"]; row.scope.applicantKeys = ["member", "spouse"]; row.scope.unresolved = [];
      row.finding = "User accepts the current shared Life questionnaire provisionally and defers the incomplete dedicated CIR form as nonblocking. Preserve this supplied source clause; complete wording and instructions are needed before adoption.";
    }
    for (const entry of sourceLedger.filter(entry => entry.reference.startsWith("WAEPA CIR questions!") && entry.disposition !== "source-heading")) { entry.disposition = "deferred-by-user"; entry.reason = "Incomplete dedicated CIR form explicitly deferred as nonblocking by the user October 21, 2026."; }
  }
  const noticeDeferral = db.semanticRequirements.find(row => row.key === importantNoticeDeferralKey)?.value as { completionBlocking?: boolean; sourceReferences?: string[] } | undefined;
  if (noticeDeferral?.completionBlocking === false) for (const row of rows.filter(row => row.kind === "source-clause" && noticeDeferral.sourceReferences?.includes(row.sourceReferences[0]) && (row.sourceReferences[0] !== "Read & Sign!B40" || /IMPORTANT NOTICE|New Mexico/i.test(row.expectedBehavior)))) {
    row.disposition = "deferred-by-user"; row.completionBlocking = false;
    row.finding = "User explicitly deferred the IMPORTANT NOTICE viewer as nonblocking. Preserve standard, New Mexico and Virginia source text; current consent references do not mean the viewer exists. ABE remains preserved.";
  }
  const coverageNoticeDeferral = db.semanticRequirements.find(row => row.key === coverageNoticeDeferralKey)?.value as { completionBlocking?: boolean; sourceReferences?: string[] } | undefined;
  if (coverageNoticeDeferral?.completionBlocking === false) for (const row of rows.filter(row => row.id === "atomic.unique-hi-ci-coverage-notice" || row.kind === "source-clause" && coverageNoticeDeferral.sourceReferences?.includes(row.sourceReferences[0]))) {
    row.area = "Coverage"; row.disposition = "deferred-by-user"; row.completionBlocking = false;
    row.finding = "User decision October 21, 2026: flag missing HI/CI Coverage notice wording and Site/product assignments as nonblocking. Preserve the source's 14-point requirement and the separate active Review attestation. Revisit on approved copy and scope.";
  }
  const referralPlacement = rows.find(row => row.id === "atomic.attestation.waepa-gi.referral-source-section");
  if (referralPlacement) {
    referralPlacement.disposition = "superseded-by-user-decision";
    referralPlacement.finding = "User clarification October 20, 2026: the unique WAEPA referral field belongs in Membership Information for new members, with TV, Radio and Newspaper choices. Separate adopted rows cover Standard and GI visibility; shared field placement remains standardized.";
  }
  const collegeList = rows.find(row => row.id === "atomic.attestation.avma.veterinary-college");
  if (collegeList) {
    collegeList.disposition = "deferred-by-user"; collegeList.completionBlocking = false;
    collegeList.finding = "User decision October 20, 2026: retain required college text entry; defer only the missing approved dropdown list as a flagged, nonblocking requirement. Revisit when the user supplies that list.";
    collegeList.context = "Current required text collection remains active. The source's dropdown control is explicitly deferred; no college options are invented.";
  }
  reviewOutsideCurrentVariants(mcrSource.cells, rows);
  reviewLookupAndLandingRequirements(rows);
  reviewAcceptedAbeDividendRequirements(db, rows);
  reviewEntryRequirements(db, rows);
  reviewBeneficiaryRequirements(db, rows);
  reviewPersistenceRequirements(rows);
  reviewSsnCollectionRequirements(db, rows);
  reviewAbeEmailPlacement(db, rows);
  reviewMembershipBasics(db, rows);
  reviewNamedOwnerRequirements(db, rows);
  reviewNavigationRequirements(db, rows);
  reviewTobaccoSourceLookbacks(rows);
  reviewAgeSourceStatements(db, rows);
  reviewContactRequirements(rows);
  reviewProfileRequirements(db, rows, financialSourceReview.status !== "scope-review-pending");
  reviewAdoptedSourceAliases(db, rows);
  reviewAmaProductOrderSource(rows);
  reviewAttestationSourceLeaves(rows);
  const reviewedRowsById = new Map(rows.map(row => [row.id, row]));
  for (const entry of sourceLedger) if (entry.clauseIds.length && entry.clauseIds.every(id => {
    const row = reviewedRowsById.get(id)!;
    return row.atomization === "reviewed" && (row.verificationStatus === "recorded-evidence" || row.disposition === "deferred" && row.scope.modes.includes("PDF"));
  })) {
    entry.disposition = "reviewed-source-clauses";
    entry.reason = "Every text clause has a bounded reviewed implementation, source-scope or deferred-PDF disposition. Metadata evidence retains its separate review.";
  }
  const plannedRows = rows.map(row => ({ ...row, interpretation: interpretation(row), organization: { path: ["application", row.area, row.kind], executionOrder: false },
    configurationPlan: row.kind === "source-clause" || row.kind === "decision" ? null : reusableConfigurationPlan(row) }));
  const identifiedOwners = new Map(rows.flatMap(row => row.executionOwners).map(owner => [JSON.stringify(owner), owner]));
  const ownerEvidence = [...identifiedOwners.values()].map(owner => {
    const record = records.get(owner.table)?.get(owner.key);
    if (!record || owner.column && !Object.hasOwn(record, owner.column)) throw new Error(`Identified crosswalk owner unavailable: ${owner.table}/${owner.key}`);
    const storedValue = owner.column ? record[owner.column] : record;
    return { ...owner, storedValue: structuredClone(storedValue), contentHash: digest(storedValue), evidenceStatus: "captured-stored-record-only" };
  });
  const scopedSourceChanges = currentEvidence.sourceChanges.map(change => {
    const mainRow = /^Main![A-Z]+(\d+)$/.exec(change.reference)?.[1];
    const identity = mainRow ? mainScopes.get(Number(mainRow)) : undefined;
    const atpeAdopted = identity?.associationKey === atpeAssociationKey && atpeProducts.some(slice => `Main!N${slice.row}` === change.reference);
    const adopted = atpeAdopted || identity?.siteKey === "isitrust" && db.semanticRequirements.some(row => row.key === `${isitrustResidencyDecisionKey}.${identity.productKey}`) && approvedIsitrustResidency.some(slice => `Main!${slice.cell}` === change.reference);
    return { ...change, siteKeys: identity ? [identity.siteKey] : [], productKey: identity?.productKey ?? null,
      policyReviewRequired: !!identity && change.kind === "content-changed" && !adopted,
      ...(adopted ? { adoptionDecisionKey: atpeAdopted ? atpePortfolioDecisionKey : `${isitrustResidencyDecisionKey}.${identity!.productKey}`, policyActivation: "reviewed-seed" } : {}),
      ...(change.reference === "Main!N280" ? { interpretationDecision: { key: "business-decision.rules-review.isitrust-overhead-yt", token: "YT", meaning: "Yukon", authority: "User clarification October 20, 2026", policyActivation: "reviewed-seed" } } : {}) };
  });
  const consentReview = businessSites.map(siteKey => {
    const policy = db.configurationValues.find(row => row.key === `${siteKey}.review-policy`);
    const value = policy?.value as { blocks?: Array<{ key: string; fields: string[]; when?: unknown; sourceReferences?: string[] }> } | undefined;
    return { siteKey, owner: policy ? { table: "configurationValues", key: policy.key } : null,
      blocks: value?.blocks?.map(block => ({ key: block.key, fields: block.fields, when: block.when, sourceReferences: block.sourceReferences })) ?? [],
      disposition: siteKey === "abe" ? "preserve-accepted-dividend-notices-and-fields" : "compare-current-review-functionality-with-applicable-current-source",
      note: "Inventory of captured policy blocks only; shared Review fields and jurisdiction notices require their own applicability review. No additional consent content is approved by inference." };
  });
  return {
    schemaVersion: 1, reviewedOn: "2026-10-21", stage: "1 — requirement enumeration only", enumerationComplete: false,
    boundary: "A source ledger and clause inventory, with earlier atomic reviews and accepted decisions retained. Clause candidates are not certified atomic requirements. Source extraction/promotion, catalog status, owner discovery and semantic verification are separate. No runtime or saved revision is changed.",
    authoringPrinciple: "User clarification October 20, 2026: MCR-specific/unique behavior must become reusable global definitions/configuration with explicit assignments for Sites that require it. The inventory records authoring targets; only separately approved adoption passes activate reviewed definitions and assignments.",
    inputs: { workbook: mcrSource.workbook, workbookSha256: mcrSource.sha256, historicalCompilerSource: currentEvidence.historicalSource,
      sourceSnapshotHash: digest(mcrSource), sourceLedgerInputHash: digest(db.sourceRequirements), catalogHash: digest(db.rules), reviewedRequirementHash: digest(reviews),
      scopeReference: "src/migration/activeSiteScope.ts", identityReference: "src/migration/activeSiteIdentity.ts" },
    scope: { businessSiteKeys: businessSites, librarySiteKeys, syntheticSiteKeys: ["demo"], sourceCurrency: activeSiteMigrationScope.sources.currentMcr.currency,
      nonblockingDeferredRequirements: [{ requirementId: "atomic.health.waepa-cir-incomplete-form", decisionKey: waepaCirQuestionnaireDeferralKey, completionBlocking: false, revisitTrigger: "User provides the complete WAEPA CIR questionnaire and explanation instructions" }, { requirementId: "atomic.unique-hi-ci-coverage-notice", decisionKey: coverageNoticeDeferralKey, completionBlocking: false, revisitTrigger: "User provides approved Coverage notice wording and applicable Site/product assignments" }, { requirementId: "atomic.health.qd-state-variation-document", decisionKey: qdStateVariationDeferralKey, completionBlocking: false, revisitTrigger: "User provides the missing QD variation document or an authoritative replacement" }, { requirementId: "atomic.attestation.avma.veterinary-college", decisionKey: "business-decision.rules-review.avma-college-list", completionBlocking: false, revisitTrigger: "User supplies the approved college dropdown list" }, { requirementId: "atomic.unique-custom-consent", decisionKey: "business-decision.rules-review.custom-consent-deferral", completionBlocking: false, revisitTrigger: "User supplies custom consent wording and applicable Sites" }],
      unresolvedIdentities: identities.filter(identity => identity.status === "blocked"),
      deferred: ["Other MCR Site variants", "Lifecycle redesign", "Site Builder redesign", "Detailed PDF/XML work", "ISI St. Louis source reconciliation retains its existing pending disposition"] },
    areaClosure: Object.fromEntries(unique(rows.map(row => row.area)).map(area => [area, ["Save and resume", "Contact", "Profile", "Beneficiary"].includes(area) && rows.filter(row => row.area === area).every(row => row.verificationStatus === "recorded-evidence" || (row.disposition === "deferred" && row.scope.modes.includes("PDF") || row.disposition === "deferred-by-user" && row.completionBlocking === false) || area === "Profile" && row.disposition === "superseded-by-user-decision") ? "Closed for current mock prototype" : "Open"])),
    counts: { rows: rows.length, byKind: countBy(rows, row => row.kind), byArea: countBy(rows, row => row.area), byDisposition: countBy(rows, row => row.disposition),
      sourceRecords: sourceLedger.length, sourceDisposition: countBy(sourceLedger, row => row.disposition), catalogRecords: catalog.length,
      catalogStatus: countBy(catalog, row => row.catalogStatus), catalogRecordsWithoutLink: catalog.filter(row => !row.requirementIds.length).length, missingMainBehaviorCoordinates: sourceAbsences.length },
    completionGate: ["Review every candidate clause for compound instructions and cross-line guards; agree with the user which legacy workarounds the new template still needs.", "ISITRUST Main!N278:N286 exclusions are explicitly adopted; retain ATPE's separate restrictions and the existing provisional country scope. Do not reopen the approved YT=Yukon interpretation.", "Resolve shared/supporting source applicability, comments, formulas, links, checklist discrepancies and embedded images. Custom consent is explicitly deferred by the user and does not block completion; revisit when the user supplies wording and Site assignments.",
      "Identify field/condition/policy/service owners and exact consumers for each applicable clause; candidate links are not ownership acceptance.",
      "Connect source clauses to matching catalog/template behaviors without treating all behavior in a cell as reviewed.",
      "Retain accepted decisions and deferred dispositions at their exact scope. Save and resume closes only for the current mock prototype when its source/test fingerprints match; Contact, Profile and Beneficiary also close for the current mock prototype when their code/test fingerprints and captured owners match; remaining areas stay open."],
    drawingSourceReview: workbookDrawingsReview,
    financialSourceReview,
    sourceMetadataReview: reviewSourceMetadata(mcrSource.cells, db.semanticRequirements.some(row => row.key === qdStateVariationDeferralKey)),
    reusableSourceScope: [...supportingScopes, ...reviewScopes, ...decisionScopes].map(([sourceReference, scope]) => ({ sourceReference, ...scope })),
    currentSourceChanges: scopedSourceChanges, consentReview,
    ruleHierarchy: { root: "application", levels: ["area", "behavior family", "rule", "requirement", "scoped owner"], dependencyFindings: ruleDependencyFindings(db.rules),
      reviewOrderIsExecutionOrder: false, conflictGate: "Validate applicability, supported predicates and overlapping owner assignments at their dedicated resolvers before activation. Hierarchy and catalog count do not prove non-interference." },
    explicitUniqueMcrRequirements: explicitUniqueMcrRequirements.map(requirement => {
      const row = rows.find(row => row.id === `atomic.${requirement.key}`);
      return { ...requirement, disposition: row?.disposition ?? requirement.disposition, finding: row?.finding ?? requirement.finding };
    }),
    uniqueSourceSignals: mcrSource.cells.filter(cell => /\bunique\b/i.test(`${cell.value ?? ""} ${cell.comment ?? ""}`)).map(cell => ({ sourceReference: `${cell.sheet}!${cell.cell}`,
      disposition: explicitUniqueMcrRequirements.some(requirement => (requirement.sourceReferences as readonly string[]).includes(`${cell.sheet}!${cell.cell}`)) ? "reusable-capability-recorded"
        : cell.sheet.startsWith("New UX") ? "historical-ux-reference" : "identifier-reference-outside-approved-scope",
      note: "A literal 'unique' word alone does not establish an executable exception. Identifier wording and historical UX copy retain their existing source/scope authority." })),
    requirements: plannedRows, ownerEvidence, catalog, sourceCells, clauseSpans, sourceAbsences, sourceLedger,
  };
}

/** One record per line keeps the generated inventory reviewable without tens of
 * thousands of repeated indented property lines. All fields remain ordinary JSON. */
export function serializeRequirementCrosswalk(report: ReturnType<typeof buildRequirementCrosswalk>) {
  const { requirements, catalog, sourceCells, clauseSpans, sourceAbsences, sourceLedger, ...metadata } = report;
  const groups = new Map<string, { sheet: string; disposition: string; classification: string; promotionState: string; sourceKeys: string[] }>();
  for (const row of sourceLedger) {
    const sheet = row.reference.split("!")[0];
    const key = JSON.stringify([sheet, row.disposition, row.classification, row.promotionState]);
    const group = groups.get(key) ?? { sheet, disposition: row.disposition, classification: row.classification, promotionState: row.promotionState, sourceKeys: [] };
    group.sourceKeys.push(row.key); groups.set(key, group);
  }
  const sections = Object.entries(metadata).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  for (const [key, values] of Object.entries({ requirements, catalog, sourceCells, clauseSpans, sourceAbsences })) sections.push(`  "${key}": [\n${values.map(value => `    ${JSON.stringify(value)}`).join(",\n")}\n  ]`);
  sections.push(`  "sourceLedgerFormat": "Groups share sheet, disposition, extraction classification and promotion state. Every original source key occurs once. Source content/metadata is bound by inputs.sourceLedgerInputHash; requirement and sourceCells links use these keys. Dispositions are enumeration triage, not semantic acceptance."`);
  sections.push(`  "sourceLedger": [\n${[...groups.values()].map(group => `    ${JSON.stringify(group)}`).join(",\n")}\n  ]`);
  return `{\n${sections.join(",\n")}\n}\n`;
}

export function renderAtomicRequirementReview(report: ReturnType<typeof buildRequirementCrosswalk>) {
  const atoms = report.requirements.filter(row => row.kind === "source-requirement" || row.serviceOwner);
  const refs = (owners: CrosswalkRow["executionOwners"]) => owners.map(owner => `\`${owner.table}/${owner.key}${owner.column ? `.${owner.column}` : ""}\``).join(", ");
  return `# Manually enumerated requirement batch

October 21, 2026. **${atoms.length} source/service instructions enumerated; behavior verification remains open.** [Full Step 1 inventory](step1-requirement-crosswalk.md). The separate 22 earlier reviews retain their dispositions. Identified records and planned global configuration targets are distinct from verified execution. Detailed PDF/XML work retains its deferred disposition.

` + unique(atoms.map(row => row.scope.siteKeys.join(", "))).map(scope => `## ${scope || "Source-only / no approved active Site assignment"}\n\n` + atoms.filter(row => row.scope.siteKeys.join(", ") === scope).map(row => {
    const plan = row.configurationPlan;
    return `### ${row.id}

${row.expectedBehavior}

- Source: ${row.sourceReferences.join("; ")}
- Area: ${row.area}; product: ${row.scope.productKeys.join(", ") || "source conditions"}; applicant: ${row.scope.applicantKeys.join(", ") || "source conditions"}; mode: ${row.scope.modes.join(", ") || "review pending"}.
- Execution owner: ${row.serviceOwner ?? (row.codeOwner ? `${row.codeOwner}${row.executionOwners.length ? `; stored owners: ${refs(row.executionOwners)}` : ""}` : row.executionOwners.length ? refs(row.executionOwners) : "discovery pending")}. Candidates: ${refs(row.ownerCandidates) || "none identified yet"}.
- Global authoring target: ${plan?.definitionTable ? `\`${plan.definitionTable}/${plan.definitionKey}\` (${plan.contractStatus})` : "service-owned contract"}. Site assignment target: ${plan?.assignmentTable ? `\`${plan.assignmentTable}\`; Sites: ${plan.siteKeys.join(", ") || "none established"}` : "service-owned"}. ${plan?.activation === "adopted-reviewed-seed" ? "Approved definition and scoped assignment are adopted in reviewed seed data." : plan?.activation === "reviewed-existing-configuration" ? "Existing captured definition and Site assignment are reviewed; no new activation was performed." : "This is an enumeration plan, not an activated definition/assignment."}
- Catalog: ${row.ruleKeys.map(key => `\`${key}\``).join(", ") || "linkage pending"}; disposition: **${row.disposition}**; verification: ${row.verificationStatus}.
- Consumer discovery/evidence: ${[...row.implementationReferences, ...row.verificationReferences].map(path => `[${path}](../../${path})`).join(", ") || "pending"}.
- Context: ${row.context}

`;
  }).join("")).join("");
}

export function renderRequirementCrosswalkSummary(report: ReturnType<typeof buildRequirementCrosswalk>) {
  return `# Step 1 requirement crosswalk

October 21, 2026. **Enumeration remains open.** Current review authority is the user-supplied v78 workbook. Review covers the nine business Sites currently in the Library; Demo is synthetic. Historical source evidence and captured revisions remain preserved.

Review now proceeds Site by Site, completing all phases for **ABE first**. The [ABE review and exact queue](step1-abe-review.md) records approved changes, exact source/owner evidence and remaining work. The [global phase register](step1-review-phases.md) retains the earlier shared batch and area totals as reference. ISITRUST's selector, AMA's online Domestic partner/Civil Union suppression and ABE's accepted dividend capability now have exact edit-sensitive owner evidence. ISITRUST C86 and Standard WAEPA C122 online source spans have guarded leaf mappings; shared routing/validation has a bounded completed review. The seven open areas retain their separate completion gates.

[Full crosswalk](step1-requirement-crosswalk.json) · [Manually enumerated batch](step1-atomic-requirements.md) · [Earlier atomic reviews](rules-requirement-crosswalk.json) · [Interpretation and rule hierarchy](rule-organization-and-interpretation.md) · [Execution plan](rules-coverage-plan.md)

The approved Standard WAEPA six-choice qualification list is authored in the shared field definition and scoped to Standard WAEPA. Associate follow-ups cover spouse, adult child, parent and sibling. The separate retired-annuitant choice is omitted from the new list; historical definitions remain available to captured revisions. Adult-child Associate Member Life entry is allowed; product eligibility remains separate. Standard WAEPA preserves the established required truthfulness checkbox whenever New Member is selected, independently of qualification; current members do not see it or the new qualification form. The source membership explanation appears with the qualification field, within the standardized Membership section. WAEPA GI retains its accepted entry exception. Standard WAEPA now asks whether a dependent spouse is already or becoming a WAEPA member; Yes blocks that dependent-spouse request through captured Eligibility and product-fact owners, while preserving separate eligible member/Associate Member applications. Shared field placement/pages are standardized across clients: ABE required email stays on Membership, while unique fields receive explicit placement. WAEPA referral offers TV, Radio and Newspaper in Membership Information for new members; GI adds a separate member-status question while retaining its accepted entry gate. Other source requirements retain their separate review.

Source instructions, current template functionality and interpretation decisions are separate on each row. Legacy workarounds require review with the user before translation. Catalog descriptions record current new-template behavior and reference actual owners. Rule metadata supplies an area/family hierarchy, visible as a filterable Library column; dependency checks detect missing references and cycles. Review order does not determine execution or prove that policies cannot conflict.

The crosswalk contains ${report.counts.rows.toLocaleString("en-US")} rows: ${Object.entries(report.counts.byKind).map(([kind, count]) => `${count.toLocaleString("en-US")} ${kind}`).join(", ")}. All ${report.counts.catalogRecords} rule catalog identities have requirement or rationale links, including planned and source records. Every one of the ${report.counts.sourceRecords.toLocaleString("en-US")} extracted source records has an enumeration disposition. These are inventory counts, not counts of accepted atomic requirements.

Each requirement row records source/decision or template rationale, area, Site/product/applicant/mode scope, expected behavior with context, rule links, execution owner or explicit discovery status, consumer references, verification evidence and disposition. Empty scope lists mean unresolved or constrained by the accompanying context; they never imply global applicability.

| Area | Inventory rows | Closure |
| --- | ---: | --- |
${Object.entries(report.counts.byArea).map(([area, count]) => `| ${area} | ${count} | ${report.areaClosure[area]} |`).join("\n")}

## Manual enumeration

The [manual batch](step1-atomic-requirements.md) contains ${report.counts.byKind["source-requirement"]} source instructions and ten save/resume service contracts. It separates ABE's optional member IDs, required SSNs, email collection and dividend presentation from the reviewed work-hours clause; AMA's API entry, nonmember participation/surcharge and step/level conditions; CSEA's entry and dependent benefits; and WAEPA's collection and military restrictions. The continuation scopes the primary Attestation rows for all nine business Sites, separates their online and PDF evidence, and enumerates AVMA collection, ISI association conditions, NSO nurse type and Standard WAEPA qualifications/follow-ups. Detailed PDF/XML instructions retain their deferred disposition. Owner candidates identify records to inspect, not accepted execution ownership.

ATPE is assigned to seven products with separate residency, identifier, eligibility and structured amount owners. The user approved its four-state Group Term exclusions, 10-Year ages 20–54 and $500,000 spouse maximum, and the Group Term 50% advisory comparison. Other current ISITRUST Associations use the approved general Life, CI-only and combined source forms through separate explicit assignments and shared fields; approved processing, shorter flows and the STD-only exception remain separate. General Group Term uses QD at 18–60, with the short flow only at 18–54 up to $500,000 and full Life questions otherwise; ages 61–64 use FUW and full Life questions. General 10-Year uses QD through age 60 and FUW at 61–64. General 20-Year eligibility and QD both use ages 20–54. Both fixed-term plans use full source Life questions for every permitted adult amount, preserving separate ATPE and amount owners. ATPE uses source Life/CI questionnaires with separate member/spouse answers, conditional follow-ups and California wording, plus scoped Virginia CI certification and suppressed premium estimates. Approved Group Term processing outcomes remain separate from question selection. Both ATPE term plans use QD with full source questions; QD LI row 79 supersedes the earlier provisional 20-Year FUW outcome. AVMA retains its STD GI/no-health flow as an approved provisional exception pending missing form information. WAEPA and NSO have explicit assignments to the shared source Life questions; all adult Standard WAEPA Life requests use them, independently of processing. Standard WAEPA Life uses QD through age 49 up to $1 million and ages 50–59 up to $500,000, with FUW otherwise within existing eligibility and benefit limits. C52 authorization applies to participating QD Disability or combined QD Life plus Disability, with Minnesota/Virginia priority and ABE preserved. Standard WAEPA STD uses QD at ages 17–49 and FUW at 50–69, with existing DI questions provisionally for FUW; eligibility and the 30-hour rule remain unchanged. Standard WAEPA retains phone on Membership and shows business details only when STD is selected. AVMA retains required college text collection; the missing approved dropdown list is explicitly deferred as nonblocking. Medical authorization and its introductory medical statement follow actual health-question participation, including CI, outside ABE. Connecticut’s source warning appears immediately before the member signature when actual health questions participate, preserving ABE. Standard WAEPA Life receives the accelerated-death-benefit note and the New York-only bold war notice after Fraud Notice and before Consent. The approved source standard, Minnesota and Virginia QD versions use native captured wording variants; Minnesota’s post-consent HIV exclusion retains its placement. WAEPA Associate Member reference details include the source's optional member middle initial, separate from the applicant's own name. NSO nurse-type collection uses a reusable dropdown with its three source choices and an explicit NSO assignment. ISITRUST retains the monthly ACH or Bill me choice, including ATPE; its legacy skip flag does not remove Payment. AMA C80/C97 consent selection and the Physician-only opening use captured Review configuration. Other shared consent uses actual health-question participation, with dedicated Standard WAEPA C86 and WAEPA GI C114 wording preserved. Supplemental Health attestation is a source-backed 14pt native block before signature for AMA, AVMA and ISITRUST, with AMA’s no-title exception; ABE remains unchanged. The approved beneficiary-note mapping uses common fixed-term C2 and plan-wide C3 copy, plus CSEA AD&D C6, through a reusable native definition and explicit Site/product/adult-applicant assignments. Child automatic beneficiaries and PDF scope remain separate. Beneficiary now follows the approved source-specific applicant/Association flags, including ATPE CI collection, ISITRUST AD&D suppression and the two dependent-spouse exclusions. Its bounded source/native/code review closes for the current mock prototype. WAEPA retains monthly ACH/credit-card choices; NSO's unconfirmed collection fee and the IMPORTANT NOTICE viewer are flagged as nonblocking. WAEPA GI displays its full source certification above Read & Sign under the existing signature consent. Current CSEA DI uses the C122 payroll authorization below Electronic Consent; standalone AD&D applicability stays flagged pending source identity. USA Fencing and US Equestrian Federation have explicit $500,000 member caps for AD&D and Group Term Life, retaining native minima/increments and separate dependent/ATPE rules. The missing 14-point HI/CI Coverage notice copy and Site/product scope are explicitly flagged as nonblocking; the active Review attestation remains separate. NSO uses the shared full Life form only when that same adult combines QD Life with FUW Disability, preserving QD processing and Life-only's shorter flow. WAEPA and NSO use source supplemental DI questions only for each adult's native QD Life + FUW Disability combination; DI-only keeps its provisional questionnaire and detailed PDF splitting stays deferred. California CSEA's source-linked DI payroll authorization appears before the member signature; its provisional standalone AD&D remains separate. The premium-contribution statement uses the source's explicit WAEPA GI exclusion, preserving ABE. The implemented category/prods filters intersect the captured Site portfolio and G-number mappings, persist across routes, and restore each application's own context; unknown IDs never broaden the selection. AMA dependent choices use the source spouse label and captured valid-role guard on Eligibility; spouse applicants retain child only and Membership physician details. AMA retains separate Coverage cards instead of a duplicate Membership selector and enforces one premium style per application, including different applicants. Its mock lookup runs on Membership continuation, carries DOB and the synthetic Medical Education Number into saved application state, permits non-member/no-match entry and ignores stale results after identity changes; real integration and XML remain separately flagged. ABE’s source landing dividend viewer opens before application entry, with Cancel and Continue, preserving its accepted Review. The New York source replacement notice appears in each applicable adult’s Profile Other Coverage section only with active Life and replacement Yes, at 12pt bold. AMA uses the source product order through an optional client configuration; other clients retain the default unless configured. featured_prod takes precedence for its available product and category, with captured/restored presentation context and no effect on availability. Quote, Coverage and Coverage Options use the same ordering resolver. Other unimplemented URL behavior is explicitly deferred as nonblocking, with existing working behavior retained. Standard WAEPA omits the unconditional Membership notice copies and retains the scoped Life/NY Life Review notices. Independent Adult Child/Step-Child Associate Member entry supersedes the contradictory dependent 50%/spouse-icon route. CSEA retains standard required spouse First Name/Last Name/DOB without legacy title/middle-initial/suffix fields, with no individual child records for the attached outpatient benefit. Current CSEA keeps spouse and child attached benefits optional, preserving current defaults and independent opt-outs; the displayed under-19 note without a confirmation checkbox is an explicitly accepted provisional exception. The user clarified that work hours belong to DI/OO category selection unless explicitly required more broadly by a client; ISITRUST retains DI/OO Coverage collection and Standard WAEPA collects for DI only. This supersedes the preceding all-member ISITRUST answer; explicit product exceptions and existing minimums remain separate. ISITRUST replaces the spouse-membership attestation with the source informational notice in the visible spouse Eligibility section, without inventing cross-application enrollment enforcement. User clarification identifies GMA-JI-L as the external QD health questionnaire. The prototype intentionally shows only its loading state and does not host those questions. Assigned external QD questionnaires count for Review health participation; ABE remains preserved. ABE Professional Overhead separately requires a firm-member count of 1–5 on Coverage, independently of its 30-hour work rule. The incomplete dedicated WAEPA CIR questionnaire is explicitly deferred as nonblocking; its sheet stops at question 7 but refers to questions 9 and 10, and the current shared Life flow is retained provisionally. ISITRUST Group Term mock rating applies a 12-month tobacco lookback for general associations and 24 months for ATPE, using captured product/association policy. Calendar-anniversary classification changes rating inputs/classes only; original answers, other products and ATPE suppression remain separate. Missing/invalid/future dates retain smoker classification. NSO AD&D uses current source member/spouse ages 17–69 and child ages through 18, extended through 25 only for full-time students, using canonical constraints and the shared student field. Existing explicit ASCE 10-/20-Year age approvals supersede their conflicting source ranges. These adoptions have separate atomic rows and owner evidence; other source instructions remain under review.

A bounded existing Membership review confirms the captured ABE/ASCE/AVMA/NSO member questions, ABE spouse question, AVMA graduation/practice collection, CSEA combined membership-and-duties gate and clerical classification, and the absence of required ABE Membership ID collection. CSEA’s child rider displays its $50/two-visit benefit and covered outpatient settings; claims processing is outside that description. These exact leaves retain edit-sensitive native checks and rendered evidence, without closing parent source cells.

The 22 earlier requirements retain their exact reviewed/exception dispositions. Remaining instructions in those cells stay open. Approved and provisional decision records retain their authority and source-reconciliation status separately from literal source instructions. ISI St. Louis remains pending. Existing field/rider decisions are preserved.

## Source boundaries

Main-sheet rows use the explicit active Site/product identity crosswalk, including CSEA's provisional mapping. Other variants remain outside approved scope. The inventory also records ${report.counts.missingMainBehaviorCoordinates} behavioral coordinates with no extracted source record, including Main!H246. Absence does not establish N/A or an implementation gap; related sources and accepted decisions need inspection.

The primary Attestation rows now have explicit Site-label evidence, including reviewed merged-cell boundaries and online/PDF columns. Adjacent GI/student/conference/upgrade variants are not assigned to those Sites. Named noncurrent variants on the shared Review, consent, smoking and decision sheets now have explicit reference-only scope; remaining shared/supporting instructions retain their separate applicability review. The dedicated full financial questionnaire has no current Site assignment: the current ACS source trigger and historical AANA native assignment remain distinct outside-scope evidence. Its scope review reopens on new current assignments or source triggers. Common instruction sheets and the reviewed Attestation cells have clause queues; QD, plan, rider, question-set and other shared evidence still require exact applicability review before their instructions can be fully enumerated. The generator does not guess ownership from nearby labels. Historical UX sheets remain reference-only under the current prototype authority decision. The drawing review accounts for 210 anchors, all 195 snapshot media files and five embedded object parts against the original workbook. Current-Site imagery is branding reference; CAT and APWU object/screenshot instructions and WAEPA Whole Life imagery remain outside current variants. Rich-data AVMA/APhA logos and legacy object icons are separately accounted. The formula and three comments have explicit historical/outside-Site scope review. All 1,022 hyperlinks are accounted separately: legacy URL examples retain their parameter review, logo/rider references retain their bounded scope, and the missing QD state-variation document is explicitly flagged as nonblocking by the user. Associations/URL application behavior still needs its own reconciliation. The historical checklist is not presented as part of the new workbook. The source workbook's recorded currency is: **${report.scope.sourceCurrency}**

The currentSourceChanges register separates content changes from metadata changes and retains previous/current values. The user explicitly approved the nine ISITRUST residency lists at Main!N278:N286 on October 20. Their reusable global definitions have explicit ISITRUST assignments and adoption-decision links; the prior selections remain superseded historical evidence. YT means Yukon and no longer excludes Utah through a spelling repair. Mainland US plus DC remains the existing provisional country scope. ATPE retains its distinct restrictions under its separately recorded assignment decision. Other compiler derivations remain pinned to historical evidence until explicitly reviewed.

Enumerated source text is split losslessly into line/sentence clause candidates, with offsets and full cells in sourceCells. Candidates outside bounded completed reviews remain **clause-review-pending**: sentence boundaries cannot prove semantic atomicity, and guards can span clauses. These candidates overlap the separately reviewed/manual rows; do not add them together as unique business requirements.

The exported source ledger groups original source keys by sheet, enumeration disposition, extraction classification and promotion state. The pinned source-input hash binds their content and metadata. Requirement/sourceCells references retain exact cell links. Grouping changes storage size, not the source records or their status.

## Reusable global configuration

${report.authoringPrinciple}

Every manually enumerated requirement has a configurationPlan naming the reusable global field, condition or typed policy contract and the explicit Site assignment target. Existing shared definitions are referenced directly. Unsupported qualification/association predicates remain contract gaps. The ownerEvidence section captures identified stored records and hashes, so reviewers can inspect current values separately from the proposed global configuration. These remain Step 1 authoring targets except the explicitly approved WAEPA qualifications and ISITRUST residency definitions/assignments. Service-owned controls retain their service contract.

The explicit MCR uniqueness register includes:

| Source | Reusable definition/content target | Active Site assignments | Disposition |
| --- | --- | --- | --- |
${report.explicitUniqueMcrRequirements.map(row => `| ${row.sourceReferences.join(", ")} | ${row.globalDefinition.key}; ${row.contentDefinition.key} | ${row.activeSiteKeys.join(", ") || "None established"} | ${row.disposition} |`).join("\n")}

ABE dividend behavior uses the captured abe.review-policy and preserves accepted notices/fields and later dividend decisions. The consentReview register inventories each current Site's stored Review blocks, fields, predicates and sources; shared Review fields and jurisdiction notices still need their own comparison. The user's ABE confirmation does not imply additional unmentioned consent controls. Compass Rose remains outside approved scope. Custom consent is explicitly deferred as a flagged, nonblocking requirement until the user supplies wording and Site assignments. A reusable definition does not make its content a default for every Site.

## Catalog and owner boundaries

Catalog records have reverse requirement links and explicit rationales. Documentation, routing, planned and source-reference status remain separate from coverage disposition. Consumers inferred from an area are discovery entry points. Non-archival cell target links appear as owner candidates; archived records never become execution owners through this report.

Contact has bounded owner/code reviews for required ABE email carried from Membership, WAEPA telephone and product-scoped business collection, empty-only location carry-forward and same-as-home restoration/copying. Its closure is limited to the current mock prototype; detailed PDF output remains deferred. Changes to captured owners or pinned implementation/tests reopen the area.

The save/resume batch covers retention, link/code expiry, attempt/challenge/request limits, revocation, single use, capability rotation and recovery isolation. Its constants belong to scripts/applicant-saves.mjs and are not Library-editable. The ten mock service contracts now have boundary, restart, isolation, client-save and rendered resume evidence, bound to reviewed source/test fingerprints. Service edits require re-verification. Shared submit/Back/unmount persistence, successful and failed saves in both layouts, responsive success feedback, and changed-revision revalidation are also reviewed against source/test fingerprints. Save and resume is closed for the current mock prototype while these fingerprints match. Production service assurance remains separate.

## Remaining Step 1 work

${report.completionGate.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Reproduce with \`npm run rules:crosswalk\`; detect artifact drift with \`npm run rules:crosswalk:check\`. Checks cover source conservation, source/catalog completeness, owner references, retained decisions, hierarchy dependencies, deterministic export and absence of generator mutations. Approved qualification definitions and hierarchy metadata are included when the reviewed seed is regenerated. A running mock server must reload that seed for new sessions; existing saved drafts/releases require an explicit migration or a newly based draft/release. Full execution-owner reconciliation and Steps 2–5 remain open.
`;
}
