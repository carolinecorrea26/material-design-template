import { portfolioLifeHealthPage } from "./portfolioHealthParticipation";
import { configuredHealthQuestionnaire, isHealthQuestionnairePolicy, validateConfiguredHealthQuestionnaire } from "./configuredHealthQuestionnaire";
import { collectsBeneficiaries } from "./beneficiaryParticipation";
import { applicantAge } from "../utils/applicantAge";
import { resolveEffectiveEligibility, type EffectiveSite, type EligibilityFacts } from "./effectiveSite";
import { reconcileCoverageSelection, isSelectionPolicy, type ApplicationMode, type SelectionElection } from "./coverageSelectionPolicy";
import { resolveCoverageJourneyPolicy, resolveSubmissionMapping, reconcileDependentElections, resolveBilling, type MappingDimensions } from "./coverageJourneyPolicy";
import { resolveNormalizedResidency } from "./residencyPolicy";
import { validateNormalizedCoverageAmount } from "./normalizedCoverageAmounts";
import { resolveNormalizedBenefit, type BenefitFacts } from "./benefitPolicy";
import { resolveDependentCoverage, type DependentFacts } from "./dependentPolicy";
import { paymentSelectionAllowed, reconcilePaymentSelection, type PaymentMethod, type PaymentFrequency } from "./paymentPolicy";
import { verifyExistingPolicy, type PolicyLookup, type PolicyVerificationService, type VerifiedPolicy } from "./policyVerification";
import type { FieldDefinition } from "./fields";
import type { ConditionDefinition } from "./rules";
import { resolveNormalizedAmountCap } from "./amountCapPolicy";
import { resolveJourneyUnderwriting } from "./coverageJourneyUnderwriting";
export { resolveJourneyUnderwriting } from "./coverageJourneyUnderwriting";

export type CoverageJourneyInput = MappingDimensions & {
  productKey: string; mode: ApplicationMode; amount: number; membershipConfirmed?: boolean;
  eligibility: EligibilityFacts; benefit?: BenefitFacts; dependent?: DependentFacts;
  jurisdiction?: string; existingPolicy?: Pick<PolicyLookup, "policyId" | "ownerReference">;
  election: SelectionElection; dependentElections?: Record<string, { selected: boolean; amount?: number; attested?: boolean }>;
  onlyChild?: boolean; memberAmount?: number; spouseAmount?: number;
  birthDate?: string; applicationDate?: string;
  answers?: Record<string, unknown>; attestations?: string[];
  payment?: { method: PaymentMethod; frequency: PaymentFrequency };
};
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const empty = (v: unknown) => v === undefined || v === null || v === "" || Array.isArray(v) && !v.length;
export { applicantAge } from "../utils/applicantAge";

