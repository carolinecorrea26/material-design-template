import { isCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import { isBeneficiaryNotePolicy } from "./beneficiaryNotes";
import { isBeneficiaryParticipationPolicy } from "./beneficiaryParticipation";
import { validateEligibilityConstraint, validateUnderwritingBand, validateUnderwritingOverlap } from "./coveragePolicyValidation";
import { eligibilityFactSatisfied, eligibilityAgeMaximumSatisfied, isEligibilityFactRequirements, type EligibilityFactRequirement } from "./eligibilityFacts";
import { categoryEligibility, readCategoryEligibilityPolicy } from "./categoryEligibilityPolicy";
import { resolveAssociationEligibility } from "./associationEligibilityPolicy";
import { resolveEffectiveConfiguration, type EffectiveConfiguration, type EffectiveConfigurationData } from "./effectiveConfiguration";
import type { DatabaseSchema } from "../persistence/types";
import type { LibraryMetadata } from "./provenance";
import { asceBusinessDecisions, inspectAsceBusinessDecisions } from "./asceBusinessDecisions";

export type EffectiveSiteData = EffectiveConfigurationData & Pick<DatabaseSchema, "sites" | "clients" | "organizations" | "organizationProfiles" | "siteProducts" | "siteProductApplicants" | "eligibilityConstraints" | "underwritingBands" | "semanticRequirements" | "associations" | "siteAssociations" | "sitePolicies">;
export type RuleProvenance = Partial<LibraryMetadata> & { table: string; key: string; approvalKey?: string };
export type ResolvedValue<T> = { value: T; provenance: RuleProvenance[] };
export type EffectiveApplicant = {
  applicantKey: string;
  provenance: RuleProvenance[];
  eligibility: ResolvedValue<{ minimumAge: number; maximumAge: number }> | null;
  constraints: ResolvedValue<{ minimumAgeDays: number | null; minimumAgeYears: number | null; maximumAgeYears: number | null; studentMaximumAgeYears: number | null; unmarried: boolean | null; minimumWorkHours: number | null }> | null;
  underwriting: ResolvedValue<{ minimumAge: number; maximumAge: number; minimumAmount: number; maximumAmount: number; minimumAmountExclusive: boolean; pathway: string }>[];
};
/** Phase 6B candidate. Unimplemented domains are explicit; this is not a browser configuration. */
export type EffectiveSite = {
  /** Retained policy references may name disabled, still-assigned Associations. */
  assignedAssociationKeys: string[];
  enabledAssociationKeys: string[];
  siteKey: string;
  clientKey: string;
  name: ResolvedValue<string>;
  runtimeActivation: "pending-phase-6";
  resolution: { completeness: "partial"; implementedScopes: { productKey: string; applicantKey: string; decisions: ("eligibility" | "underwriting")[] }[] };
  provisionalDecisions: { key: string; value: import("../persistence/types").Json; provenance: RuleProvenance[] }[];
  configuration: EffectiveConfiguration;
  products: { productKey: string; provenance: RuleProvenance[]; applicants: EffectiveApplicant[] }[];
};
function provenance(table: string, row: { id: string; key?: string } & Partial<LibraryMetadata>, approvalKey?: string): RuleProvenance {
  return { table, key: row.key ?? row.id, displayId: row.displayId, providedBy: row.providedBy ?? null, sourceReference: row.sourceReference ?? null, ...(approvalKey ? { approvalKey } : {}) };
}
function unique<T>(rows: T[], key: (row: T) => string, label: string) {
  if (new Set(rows.map(key)).size !== rows.length) throw new Error(`Duplicate ${label}`);
}
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Pure resolution over a persisted snapshot. No static fallback, extraction or writes. */
export function resolveEffectiveSite(data: EffectiveSiteData, siteKey: string): EffectiveSite {
  const sites = data.sites.filter(s => s.key === siteKey);
  if (sites.length !== 1 || sites[0].deletedAt || sites[0].status !== "active") throw new Error(`Unavailable Site: ${siteKey}`);
  const site = sites[0];
  const clients = data.clients.filter(c => c.id === site.clientId);
  if (clients.length !== 1 || clients[0].status !== "active") throw new Error(`Unavailable Client: ${site.clientId}`);
  if (siteKey === "asce") {
    const invalid = inspectAsceBusinessDecisions(data).filter(d => !d.approved);
    if (invalid.length) throw new Error(`Unapproved ASCE rules: ${invalid.map(d => d.key).join(", ")}`);
  }
  const assignments = data.siteProducts.filter(p => p.siteId === site.id);
  unique(assignments, p => p.productKey, "Site product assignment");
  const products = assignments.filter(p => p.enabled).sort((a, b) => compare(a.productKey, b.productKey)).map(product => {
    const applicants = data.siteProductApplicants.filter(a => a.siteKey === siteKey && a.productKey === product.productKey);
    unique(applicants, a => a.applicantKey, "Site applicant assignment");
    if (!applicants.length) throw new Error(`Missing applicants: ${product.productKey}`);
    return { productKey: product.productKey, provenance: [provenance("siteProducts", product)], applicants: applicants.sort((a, b) => a.position - b.position || compare(a.key, b.key)).map(applicant => {
      const result: EffectiveApplicant = { applicantKey: applicant.applicantKey, provenance: [provenance("siteProductApplicants", applicant)], eligibility: null, constraints: null, underwriting: [] };
      const supported = siteKey === "asce" && ["li-10yr", "li-20yr"].includes(product.productKey) && ["member", "spouse"].includes(applicant.applicantKey) || siteKey === "waepa-gi" && product.productKey === "li-group-term" && applicant.applicantKey === "member" && data.underwritingBands.some(band => band.siteKey === siteKey && band.productKey === product.productKey && band.pathway === "GI" && band.sourceReference === "Main!O386/U386");
      const constraints = data.eligibilityConstraints.filter(r => r.siteKey === siteKey && r.productKey === product.productKey && r.applicantTypeKey === applicant.applicantKey);
      if (constraints.length > 1) throw new Error(`Ambiguous eligibility: ${product.productKey}/${applicant.applicantKey}`);
      if (constraints.length === 1) {
        const c = constraints[0];
        const { minimumAgeDays, minimumAgeYears, maximumAgeYears, studentMaximumAgeYears, unmarried, minimumWorkHours } = c;
        validateEligibilityConstraint(c);
        result.constraints = { value: { minimumAgeDays, minimumAgeYears, maximumAgeYears, studentMaximumAgeYears, unmarried, minimumWorkHours }, provenance: [provenance("eligibilityConstraints", c)] };
      }
      if (!supported) return result;
      const inScope = (r: { siteKey: string | null; productKey: string; applicantTypeKey: string | null }) => (r.siteKey === siteKey || r.siteKey === null) && r.productKey === product.productKey && (r.applicantTypeKey === applicant.applicantKey || r.applicantTypeKey === null);
      const eligibility = data.eligibilityConstraints.filter(inScope);
      // No implicit global/site precedence or silent first-match selection.
      if (eligibility.length !== 1) throw new Error(`Ambiguous eligibility: ${product.productKey}/${applicant.applicantKey}`);
      const row = eligibility[0];
      const evidenceFor = (table: string, source: { id: string; key: string } & LibraryMetadata) => {
        const key = source.key;
        const decision = asceBusinessDecisions.find(d => d.targets.some(t => t.table === table && t.key === key));
        const evidence = decision && data.semanticRequirements.find(r => r.key === `business-decision.${decision.key}`);
        return [provenance(table, source, evidence?.key), ...(evidence ? [provenance("semanticRequirements", evidence)] : [])];
      };
      result.eligibility = { value: { minimumAge: row.minimumAgeYears!, maximumAge: row.maximumAgeYears! }, provenance: evidenceFor("eligibilityConstraints", row) };
      result.constraints!.provenance = result.eligibility.provenance;
      const bands = data.underwritingBands.filter(inScope).sort((a, b) => compare(a.key, b.key));
      unique(bands, b => b.key, "underwriting rule");
      if (!bands.length) throw new Error(`Missing underwriting: ${product.productKey}`);
      result.underwriting = bands.map(b => {
        validateUnderwritingBand(b, siteKey, applicant.applicantKey);
        return { value: { minimumAge: b.minimumAge, maximumAge: b.maximumAge, minimumAmount: b.minimumAmount, maximumAmount: b.maximumAmount, minimumAmountExclusive: b.minimumAmountExclusive, pathway: b.pathway }, provenance: evidenceFor("underwritingBands", b) };
      });
      validateUnderwritingOverlap(result.underwriting.map(band => band.value), product.productKey, applicant.applicantKey);
      return result;
    }) };
  });
  const configuration = resolveEffectiveConfiguration(data, siteKey, clients[0].key, site.id, products.map(p => p.productKey));
  readCategoryEligibilityPolicy(configuration.categoryEligibilityPolicies);
  const assignedProducts = new Set(data.siteProducts.filter(link => link.siteId === site.id).map(link => link.productKey));
  for (const policy of configuration.beneficiaryParticipationPolicies) if (isBeneficiaryParticipationPolicy(policy.value) && policy.value.rules.some(rule => !assignedProducts.has(rule.productKey))) throw new Error("Invalid beneficiary participation policy product scope");
  for (const policy of configuration.beneficiaryNotePolicies) if (isBeneficiaryNotePolicy(policy.value) && policy.value.notes.some(note => note.productKeys.some(key => !assignedProducts.has(key)))) throw new Error("Invalid beneficiary note policy product scope");
  for (const policy of configuration.beneficiaryParticipationPolicies) if (isBeneficiaryParticipationPolicy(policy.value) && policy.value.rules.some(rule => rule.associationKeys?.some(key => !data.siteAssociations.some(link => link.siteKey === siteKey && link.associationKey === key)))) throw new Error("Invalid beneficiary participation policy Association scope");
  const implementedScopes = products.flatMap(p => p.applicants.flatMap(a => {
    if (eligibilityExecution(configuration, p.productKey, a).reason) return [];
    const c = a.constraints!.value;
    const policy = configuration.products.find(product => product.productKey === p.productKey)!;
    // The underwriting API accepts age and amount only; additional eligibility facts cannot be supplied.
    const ageOnly = c.minimumAgeDays === null && c.studentMaximumAgeYears === null && c.unmarried === null && c.minimumWorkHours === null
      && !policy.dependencies.some(r => r.value.applicantTypeKey === a.applicantKey)
      && !policy.maximumPlans.some(r => r.value.applicantTypeKey === a.applicantKey);
    const decisions: ("eligibility" | "underwriting")[] = ["eligibility"];
    if (a.underwriting.length && ageOnly) decisions.push("underwriting");
    return [{ productKey: p.productKey, applicantKey: a.applicantKey, decisions }];
  }));
  const provisionalDecisions = data.semanticRequirements.filter(decision => decision.domain === "provisional-source-decision" && decision.subjectTable === "sites" && decision.subjectKey === siteKey).sort((a, b) => compare(a.key, b.key)).map(decision => ({ key: decision.key, value: decision.value, provenance: [provenance("semanticRequirements", decision)] }));
  return structuredClone({ assignedAssociationKeys: data.siteAssociations.filter(link => link.siteKey === siteKey).map(link => link.associationKey), enabledAssociationKeys: data.siteAssociations.filter(link => link.siteKey === siteKey && link.enabled).map(link => link.associationKey), provisionalDecisions, siteKey, clientKey: clients[0].key, name: { value: site.name, provenance: [provenance("sites", site)] }, runtimeActivation: "pending-phase-6", resolution: { completeness: "partial", implementedScopes }, configuration, products });
}

export type EffectiveDecision = { status: "resolved" | "needs-information" | "unresolved" | "ineligible"; eligible?: boolean; pathway?: string; reason?: string; provenance: RuleProvenance[] };
export type EligibilityFacts = { ageYears?: number; ageDays?: number; fullTimeStudent?: boolean; unmarried?: boolean; workHoursPerWeek?: number; activeMilitary?: boolean; activelyAtWork?: boolean; associationMember?: boolean; membershipType?: string;
  associationKey?: string;
  honorablyDischargedServiceMember?: boolean;
  firmMemberCount?: number;
  selectedPlans?: { productKey: string; categoryKey: string; applicantKey: string }[];
};
/** Shared structural eligibility gate for capability metadata and execution. */
function eligibilityExecution(configuration: EffectiveConfiguration, productKey: string, applicant?: EffectiveApplicant) {
  const product = configuration.products.find(p => p.productKey === productKey);
  const rules = product?.applicantRules.filter(r => r.value.applicantTypeKey === applicant?.applicantKey) ?? [];
  const dependencies = product?.dependencies.filter(r => r.value.applicantTypeKey === applicant?.applicantKey) ?? [];
  const maximumPlans = product?.maximumPlans.filter(r => r.value.applicantTypeKey === applicant?.applicantKey) ?? [];
  const facts = product?.eligibilityFacts.filter(rule => rule.applicantKey === applicant?.applicantKey) ?? [];
  const validFacts = facts.every(rule => isEligibilityFactRequirements(rule.value));
  const provenance = [...facts.flatMap(rule => rule.provenance), ...(applicant?.constraints?.provenance ?? applicant?.provenance ?? []), ...rules.flatMap(r => r.provenance), ...dependencies.flatMap(r => r.provenance), ...maximumPlans.flatMap(r => r.provenance)];
  const reason = !applicant?.constraints || !product ? "Unsupported product or applicant scope"
    : Object.values(applicant.constraints.value).every(v => v === null) ? "Empty eligibility constraint"
    : rules.length !== 1 || rules[0].value.conditionKey !== null ? "No unique unconditional applicant assignment"
    : !validFacts ? "Unsupported additional eligibility facts"
    : maximumPlans.some(r => !Number.isInteger(r.value.count) || r.value.count < 0) ? "Invalid maximum-plan requirement"
    : undefined;
  return { reason, provenance, rules, dependencies, maximumPlans, facts };
}
/** Evaluates only explicit persisted applicant constraints; missing constraints never imply approval. */
export function resolveEffectiveEligibility(site: EffectiveSite, productKey: string, applicantKey: string, ageOrFacts?: number | EligibilityFacts): EffectiveDecision {
  const applicant = site.products.find(p => p.productKey === productKey)?.applicants.find(a => a.applicantKey === applicantKey);
  const execution = eligibilityExecution(site.configuration, productKey, applicant);
  if (execution.reason) return { status: "unresolved", reason: execution.reason, provenance: execution.provenance };
  const baseConstraints = applicant!.constraints!.value;
  const provenance = execution.provenance;
  const facts: EligibilityFacts = typeof ageOrFacts === "number" ? { ageYears: ageOrFacts } : ageOrFacts ?? {};
  const requiresAssociationChoice = site.configuration.products.find(product => product.productKey === productKey)?.journeyPolicies.some(row => isCoverageJourneyPolicy(row.value) && row.value.associationChoices.length > 0);
  if (requiresAssociationChoice && facts.associationKey && !site.enabledAssociationKeys.includes(facts.associationKey)) return { status: "unresolved", eligible: false, reason: "Association is unavailable in this Site", provenance };
  const association = resolveAssociationEligibility(site, productKey, applicantKey, facts);
  if (association.result !== "eligible") return { status: association.invalid ? "unresolved" : association.result === "needs-information" ? "needs-information" : "resolved", eligible: false, reason: association.reason ?? "Applicant does not satisfy association eligibility", provenance: [...provenance, ...(site.configuration.products.find(product => product.productKey === productKey)?.associationEligibilityPolicies ?? []).flatMap(policy => policy.provenance)] };
  const c = association.replacesAgeBounds ? { ...baseConstraints, minimumAgeDays: null, minimumAgeYears: null, maximumAgeYears: null, studentMaximumAgeYears: null } : baseConstraints;
  const categoryPolicy = readCategoryEligibilityPolicy(site.configuration.categoryEligibilityPolicies);
  const category = site.configuration.products.find(product => product.productKey === productKey)?.catalog?.value.categoryKey ?? "";
  const categoryDecision = categoryEligibility(categoryPolicy, facts.membershipType, category);
  if (categoryDecision !== "eligible") return { status: categoryDecision === "ineligible" ? "resolved" : "needs-information", eligible: false, reason: "Applicant type does not establish eligibility for this category", provenance: [...provenance, ...site.configuration.categoryEligibilityPolicies.flatMap(policy => policy.provenance)] };
  const valid = (n: unknown, integer = false): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && (!integer || Number.isInteger(n));
  const ageRequired = c.minimumAgeYears !== null || c.maximumAgeYears !== null || c.studentMaximumAgeYears !== null;
  if (ageRequired && !valid(facts.ageYears, true) || c.minimumAgeDays !== null && !valid(facts.ageDays, true) || c.unmarried !== null && typeof facts.unmarried !== "boolean" || c.minimumWorkHours !== null && !valid(facts.workHoursPerWeek)) return { status: "needs-information", provenance };
  let maximum = c.maximumAgeYears;
  if (c.studentMaximumAgeYears !== null && (maximum === null || facts.ageYears! > maximum)) {
    if (typeof facts.fullTimeStudent !== "boolean") return { status: "needs-information", provenance };
    if (facts.fullTimeStudent) maximum = c.studentMaximumAgeYears;
  }
  const maximumSatisfied = maximum === null ? true : eligibilityAgeMaximumSatisfied(facts.ageYears, maximum, execution.facts.flatMap(rule => rule.value as EligibilityFactRequirement[]), facts);
  if (maximumSatisfied === undefined) return { status: "needs-information", provenance };
  let eligible = (c.minimumAgeDays === null || facts.ageDays! >= c.minimumAgeDays) && (c.minimumAgeYears === null || facts.ageYears! >= c.minimumAgeYears) && maximumSatisfied && (c.unmarried === null || facts.unmarried === c.unmarried) && (c.minimumWorkHours === null || facts.workHoursPerWeek! >= c.minimumWorkHours);
  for (const rule of execution.facts) for (const requirement of rule.value as EligibilityFactRequirement[]) {
    if ("extendsMaximumAgeTo" in requirement) continue;
    const satisfied = eligibilityFactSatisfied(requirement, facts[requirement.fact]);
    if (satisfied === undefined) return { status: "needs-information", reason: `${requirement.fact} is required`, provenance };
    eligible &&= satisfied;
  }
  const { rules, dependencies, maximumPlans } = execution;
  const evidence = provenance;
  eligible = eligible && rules[0].value.eligible;
  if (eligible && (dependencies.length || maximumPlans.length)) {
    if (!Array.isArray(facts.selectedPlans)) return { status: "needs-information", reason: "Selected plans required", provenance: evidence };
    eligible = dependencies.every(({ value: r }) => facts.selectedPlans!.some(p => p.applicantKey === r.requiresApplicantKey && p.categoryKey === r.categoryKey && (!r.sameProduct || p.productKey === productKey))) && maximumPlans.every(({ value: r }) => facts.selectedPlans!.filter(p => p.applicantKey === applicantKey && p.categoryKey === r.categoryKey).length <= r.count);
  }
  return { status: "resolved", eligible, provenance: evidence };
}
export function resolveEffectiveUnderwriting(site: EffectiveSite, productKey: string, applicantKey: string, ageOrFacts?: number | EligibilityFacts, amount?: number): EffectiveDecision {
  const supported = site.products.find(p => p.productKey === productKey)?.applicants.find(a => a.applicantKey === applicantKey);
  if (!supported?.underwriting.length) return { status: "unresolved", reason: "Unsupported underwriting scope", provenance: supported?.provenance ?? [] };
  const facts = typeof ageOrFacts === "number" ? { ageYears: ageOrFacts } : ageOrFacts;
  const ageYears = facts?.ageYears;
  const eligibility = resolveEffectiveEligibility(site, productKey, applicantKey, facts);
  if (eligibility.status !== "resolved") return eligibility;
  if (!eligibility.eligible) return { ...eligibility, status: "ineligible" };
  if (amount === undefined || !Number.isFinite(amount) || amount <= 0) return { status: "needs-information", provenance: eligibility.provenance };
  const applicant = site.products.find(p => p.productKey === productKey)!.applicants.find(a => a.applicantKey === applicantKey)!;
  const bands = applicant.underwriting.filter(({ value: b }) => ageYears! >= b.minimumAge && ageYears! <= b.maximumAge && (b.minimumAmountExclusive ? amount > b.minimumAmount : amount >= b.minimumAmount) && amount <= b.maximumAmount);
  if (bands.length !== 1) return { status: "unresolved", reason: "No unique underwriting band", provenance: eligibility.provenance };
  return { status: "resolved", pathway: bands[0].value.pathway, provenance: [...eligibility.provenance, ...bands[0].provenance] };
}
