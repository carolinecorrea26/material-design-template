import { parseUnqualifiedAge } from "./activeSiteEligibilityAdoption";
import { currentMcrSource } from "./currentMcr";
import { nsoAccidentAgeReviewKey, nsoAccidentChildAgeReviewKey } from "./nsoAccidentAgeAdoption";
import { reviewedAgeCodeMatches } from "./requirementCrosswalkAgeReview";
import { reviewedEntryCodeMatches } from "./requirementCrosswalkEntryReview";
import { amaProductOrderDecisionKey } from "./amaProductOrderAdoption";
import { workHoursCollectionDecisionKey } from "./workHoursCollectionDecision";
import { tobaccoLookbackDecisionKey } from "./tobaccoLookbackAdoption";
import { reviewedTobaccoLookbackCodeMatches } from "./requirementCrosswalkTobaccoReview";
import { cseaDependentCollectionDecisionKey } from "./cseaDependentCollectionDecision";
import { amaDependentCollectionReviewKey } from "./amaDependentCollectionAdoption";
import { reviewedMembershipBasicsCodeMatches } from "./requirementCrosswalkMembershipReview";
import { waepaMembershipCollectionReviewKey } from "./waepaMembershipCollectionReview";
import { reviewedExternalQdCodeMatches } from "./requirementCrosswalkExternalQdReview";
import { abeFirmSizeDecisionKey } from "./abeFirmSizeAdoption";
import { externalQdQuestionnaireDecisionKey } from "./externalQdQuestionnaireDecision";
import { isitrustSpouseNoticeReviewKey } from "./isitrustSpouseNoticeAdoption";
import { cseaDependentBenefitDecisionKey } from "./cseaDependentBenefitInterpretation";
import { waepaMembershipInterpretationKey } from "./waepaMembershipInterpretation";
import { waepaMemberReferenceReviewKey } from "./waepaMemberReferenceAdoption";
import { sportAssociationCapDecisionKey, sportAssociationKeys } from "./isitrustSportAssociationCapAdoption";
import { nsoCombinedLifeDecisionKey } from "./nsoCombinedLifeQuestionnaireAdoption";
import { combinedDisabilityQuestionnaireDecisionKey } from "./combinedDisabilityQuestionnaireAdoption";
import { giAndPayrollReviewDecisionKey } from "./giAndPayrollReviewAdoption";
import { sharedLifeQuestionnaireDecisionKey } from "./sharedLifeQuestionnaireAdoption";
import { waepaLifeUnderwritingDecisionKey } from "./waepaLifeUnderwritingAdoption";
import { qdDisabilityAuthorizationKey } from "./qdDisabilityAuthorizationAdoption";
import { membershipLookupDecisionKey, abeLandingNoticeDecisionKey } from "./membershipLookupAndLandingAdoption";
import { amaPremiumStyleDecisionKey } from "./amaPremiumStyleAdoption";
import { profileReplacementNoticeKey } from "./profileReplacementNoticeAdoption";
import { premiumContributionStatementKey } from "./premiumContributionStatementAdoption";
import { cseaPayrollAuthorizationKey } from "./cseaPayrollAuthorizationAdoption";
import { paymentReviewDecisionKey } from "./paymentReviewDecisions";
import { beneficiaryParticipationDecisionKey } from "./beneficiaryParticipationAdoption";
import { isBeneficiaryParticipationPolicy } from "../domain/beneficiaryParticipation";
import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";
import { atpeAmountSelections, atpeAssociationKey, atpeEligibilitySelections, atpeUnderwritingSelections } from "./atpeAssociationAdoption";
import { amaConsentDecisionKey } from "./amaConsentAdoption";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { waepaReferralDecisionKey } from "./waepaReferralAdoption";
import { jurisdictionReviewNoticePrefix } from "./jurisdictionReviewNoticeAdoption";
import { waepaSpouseMembershipDecisionKey } from "./waepaSpouseMembershipAdoption";
import { isitrustStdHealthDecisionKey } from "./isitrustStdHealthDecision";
import { avmaStdHealthDecisionKey } from "./avmaStdHealthDecision";
import { waepaStdUnderwritingDecisionKey } from "./waepaStdUnderwritingAdoption";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { beneficiaryNoteDecisionPrefix } from "./beneficiaryNoteAdoption";
import { isBeneficiaryNotePolicy } from "../domain/beneficiaryNotes";
import { sharedConsentDecisionPrefix } from "./sharedConsentAdoption";
import { supplementalHealthReviewPrefix } from "./supplementalHealthReviewAdoption";
import { nsoNurseTypeReviewKey } from "./nsoNurseTypeAdoption";
import { reviewAuthorizationDecisionPrefix } from "./reviewAuthorizationAdoption";
import { waepaContactDecisionKey } from "./waepaContactAdoption";
import { isitrustPaymentDecisionKey } from "./isitrustPaymentDecision";
import { isitrustTermUnderwritingDecisionKey } from "./isitrustTermUnderwritingAdoption";
import { isitrustQuestionnaireDecisionKey } from "./isitrustQuestionnaireAdoption";
import { atpeQuestionnaireDecisionKey } from "./atpeQuestionnaireAdoption";
import { isHealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { isReviewPolicy } from "../domain/reviewPolicy";
import type { FieldDefinition } from "../domain/fields";

type Owner = { table: string; key: string; column?: string };
const owner = (key: string): Owner => ({ table: "configurationValues", key, column: "value" });
const canonical = (value: unknown): string => value && typeof value === "object" ? Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${key}:${canonical(item)}`).join(",")}}` : JSON.stringify(value) ?? "undefined";
const originalAuthorization = (value: unknown) => {
  if (!value || typeof value !== "object") return value;
  const authorization = structuredClone(value) as { wording?: { processingVariants?: unknown } };
  if (authorization.wording) delete authorization.wording.processingVariants;
  return authorization;
};
export function reviewedAtpeOwnersMatch(db: DatabaseSchema, owners: Owner[]) {
  const review = db.semanticRequirements.find(row => row.key === "business-decision.rules-review.atpe-native-owners")?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  const current = (ref: Owner) => {
    const records = db[ref.table as keyof DatabaseSchema] as Array<{ key: string } & Record<string, unknown>>;
    const record = records?.find(row => row.key === ref.key);
    return ref.column ? record?.[ref.column] : record;
  };
  return owners.length > 0 && owners.every(ref => {
    const recorded = review?.owners?.find(owner => owner.table === ref.table && owner.key === ref.key && owner.column === ref.column);
    return recorded && canonical(recorded.reviewedValue) === canonical(current(ref));
  });
}
export function reviewedAdoptionRequirements(db: DatabaseSchema): CrosswalkRow[] {
  const rows: CrosswalkRow[] = [];
  const verified = (owners: Owner[]) => reviewedAtpeOwnersMatch(db, owners);
  const current = (ref: Owner) => {
    const record = (db[ref.table as keyof DatabaseSchema] as Array<{ key: string } & Record<string, unknown>>)?.find(row => row.key === ref.key);
    return ref.column ? record?.[ref.column] : record;
  };
  function add(id: string, area: string, site: string, product: string | null, applicant: string | null, sources: string[], expected: string, owners: Owner[], matches: boolean, tests: string[], association = false) {
    rows.push({ id: `atomic.adopted.${id}`, kind: "source-requirement", area,
      scope: { siteKeys: [site], productKeys: product ? [product] : [], applicantKeys: applicant ? [applicant] : [], associationKeys: association ? [atpeAssociationKey] : [], modes: ["application"], basis: "Dedicated source rows and explicit October 20 user decisions; captured native owner values.", unresolved: [] },
      sourceReferences: sources, sourceKey: null, expectedBehavior: expected, context: "This atom covers only the stated behavior. Other instructions in the source remain separate requirements.",
      ruleKeys: [area === "Review and consent" ? "rule-review-conditional-consent-blocks" : "rule-coverage-product-policy-owners"], rationale: null, atomization: "reviewed", executionOwners: owners, ownerCandidates: [], serviceOwner: null, ownerResolution: "recorded-review",
      implementationReferences: area === "Review and consent" ? ["src/domain/reviewPolicy.ts", "src/config/reviewExperience.ts", "src/pages/Review.tsx"] : area === "Payment and rates" ? ["src/domain/paymentPolicy.ts", "src/pages/Payment.tsx"] : ["src/domain/associationAmountPolicy.ts", "src/domain/associationEligibilityPolicy.ts", "src/domain/dependentPolicy.ts", "src/domain/associationUnderwriting.ts", "src/domain/coverageRuntime.ts", "src/domain/coverageJourney.ts", "src/config/flowGates.ts"],
      verificationReferences: tests, verificationStatus: matches ? "recorded-evidence" : "not-verified", disposition: "adopted-user-decision", finding: matches ? "Captured native owner values match the reviewed adoption. Scoped persistence and runtime behavior have regression evidence." : "Owning data changed or the adoption evidence is unavailable. Reverify this edited requirement.",
    });
  }
  for (const slice of atpeAmountSelections) for (const [applicant, selection] of Object.entries(slice.amounts)) {
    const ref = owner(`isitrust.${slice.productKey}.atpe-amounts`);
    const column = applicant === "member" ? "H" : applicant === "spouse" ? "I" : "J";
    const amounts = current(ref) as { amounts: Array<{ applicantKey: string; amountPatternKey: string }> };
    const key = amounts?.amounts.find(row => row.applicantKey === applicant)?.amountPatternKey;
    const owners = [ref, ...db.coverageAmountPatterns.filter(row => row.key === key).map(row => ({ table: "coverageAmountPatterns", key: row.key })), ...db.amountBands.filter(row => row.amountPatternKey === key).map(row => ({ table: "amountBands", key: row.key })), ...db.amountOptions.filter(row => row.amountPatternKey === key).map(row => ({ table: "amountOptions", key: row.key }))];
    const test = ["src/migration/atpeAssociationAdoption.test.ts"];
    if (Array.isArray(selection)) add(`atpe.${slice.productKey}.${applicant}.choices`, "Coverage", "isitrust", slice.productKey, applicant, [`Main!${column}${slice.row}`], `ATPE ${applicant} offers exactly ${selection.join(", ")}.`, owners, verified(owners), test, true);
    else for (const [part, value] of Object.entries(selection)) add(`atpe.${slice.productKey}.${applicant}.${part}`, "Coverage", "isitrust", slice.productKey, applicant, [`Main!${column}${slice.row}`], `ATPE ${applicant} amount ${part} is ${value}.`, owners, verified(owners), test, true);
  }
  for (const slice of atpeEligibilitySelections) for (const rule of slice.rules) {
    const owners = [owner(`isitrust.${slice.productKey}.association-eligibility`)];
    const column = rule.applicantKey === "member" ? slice.row === 180 ? "R" : "O" : rule.applicantKey === "spouse" ? slice.row === 180 ? "S" : "P" : "Q";
    const source = `Main!${column}${slice.row}`;
    for (const [bound, age] of Object.entries({ minimumAgeDays: rule.minimumAgeDays, minimumAgeYears: rule.minimumAgeYears, maximumAgeYears: rule.maximumAgeYears, studentMaximumAgeYears: rule.studentMaximumAgeYears })) if (age !== undefined) add(`atpe.${slice.productKey}.${rule.applicantKey}.age.${bound}`, "Eligibility", "isitrust", slice.productKey, rule.applicantKey, [source], `ATPE ${rule.applicantKey} ${bound} is ${age}, inclusive.${bound === "studentMaximumAgeYears" ? " Full-time-student status is required only for the extension above the ordinary maximum." : " Dedicated Association age bounds replace only the shared age bounds."}`, owners, verified(owners), ["src/migration/atpeAssociationAdoption.test.ts"], true);
    if (rule.unmarried) add(`atpe.${slice.productKey}.${rule.applicantKey}.age.unmarried`, "Eligibility", "isitrust", slice.productKey, rule.applicantKey, [`Main!T${slice.row}`], "ATPE child coverage requires unmarried status; an unanswered status does not establish eligibility.", owners, verified(owners), ["src/migration/atpeAssociationAdoption.test.ts"], true);
    if (!rule.eligible) add(`atpe.${slice.productKey}.${rule.applicantKey}.age.participation`, "Eligibility", "isitrust", slice.productKey, rule.applicantKey, [`Main!J${slice.row}`], "ATPE does not offer child coverage on this product.", owners, verified(owners), ["src/migration/atpeAssociationAdoption.test.ts"], true);
  }
  const advisoryOwners = [owner("isitrust.li-group-term.reviewed-dependent-policy"), { table: "contentValues", key: "isitrust.dependent.spouse-half-member-advisory", column: "value" }];
  for (const slice of atpeUnderwritingSelections) for (const rule of slice.rules) for (const [index, band] of rule.bands.entries()) {
    const owners = [owner(`isitrust.${slice.productKey}.journey-policy`)];
    const sources = slice.row === 179 ? [`Main!${rule.applicantKey === "member" ? "H" : rule.applicantKey === "spouse" ? "I" : "W"}179`] : slice.row === 180 ? ["Main!Z180", "Main!AA180"] : slice.row === 181 ? ["Main!Z181", ...((rule.applicantKey === "member" ? ["J79", "O79"] : ["K79", "P79"]).map(cell => `QD LI!${cell}`))] : [`Main!Z${slice.row}`];
    add(`atpe.${slice.productKey}.${rule.applicantKey}.underwriting.${index + 1}`, "Health", "isitrust", slice.productKey, rule.applicantKey, sources,
      `At ages ${band.minimumAgeYears}–${band.maximumAgeYears},${band.minimumAmount === undefined ? "" : ` amount ${band.minimumAmountExclusive ? ">" : ">="} ${band.minimumAmount},`}${band.maximumAmount === undefined ? "" : ` amount <= ${band.maximumAmount},`} select ${band.pathway} processing and ${band.healthPage ?? "no health questionnaire"}.${slice.row === 181 ? " The user-approved QD selection supersedes the earlier provisional FUW outcome. QD LI row 79 retains Core QD through $500,000 and Expanded QD above it as supporting source evidence." : ""}`, owners, verified(owners), ["src/migration/atpeUnderwritingAdoption.test.ts"], true);
  }
  const labelOwners = [owner("isitrust.li-50plus.journey-policy")];
  add("atpe.li-50plus.display-name", "Coverage", "isitrust", "li-50plus", null, ["Main!D185", "User decision October 20, 2026"], "Display Graded Benefit Life for the ATPE selection; retain the shared product name for other Associations.", labelOwners, verified(labelOwners), ["src/migration/atpeAssociationAdoption.test.ts"], true);
  add("atpe.li-group-term.spouse.advisory", "Coverage", "isitrust", "li-group-term", "spouse", ["Main!I179"], "When spouse coverage exceeds 50% of member coverage, display the advisory comparison; retain selectable amounts through the separate $500,000 maximum without a hard relative cap.", advisoryOwners, verified(advisoryOwners), ["src/migration/atpeAssociationAdoption.test.ts", "src/components/coverage/ProductCatalog.test.tsx"], true);
  const consentOwner = owner("ama.review-policy"), consent = (current(consentOwner) as { consent?: unknown })?.consent;
  const approved = db.semanticRequirements.find(row => row.key === amaConsentDecisionKey)?.value as { selected?: unknown } | undefined;
  const matches = consent !== undefined && canonical(consent) === canonical(approved?.selected);
  for (const [suffix, sources, expected] of [
    ["underwritten-consent", ["Read & Sign!B3", "Read & Sign!C80"], "Any selected member/spouse Life, DI or Overhead request uses AMA C80 consent, including mixed requests."],
    ["other-consent", ["Read & Sign!B4", "Read & Sign!C97"], "Child-only Life, AD&D-only and Hospital-Income-only requests use AMA C97 consent."],
    ["physician-opening", ["Read & Sign!C97", "User decision October 20, 2026"], "Retain 'I am a physician and' only when applicant type is Physician; other accepted types receive the remainder without that claim."],
    ["missing-applicant-type", ["Read & Sign!C97", "User decision October 20, 2026"], "Missing or invalid applicant type cannot select the conditional C97 wording or pass Review."],
  ] as const) add(`ama.${suffix}`, "Review and consent", "ama", null, null, [...sources], expected, [consentOwner], matches, ["src/migration/amaConsentAdoption.test.ts"]);
  const initialStatementReview = db.semanticRequirements.find(row => row.key === premiumContributionStatementKey)?.value as { selected?: Array<{ siteKey: string; key: string; statement: string | null }> } | undefined;
  for (const selected of initialStatementReview?.selected ?? []) {
    const ref = owner(selected.key), policy = current(ref) as { premiumContributionStatement?: string | null } | undefined;
    add(`premium-statement.${selected.siteKey}`, "Review and consent", selected.siteKey, null, null, ["Read & Sign!B6", "Read & Sign!B7", ...(selected.siteKey === "waepa-gi" ? ["Read & Sign!B24"] : [])], selected.statement === null ? "Omit the initial premium-contribution statement for WAEPA GI, following its explicit source exception." : "Show the common source premium-contribution statement before the remaining Read & Sign sections, independently of health-question participation. Preserve ABE's accepted Review separately.", [ref], policy?.premiumContributionStatement === selected.statement, ["src/migration/premiumContributionStatementAdoption.test.ts", "src/pages/Review.consent.test.tsx"]);
    rows.at(-1)!.disposition = "adopted-source-requirement";
    rows.at(-1)!.scope.basis = "Dedicated common source statement and explicit WAEPA GI exclusion; no new user business choice inferred.";
  }
  const payrollReview = db.semanticRequirements.find(row => row.key === cseaPayrollAuthorizationKey)?.value as { selected?: { key: string }; sourceReferences?: string[] } | undefined;
  if (payrollReview?.selected) {
    const ref = owner("csea.review-policy"), value = current(ref) as { blocks?: Array<{ key: string }> } | undefined;
    add("csea.payroll-authorization", "Review and consent", "csea", "di-ltd", "member", payrollReview.sourceReferences ?? [], "For California CSEA DI applications, display the source payroll-deduction authorization immediately above the member signature, independently of health questions. Do not assign it to standalone AD&D without a payroll source.", [ref], canonical(value?.blocks?.find(block => block.key === payrollReview.selected!.key)) === canonical(payrollReview.selected), ["src/migration/cseaPayrollAuthorizationAdoption.test.ts"]);
    rows.at(-1)!.disposition = "adopted-source-requirement";
    rows.at(-1)!.scope.basis = "Dedicated current-source California CSEA statement and source-linked payroll DI product; no new business interpretation or acknowledgement is inferred.";
  }
  const methodReview = db.semanticRequirements.find(row => row.key === paymentReviewDecisionKey)?.value as { selected?: Array<{ siteKey: string; key: string; payment: unknown; billing: { feePerCollection: Record<string, number> } }> } | undefined;
  for (const selected of methodReview?.selected ?? []) {
    const ref = owner(selected.key), value = current(ref) as { payment?: unknown; billing?: { feePerCollection: Record<string, number> } } | undefined;
    const nso = selected.siteKey === "nso", product = selected.key.split(".")[1];
    add(`payment-review.${selected.siteKey}.${product}`, "Payment and rates", selected.siteKey, product, null, nso ? ["Main!AH318", "Main!AI318", "User decision October 20, 2026"] : [`Main!AE${selected.siteKey === "waepa-gi" ? 386 : product === "di-short-term" ? 380 : 379}`, `Main!AK${selected.siteKey === "waepa-gi" ? 386 : product === "di-short-term" ? 380 : 379}`, "User decision October 20, 2026"], nso ? "Retain zero Direct Bill collection fees provisionally. The unconfirmed $5 source fee is explicitly deferred as nonblocking until the user supplies confirmed fee/basis information." : "Require monthly ACH or credit card. The approved method interpretation resolves the conflicting no-credit-card statement; preserve existing mock payment handling.", [ref], canonical(nso ? value?.billing?.feePerCollection["bill-me"] : value?.payment) === canonical(nso ? selected.billing.feePerCollection["bill-me"] : selected.payment), ["src/pages/Payment.policy.test.tsx"]);
  }
  const paymentReview = db.semanticRequirements.find(row => row.key === isitrustPaymentDecisionKey)?.value as { selected?: Array<{ key: string; payment: unknown; billing: unknown }> } | undefined;
  for (const selected of paymentReview?.selected ?? []) {
    const ref = owner(selected.key), value = current(ref) as { payment?: unknown; billing?: unknown } | undefined;
    const matches = canonical({ payment: value?.payment, billing: value?.billing }) === canonical({ payment: selected.payment, billing: selected.billing });
    const productKey = selected.key.replace("isitrust.", "").replace(".journey-policy", "");
    const sourceRows = [activeSiteMainRows.isitrust[productKey], ...atpeAmountSelections.filter(slice => slice.productKey === productKey).map(slice => slice.row)];
    for (const [suffix, expected] of [
      ["collection", "Require a payment-method choice. The legacy Skip Payment flag does not remove the Payment step."],
      ["methods", "Offer ACH (Bank account) or Direct Bill (Bill me); Bill me requires no bank details."],
      ["frequency", "Offer monthly billing for either payment method."],
    ]) add(`isitrust.${productKey}.payment.${suffix}`, "Payment and rates", "isitrust", productKey, null, [...sourceRows.map(row => `Main!${suffix === "collection" ? "AF" : suffix === "methods" ? "AE" : "AG"}${row}`), "User decision October 20, 2026"], `${expected} Applies to current eligible Associations, including ATPE where this product is available.`, [ref], matches, ["src/pages/Payment.policy.test.tsx"]);
  }
  const questionnaireOwner = owner("isitrust.atpe.health-questionnaires");
  const questionnaire = current(questionnaireOwner);
  const questionnaireReview = db.semanticRequirements.find(row => row.key === atpeQuestionnaireDecisionKey)?.value as { selected?: { policy: unknown; fields: FieldDefinition[]; rate: unknown; review: unknown } } | undefined;
  const selected = questionnaireReview?.selected;
  if (isHealthQuestionnairePolicy(questionnaire)) for (const variant of questionnaire.variants) for (const item of variant.items) {
    const fields = [...(item.questionFieldKey ? [item.questionFieldKey] : []), ...item.fieldKeys];
    const owners = [questionnaireOwner, ...fields.map(key => ({ table: "fields", key, column: "definition" }))];
    const matches = canonical(questionnaire) === canonical(selected?.policy) && fields.every(key => canonical(current({ table: "fields", key, column: "definition" })) === canonical(selected?.fields.find(field => field.id === key)));
    const test = ["src/migration/atpeQuestionnaireAdoption.test.tsx"];
    const guard = `Variant ${variant.key}, per applicant; selection ${JSON.stringify(variant.when)}${item.when ? `; additional guard ${JSON.stringify(item.when)}` : ""}.`;
    if (item.questionFieldKey) add(`atpe.questionnaire.${variant.key}.${item.key}.answer`, "Health", "isitrust", null, null, item.sourceReferences,
      `Require the captured Yes/No answer: ${(current({ table: "fields", key: item.questionFieldKey, column: "definition" }) as FieldDefinition).label} ${guard}`, owners, matches, test, true);
    for (const key of item.fieldKeys) {
      const field = current({ table: "fields", key, column: "definition" }) as FieldDefinition;
      add(`atpe.questionnaire.${variant.key}.${item.key}.${key}`, "Health", "isitrust", null, null, item.sourceReferences,
        `${item.questionFieldKey ? "On Yes, collect" : "Collect"} ${field.label}; ${field.required ? "required" : "optional"}${field.maxLength ? `, at most ${field.maxLength} characters` : ""}${field.options ? `; choices ${field.options.map(option => option.label).join(", ")}` : ""}. ${item.repeated ? "Allow repeatable records and require at least one complete record on Yes." : "Use the captured field definition and format."} ${guard}`, owners, matches, test, true);
    }
  }
  const participationReview = db.semanticRequirements.find(row => row.key === beneficiaryParticipationDecisionKey)?.value as { selected?: Array<{ siteKey: string; policy: unknown }> } | undefined;
  for (const selected of participationReview?.selected ?? []) {
    if (!isBeneficiaryParticipationPolicy(selected.policy)) continue;
    const ref = owner(`${selected.siteKey}.beneficiary-participation`), matches = canonical(current(ref)) === canonical(selected.policy);
    for (const [index, rule] of selected.policy.rules.entries()) {
      const sourceRow = selected.siteKey === "ama" ? 126 : rule.productKey === "li-group-term" ? 278 : rule.productKey === "sh-critical-illness" ? 184 : rule.productKey === "li-50plus" ? 185 : rule.associationKeys?.includes(atpeAssociationKey) ? 182 : 282;
      add(`beneficiary-participation.${selected.siteKey}.${index + 1}`, "Beneficiary", selected.siteKey, rule.productKey, rule.applicantKey, [`Main!AB${sourceRow}`, "User decision October 20, 2026"], `${rule.collect ? "Collect" : "Do not collect"} beneficiary selections for this product/applicant scope. Routing and card display consume the same captured participation owner. Child automatic rules and other coverage remain separate; no unsupported automatic-beneficiary statement is added.`, [ref], matches, ["src/migration/beneficiaryParticipationAdoption.test.tsx"]);
      if (rule.associationKeys) rows.at(-1)!.scope.associationKeys = rule.associationKeys;
    }
  }
  const termReview = db.semanticRequirements.find(row => row.key === isitrustTermUnderwritingDecisionKey)?.value as { selected?: Array<{ key: string; rules: Array<{ associationKey: string; applicantKey: string; bands: Array<{ minimumAgeYears: number; maximumAgeYears: number; minimumAmount?: number; minimumAmountExclusive?: boolean; maximumAmount?: number; pathway: string; healthPage: string | null }> }> }> } | undefined;
  for (const selected of termReview?.selected ?? []) {
    const ref = owner(selected.key), policy = current(ref);
    if (!isCoverageJourneyPolicy(policy)) continue;
    const associationKeys = [...new Set(selected.rules.map(rule => rule.associationKey))];
    const currentRules = policy.associationUnderwriting?.filter(rule => associationKeys.includes(rule.associationKey));
    const matches = canonical(currentRules) === canonical(selected.rules);
    const product = selected.key.includes("li-group-term") ? "li-group-term" : selected.key.includes("li-10yr") ? "li-10yr" : "li-20yr", row = product === "li-group-term" ? 278 : product === "li-10yr" ? 283 : 284, qdRow = product === "li-group-term" ? 74 : product === "li-10yr" ? 75 : 76;
    for (const applicant of ["member", "spouse"]) for (const [index, band] of selected.rules.find(rule => rule.applicantKey === applicant)!.bands.entries()) {
      add(`isitrust.term-underwriting.${product}.${applicant}.${index + 1}`, "Health", "isitrust", product, applicant, [`Main!Z${row}`, `Main!AA${row}`, ...[applicant === "member" ? "J" : "K", applicant === "member" ? "O" : "P"].map(column => `QD LI!${column}${qdRow}`), "User decision October 20, 2026"],
        `At ages ${band.minimumAgeYears}–${band.maximumAgeYears} inclusive, use ${band.pathway} processing with ${band.healthPage === "health-qd" ? "the existing short processing flow" : "the full source Life questionnaire"}; amount scope ${band.minimumAmount === undefined ? "from the permitted minimum" : `${band.minimumAmountExclusive ? "above" : "at least"} $${band.minimumAmount}`} ${band.maximumAmount === undefined ? "through the permitted maximum" : `through $${band.maximumAmount}`}. Supporting QD bands and the user decision resolve the Main conflict. General 20-Year eligibility is separately approved at 20–54. Preserve other eligibility/amount limits, child participation and ATPE's distinct rules.`, [ref], matches, ["src/migration/isitrustTermUnderwritingAdoption.test.ts"]);
      rows.at(-1)!.scope.associationKeys = associationKeys;
    }
  }
  const eligibilityReview = db.semanticRequirements.find(row => row.key === isitrustTermUnderwritingDecisionKey)?.value as { selectedEligibility?: { key: string; rules: Array<{ associationKey: string; applicantKey: string; minimumAgeYears: number; maximumAgeYears: number }> } } | undefined;
  if (eligibilityReview?.selectedEligibility) {
    const selected = eligibilityReview.selectedEligibility, ref = owner(selected.key);
    const policy = current(ref) as { rules?: typeof selected.rules } | undefined;
    const associations = [...new Set(selected.rules.map(rule => rule.associationKey))];
    const matches = canonical(policy?.rules?.filter(rule => associations.includes(rule.associationKey))) === canonical(selected.rules);
    for (const applicant of ["member", "spouse"]) {
      add(`isitrust.twenty-year-eligibility.${applicant}`, "Eligibility", "isitrust", "li-20yr", applicant, [`Main!${applicant === "member" ? "O" : "P"}284`, `QD LI!${applicant === "member" ? "J" : "K"}76`, "User decision October 20, 2026"], "General ISITRUST 20-Year Term accepts ages 20–54 inclusive. This approved source range replaces the native 18–64 range; ATPE retains its separately approved range.", [ref], matches, ["src/migration/isitrustTermUnderwritingAdoption.test.ts"]);
      rows.at(-1)!.scope.associationKeys = associations;
    }
  }
  const generalQuestionnaireOwner = owner("isitrust.general.health-questionnaires"), generalQuestionnaire = current(generalQuestionnaireOwner);
  const generalReview = db.semanticRequirements.find(row => row.key === isitrustQuestionnaireDecisionKey)?.value as { selected?: { policy: unknown; certification: { key: string }; fields: Array<{ key: string; definition: FieldDefinition }> } } | undefined;
  if (isHealthQuestionnairePolicy(generalQuestionnaire) && generalReview?.selected) {
    const selected = generalReview.selected;
    for (const variant of generalQuestionnaire.variants) for (const item of variant.items) {
      const keys = [...(item.questionFieldKey ? [item.questionFieldKey] : []), ...item.fieldKeys];
      const owners = [generalQuestionnaireOwner, ...keys.map(key => ({ table: "fields", key, column: "definition" }))];
      const matches = canonical(generalQuestionnaire) === canonical(selected.policy) && keys.every(key => canonical(current({ table: "fields", key, column: "definition" })) === canonical(selected.fields.find(field => field.key === key)?.definition));
      const guard = `Variant ${variant.key}; per applicant; product guard ${JSON.stringify(variant.when)}${item.when ? `; answer/jurisdiction guard ${JSON.stringify(item.when)}` : ""}. Approved processing and actual page participation remain separate; preserve STD-only's accepted exception.`;
      for (const key of keys) {
        const field = current({ table: "fields", key, column: "definition" }) as FieldDefinition;
        add(`isitrust.general-questionnaire.${variant.key}.${item.key}.${key}`, "Health", "isitrust", null, null, item.sourceReferences,
          `${key === item.questionFieldKey ? "Collect the source Yes/No answer" : item.questionFieldKey ? "On Yes, collect" : "Collect"}: ${field.label}; ${field.required ? "required" : "optional"}${field.maxLength ? `; at most ${field.maxLength} characters` : ""}${field.options ? `; choices ${field.options.map(option => option.label).join(", ")}` : ""}. ${item.repeated && key !== item.questionFieldKey ? "Allow repeated complete detail records; at least one is required on Yes." : "Use the captured shared field format."} ${guard}`,
          owners, matches, ["src/migration/isitrustQuestionnaireAdoption.test.ts", "src/migration/atpeQuestionnaireAdoption.test.tsx"]);
        const row = rows.at(-1)!;
        row.scope.associationKeys = [...generalQuestionnaire.associationKeys]; row.scope.applicantKeys = ["member", "spouse"];
        row.implementationReferences = ["src/domain/configuredHealthQuestionnaire.ts", "src/config/clientFields/getClientPageFields.ts", "src/pages/HealthLi.tsx", "src/app/sections/ConfiguredHealthQuestions.tsx"];
      }
    }
    const policy = current(owner("isitrust.review-policy"));
    add("isitrust.general-ci-virginia-certification", "Review and consent", "isitrust", "sh-critical-illness", null, ["Health Questions!B84", "User decision October 20, 2026"], "For explicitly assigned non-ATPE Associations, show the source Virginia CI certification before signature. ATPE retains its separate assignment; other jurisdictions/products do not inherit it.", [owner("isitrust.review-policy")], isReviewPolicy(policy) && canonical(policy.blocks.find(block => block.key === selected.certification.key)) === canonical(selected.certification), ["src/migration/isitrustQuestionnaireAdoption.test.ts"]);
    rows.at(-1)!.scope.associationKeys = [...generalQuestionnaire.associationKeys];
  }
  const sharedLifeReview = db.semanticRequirements.find(row => row.key === sharedLifeQuestionnaireDecisionKey)?.value as { selected?: Array<{ siteKey: string; key: string; policy: unknown; fields: Array<{ key: string; definition: FieldDefinition }> }>; waepaHealthScope?: { key: string; questions: unknown; healthPageByUnderwriting: unknown } } | undefined;
  for (const selected of sharedLifeReview?.selected ?? []) {
    const ref = owner(selected.key), policy = selected.policy;
    if (!isHealthQuestionnairePolicy(policy)) continue;
    for (const variant of policy.variants) for (const item of variant.items) for (const key of [...(item.questionFieldKey ? [item.questionFieldKey] : []), ...item.fieldKeys]) {
      const fieldRef = { table: "fields", key, column: "definition" }, field = current(fieldRef) as FieldDefinition;
      const matches = canonical(current(ref)) === canonical(selected.policy) && canonical(field) === canonical(selected.fields.find(row => row.key === key)?.definition);
      add(`shared-life.${selected.siteKey}.${variant.key}.${item.key}.${key}`, "Health", selected.siteKey, null, null, item.sourceReferences,
        `${key === item.questionFieldKey ? "Collect source Yes/No answer" : item.questionFieldKey ? "On Yes, collect" : "Collect"}: ${field.label}; ${field.required ? "required" : "optional"}${field.maxLength ? `; maximum ${field.maxLength} characters` : ""}. ${item.repeated && key !== item.questionFieldKey ? "Require complete repeatable details on Yes." : "Use captured field format."} Per adult, explicit Site assignment, product guard ${JSON.stringify(variant.when)}${item.when ? `, conditional guard ${JSON.stringify(item.when)}` : ""}. Actual health participation remains separate from processing; preserve NSO short QD, WAEPA child and GI scope.`,
        [ref, fieldRef], matches, ["src/migration/sharedLifeQuestionnaireAdoption.test.ts"]);
      rows.at(-1)!.scope.applicantKeys = ["member", "spouse"];
      rows.at(-1)!.implementationReferences = ["src/domain/configuredHealthQuestionnaire.ts", "src/domain/coverageJourney.ts", "src/app/sections/ConfiguredHealthQuestions.tsx", "src/pages/HealthLi.tsx"];
    }
  }
  if (sharedLifeReview?.waepaHealthScope) {
    const selected = sharedLifeReview.waepaHealthScope, ref = owner(selected.key), policy = current(ref);
    add("waepa.full-adult-life-questions", "Health", "waepa", "li-group-term", null, ["Main!AA379", "User decision October 20, 2026"], "All permitted adult Life requests use full source Life questions for QD and FUW processing. Child-only, GI Site and STD routing remain separate. Native submission requires active source answers and excludes inactive legacy controls.", [ref], isCoverageJourneyPolicy(policy) && canonical(policy.questions) === canonical(selected.questions) && canonical(policy.healthPageByUnderwriting) === canonical(selected.healthPageByUnderwriting), ["src/migration/sharedLifeQuestionnaireAdoption.test.ts"]);
    rows.at(-1)!.scope.applicantKeys = ["member", "spouse"];
  }
  const lifeBandsReview = db.semanticRequirements.find(row => row.key === waepaLifeUnderwritingDecisionKey)?.value as { selected?: Array<{ key: string; applicantTypeKey: string; minimumAge: number; maximumAge: number; minimumAmount: number; maximumAmount: number; minimumAmountExclusive: boolean; pathway: string }> } | undefined;
  for (const band of lifeBandsReview?.selected ?? []) {
    const ref = { table: "underwritingBands", key: band.key };
    add(`waepa.life-underwriting.${band.key}`, "Health", "waepa", "li-group-term", band.applicantTypeKey, ["QD LI!J92", "QD LI!O92", "User decision October 20, 2026"], `Use ${band.pathway} at ages ${band.minimumAge}–${band.maximumAge}, amounts ${band.minimumAmountExclusive ? ">" : ">="} ${band.minimumAmount} ${band.maximumAmount === Number.MAX_SAFE_INTEGER ? "through separately permitted benefits" : `through ${band.maximumAmount}`}. Keep full source questions in either processing path, eligibility and benefit limits separate.`, [ref], canonical(current(ref)) === canonical(band), ["src/migration/waepaLifeUnderwritingAdoption.test.ts"]);
  }
  const qdAuthorizationReview = db.semanticRequirements.find(row => row.key === qdDisabilityAuthorizationKey)?.value as { selected?: Array<{ siteKey: string; key: string; processingVariants: unknown }> } | undefined;
  for (const selected of qdAuthorizationReview?.selected ?? []) {
    const ref = owner(selected.key), policy = current(ref);
    add(`qd-disability-authorization.${selected.siteKey}`, "Review and consent", selected.siteKey, null, null, ["Read & Sign!B52", "Read & Sign!C52", "User decision October 20, 2026"], "With actual health questions, use source C52 authorization for adult QD Disability or combined adult QD Life plus Disability. Minnesota and Virginia wording take priority. Preserve ABE, consent and no-health flows.", [ref], isReviewPolicy(policy) && canonical(policy.authorization?.wording?.processingVariants) === canonical(selected.processingVariants), ["src/migration/qdDisabilityAuthorizationAdoption.test.ts"]);
  }
  const combinedDiReview = db.semanticRequirements.find(row => row.key === combinedDisabilityQuestionnaireDecisionKey)?.value as { selected?: Array<{ siteKey: string; key: string; policy: unknown }>; fields?: Array<{ key: string; definition: FieldDefinition }> } | undefined;
  for (const selected of combinedDiReview?.selected ?? []) {
    const ref = owner(selected.key), policy = selected.policy;
    if (!isHealthQuestionnairePolicy(policy)) continue;
    for (const variant of policy.variants) for (const item of variant.items) for (const key of [...(item.questionFieldKey ? [item.questionFieldKey] : []), ...item.fieldKeys]) {
      const fieldRef = { table: "fields", key, column: "definition" }, field = current(fieldRef) as FieldDefinition;
      add(`combined-di.${selected.siteKey}.${item.key}.${key}`, "Health", selected.siteKey, null, null, [...item.sourceReferences, "Health Questions!A101", "User decision October 20, 2026"], `${key === item.questionFieldKey ? "Require source Yes/No answer" : "On Yes, require detail"}: ${field.label}${field.maxLength ? `, maximum ${field.maxLength} characters` : ""}. ${item.repeated && key !== item.questionFieldKey ? "Allow repeated complete records." : "Use captured field format."} Only for the same adult's native QD Life + FUW Disability combination. DI-only retains its provisional form; processing and PDF output remain separate.`, [ref, fieldRef], canonical(current(ref)) === canonical(selected.policy) && canonical(field) === canonical(combinedDiReview?.fields?.find(row => row.key === key)?.definition), ["src/migration/combinedDisabilityQuestionnaireAdoption.test.tsx"]);
      rows.at(-1)!.scope.applicantKeys = ["member", "spouse"];
      rows.at(-1)!.implementationReferences = ["src/domain/configuredHealthQuestionnaire.ts", "src/domain/coverageJourneyUnderwriting.ts", "src/domain/coverageJourney.ts", "src/domain/coveragePortfolio.ts", "src/pages/HealthDi.tsx", "src/config/healthFollowUps.ts"];
    }
  }
  const giPayrollReview = db.semanticRequirements.find(row => row.key === giAndPayrollReviewDecisionKey)?.value as { selected?: Array<{ siteKey: string; key: string; block: { key: string; sourceReferences: string[] } }> } | undefined;
  for (const selected of giPayrollReview?.selected ?? []) {
    const ref = owner(selected.key), policy = current(ref);
    add(`gi-payroll.${selected.siteKey}`, "Review and consent", selected.siteKey, selected.siteKey === "csea" ? "di-ltd" : "li-group-term", "member", [...selected.block.sourceReferences, "User decision October 20, 2026"], selected.siteKey === "csea" ? "Show the complete C122 payroll authorization below Electronic Consent online for current CSEA Disability. Standalone AD&D applicability is explicitly flagged pending source identity; no unsupported assignment or new acknowledgement field." : "Show the complete C24 GI certification as a blue informational notice above Read & Sign, covered by the existing signature consent. Do not add separate history/window eligibility answers. Existing age and amount rules remain separate.", [ref], isReviewPolicy(policy) && canonical(policy.blocks.find(block => block.key === selected.block.key)) === canonical(selected.block), ["src/migration/giAndPayrollReviewAdoption.test.ts", "src/pages/Review.consent.test.tsx"]);
  }
  if (giPayrollReview?.selected?.length) {
    add("csea-add-payroll-applicability", "Review and consent", "csea", "li-add", "member", ["Read & Sign!B122", "Read & Sign!C122", "User decision October 21, 2026"], "Flag whether CSEA C122 payroll authorization applies to standalone AD&D; resolve its provisional source identity before assigning this notice. Preserve current behavior meanwhile. This flagged requirement does not block this review.", [], false, []);
    Object.assign(rows.at(-1)!, { id: "atomic.flagged.csea-add-payroll-applicability", disposition: "deferred-by-user", completionBlocking: false, ruleKeys: [], implementationReferences: [], finding: "User approved the DI mapping and explicitly retained standalone AD&D applicability as a flag pending its source identity. Revisit when that identity and payroll scope are established." });
  }
  const amaOrder = db.semanticRequirements.find(row => row.key === amaProductOrderDecisionKey)?.value as { sourceReferences?: string[]; owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (amaOrder?.owners?.length) {
    const refs = amaOrder.owners.map(({ table, key }) => ({ table, key }));
    add("ama.source-product-order", "Coverage", "ama", null, null, amaOrder.sourceReferences ?? [], "Apply AMA's source product sequence through the optional native client productOrder setting: 20-Year, 15-Year, 10-Year, Pure Term, Preferred Term, Premier Accident, Step/Level Disability, Office Overhead, Hospital Income. Other clients retain defaults unless configured. An available featured_prod product and its category take precedence; remaining products keep their configured order.", refs, reviewedEntryCodeMatches() && amaOrder.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/amaProductOrderAdoption.test.tsx", "src/domain/coveragePresentation.test.ts", "src/app/ApplicationFormContext.entryScope.test.tsx"]);
    Object.assign(rows.at(-1)!, { ruleKeys: ["rule-coverage-coverage-options-featured-first-sort-and-category-fallback"], scope: { ...rows.at(-1)!.scope, modes: ["application", "quote", "coverage options"] }, implementationReferences: ["src/domain/coveragePresentation.ts", "src/config/client/getActiveClientCoverages.ts", "src/app/workflows/QuoteCalculator.tsx", "src/components/coverage/CoverageOptionsPanel.tsx", "src/components/coverage/ProductCatalog.tsx"] });
  }
  const waepaMembership = db.semanticRequirements.find(row => row.key === waepaMembershipCollectionReviewKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (waepaMembership?.owners?.length) {
    const refs = waepaMembership.owners.map(({ table, key }) => ({ table, key }));
    add("waepa.new-member-collection", "Membership", "waepa", null, "member", ["Attestation Online and PDF!C122", "Main!R379", "User confirmation October 21, 2026"], "Preserve the current New/Current selector and six approved qualification choices. New Member always shows the required truthfulness checkbox and qualification field; current members do not see that form. Active employees supply agency/start date, former employees have no qualification follow-ups, and current-member stale answers do not reveal them. Display the source membership explanation with qualification; retain standard section naming, optional member number and Membership military collection/blocking.", refs, reviewedMembershipBasicsCodeMatches() && waepaMembership.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/waepaMembershipCollectionReview.test.tsx", "src/migration/mcrReviewDecisions.test.ts", "src/pages/Membership.test.tsx"]);
    Object.assign(rows.at(-1)!, { ruleKeys: ["rule-membership-waepa-new-member-displays-member-information", "rule-membership-waepa-active-federal-employee-fields", "rule-membership-waepa-active-duty-prevents-application"], implementationReferences: ["src/pages/Membership.tsx", "src/config/clientFields/getClientPageFields.ts", "src/config/conditions/evaluateConditions.ts", "src/utils/fieldValidation.ts", "src/domain/applicantExperience.ts"] });
  }
  const amaDependents = db.semanticRequirements.find(row => row.key === amaDependentCollectionReviewKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (amaDependents?.owners?.length) {
    const refs = amaDependents.owners.map(({ table, key }) => ({ table, key }));
    add("ama.dependent-role-collection", "Eligibility", "ama", null, null, ["Attestation Online and PDF!C3"], "Show optional dependent choices after a valid AMA applicant type: spouse/child for Physician, Resident, Student and Retired Physician; child only for Spouse of Physician. Use the source spouse option label naming Premier Accident/Hospital Income. Keep standardized Eligibility placement, no redundant insurance-for question, and existing Membership physician details only for spouse applicants.", refs, reviewedMembershipBasicsCodeMatches() && amaDependents.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/amaDependentCollectionAdoption.test.tsx"]);
    Object.assign(rows.at(-1)!, { ruleKeys: ["rule-membership-ama-spouse-displays-physician-information"], implementationReferences: ["src/pages/Membership.tsx", "src/pages/Eligibility.tsx", "src/config/clientFields/getClientPageFields.ts", "src/config/conditions/evaluateConditions.ts"] });
  }
  const cseaCollection = db.semanticRequirements.find(row => row.key === cseaDependentCollectionDecisionKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (cseaCollection?.owners?.length) for (const [suffix, applicant, expected] of [["standard-spouse-fields", "spouse", "Keep the standard required spouse First Name, Last Name and DOB in the active Eligibility section. The user supersedes legacy title/middle-initial/suffix collection; no duplicate or additional name fields."], ["no-child-records", "child", "For CSEA's optional attached child outpatient benefit, display the under-19 Eligibility note without individual child records. The separately accepted absence of an explicit age confirmation remains a provisional exception."]] as const) {
    const refs = cseaCollection.owners.map(({ table, key }) => ({ table, key }));
    add(`csea.${suffix}`, "Eligibility", "csea", "di-ltd", applicant, ["Attestation Online and PDF!C69", "User decisions October 21, 2026"], expected, refs, cseaCollection.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/cseaDependentCollectionDecision.test.tsx", "src/domain/cseaExperience.test.ts"]);
    Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/pages/Eligibility.tsx", "src/config/clientFields/getClientPageFields.ts", "src/config/pageSections/getPageSections.ts"] });
  }
  const tobaccoReview = db.semanticRequirements.find(row => row.key === tobaccoLookbackDecisionKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (tobaccoReview?.owners?.length) for (const [suffix, months, source] of [["general", 12, "Main!AD278"], ["atpe", 24, "Main!AD179"]] as const) {
    const refs = tobaccoReview.owners.map(({ table, key }) => ({ table, key }));
    add(`isitrust.group-term-tobacco.${suffix}`, "Payment and rates", "isitrust", "li-group-term", null, [source, "User decision October 21, 2026"], `Use a ${months}-calendar-month last-tobacco-use lookback for ${suffix === "atpe" ? "ATPE" : "current non-ATPE associations"} Group Term mock rating, normalizing both class and tobacco input while preserving original answers. Missing/invalid/future dates retain smoker classification; other products and ATPE estimate suppression stay separate.`, refs, reviewedTobaccoLookbackCodeMatches() && tobaccoReview.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/tobaccoLookbackAdoption.test.ts", "src/migration/reviewAndRateAcceptance.test.ts"], suffix === "atpe");
    Object.assign(rows.at(-1)!, { ruleKeys: [], scope: { ...rows.at(-1)!.scope, applicantKeys: ["member", "spouse"], associationKeys: suffix === "atpe" ? [atpeAssociationKey] : db.siteAssociations.filter(row => row.siteKey === "isitrust" && row.enabled && row.associationKey !== atpeAssociationKey).map(row => row.associationKey) }, implementationReferences: ["src/domain/tobaccoLookback.ts", "src/domain/rateInputPolicy.ts", "src/domain/mockRating.ts", "src/app/usePrototypeRates.ts"] });
  }
  for (const [key, applicants] of [[nsoAccidentAgeReviewKey, ["member", "spouse"]], [nsoAccidentChildAgeReviewKey, ["child"]]] as const) {
    const review = db.semanticRequirements.find(row => row.key === key)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
    if (!review?.owners?.length) continue;
    for (const applicant of applicants) for (const [bound, age] of applicant === "child" ? [["maximumAgeYears", 18], ["studentMaximumAgeYears", 25]] as const : [["minimumAgeYears", 17], ["maximumAgeYears", 69]] as const) {
      const refs = review.owners.filter(ref => (ref.reviewedValue as { applicantTypeKey: string }).applicantTypeKey === applicant).map(({ table, key }) => ({ table, key }));
      const source = `Main!${applicant === "member" ? "O" : applicant === "spouse" ? "P" : "Q"}320`;
      add(`nso.accident-ages.${applicant}.${bound}`, "Eligibility", "nso", "li-add", applicant, [source], `${bound} = ${age}, inclusive. ${applicant === "child" ? "The extension beyond 18 requires full-time-student Yes; no unmarried restriction is inferred. Shared child collection supplies student status." : "Use the dedicated current source age range for this adult."} Other eligibility, family amounts and processing remain separate.`, refs, reviewedAgeCodeMatches() && review.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/nsoAccidentAgeAdoption.test.ts"]);
      Object.assign(rows.at(-1)!, { disposition: "adopted-source-requirement", ruleKeys: [], implementationReferences: ["src/domain/effectiveSite.ts", "src/domain/coverageRuntime.ts", "src/domain/fieldCollections.ts", "src/utils/applicantFacts.ts"] });
    }
  }
  // Only complete, unqualified ranges: the anchored parser rejects additional
  // age bands, student clauses and cross-line eligibility guards.
  for (const [site, products] of Object.entries(activeSiteMainRows)) for (const [product, sourceRow] of Object.entries(products)) for (const [applicant, column] of [["member", "O"], ["spouse", "P"], ["child", "Q"]] as const) {
    if (site === "nso" && product === "li-add" || site === "asce" && ["li-10yr", "li-20yr"].includes(product) && applicant !== "child") continue;
    if (!db.siteProductApplicants.some(row => row.siteKey === site && row.productKey === product && row.applicantKey === applicant)) continue;
    const source = `Main!${column}${sourceRow}`;
    const ages = parseUnqualifiedAge(String(currentMcrSource.cells.find(row => row.sheet === "Main" && row.cell === `${column}${sourceRow}`)?.value ?? ""));
    if (!ages) continue;
    const constraints = db.eligibilityConstraints.filter(row => row.siteKey === site && row.productKey === product && row.applicantTypeKey === applicant);
    const refs = constraints.map(({ key }) => ({ table: "eligibilityConstraints", key }));
    const matches = reviewedAgeCodeMatches() && constraints.length === 1 && constraints[0].minimumAgeYears === ages.minimumAgeYears && constraints[0].maximumAgeYears === ages.maximumAgeYears;
    for (const bound of ["minimumAgeYears", "maximumAgeYears"] as const) {
      add(`canonical-age.${site}.${product}.${applicant}.${bound}`, "Eligibility", site, product, applicant, [source], `${bound} = ${ages[bound]}, inclusive. This complete unqualified source range defines completed-year age bounds only. Work, membership, dependent, Association and underwriting predicates retain their separate requirements.`, refs, matches, ["src/migration/canonicalAgeSourceReview.test.ts"]);
      Object.assign(rows.at(-1)!, { disposition: "adopted-source-requirement", ruleKeys: [], scope: { ...rows.at(-1)!.scope, basis: "Exact unqualified current Main source range and unique canonical Site/product/applicant constraint. No source applicability is inferred from adjacent records." }, implementationReferences: ["src/domain/effectiveSite.ts", "src/domain/coverageRuntime.ts", "src/utils/applicantFacts.ts"] });
    }
  }
  const hoursReview = db.semanticRequirements.find(row => row.key === workHoursCollectionDecisionKey)?.value as { selected?: Array<{ siteKey: string; sourceReference: string; categories: string[] }>; owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (hoursReview?.owners?.length) for (const selected of hoursReview.selected ?? []) {
    const refs = hoursReview.owners.map(({ table, key }) => ({ table, key }));
    add(`work-hours.${selected.siteKey}`, "Eligibility", selected.siteKey, null, "member", [selected.sourceReference, "User clarification October 21, 2026"], `Collect member weekly hours on Coverage only for ${selected.categories.join("/")} category selection. No hours are added to Life/AD&D/Health-only entry or Eligibility. Preserve explicit product work-hour requirements and existing minimums. The clarification supersedes the preceding ISITRUST all-member answer.`, refs, hoursReview.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/workHoursCollectionDecision.test.tsx", "src/migration/workEligibilityAdoption.test.ts"]);
    Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/components/coverage/CoverageQuestions.tsx", "src/config/resolvers/resolveCoverageQuestionSections.ts", "src/config/coverageQuestionRequirements.ts", "src/config/fields/coverageFactFields.ts", "src/utils/applicantFacts.ts"] });
  }
  const firmReview = db.semanticRequirements.find(row => row.key === abeFirmSizeDecisionKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (firmReview?.owners?.length) {
    const refs = firmReview.owners.map(({ table, key }) => ({ table, key }));
    add("abe.firm-member-count", "Eligibility", "abe", "oo-professional", "member", ["Main!R48", "User decision October 21, 2026"], "Collect a required whole-number firm-member count on Coverage only for selected ABE Professional Overhead and require 1–5. Missing/invalid counts never establish eligibility; firms above five are ineligible. Preserve the independent 30-hour work rule, other products, employee-count semantics and ABE Review.", refs, firmReview.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/abeFirmSizeAdoption.test.ts"]);
    Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/domain/eligibilityFacts.ts", "src/domain/effectiveSite.ts", "src/domain/coverageRequirements.ts", "src/utils/applicantFacts.ts", "src/config/fields/coverageFactFields.ts", "src/config/clientFields/getClientPageFields.ts", "src/pages/Coverage.tsx"] });
  }
  if (db.semanticRequirements.some(row => row.key === externalQdQuestionnaireDecisionKey)) {
    add("external-qd.prototype-loading-state", "Health", "nso", null, null, ["Health Questions!A4:B5", "User clarification October 21, 2026"], "GMA-JI-L identifies externally hosted QD health questions. The prototype intentionally shows their loading state and does not host the questions, answers or iframe integration. Preserve separately approved full source questionnaires.", [], reviewedExternalQdCodeMatches(), ["src/migration/externalQdQuestionnaireDecision.test.ts"]);
    Object.assign(rows.at(-1)!, { ruleKeys: [], scope: { ...rows.at(-1)!.scope, siteKeys: Object.keys(activeSiteMainRows), modes: ["prototype", "external questionnaire boundary"] }, codeOwner: "HealthQd loading-state presentation; actual QD questionnaire belongs to external iframe", ownerResolution: "code-owned", implementationReferences: ["src/pages/HealthQd.tsx", "src/config/reviewExperience.ts"] });
  }
  const sportCapReview = db.semanticRequirements.find(row => row.key === sportAssociationCapDecisionKey)?.value as { selected?: Array<{ productKey: string; key: string; value: unknown; minimum: number; increment: number; band: { key: string } }> } | undefined;
  for (const selected of sportCapReview?.selected ?? []) {
    const refs = [owner(selected.key), { table: "amountBands", key: selected.band.key }];
    add(`isitrust.sport-member-cap.${selected.productKey}`, "Coverage", "isitrust", selected.productKey, "member", ["Attestation Online and PDF!C86", "User decision October 21, 2026"], `USA Fencing and US Equestrian Federation member ${selected.productKey} offers ${selected.minimum} through 500000 in increments of ${selected.increment}. Separate spouse/child rules, other Associations and ATPE remain unchanged. Explicit Group Term scope preserves its already-existing general maximum independently.`, refs, canonical(current(refs[0])) === canonical(selected.value) && canonical(current(refs[1])) === canonical(selected.band), ["src/migration/isitrustSportAssociationCapAdoption.test.ts"]);
    rows.at(-1)!.scope.associationKeys = [...sportAssociationKeys];
    rows.at(-1)!.implementationReferences = ["src/domain/associationAmountPolicy.ts", "src/domain/normalizedCoverageAmounts.ts", "src/domain/coverageRuntime.ts", "src/domain/coverageJourney.ts"];
  }
  const nsoLifeReview = db.semanticRequirements.find(row => row.key === nsoCombinedLifeDecisionKey)?.value as { selected?: Array<{ key: string; healthPageForPortfolio: unknown }> } | undefined;
  for (const selected of nsoLifeReview?.selected ?? []) {
    const ref = owner(selected.key), policy = current(ref), productKey = selected.key.replace(/^nso\./, "").replace(/\.journey-policy$/, "");
    add(`nso.combined-life.${productKey}`, "Health", "nso", productKey, null, ["Health Questions!A62:B75", "Health Questions!A101:B104", "SUP DI Health questions!A1:A4", "User decision October 21, 2026"], "For the same adult's native QD Life plus FUW Disability combination, require the shared full source Life form and the separate source supplemental DI form. Keep QD processing and the Life-only shorter flow. Other applicants and GI do not inherit the conditional override.", [ref], isCoverageJourneyPolicy(policy) && canonical(policy.healthPageForPortfolio) === canonical(selected.healthPageForPortfolio), ["src/migration/nsoCombinedLifeQuestionnaireAdoption.test.ts"]);
    rows.at(-1)!.scope.applicantKeys = ["member", "spouse"];
    rows.at(-1)!.implementationReferences = ["src/domain/portfolioHealthParticipation.ts", "src/domain/coverageRuntime.ts", "src/domain/coverageJourney.ts", "src/domain/coveragePortfolio.ts"];
  }
  const spouseNotice = db.semanticRequirements.find(row => row.key === isitrustSpouseNoticeReviewKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (spouseNotice?.owners?.length) {
    const refs = spouseNotice.owners.map(({ table, key }) => ({ table, key }));
    add("isitrust.spouse-election-notice", "Eligibility", "isitrust", null, "spouse", ["Attestation Online and PDF!C86"], "Omit the ISITRUST spouse-membership question and show the source informational notice only for a visible spouse Eligibility section: participating-association members may apply as member or spouse but not both. No cross-application enforcement is inferred.", refs, spouseNotice.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/isitrustSpouseNoticeAdoption.test.tsx", "src/migration/waepaSpouseMembershipAdoption.test.tsx"]);
    Object.assign(rows.at(-1)!, { disposition: "adopted-source-requirement", ruleKeys: [], implementationReferences: ["src/pages/Eligibility.tsx", "src/config/pages.ts", "src/config/clientFields/getClientPageFields.ts"] });
  }
  const cseaBenefits = db.semanticRequirements.find(row => row.key === cseaDependentBenefitDecisionKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (cseaBenefits?.owners?.length) {
    const refs = cseaBenefits.owners.map(({ table, key }) => ({ table, key }));
    add("csea.optional-dependent-benefits", "Coverage", "csea", "di-ltd", "member", ["Main!I246", "Main!J246", "Attestation Online and PDF!C69", "User decision October 21, 2026"], "Keep spouse Accident Disability and child Outpatient Emergency Room Benefit independently optional, with current defaults and editable checkboxes. Spouse offers $500/$1,000; the child benefit has no amount selector. Supersede the forced spouse control; child age confirmation and program identity retain separate review scope.", refs, cseaBenefits.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/domain/cseaExperience.test.ts", "src/components/coverage/ProductCatalog.test.tsx", "src/migration/coverageJourneyAcceptance.test.ts"]);
    Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/domain/applicationRiders.ts", "src/app/useCoverageState.ts", "src/components/coverage/ProductCatalog.tsx"] });
  }
  const membershipInterpretation = db.semanticRequirements.find(row => row.key === waepaMembershipInterpretationKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (membershipInterpretation?.owners?.length) {
    const refs = membershipInterpretation.owners.map(({ table, key, column }) => ({ table, key, column }));
    add("waepa.membership-notice-cleanup", "Membership", "waepa", null, null, ["Read & Sign!C75", "User decisions October 21, 2026"], "Omit unconditional accelerated-death-benefit and New York war notices from Membership. Retain the separately approved Review placement for Life, with the war notice limited to New York Life.", refs, membershipInterpretation.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/pages/Membership.test.tsx", "src/pages/Review.consent.test.tsx"]);
    Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/pages/Membership.tsx", "src/content/clients/waepa.ts"] });
  }
  const memberReference = db.semanticRequirements.find(row => row.key === waepaMemberReferenceReviewKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (memberReference?.owners) {
    const refs = memberReference.owners.map(({ table, key }) => ({ table, key }));
    add("waepa.associate-member-middle-initial", "Membership", "waepa", null, "member", ["Attestation Online and PDF!C122"], "For each approved new Associate Member qualification, collect the associated WAEPA member's required first/last names, optional membership number and optional middle initial. Keep it separate from the applicant's own middle initial; current-member/federal entry and other Sites do not inherit it.", refs, memberReference.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), ["src/migration/waepaMemberReferenceAdoption.test.ts", "src/pages/Membership.test.tsx"]);
    Object.assign(rows.at(-1)!, { disposition: "adopted-source-requirement", ruleKeys: [], implementationReferences: ["src/pages/Membership.tsx", "src/config/clientFields/getClientPageFields.ts"] });
  }
  const rateOwner = owner("isitrust.reviewed-rate-presentation");
  if (selected) {
    add("atpe.rate-suppression", "Payment and rates", "isitrust", null, null, ["Attestation Online and PDF!C86"], "Suppress ATPE premium estimates and estimate requests while keeping its approved application portfolio available. Other Associations retain their assigned rate presentation.", [rateOwner], canonical(current(rateOwner)) === canonical(selected.rate), ["src/migration/atpeQuestionnaireAdoption.test.tsx"], true);
    const reviewOwner = owner("isitrust.review-policy");
    const reviewedPolicy = selected.review, currentPolicy = current(reviewOwner);
    const certificationMatches = isReviewPolicy(reviewedPolicy) && isReviewPolicy(currentPolicy) && canonical(currentPolicy.blocks.find(block => block.key === "ci-virginia-certification")) === canonical(reviewedPolicy.blocks.find(block => block.key === "ci-virginia-certification"));
    add("atpe.ci-virginia-certification", "Review and consent", "isitrust", "sh-critical-illness", null, ["Health Questions!B84"], "For ATPE Critical Illness applicants residing in Virginia, display the source certification before the signature/consent controls; no added acknowledgement field.", [reviewOwner], certificationMatches, ["src/migration/atpeQuestionnaireAdoption.test.tsx"], true);
  }
  for (const row of rows.filter(row => row.id.startsWith("atomic.adopted.atpe.questionnaire."))) {
    row.scope.applicantKeys = ["member", "spouse"];
    row.scope.productKeys = row.id.includes(".ci-only.") ? ["sh-critical-illness"] : row.id.includes(".ci-mixed.") ? atpeAmountSelections.map(slice => slice.productKey) : ["li-group-term", "li-10yr", "li-20yr"];
    row.implementationReferences = ["src/domain/configuredHealthQuestionnaire.ts", "src/config/clientFields/getClientPageFields.ts", "src/config/healthFollowUps.ts", "src/pages/HealthLi.tsx", "src/app/sections/ConfiguredHealthQuestions.tsx"];
  }
  const contactReview = db.semanticRequirements.find(row => row.key === waepaContactDecisionKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (contactReview?.owners?.length) {
    const owners = contactReview.owners.map(({ table, key, column }) => ({ table, key, ...(column ? { column } : {}) }));
    const matches = contactReview.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue));
    for (const [suffix, sources, expected] of [
      ["telephone-placement", ["Main!R379", "User decision October 20, 2026"], "Retain member telephone collection on Membership, with no member-phone field on Contact. This explicitly supersedes the source's Eligibility placement for the new template."],
      ["std-business-address", ["Main!R380", "User decision October 20, 2026"], "When Standard WAEPA Short-Term Disability is selected, show the existing Business/Employer section and collect its applicable fields, including on mixed Life/STD applications."],
      ["life-business-hidden", ["Main!R379", "User decision October 20, 2026"], "With Life only or no STD selected, hide business fields even if old correspondence or business answers remain in a restored application. WAEPA GI retains its separate hiding policy."],
    ] as const) {
      add(`waepa.contact.${suffix}`, "Contact", "waepa", suffix === "telephone-placement" ? null : suffix === "std-business-address" ? "di-short-term" : "li-group-term", "member", [...sources], expected, owners, matches, ["src/pages/Contact.test.tsx"]);
      rows.at(-1)!.ruleKeys = ["rule-contact-business-address-same-as-home"];
      rows.at(-1)!.implementationReferences = ["src/domain/applicantExperience.ts", "src/config/clientFields/getClientPageFields.ts", "src/pages/Contact.tsx"];
    }
  }
  for (const decision of db.semanticRequirements.filter(row => row.key.startsWith(`${reviewAuthorizationDecisionPrefix}.`))) {
    const ref = owner(`${decision.subjectKey}.review-policy`);
    const value = current(ref) as { authorization?: unknown } | undefined;
    const selected = (decision.value as { selected?: unknown }).selected;
    add(`${decision.subjectKey}.medical-authorization`, "Review and consent", decision.subjectKey, null, null, ["Read & Sign!B3:B4", "Read & Sign!B35:B36", "Read & Sign!B40:B43", "Read & Sign!C43", "Read & Sign!B48:C48", "User decisions October 20, 2026"],
      "Display the introductory medical statement and medical authorization only when the application participates in actual Life, SI or DI health questions, including CI; Assigned external QD questionnaires count as participation even though their prototype page shows only a loading state. No-question GI/AD requests do not trigger it. Preserve consent and applicable fraud notices. ABE keeps its accepted Review behavior.",
      [ref], value?.authorization !== undefined && canonical(originalAuthorization(value.authorization)) === canonical(selected), ["src/migration/reviewAuthorizationAdoption.test.ts", "src/pages/Review.consent.test.tsx"]);
    for (const [suffix, sources, expected] of [
      ["medical-introduction", ["Read & Sign!B35:B36"], "Display the source B36 medical-examination statement only with actual health-question participation, using the same approved guard as medical authorization."],
      ["standard-authorization", ["Read & Sign!B40:B41"], "For participating health-question requests outside the scoped Minnesota, Virginia QD and approved C52 processing variants, use the source B41 medical authorization wording."],
      ["minnesota-authorization", ["Read & Sign!B43:C43"], "For Minnesota residents with participating health questions, use C43 authorization and definitions; display its HIV-test exclusion after the actual consent. Treat embedded fraud/consent labels as placement instructions and preserve the real applicable fraud notice and consent."],
      ["virginia-qd-authorization", ["Read & Sign!B48:C48"], "For Virginia applications with participating health questions and a selected QD processing outcome, use C48 authorization. Non-QD requests retain standard authorization."],
    ] as const) add(`${decision.subjectKey}.${suffix}`, "Review and consent", decision.subjectKey, null, null, [...sources, "User decisions October 20, 2026"], expected, [ref], value?.authorization !== undefined && canonical(originalAuthorization(value.authorization)) === canonical(selected), ["src/migration/reviewAuthorizationAdoption.test.ts"]);

  }
  for (const review of db.semanticRequirements.filter(row => row.key.startsWith(`${supplementalHealthReviewPrefix}.`))) {
    const ref = owner(`${review.subjectKey}.review-policy`), policy = current(ref), selected = (review.value as { selected?: unknown }).selected;
    const block = isReviewPolicy(policy) ? policy.blocks.find(block => block.key === "supplemental-health-attestation") : undefined;
    add(`${review.subjectKey}.supplemental-health-attestation`, "Review and consent", review.subjectKey, null, null, ["Read & Sign!B115:B117", "Read & Sign!C117"], "For selected HI/CI coverage, display the source Supplemental Health attestation at 14pt before signature controls; AMA uses the source no-title version. No new checkbox is inferred. Preserve ABE's accepted Review.", [ref], block !== undefined && canonical(block) === canonical(selected), ["src/migration/supplementalHealthReviewAdoption.test.ts", "src/pages/Review.consent.test.tsx"]);
    rows.at(-1)!.disposition = "adopted-source-requirement";
    rows.at(-1)!.scope.productKeys = block?.when?.products ?? [];
    rows.at(-1)!.scope.basis = "Read & Sign explicitly specifies HI/CI, 14pt placement above signature and AMA's no-title exception; dedicated native block adoption preserves accepted ABE.";
  }
  for (const decision of db.semanticRequirements.filter(row => row.key.startsWith(`${sharedConsentDecisionPrefix}.`))) {
    const ref = owner(`${decision.subjectKey}.review-policy`), policy = current(ref), selected = (decision.value as { selected?: unknown }).selected;
    const matches = isReviewPolicy(policy) && canonical(policy.consent) === canonical(selected);
    for (const [suffix, expected] of [
      ["consent-health-participation", "Use the source underwritten consent for actual health-question participation and the source simpler consent otherwise, including CI and guaranteed/no-question coverage. Preserve AMA's approved C80/C97 and ABE's accepted Review."],
      ["consent-wording", decision.subjectKey === "waepa" ? "Retain dedicated WAEPA C86 consent wording." : decision.subjectKey === "waepa-gi" ? "Use dedicated WAEPA GI C114 consent wording." : "Use common B78 underwriting consent and B93 non-underwriting consent. Present the Important Notice placeholder as the notice label; detailed PDF routing stays deferred."],
    ] as const) add(`${decision.subjectKey}.${suffix}`, "Review and consent", decision.subjectKey, null, null,
      isReviewPolicy(policy) ? policy.consent!.sourceReferences : ["Read & Sign!B78", "Read & Sign!B93"], expected, [ref], matches, ["src/migration/sharedConsentAdoption.test.ts"]);
  }
  for (const decision of db.semanticRequirements.filter(row => row.key.startsWith(`${beneficiaryNoteDecisionPrefix}.`))) {
    const ref = owner(`${decision.subjectKey}.beneficiary-notes`), policy = current(ref), selected = (decision.value as { selected?: unknown }).selected;
    if (!isBeneficiaryNotePolicy(policy)) continue;
    const matches = canonical(policy) === canonical(selected);
    for (const note of policy.notes) for (const product of note.productKeys) for (const applicant of note.applicants) {
      add(`${decision.subjectKey}.${product}.${applicant}.beneficiary-note`, "Beneficiary", decision.subjectKey, product, applicant, note.sourceReferences,
        `Display this captured designation note for ${product}/${applicant}: ${note.text} Child automatic beneficiaries and detailed PDF behavior remain separate.`, [ref], matches, ["src/migration/beneficiaryNoteAdoption.test.tsx"]);
      Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/domain/beneficiaryNotes.ts", "src/pages/Beneficiary.tsx"] });
    }
  }
  const stdRef = owner("isitrust.di-short-term.journey-policy"), stdPolicy = current(stdRef);
  const stdDecision = db.semanticRequirements.find(row => row.key === isitrustStdHealthDecisionKey)?.value as { selected?: unknown } | undefined;
  if (isCoverageJourneyPolicy(stdPolicy) && stdDecision) {
    const selected = { defaultUnderwritingPathway: stdPolicy.defaultUnderwritingPathway, questions: stdPolicy.questions };
    for (const [suffix, sources, expected] of [
      ["processing", ["Main!U281", "Main!Z281"], "Retain current guaranteed-issue processing as an explicit user-approved provisional exception; do not adopt Fully Underwritten processing from the source flags."],
      ["questions", ["Main!AA281", "Health Questions!A14:C16"], "Retain no health questions for ISITRUST STD as an explicit user-approved provisional exception to the source's EZ-3 requirement for every age/amount. ATPE does not offer STD. Revisit only on new user approval or corrected source information."],
    ] as const) add(`isitrust.di-short-term.health-exception.${suffix}`, "Health", "isitrust", "di-short-term", "member", [...sources, "User decision October 20, 2026"], expected, [stdRef], canonical(selected) === canonical(stdDecision.selected), ["src/migration/isitrustStdHealthDecision.test.ts"]);
  }
  const avmaStdRef = owner("avma.di-short-term.journey-policy"), avmaStdPolicy = current(avmaStdRef);
  const avmaStdDecision = db.semanticRequirements.find(row => row.key === avmaStdHealthDecisionKey)?.value as { selected?: unknown } | undefined;
  if (isCoverageJourneyPolicy(avmaStdPolicy) && avmaStdDecision) {
    const matches = canonical({ defaultUnderwritingPathway: avmaStdPolicy.defaultUnderwritingPathway, questions: avmaStdPolicy.questions }) === canonical(avmaStdDecision.selected);
    for (const [suffix, expected] of [
      ["processing", "Retain AVMA STD guaranteed-issue processing provisionally despite Main U194 underwriting Yes. This approved exception remains flagged and does not block completion."],
      ["questions", "Retain no AVMA STD health questions provisionally until missing form/underwriting information is supplied or the user approves replacement. Do not invent a questionnaire from an empty instruction."],
    ] as const) add(`avma.di-short-term.health-exception.${suffix}`, "Health", "avma", "di-short-term", "member", ["Main!U194", "Main!Z194", "Main!AA194", "User decision October 20, 2026"], expected, [avmaStdRef], matches, ["src/migration/stdHealthDecisions.test.ts"]);
  }
  const waepaStdDecision = db.semanticRequirements.find(row => row.key === waepaStdUnderwritingDecisionKey)?.value as { selected?: { bands: Array<{ key: string }>; questions: unknown; healthPageByUnderwriting: unknown } } | undefined;
  if (waepaStdDecision?.selected) {
    const selected = waepaStdDecision.selected, policy = current(owner("waepa.di-short-term.journey-policy"));
    const bandOwners = selected.bands.map(row => ({ table: "underwritingBands", key: row.key }));
    const matches = selected.bands.every(row => canonical(current({ table: "underwritingBands", key: row.key })) === canonical(row)) && isCoverageJourneyPolicy(policy) && canonical(policy.questions) === canonical(selected.questions) && canonical(policy.healthPageByUnderwriting) === canonical(selected.healthPageByUnderwriting);
    for (const [suffix, expected] of [
      ["qd", "For Standard WAEPA STD member ages 17–49 inclusive, use QD processing across permitted amounts. QD remains a processing page without health questions."],
      ["fuw", "For Standard WAEPA STD member ages 50–69 inclusive, use Fully Underwritten processing across permitted amounts. Preserve eligibility ages 17–69, the 30-hour work rule and existing amount/income limits."],
      ["questions", "Use the existing DI questionnaire provisionally for the WAEPA STD FUW flow. Actual health participation enables the approved medical Review sections. Revisit when corrected authoritative form instructions arrive."],
    ] as const) {
      add(`waepa.di-short-term.underwriting.${suffix}`, "Health", "waepa", "di-short-term", "member", ["QD DI!J15", "QD DI!O15", "Main!U380", "Main!Z380", "Main!AA380", "User decision October 20, 2026"], expected, [...bandOwners, owner("waepa.di-short-term.journey-policy")], matches, ["src/migration/stdHealthDecisions.test.ts"]);
      Object.assign(rows.at(-1)!, { implementationReferences: ["src/domain/coverageJourney.ts", "src/domain/coverageRuntime.ts", "src/config/flowGates.ts", "src/config/reviewExperience.ts"] });
    }
  }
  const spouseReview = db.semanticRequirements.find(row => row.key === waepaSpouseMembershipDecisionKey)?.value as { selected?: { field: unknown; values: Array<{ key: string; value: unknown }> } } | undefined;
  if (spouseReview?.selected) {
    const selected = spouseReview.selected;
    const fieldRef = { table: "siteFieldConfigurations", key: "site:waepa.eligibility.spouse-membership.include" };
    const owners = [fieldRef, ...selected.values.map(row => owner(row.key))];
    const matches = canonical(current(fieldRef)) === canonical(selected.field) && selected.values.every(row => canonical(current(owner(row.key))) === canonical(row.value));
    for (const [suffix, expected] of [
      ["question", "In active Spouse Eligibility, require Yes/No for whether the spouse currently is or is becoming a WAEPA member, using the shared spouse-membership field with explicit Standard WAEPA wording."],
      ["yes-block", "A Yes answer shows the scoped explanation and disables Eligibility Next for an active dependent-spouse request. Product eligibility independently rejects that spouse; member-only entry and eligible independent member/Associate Member applications remain available."],
      ["no-missing", "No satisfies only this additional spouse restriction. Missing or invalid answers do not establish dependent-spouse eligibility. Other eligibility rules remain separate."],
      ["stale-answer", "A retained spouse Yes answer does not block member-only Eligibility after spouse is removed from dependents. WAEPA GI and other Sites retain their own policies."],
    ] as const) {
      add(`waepa.dependent-spouse.${suffix}`, "Eligibility", "waepa", "li-group-term", "spouse", ["Attestation Online and PDF!C122", "User decision October 20, 2026"], expected, owners, matches, ["src/migration/waepaSpouseMembershipAdoption.test.tsx"]);
      Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/domain/applicantExperience.ts", "src/utils/applicantFacts.ts", "src/domain/coverageRequirements.ts", "src/domain/effectiveSite.ts", "src/pages/Eligibility.tsx"] });
    }
  }
  for (const decision of db.semanticRequirements.filter(row => row.key.startsWith(`${jurisdictionReviewNoticePrefix}.`))) {
    const policy = current(owner(`${decision.subjectKey}.review-policy`));
    const selected = (decision.value as { selected?: Array<{ key: string; sourceReferences: string[] }> }).selected;
    if (!isReviewPolicy(policy) || !selected) continue;
    for (const block of selected) {
      const expected = block.key === "connecticut-underwritten-notice" ? "For Connecticut residence and actual health-question participation, show source B119 immediately above the member signature controls. Missing health participation does not activate this block; preserve ABE Review." : block.key === "accelerated-death-benefit-notice" ? "For Standard WAEPA Group Term Life, display the source accelerated-death-benefit public-assistance/tax note after Fraud Notice and before Consent. STD-only and GI do not inherit it." : "For Standard WAEPA Group Term Life in New York only, display the source war-restriction notice in bold uppercase after Fraud Notice and before Consent. Other jurisdictions, STD-only and GI do not inherit it.";
      add(`${decision.subjectKey}.review-notice.${block.key}`, "Review and consent", decision.subjectKey, block.key === "connecticut-underwritten-notice" ? null : "li-group-term", null, [...block.sourceReferences, "User decision October 20, 2026"], expected, [owner(`${decision.subjectKey}.review-policy`)], canonical(policy.blocks.find(row => row.key === block.key)) === canonical(block), ["src/migration/jurisdictionReviewNoticeAdoption.test.tsx", "src/pages/Review.consent.test.tsx"]);
    }
  }
  const referralDecision = db.semanticRequirements.find(row => row.key === waepaReferralDecisionKey)?.value as { selected?: { field: { key: string }; status: { key: string }; condition: { key: string }; assignments: Array<{ key: string; siteKey: string }> } } | undefined;
  if (referralDecision?.selected) {
    const selected = referralDecision.selected;
    const owners = [{ table: "fields", key: selected.field.key }, { table: "fields", key: selected.status.key }, { table: "conditions", key: selected.condition.key }, ...selected.assignments.map(row => ({ table: "siteFieldConfigurations", key: row.key }))];
    const matches = canonical(current(owners[0])) === canonical(selected.field) && canonical(current(owners[1])) === canonical(selected.status) && canonical(current(owners[2])) === canonical(selected.condition) && selected.assignments.every(row => canonical(current({ table: "siteFieldConfigurations", key: row.key })) === canonical(row));
    for (const site of ["waepa", "waepa-gi"]) {
      for (const [suffix, expected] of [
        ["placement", "Collect the unique referral question in Membership Information for new members; the user's standardized shared-field placement principle supersedes the legacy Personal Information location."],
        ["choices", "Offer a required multiselect dropdown with TV, Radio and Newspaper. Require at least one configured choice."],
        ["visibility", site === "waepa" ? "Show referral only for membership=New Member; current members and unanswered membership do not render or validate the field." : "Preserve the generic GI Yes/No entry gate. After Yes, require a separate New/Current Member status answer and show referral only for New; this collection does not change eligibility."],
      ] as const) {
        add(`${site}.membership-referral.${suffix}`, "Membership", site, null, "member", ["Attestation Online and PDF!C125", "User clarification October 20, 2026", "User clarification October 26, 2026"], expected, owners, matches, ["src/migration/waepaReferralAdoption.test.ts", "src/pages/Membership.test.tsx"]);
        Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/config/clientFields/getClientPageFields.ts", "src/pages/Membership.tsx", "src/utils/fieldValidation.ts"] });
      }
    }
  }
  const nurseReview = db.semanticRequirements.find(row => row.key === nsoNurseTypeReviewKey)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
  if (nurseReview?.owners?.length) {
    const owners = nurseReview.owners.map(({ table, key }) => ({ table, key }));
    const matches = nurseReview.owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue));
    add("nso.nurse-type", "Membership", "nso", null, "member", ["Attestation Online and PDF!D98"],
      "After the existing membership Yes gate, collect required Nurse Type from RN, LPN or Other Nurse Professional Type. Other Sites do not inherit this field placement; unknown saved choices fail shared selection validation. Requiredness follows the current template collection convention.",
      owners, matches, ["src/migration/nsoNurseTypeAdoption.test.ts", "src/pages/Membership.test.tsx", "src/utils/fieldValidation.test.ts"]);
    Object.assign(rows.at(-1)!, { disposition: "adopted-source-requirement", ruleKeys: [], implementationReferences: ["src/config/clientFields/getClientPageFields.ts", "src/pages/Membership.tsx", "src/utils/fieldValidation.ts"] });
    rows.at(-1)!.scope.basis = "Explicit NSO source choices, source-backed adoption and captured field/condition/placement values; required collection follows the template convention.";
  }
  const college = current({ table: "fields", key: "avma-vet-college", column: "definition" }) as FieldDefinition | undefined;
  add("avma.college-text", "Membership", "avma", null, "member", ["Attestation Online and PDF!D38", "User decision October 20, 2026"],
    "Retain required veterinary-college text collection. The missing approved dropdown list is separately flagged as deferred by the user and does not block task completion.",
    [{ table: "fields", key: "avma-vet-college", column: "definition" }, { table: "siteFieldConfigurations", key: "site:avma.membership.avma-vet-college.override" }], college?.inputType === "text" && college.required === true, ["src/migration/nsoNurseTypeAdoption.test.ts"]);
  Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: ["src/config/clientFields/getClientPageFields.ts", "src/pages/Membership.tsx"] });
  for (const [key, id, area, site, source, expected, implementation, tests] of [
    [membershipLookupDecisionKey, "ama.mock-membership-lookup", "Membership", "ama", "Main!R118:R119", "On Membership continuation, use the shared applicant name and DOB in an AMA mock lookup. Carry the synthetic ME number, membership result and DOB in the saved application. No match permits non-member entry; failures can be retried. Ignore stale results after name/DOB changes. Real AMA integration and detailed XML remain separately flagged requirements.", ["src/pages/Membership.tsx", "src/domain/membershipLookup.ts", "scripts/mock-platform.mjs"], ["src/pages/Membership.lookup.test.tsx", "src/domain/membershipLookup.test.ts", "scripts/mock-platform.test.mjs"]],
    [abeLandingNoticeDecisionKey, "abe.landing-dividend-notice", "Review and consent", "abe", "Legal Disclosures!A11:C11", "Open the source ABE dividend-information viewer after the landing Apply/Start/New Application action. Cancel retains the landing page; Continue starts the application. Use captured content, with only the stray +A16 source artifact removed. Preserve accepted ABE Review.", ["src/pages/Home.tsx", "src/domain/applicantExperience.ts"], ["src/pages/Home.notice.test.tsx", "src/migration/membershipLookupAndLandingAdoption.test.ts"]],
    [amaPremiumStyleDecisionKey, "ama.premium-style-exclusive", "Coverage", "ama", "Attestation Online and PDF!C3", "Retain separate Step Rated and Level Rated Coverage cards, but allow one premium style per application, including different applicants. Shared relationship validation and normalized benefit evaluation reject simultaneous styles; retained answers require explicit applicant correction.", ["src/domain/coverageRequirements.ts", "src/domain/benefitPolicy.ts", "src/app/useCoverageState.ts"], ["src/migration/amaPremiumStyleAdoption.test.ts"]],
    [profileReplacementNoticeKey, "profile.ny-life-replacement-notice", "Profile", "", "Legal Disclosures!A14:D14", "Within each active adult's Profile Other Coverage section, show the complete 12-point bold source notice only for New York, active positive Life coverage, other-Life Yes and replacement Yes. Stale answers and other jurisdictions do not activate it. ABE Review remains unchanged.", ["src/domain/applicantExperience.ts", "src/pages/Profile.tsx"], ["src/migration/profileReplacementNoticeAdoption.test.ts", "src/pages/Profile.test.tsx"]],
  ] as const) {
    const decision = db.semanticRequirements.find(row => row.key === key)?.value as { owners?: Array<Owner & { reviewedValue: unknown }> } | undefined;
    const owners = decision?.owners ?? [];
    add(id, area, site, null, null, [source, "User decision October 20, 2026"], expected, owners.map(({ table, key, column }) => ({ table, key, column })), !!owners.length && owners.every(ref => canonical(current(ref)) === canonical(ref.reviewedValue)), [...tests]);
    Object.assign(rows.at(-1)!, { ruleKeys: [], implementationReferences: [...implementation] });
    if (!site) rows.at(-1)!.scope.siteKeys = ["abe", "ama", "asce", "avma", "csea", "isitrust", "nso", "waepa", "waepa-gi"];
  }
  return rows;
}