function condition(definition: ConditionDefinition, answers: Record<string, unknown>): boolean | null {
  const matches = definition.conditions.map(c => {
    if (empty(answers[c.fieldId])) return null;
    const actual = answers[c.fieldId];
    return c.operator === "equals" ? actual === c.value : c.operator === "notEquals" ? actual !== c.value : c.operator === "oneOf" ? Array.isArray(c.value) && c.value.includes(actual) : Array.isArray(actual) && actual.includes(c.value);
  });
  if (definition.match === "any") return matches.some(v => v === true) ? true : matches.some(v => v === null) ? null : false;
  return matches.some(v => v === false) ? false : matches.some(v => v === null) ? null : true;
}
function validAnswer(field: FieldDefinition, value: unknown) {
  if (field.options?.length) return ["checkbox-group", "multi-select"].includes(field.inputType) ? Array.isArray(value) && value.every(v => field.options!.some(o => o.value === v)) && new Set(value).size === value.length : field.options.some(o => o.value === value);
  if (["number", "percent"].includes(field.inputType)) return finite(value);
  if (field.inputType === "checkbox") return value === true || value === false;
  return typeof value === "string" && value.trim().length > 0;
}
export function resolveQuestionParticipation(site: EffectiveSite, productKey: string, applicantKey: string, mode: ApplicationMode, answers: Record<string, unknown> = {}, attestations: string[] = [], electedRiders: string[] = [], underwritingPathway?: string, underwritingHealthPage?: string | null, questionnaireContext?: { associationKey?: string; jurisdiction?: string; selectedProducts?: string[]; processing?: import("./configuredHealthQuestionnaire").QuestionnaireProcessing }) {
  const policy = resolveCoverageJourneyPolicy(site, productKey);
  const spec = policy?.questions.filter(q => q.applicantKey === applicantKey && q.modes.includes(mode));
  if (!policy || spec?.length !== 1) return { status: "unresolved" as const, allowed: false, activeFields: [] as string[], cleanedAnswers: {}, missingFacts: [], errors: ["No unique question participation policy"], healthPage: null, cirQuestionnaireRequired: false };
  const q = spec[0], product = site.configuration.products.find(p => p.productKey === productKey)!;
  const cir = electedRiders.some(key => product.riders.find(r => r.key === key)?.definition?.value.id === "cir");
  const nativeHealthPage = underwritingHealthPage !== undefined ? underwritingHealthPage : underwritingPathway && policy.healthPageByUnderwriting && Object.hasOwn(policy.healthPageByUnderwriting, underwritingPathway) ? policy.healthPageByUnderwriting[underwritingPathway as keyof typeof policy.healthPageByUnderwriting] : undefined;
  const separateCirForm = site.configuration.healthQuestionnairePolicies.some(row => isHealthQuestionnairePolicy(row.value) && row.value.pageId === "health-cir");
  // A separately assigned CIR form supplements the base product's native health
  // routing. Unassigned legacy CIR flows retain their provisional Life form.
  const selectedHealthPage = applicantKey === "child" ? null : nativeHealthPage !== undefined ? nativeHealthPage : underwritingPathway === undefined ? q.healthPage : ["GI", "NA", "NCGI"].includes(underwritingPathway) ? null : underwritingPathway === "QD" ? "health-qd" : underwritingPathway === "SI" ? "health-si" : ["DI", "OO"].includes(product.catalog!.value.categoryKey) ? "health-di" : "health-li";
  const portfolioPage = portfolioLifeHealthPage(site, productKey, applicantKey, underwritingPathway, questionnaireContext?.selectedProducts ?? [productKey], questionnaireContext?.processing ?? []);
  const healthPage = portfolioPage.status === "matched" ? portfolioPage.healthPage : cir && !separateCirForm && (!selectedHealthPage || selectedHealthPage === "health-qd") ? "health-li" : selectedHealthPage;
  const questionnaireValues = { ...answers, association: questionnaireContext?.associationKey ?? answers.association ?? answers.membership, "state-province": questionnaireContext?.jurisdiction ?? answers["state-province"] ?? answers.state, coverageSelections: questionnaireContext?.selectedProducts ?? [productKey], productApplicants: Object.fromEntries((questionnaireContext?.selectedProducts ?? [productKey]).map(key => [key, [applicantKey]])), coverageRiders: { ...(answers.coverageRiders && typeof answers.coverageRiders === "object" && !Array.isArray(answers.coverageRiders) ? answers.coverageRiders : {}), [`${productKey}:cir:${applicantKey}`]: cir } };
  const configured = ["health-li", "health-di", "health-ci"].includes(healthPage ?? "") ? configuredHealthQuestionnaire(site, healthPage!, applicantKey, questionnaireValues, questionnaireContext?.processing) : null;
  const hasConfigured = !!configured && configured.status !== "unassigned";
  const health = healthPage && !hasConfigured ? site.configuration.pages.find(p => p.key === healthPage)?.fields.filter(f => f.included && f.key.startsWith(`${healthPage}-q`) && f.key.endsWith("-spouse") === (applicantKey === "spouse")) ?? [] : [];
  const wanted = [...q.financialFields, ...q.tobaccoFields];
  const allFields = site.configuration.pages.flatMap(p => p.fields);
  const fields = [...health, ...wanted.flatMap(key => {
    const f = allFields.find(f => f.key === key && f.included);
    return f ? [f] : [];
  })];
  const errors: string[] = [], missingFacts: string[] = [], activeFields: string[] = [], cleanedAnswers: Record<string, unknown> = {};
  if (portfolioPage.status === "needs-information") missingFacts.push("portfolio-processing");
  for (const key of wanted) if (!fields.some(f => f.key === key)) errors.push(`Missing participation field ${key}`);
  if (healthPage && healthPage !== "health-qd" && !health.length && !hasConfigured) errors.push("Health question set is missing");
  for (const row of fields) {
    const field = row.definition;
    if (q.tobaccoFields.includes(row.key) && !row.key.endsWith("smoker")) {
      const smokerKey = applicantKey === "spouse" ? "spouse-smoker" : "smoker";
      if (empty(answers[smokerKey])) { missingFacts.push(smokerKey); continue; }
      if (answers[smokerKey] !== "yes") continue;
    }
    if (field.visibilityConditionId) {
      const definitions = site.configuration.conditions.filter(c => c.value.definition.id === field.visibilityConditionId);
      if (definitions.length !== 1) { errors.push(`Unknown visibility condition ${field.visibilityConditionId}`); continue; }
      const show = condition(definitions[0].value.definition, answers);
      if (show === null) { missingFacts.push(...definitions[0].value.definition.conditions.map(c => c.fieldId)); continue; }
      if (!show) continue;
    }
    activeFields.push(row.key);
    if (empty(answers[row.key])) { if (field.required) missingFacts.push(row.key); continue; }
    if (!validAnswer(field, answers[row.key])) errors.push(`Invalid answer ${row.key}`);
    else cleanedAnswers[row.key] = answers[row.key];
    // Detailed health responses stay in the candidate's scoped answer envelope.
    // A yes answer requires a non-empty details string without diagnosing it.
    if (row.key.startsWith("health-") && answers[row.key] === "yes") {
      const detailKey = `${row.key}.details`;
      if (typeof answers[detailKey] !== "string" || !(answers[detailKey] as string).trim()) missingFacts.push(detailKey);
      else cleanedAnswers[detailKey] = answers[detailKey];
    }
  }
  const cirPageEnabled = site.configuration.pages.some(page => page.key === "health-cir" && page.requirement !== "none");
  const cirForm = cir && separateCirForm && cirPageEnabled ? configuredHealthQuestionnaire(site, "health-cir", applicantKey, questionnaireValues) : null;
  for (const sourceForm of [...(hasConfigured && configured ? [configured] : []), ...(cirForm ? [cirForm] : [])]) {
    if (sourceForm.status !== "resolved") errors.push("No unique valid source health questionnaire is assigned");
    else {
      const formError = validateConfiguredHealthQuestionnaire(sourceForm, questionnaireValues);
      for (const field of sourceForm.fields) {
        activeFields.push(field.id);
        if (empty(answers[field.id])) { if (field.required) missingFacts.push(field.id); }
        else cleanedAnswers[field.id] = answers[field.id];
      }
      for (const item of sourceForm.items.filter(item => item.repeated && item.showDetails)) {
        activeFields.push(item.collection);
        const rows = answers[item.collection];
        if (!Array.isArray(rows) || !rows.length) missingFacts.push(item.collection);
        else cleanedAnswers[item.collection] = rows.map(row => row && typeof row === "object" && !Array.isArray(row) ? Object.fromEntries(item.fields.filter(field => Object.hasOwn(row, field.id)).map(field => [field.id, (row as Record<string, unknown>)[field.id]])) : row);
      }
      if (formError && !missingFacts.length) errors.push(formError);
    }
  }
  if (!attestations.includes(q.attestationKey)) missingFacts.push(q.attestationKey);
  return { status: errors.length ? "unresolved" as const : missingFacts.length ? "needs-information" as const : "resolved" as const, allowed: !errors.length && !missingFacts.length, activeFields, cleanedAnswers, missingFacts: [...new Set(missingFacts)], errors, healthPage, cirQuestionnaireRequired: cir && (!separateCirForm || cirPageEnabled) };
}

/** Candidate application acceptance, based solely on one captured Library Site.
 * Lookup is performed here; form-supplied verified booleans/amounts are ignored.
 * No insurer submission, funds, UI activation or publication side effects. */
export async function evaluateCoverageJourney(site: EffectiveSite, input: CoverageJourneyInput, services: { policies: PolicyVerificationService; now?: () => number; portfolio?: CoverageJourneyInput[]; existingLifeAmount?: number }) {
  const policy = resolveCoverageJourneyPolicy(site, input.productKey);
  const product = site.configuration.products.find(p => p.productKey === input.productKey);
  const errors: string[] = [], missingFacts: string[] = [];
  const blocked = (error: string) => ({ status: "unresolved" as const, allowed: false, errors: [error], missingFacts: [], submission: null });
  if (!policy || !product || product.selectionPolicies.length !== 1 || !isSelectionPolicy(product.selectionPolicies[0].value)) return blocked("Candidate journey policy is missing or invalid");
  if (!policy.applicants.includes(input.applicantKey)) return blocked("Applicant is unavailable");
  if (policy.associationChoices.length && input.associationKey && !site.enabledAssociationKeys.includes(input.associationKey)) return blocked("Association is unavailable in this Site");
  if (policy.membershipRequired && input.membershipConfirmed !== true) missingFacts.push("membershipConfirmed");
  let verified: VerifiedPolicy | undefined;
  if (input.mode !== "new") {
    if (!input.existingPolicy?.policyId || !input.existingPolicy.ownerReference) missingFacts.push("existingPolicy");
    else {
      const request: PolicyLookup = { ...input.existingPolicy, siteKey: site.siteKey, productKey: input.productKey, applicantKey: input.applicantKey, ...(input.associationKey ? { associationKey: input.associationKey } : {}) };
      const verification = await verifyExistingPolicy(services.policies, request);
      if (verification.status !== "verified") errors.push(`Policy verification ${verification.status}`);
      else {
        verified = verification.policy;
        if (["policyId", "ownerReference", "siteKey", "productKey", "applicantKey", "associationKey"].some(k => verified![k as keyof PolicyLookup] !== request[k as keyof PolicyLookup]) || verified.status !== "active" || !finite(verified.amount) || verified.amount <= 0 || !Number.isFinite(verified.expiresAt) || verified.expiresAt <= (services.now ?? Date.now)()) { errors.push("Verified policy is stale or mismatched"); verified = undefined; }
        else if (!verified.permittedChanges.includes(input.mode)) errors.push("Policy does not permit this change");
      }
    }
  }
  const age = input.birthDate && input.applicationDate ? applicantAge(input.birthDate, input.applicationDate) : null;
  if (input.birthDate || input.applicationDate) {
    if (!age) errors.push("Invalid birth/application date");
    else if (input.eligibility.ageYears !== undefined && input.eligibility.ageYears !== age.ageYears || input.eligibility.ageDays !== undefined && input.eligibility.ageDays !== age.ageDays) errors.push("Age facts do not match application dates");
  }
  const eligibilityFacts = { ...input.eligibility, ...(age ?? {}), associationKey: input.associationKey };
  const eligibility = resolveEffectiveEligibility(site, input.productKey, input.applicantKey, eligibilityFacts);
  if (eligibility.status === "needs-information") missingFacts.push("eligibility");
  else if (eligibility.status !== "resolved" || !eligibility.eligible) errors.push(eligibility.reason ?? "Applicant is ineligible");
  const residency = resolveNormalizedResidency(site, input.productKey, input.applicantKey, { jurisdiction: input.jurisdiction, activeMilitary: input.eligibility.activeMilitary, associationKey: input.associationKey });
  if (residency.status === "needs-information") missingFacts.push("residency");
  else if (!residency.allowed) errors.push(residency.reason);
  const selection = reconcileCoverageSelection(product.selectionPolicies[0].value, {
    mode: input.mode, applicantKey: input.applicantKey, baseAmount: input.amount, ageYears: eligibilityFacts.ageYears, jurisdiction: input.jurisdiction,
    existingPolicyVerified: !!verified, existingAmount: verified?.amount, childAgeDays: eligibilityFacts.ageDays,
    memberAmount: input.memberAmount, spouseAmount: input.spouseAmount, onlyChild: input.onlyChild,
  }, input.election);
  errors.push(...selection.errors); missingFacts.push(...selection.missingFacts);
  let finalAmount = input.amount;
  if (input.mode !== "rider-only") {
    if (input.applicantKey === "child" && product.selectionPolicies[0].value.childSchedule) {
      if (selection.childAmount !== null) { finalAmount = selection.childAmount; if (input.amount !== finalAmount) errors.push("Child amount must recalculate from schedule"); }
    } else if (product.benefitPolicies.length) {
      const benefit = resolveNormalizedBenefit(site, input.productKey, input.applicantKey, { ...input.benefit, ageYears: eligibilityFacts.ageYears, applicantClass: input.applicantClass, amount: input.amount, waitingPeriod: input.waitingPeriod, benefitPeriod: input.benefitPeriod });
      errors.push(...benefit.errors); missingFacts.push(...benefit.missingFacts);
      if (benefit.status === "unresolved") errors.push("Benefit policy is unresolved");
    } else if (input.applicantKey !== "member" && product.dependentPolicies.length) {
      const dependent = resolveDependentCoverage(site, input.productKey, input.applicantKey, { ...input.dependent, associationKey: input.associationKey, amount: input.amount });
      errors.push(...dependent.errors); missingFacts.push(...dependent.missingFacts);
      if (dependent.status === "unresolved") errors.push("Dependent policy is unresolved");
      if (dependent.derivedAmount !== null) finalAmount = dependent.derivedAmount;
    } else {
      const amount = validateNormalizedCoverageAmount(site, input.productKey, input.applicantKey, input.amount, input.applicantClass, input.associationKey);
      if (!amount.allowed) (amount.status === "needs-information" ? missingFacts : errors).push(amount.reason);
    }
  }
  if (input.mode !== "rider-only") {
    const cap = resolveNormalizedAmountCap(site, input.productKey, input.applicantKey, eligibilityFacts.ageYears);
    if (cap.status === "needs-information") missingFacts.push("ageYears");
    else if (cap.status !== "resolved") errors.push(cap.reason ?? "Amount-cap policy is unresolved");
    else if (cap.maximum !== undefined && finalAmount > cap.maximum) errors.push("Coverage amount exceeds the applicant age cap");
  }
  const dependentElections = reconcileDependentElections(policy, input.dependentElections ?? {});
  errors.push(...dependentElections.errors); missingFacts.push(...dependentElections.missingFacts);
  const processingContext = (row: CoverageJourneyInput) => ({ jurisdiction: row.jurisdiction, existingLifeAmount: services.existingLifeAmount, memberAmount: row.memberAmount ?? services.portfolio?.find(other => other.productKey === row.productKey && other.applicantKey === "member")?.amount, portfolio: (services.portfolio ?? [input]).map(other => ({ productKey: other.productKey, applicantKey: other.applicantKey, amount: other.amount })) });
  const underwriting = resolveJourneyUnderwriting(site, input.productKey, input.applicantKey, eligibilityFacts.ageYears, input.mode === "rider-only" ? verified?.amount : input.amount, input.applicantClass, input.associationKey, processingContext(input));
  if (underwriting.status === "needs-information") missingFacts.push("underwriting");
  else if (underwriting.status !== "resolved") errors.push("Underwriting policy has no unique executable outcome");
  const questions = resolveQuestionParticipation(site, input.productKey, input.applicantKey, input.mode, input.answers, input.attestations, selection.election.riders, input.mode === "rider-only" && selection.healthRequired ? "FUW" : underwriting.pathway, input.mode === "rider-only" && selection.healthRequired ? undefined : "healthPage" in underwriting ? underwriting.healthPage : undefined, { associationKey: input.associationKey, jurisdiction: input.jurisdiction, selectedProducts: [...new Set([input.productKey, ...(input.eligibility?.selectedPlans?.filter(plan => plan.applicantKey === input.applicantKey).map(plan => plan.productKey) ?? []), ...(services.portfolio?.filter(row => row.applicantKey === input.applicantKey).map(row => row.productKey) ?? [])])], processing: (services.portfolio ?? [input]).filter(row => row.applicantKey === input.applicantKey).map(row => ({ productKey: row.productKey, ...resolveJourneyUnderwriting(site, row.productKey, row.applicantKey, row.eligibility.ageYears, row.amount, row.applicantClass, row.associationKey, processingContext(row)) })) });
  errors.push(...questions.errors); missingFacts.push(...questions.missingFacts);
  const skipPayment = selection.allowed && selection.skipPayment || policy.payment.collection === "none";
  const payment = skipPayment ? { method: null, frequency: null } : reconcilePaymentSelection(policy.payment, input.payment?.method ?? null, input.payment?.frequency ?? null);
  if (!skipPayment && policy.payment.collection === "required" && (!input.payment || !paymentSelectionAllowed(policy.payment, input.payment.method, input.payment.frequency))) missingFacts.push("payment");
  const mapping = resolveSubmissionMapping(policy, input);
  if (mapping.status !== "resolved") (mapping.status === "needs-information" ? missingFacts : errors).push("submissionMapping");
  const allowed = !errors.length && !missingFacts.length;
  const submission = allowed && mapping.mapping ? {
    contract: "mock-coverage-v1", siteKey: site.siteKey, productKey: input.productKey, applicantKey: input.applicantKey, mode: input.mode,
    associationKey: input.associationKey ?? null, applicantClass: input.applicantClass ?? null,
    identifiers: mapping.mapping.identifiers, amountMeaning: "resulting-total", amount: finalAmount,
    existingPolicyId: verified?.policyId ?? null, existingAmount: verified?.amount ?? null,
    waitingPeriod: input.waitingPeriod ?? null, benefitPeriod: input.benefitPeriod ?? null,
    riders: selection.election.riders.map(key => ({ key, code: mapping.mapping!.riderCodes[key], amount: selection.election.riderAmounts[key] ?? null })),
    dependentBenefits: dependentElections.elections, payment: skipPayment ? verified?.billing ?? null : payment,
    effectiveDate: verified?.effectiveDate ?? input.applicationDate ?? null,
    questions: questions.cleanedAnswers, underwritingPathway: underwriting.pathway, attestationKeys: policy.questions.filter(q => q.applicantKey === input.applicantKey && q.modes.includes(input.mode)).map(q => q.attestationKey),
    provisional: policy.provisional,
  } : null;
  if (submission?.riders.some(r => !r.code)) return blocked("Rider submission mapping is missing");
  return { status: errors.length ? "unresolved" as const : missingFacts.length ? "needs-information" as const : "resolved" as const, allowed, errors: [...new Set(errors)], missingFacts: [...new Set(missingFacts)], underwriting, selection, questions, dependentElections, skipPayment, skipBeneficiary: selection.skipBeneficiary || !collectsBeneficiaries(site, input.productKey, product.catalog?.value.categoryKey ?? "", input.applicantKey, input.associationKey), payment, rating: resolveBilling(policy, input.payment?.method ?? policy.payment.defaultMethod ?? "bank-account", input.payment?.frequency ?? policy.payment.defaultFrequency ?? "monthly", null), submission };
}

/** Per-child elections, not a single shared youngest/oldest child age. */
export function resolveScheduledChildren(site: EffectiveSite, productKey: string, children: Array<{ key: string; birthDate: string }>, applicationDate: string, primaryAmounts: { member?: number; spouse?: number }) {
  const product = site.configuration.products.find(p => p.productKey === productKey);
  const policy = product?.selectionPolicies[0]?.value;
  if (!product || product.selectionPolicies.length !== 1 || !isSelectionPolicy(policy) || !policy.childSchedule || !children.length || new Set(children.map(c => c.key)).size !== children.length || children.some(c => !c.key)) return { status: "unresolved" as const, allowed: false, children: [] };
  // Spouse-linked benefit uses the same 50% cap provisionally. Explicit zero is
  // different from missing coverage. Revisit the insurer's spouse schedule.
  if (!finite(primaryAmounts.member) || !finite(primaryAmounts.spouse)) return { status: "needs-information" as const, allowed: false, children: [] };
  const base = Math.max(primaryAmounts.member, primaryAmounts.spouse);
  const decisions = children.map(c => {
    const age = applicantAge(c.birthDate, applicationDate);
    if (!age) return { key: c.key, allowed: false, amount: null, reason: "Invalid child dates" };
    if (age.ageYears > (policy.childSchedule!.maximumAgeYears ?? 25) || base <= 0) return { key: c.key, allowed: false, amount: null, reason: "Child or primary coverage is unavailable" };
    const result = reconcileCoverageSelection(policy, { mode: "new", applicantKey: "child", baseAmount: 1, memberAmount: primaryAmounts.member, spouseAmount: primaryAmounts.spouse, ageYears: age.ageYears, childAgeDays: age.ageDays }, { riders: [], riderAmounts: {} });
    return { key: c.key, allowed: result.allowed, amount: result.childAmount, reason: result.errors.join("; ") };
  });
  return { status: "resolved" as const, allowed: decisions.every(c => c.allowed), children: decisions };
}
