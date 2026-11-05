import { isFinancialQuestionnairePolicy } from "./financialQuestionnaire";
import { isBeneficiaryParticipationPolicy } from "./beneficiaryParticipation";
import { isBeneficiaryNotePolicy } from "./beneficiaryNotes";
import { healthQuestionnaireFieldKeys, isHealthQuestionnairePolicy } from "./configuredHealthQuestionnaire";
import { materializeRuleDocumentation } from "./ruleDocumentation";
import { resolveSiteStructureOwnership } from "./siteStructureOwnership";
import { resolveProductAvailabilityOwnership } from "./productAvailabilityOwnership";
import { resolveFieldDefinitionOwnership, resolveSharedFieldDefinition } from "./fieldDefinitionOwnership";
import { resolvePageParticipationOwnership } from "./pageParticipation";
import { resolveRoutingRules } from "./routingRules";
import { isSelectionPolicy } from "./coverageSelectionPolicy";
import type { CoverageAmountAssignment } from "./coverage";
import { materializeSelectionPolicy } from "./structuredSelectionPolicy";
import { isSupportedAmountPattern } from "./coveragePolicyValidation";
import { isAssociationAmountPolicy, resolveConfiguredAssociationAmounts } from "./associationAmountPolicy";
import { materializeBenefitPolicy } from "./structuredBenefitPolicy";
import { applyRiderOverrides, isRelationalRiderSet } from "./riderOverrides";
import type { DatabaseSchema, Scope } from "../persistence/types";
import type { LibraryMetadata } from "./provenance";
import type { ResolvedValue, RuleProvenance } from "./effectiveSite";

import { effectiveConfigurationTables } from "../persistence/catalogTables";
export { effectiveConfigurationTables } from "../persistence/catalogTables";
export type EffectiveConfigurationData = Pick<DatabaseSchema, typeof effectiveConfigurationTables[number]>;
export type DomainIssue = { domain: string; key: string; reason: string; provenance: RuleProvenance[] };
type Source = { id: string; key?: string } & Partial<LibraryMetadata>;
export function source(table: string, row: Source): RuleProvenance {
  return { table, key: row.key ?? row.id, displayId: row.displayId, providedBy: row.providedBy ?? null, sourceReference: row.sourceReference ?? null };
}
const order = <T extends { key: string; position?: number }>(rows: T[]) => [...rows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
const rank = { global: 0, client: 1, site: 2 };

/** Domain configuration, keyed by semantic identity; never reconstructs ClientConfig paths. */
export function resolveEffectiveConfiguration(db: EffectiveConfigurationData, siteKey: string, clientKey: string, siteId: string, productKeys: string[]) {
  for (const table of effectiveConfigurationTables) {
    const keys = db[table].map(r => "key" in r ? r.key ?? r.id : r.id);
    if (new Set(keys).size !== keys.length) throw new Error(`Duplicate normalized identity: ${table}`);
  }
  const issues: DomainIssue[] = [];
  const issue = (domain: string, key: string, reason: string, provenance: RuleProvenance[] = []) => { issues.push({ domain, key, reason, provenance }); };
  const applicable = (r: Scope) => r.scope === "global" ? r.clientKey === null && r.siteKey === null : r.scope === "client" ? r.clientKey === clientKey && r.siteKey === null : r.scope === "site" && r.siteKey === siteKey;
  const scoped = <T extends Scope & { key: string; position?: number }>(rows: T[]) => order(rows.filter(applicable)).sort((a, b) => rank[a.scope] - rank[b.scope]);
  const one = <T extends Source>(rows: T[], key: string, table: string): T | undefined => {
    const matches = rows.filter(r => r.key === key);
    if (matches.length > 1) throw new Error(`Ambiguous ${table}: ${key}`);
    if (!matches.length) issue(table, key, "Missing referenced normalized record");
    return matches[0];
  };
  const wrap = <T extends Source>(table: string, rows: T[]) => rows.map(row => {
    const { id: _id, key: _key, displayId: _display, providedBy: _provider, sourceReference: _reference, ...value } = row;
    void _id; void _key; void _display; void _provider; void _reference;
    return { key: row.key ?? row.id, value, provenance: [source(table, row)] };
  });
  const definition = <T>(table: string, row: Source & { definition: T }): ResolvedValue<T> => ({ value: row.definition, provenance: [source(table, row)] });
  // Scalar configuration values have explicit global < client < Site precedence.
  // Same-layer collisions are errors, never resolved by insertion order.
  function values<T extends Scope & Source & { key: string; value: unknown; position: number }>(table: string, rows: T[], identity: (row: T) => string) {
    const result = new Map<string, ResolvedValue<unknown>>();
    const seen = new Set<string>();
    for (const row of scoped(rows)) {
      const key = identity(row), collision = `${row.scope}:${key}`;
      if (seen.has(collision)) throw new Error(`Ambiguous ${table}: ${collision}`);
      seen.add(collision);
      result.set(key, { value: row.value, provenance: [...(result.get(key)?.provenance ?? []), source(table, row)] });
    }
    return [...result].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => ({ key, ...value }));
  }
  function profile<T extends object>(table: string, rows: (Scope & Source & { key: string; position: number; definition: T })[]) {
    return values(table, rows.flatMap(row => Object.entries(row.definition).map(([key, value]) => ({ ...row, property: key, value }))), r => r.property);
  }
  const fieldDefinitionOwnership = resolveFieldDefinitionOwnership(db);
  const configurations = values("configurationValues", db.configurationValues, r => r.configurationKey);
  for (const value of configurations) one(db.configurationDefinitions, value.key, "configurationDefinitions");
  const productAvailabilityOwnership = resolveProductAvailabilityOwnership(db, configurations, siteKey);
  const siteStructureOwnership = resolveSiteStructureOwnership(db, configurations, siteKey);
  const pageParticipation = resolvePageParticipationOwnership(db, configurations, siteKey);
  const routingConfigurations = configurations.filter(configuration => {
    const definition = db.configurationDefinitions.find(row => row.key === configuration.key)?.definition;
    return definition?.target?.kind === "site-routing-policy" || definition?.path?.join(".") === "routingGates";
  });
  if (routingConfigurations.length > 1) throw new Error("Ambiguous routing configuration");
  if (routingConfigurations[0] && Array.isArray(routingConfigurations[0].value) && routingConfigurations[0].provenance.some(provenance =>
    db.configurationValues.some(row => row.key === provenance.key && !Array.isArray(row.value)))) throw new Error("Routing arrays cannot override rule-owned routing");
  const routing = resolveRoutingRules(db, routingConfigurations[0], siteKey, clientKey);
  const content = values("contentValues", db.contentValues, r => r.contentKey);
  for (const value of content) one(db.contentEntries, value.key, "contentEntries");
  const branding = profile("brandingProfiles", db.brandingProfiles);
  const support = profile("supportProfiles", db.supportProfiles);
  if (!branding.length) issue("branding", siteKey, "No branding profile");
  if (!support.length) issue("support", siteKey, "No support profile");

  const amounts = (key: string) => {
    const pattern = one(db.coverageAmountPatterns, key, "coverageAmountPatterns");
    if (!pattern) return null;
    const bands = order(db.amountBands.filter(r => r.amountPatternKey === key));
    const options = order(db.amountOptions.filter(r => r.amountPatternKey === key));
    const supported = isSupportedAmountPattern(pattern, bands, options);
    if (!supported) issue("amounts", key, "Unsupported or incomplete amount pattern", [source("coverageAmountPatterns", pattern)]);
    return { status: supported ? "resolved" as const : "unresolved" as const, pattern: wrap("coverageAmountPatterns", [pattern])[0], bands: wrap("amountBands", bands), options: wrap("amountOptions", options) };
  };
  const products = productKeys.map(productKey => {
    const row = one(db.products, productKey, "products");
    const category = row && one(db.coverageCategories, row.categoryKey, "coverageCategories");
    const presentationKeys = ["name", "definition", "description", "brochureUrl", "coverageNote", "featured", "applicantNotes", "productWarning", "productContent", "groupPolicySitus", "options", "riders"] as const;
    const presentation = presentationKeys.flatMap(key => {
      const overrideKeys = new Set(db.configurationDefinitions.filter(d => {
        const target = d.definition.target;
        return target?.kind === "product-presentation" && target.productKey === productKey && target.property === key;
      }).map(d => d.key));
      const overrides = configurations.filter(c => overrideKeys.has(c.key));
      if (overrides.length > 1) throw new Error(`Ambiguous product presentation: ${productKey}/${key}`);
      const base = key === "riders" ? undefined : row?.definition[key];
      const override = overrides[0];
      if (base === undefined && !override) return [];
      return [{ key, value: override ? override.value : base, provenance: [...(row && base !== undefined ? [source("products", row)] : []), ...(override?.provenance ?? [])] }];
    });
    // Site-normalized coverage rows are complete Site-specific sets. Global rows
    // are catalog inputs, not implicit substitutes for missing Site policy.
    const selected = <T extends { productKey: string; siteKey: string | null; key: string; position?: number }>(rows: T[]) => order(rows.filter(r => r.productKey === productKey && r.siteKey === siteKey));
    const amountRules = selected(db.productAmountRules).map(r => {
      if (r.conditionKey || (r.clientKey !== null && r.clientKey !== clientKey)) issue("amounts", r.key, "Conditional or mismatched amount assignment", [source("productAmountRules", r)]);
      return { ...wrap("productAmountRules", [r])[0], status: r.conditionKey || (r.clientKey !== null && r.clientKey !== clientKey) ? "unresolved" as const : "resolved" as const, amount: amounts(r.amountPatternKey) };
    });
    if (!amountRules.length) issue("amounts", productKey, "No Site amount rules");
    const limits = order(db.aggregateLimits.filter(r => r.siteKey === siteKey && (r.productKey === productKey || (r.productKey === null && r.categoryKey === row?.categoryKey)))).map(r => {
      const caps = wrap("benefitCaps", order(db.benefitCaps.filter(c => c.aggregateLimitKey === r.key)));
      const supported = r.formula === null && r.conditionKey === null && (r.maximum !== null ? Number.isFinite(r.maximum) && r.maximum >= 0 : r.productKey !== null && caps.length > 0);
      if (!supported) issue("benefits", r.key, "Incomplete limit or formula/condition requires an executable normalized expression", [source("aggregateLimits", r)]);
      return { ...wrap("aggregateLimits", [r])[0], status: supported ? "resolved" as const : "unresolved" as const, caps };
    });
    const riderAssignments = scoped(db.productRiders.filter(r => r.productKey === productKey));
    // A scoped replacement marker can explicitly select an empty rider set.
    const markerKeys = new Set(db.configurationDefinitions.filter(r => r.definition.target?.kind === "product-rider-set" && r.definition.target.productKey === productKey).map(r => r.key));
    const marker = scoped(db.configurationValues.filter(r => markerKeys.has(r.configurationKey))).at(-1);
    const riderOwnership = marker && isRelationalRiderSet(marker.value) ? "relational" as const : "legacy" as const;
    if (marker?.value && typeof marker.value === "object" && !Array.isArray(marker.value) && riderOwnership !== "relational") throw new Error(`Invalid rider-set contract: ${productKey}`);
    if (riderOwnership === "relational") {
      if (scoped(db.configurationValues.filter(r => markerKeys.has(r.configurationKey) && r.scope === marker?.scope)).length !== 1) throw new Error(`Ambiguous rider-set contract: ${productKey}`);
      if (presentation.some(value => value.key === "riders" && value.value !== null)) throw new Error(`Whole-rider overrides are not supported by the relational contract: ${productKey}`);
    }
    for (const configuration of configurations) {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      if (target?.kind === "product-rider-override" && target.productKey === productKey
        && configuration.provenance.some(provenance => db.configurationValues.some(row => row.key === provenance.key && row.scope === "global"))) throw new Error("Global rider properties belong to the rider definition");
      if (target?.kind === "product-rider-override" && target.productKey === productKey
        && !riderAssignments.some(assignment => assignment.riderKey === target.riderKey && assignment.scope === marker?.scope)) {
        if (configuration.provenance.some(provenance => db.configurationValues.some(row => row.key === provenance.key && row.scope === "site"))) throw new Error(`Unassigned rider override: ${target.riderKey}`);
        // Client properties apply only where the rider is assigned. An explicit
        // empty Site set (for example WAEPA GI) must remain empty.
        const base = one(db.riders, target.riderKey, "riders");
        if (!base) throw new Error(`Missing rider override definition: ${target.riderKey}`);
        applyRiderOverrides(base.definition, [{ key: target.property, value: configuration.value }]);
      }
    }
    const riders = riderAssignments.filter(r => marker ? r.scope === marker.scope : r.scope === "global").map(r => {
      const rider = one(db.riders, r.riderKey, "riders");
      const switches = db.siteRiders.filter(s => s.siteId === siteId && s.riderKey === r.riderKey);
      if (switches.length > 1) throw new Error(`Ambiguous Site rider: ${r.riderKey}`);
      const overrideTargets = new Map(db.configurationDefinitions.flatMap(definition => {
        const target = definition.definition.target;
        return target?.kind === "product-rider-override" && target.productKey === productKey && target.riderKey === r.riderKey ? [[definition.key, target.property] as const] : [];
      }));
      const overrides = values("configurationValues", db.configurationValues.filter(value => overrideTargets.has(value.configurationKey)), value => overrideTargets.get(value.configurationKey)!);
      if (overrides.length && riderOwnership !== "relational") throw new Error(`Rider property overrides require the relational contract: ${productKey}`);
      const effective = rider && riderOwnership === "relational" ? applyRiderOverrides(rider.definition, overrides) : null;
      if (!rider && riderOwnership === "relational") throw new Error(`Missing relational rider: ${r.riderKey}`);
      if (!rider || rider.definition.premiumFactor === null || !Number.isFinite(rider.definition.premiumFactor) || rider.definition.premiumFactor < 0) issue("riders", r.riderKey, "Missing rider or unconfirmed premium factor", [source("productRiders", r)]);
      return { key: r.riderKey, enabled: effective?.enabled ?? switches[0]?.enabled ?? true,
        definition: rider ? { value: effective?.definition ?? rider.definition, provenance: [source("riders", rider), ...overrides.flatMap(override => override.provenance)] } : null,
        provenance: [source("productRiders", r), ...(marker ? [source("configurationValues", marker)] : []), ...switches.map(s => source("siteRiders", s)), ...overrides.flatMap(override => override.provenance)], amounts: order(db.riderAmountRules.filter(a => a.riderKey === r.riderKey && (a.baseProductKey === null || a.baseProductKey === productKey))).map(a => ({ ...wrap("riderAmountRules", [a])[0], amount: amounts(a.amountPatternKey) })) };
    });
    if (riderOwnership === "relational" && new Set(riders.map(rider => rider.definition?.value.id)).size !== riders.length) throw new Error(`Duplicate relational rider identity: ${productKey}`);
    const policyConfigurations = (kind: "product-rate-modifier-policy" | "product-rate-input-policy" | "product-rate-outcome" | "product-rating-adjustments" | "product-selection-policy" | "product-journey-policy") => configurations.filter(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === kind && target.productKey === productKey;
    });
    const journeyPolicies = policyConfigurations("product-journey-policy");
    const selectionPolicies = policyConfigurations("product-selection-policy").map(configuration => {
      const resolved = materializeSelectionPolicy(configuration.value, productKey, riders);
      if (resolved.error) throw new Error(`Unresolved structured selection: ${productKey}: ${resolved.error}`);
      return { ...configuration, value: resolved.value, provenance: [...configuration.provenance, ...resolved.provenance] };
    });
    const structuredSelection = selectionPolicies.filter(policy => policy.value !== null && typeof policy.value === "object" && "amountSource" in policy.value && policy.value.amountSource === "rider-amount-rules");
    if (structuredSelection.length) {
      const policy = structuredSelection[0].value;
      if (selectionPolicies.length !== 1 || !isSelectionPolicy(policy)) throw new Error(`Unresolved structured selection: ${productKey}`);
      for (const rider of riders) {
        const rule = policy.riders.find(rule => rule.key === rider.key);
        if (!rule || !rider.definition?.value.hasAmount) continue;
        if (configurations.some(configuration => {
          const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
          return target?.kind === "product-rider-override" && target.productKey === productKey && target.riderKey === rider.key && ["coverageAmounts", "defaultAmount"].includes(target.property);
        })) throw new Error(`Rider amount overrides compete with structured rules: ${rider.key}`);
        const coverageAmounts: CoverageAmountAssignment[] = [];
        for (const applicant of rule.applicants) {
          if (applicant !== "member" && applicant !== "spouse" && applicant !== "child") throw new Error("Unsupported rider applicant");
          const amount = rule.amountByApplicant?.[applicant] ?? rule.amount;
          if (amount.kind !== "choices") continue;
          const step = amount.values[1] - amount.values[0];
          const range = amount.values.length > 2 && step > 0 && amount.values.every((value, i) => value === amount.values[0] + step * i);
          coverageAmounts.push({ scope: { applicantType: applicant }, selections: range
            ? [{ type: "range", min: amount.values[0], max: amount.values[amount.values.length - 1], increment: step }]
            : [{ type: "amountList", values: [...amount.values] }] });
        }
        // Legacy presentation amounts remain source evidence only. The amount
        // controls and journey reconciliation read these same structured choices.
        rider.definition.value = { ...rider.definition.value, coverageAmounts };
        if (rider.definition.value.defaultAmount !== undefined && rule.amount.kind === "choices") rider.definition.value.defaultAmount = rule.amount.default;
        rider.definition.provenance.push(...structuredSelection[0].provenance);
      }
    }
    const rateModifierPolicies = policyConfigurations("product-rate-modifier-policy");
    const rateInputPolicies = policyConfigurations("product-rate-input-policy");
    const rateOutcomes = policyConfigurations("product-rate-outcome");
    const ratingAdjustments = policyConfigurations("product-rating-adjustments");
    const rateOutcome = rateOutcomes.length === 1 ? rateOutcomes[0] : null;
    const outcomeValue = rateOutcome?.value;
    const rateUnavailable = outcomeValue !== null && typeof outcomeValue === "object" && !Array.isArray(outcomeValue) && "status" in outcomeValue && outcomeValue.status === "unavailable" && "reason" in outcomeValue && typeof outcomeValue.reason === "string" && outcomeValue.reason.trim().length > 0;
    if (rateOutcomes.length > 1 || rateOutcomes.length && !rateUnavailable) issue("rates", productKey, "Invalid or conflicting rate outcome", rateOutcomes.flatMap(outcome => outcome.provenance));
    const rating = { status: rateUnavailable ? "unavailable" as const : "unresolved" as const, outcome: rateOutcome, adjustments: ratingAdjustments };
    const rates = order(db.productRateTables.filter(r => r.productKey === productKey && (r.siteKey === siteKey || r.siteKey === null))).map(r => {
      const table = one(db.rateTables, r.rateTableKey, "rateTables");
      if (!rateUnavailable) issue("rates", r.key, "Rate source is reference material; executable rate cells/inputs are not modeled", [source("productRateTables", r)]);
      return { ...wrap("productRateTables", [r])[0], status: "unresolved" as const, table: table ? wrap("rateTables", [table])[0] : null, presentations: wrap("rateTablePresentations", order(db.rateTablePresentations.filter(p => p.rateTableKey === r.rateTableKey && (p.siteKey === siteKey || p.siteKey === null) && (p.productKey === productKey || p.productKey === null)))) };
    });
    if (!rates.length && !rateUnavailable) issue("rates", productKey, "No normalized rate inputs");
    const plans = order(db.productCoveragePlans.filter(r => r.productKey === productKey)).map(link => {
      const plan = one(db.coveragePlanDefinitions, link.planKey, "coveragePlanDefinitions");
      return { ...wrap("productCoveragePlans", [link])[0], definition: plan ? wrap("coveragePlanDefinitions", [plan])[0] : null,
        variants: order(db.coveragePlanVariants.filter(v => v.planKey === link.planKey && (v.applicantTypeKey === null || v.applicantTypeKey === link.applicantTypeKey))).map(v => ({ ...wrap("coveragePlanVariants", [v])[0],
          amounts: order(db.planAmountRules.filter(a => a.variantKey === v.key)).map(a => {
            if (a.conditionKey) issue("plans", a.key, "Conditional plan amount requires evaluation", [source("planAmountRules", a)]);
            return { ...wrap("planAmountRules", [a])[0], amount: amounts(a.amountPatternKey) };
          }), periods: wrap("planBenefitPeriods", order(db.planBenefitPeriods.filter(p => p.variantKey === v.key))) })) };
    });
    const questionSets = order(db.productQuestionSets.filter(r => r.productKey === productKey)).map(link => {
      const set = one(db.questionSets, link.questionSetKey, "questionSets");
      return { ...wrap("productQuestionSets", [link])[0], definition: set ? wrap("questionSets", [set])[0] : null,
        questions: order(db.questionSetQuestions.filter(q => q.questionSetKey === link.questionSetKey)).map(q => {
          const question = one(db.questionDefinitions, q.questionKey, "questionDefinitions");
          if (q.conditionKey) issue("questions", q.key, "Conditional question requires evaluation", [source("questionSetQuestions", q)]);
          if (question?.status !== "documented") issue("questions", q.questionKey, "Question is not documented", question ? [source("questionDefinitions", question)] : []);
          return { ...wrap("questionSetQuestions", [q])[0], definition: question ? wrap("questionDefinitions", [question])[0] : null };
        }), fields: order(db.questionSetFields.filter(f => f.questionSetKey === link.questionSetKey)).map(f => {
          const field = one(db.fields, f.fieldKey, "fields");
          if (f.conditionKey) issue("questions", f.key, "Conditional question field requires evaluation", [source("questionSetFields", f)]);
          return { ...wrap("questionSetFields", [f])[0], definition: field ? definition("fields", field) : null };
        }) };
    });
    const dependentPolicies = configurations.filter(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === "product-dependent-policy" && target.productKey === productKey;
    });
    const amountCapPolicies = configurations.filter(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === "product-amount-cap-policy" && target.productKey === productKey;
    });
    const associationEligibilityPolicies = configurations.filter(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === "product-association-eligibility" && target.productKey === productKey;
    });
    const associationAmounts = configurations.filter(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === "product-association-amounts" && target.productKey === productKey;
    }).map(policy => ({ ...policy, amounts: isAssociationAmountPolicy(policy.value) ? policy.value.amounts.map(assignment => {
      const base = amountRules.find(rule => rule.value.applicantTypeKey === assignment.applicantKey) ?? amountRules.find(rule => rule.value.applicantTypeKey === null);
      if (!base) throw new Error(`Unavailable association amount applicant: ${productKey}/${assignment.applicantKey}`);
      return { ...base, key: `${policy.key}.${assignment.applicantKey}`, provenance: policy.provenance,
        value: { ...base.value, applicantTypeKey: assignment.applicantKey, applicantClass: null, amountPatternKey: assignment.amountPatternKey }, amount: amounts(assignment.amountPatternKey) };
    }) : [] }));
    const referenceRateTables = configurations.filter(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === "product-reference-rate-table" && target.productKey === productKey;
    });
    const residencyPolicies = configurations.filter(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === "product-residency-policy" && target.productKey === productKey;
    });
    const benefitPolicies = configurations.filter(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === "product-benefit-policy" && target.productKey === productKey;
    }).map(configuration => {
      const resolved = materializeBenefitPolicy(configuration.value, amountRules);
      if (resolved.error) issue("benefits", configuration.key, resolved.error, configuration.provenance);
      return { ...configuration, value: resolved.value, provenance: [...configuration.provenance, ...resolved.provenance] };
    });
    const eligibilityFacts = configurations.flatMap(configuration => {
      const target = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target;
      return target?.kind === "product-eligibility-facts" && target.productKey === productKey
        ? [{ ...configuration, applicantKey: target.applicantKey }] : [];
    });
    return { productKey, presentation, plans, questionSets, eligibilityFacts, associationEligibilityPolicies, associationAmounts, benefitPolicies, dependentPolicies, residencyPolicies, referenceRateTables, underwritingRules: wrap("underwritingBands", selected(db.underwritingBands)), residency: order(db.residencyRules.filter(r => (r.siteKey === siteKey || r.siteKey === null) && r.productKey === productKey)).map(r => { issue("residency", r.key, "Residency policy is represented but not evaluated", [source("residencyRules", r)]); return { ...wrap("residencyRules", [r])[0], jurisdictions: wrap("residencyJurisdictions", order(db.residencyJurisdictions.filter(j => j.residencyRuleKey === r.key))) }; }), catalog: row ? { value: { name: row.definition.name, code: row.definition.code, categoryKey: row.categoryKey, definition: row.definition.definition }, provenance: [source("products", row)] } : null, category: category ? definition("coverageCategories", category) : null,
      configurations: wrap("productConfigurationValues", order(db.productConfigurationValues.filter(r => r.productKey === productKey))),
      identifiers: wrap("productIdentifiers", scoped(db.productIdentifiers.filter(r => r.productKey === productKey))),
      applicantRules: wrap("productApplicantEligibility", selected(db.productApplicantEligibility)), dependencies: wrap("coverageDependencies", selected(db.coverageDependencies)), maximumPlans: wrap("maximumPlanRules", selected(db.maximumPlanRules)),
      benefitPeriods: wrap("benefitPeriodOptions", selected(db.benefitPeriodOptions)), selectionPolicies, journeyPolicies, amountCapPolicies, limits, amounts: amountRules, riderOwnership, riders, rates, rating, rateInputPolicies, rateModifierPolicies };
  });

  const pages = order(db.sitePages.filter(p => p.siteKey === siteKey)).map(assignment => {
    const page = one(db.pages, assignment.pageKey, "pages");
    const fieldKeys = new Map<string, { included: boolean; definition: DatabaseSchema["fields"][number]["definition"]; provenance: RuleProvenance[] }>();
    const field = (key: string) => {
      const row = one(db.fields, key, "fields");
      if (!row) return undefined;
      const resolved = resolveSharedFieldDefinition(row, db.validationRules, fieldDefinitionOwnership);
      return { included: true, ...resolved };
    };
    for (const row of order(db.pageFields.filter(r => r.pageKey === assignment.pageKey))) {
      if (fieldKeys.has(row.fieldKey)) throw new Error(`Duplicate page field: ${row.key}`);
      const value = field(row.fieldKey);
      if (value) fieldKeys.set(row.fieldKey, { ...value, provenance: [...value.provenance, source("pageFields", row)] });
    }
    const sectionKeys = new Set(db.pageSections.filter(section => section.pageKey === assignment.pageKey && !section.definition.collectionName).map(section => section.key));
    for (const row of order(db.pageSectionFields.filter(placement => sectionKeys.has(placement.sectionKey)))) {
      if (fieldKeys.has(row.fieldKey)) continue;
      const value = field(row.fieldKey);
      if (value) fieldKeys.set(row.fieldKey, { ...value, provenance: [...value.provenance, source("pageSectionFields", row)] });
    }
    const written = new Set<string>();
    for (const row of scoped(db.siteFieldConfigurations.filter(r => r.pageKey === assignment.pageKey))) {
      for (const property of [...Object.keys(row.values), ...(row.hidden !== null ? ["hidden"] : []), ...(row.include !== null ? ["include"] : [])]) {
        const key = `${row.scope}:${row.fieldKey}:${property}`;
        if (written.has(key)) throw new Error(`Ambiguous field override: ${key}`);
        written.add(key);
      }
      const value = fieldKeys.get(row.fieldKey) ?? (row.include === true ? field(row.fieldKey) : undefined);
      if (!value) { issue("fields", row.key, "Override references an unassigned field", [source("siteFieldConfigurations", row)]); continue; }
      fieldKeys.set(row.fieldKey, { included: row.hidden !== null ? !row.hidden : row.include ?? value.included, definition: { ...value.definition, ...row.values }, provenance: [...value.provenance, source("siteFieldConfigurations", row)] });
    }
    for (const value of fieldKeys.values()) {
      const conditionKeys = [value.definition.visibilityConditionId, ...(value.definition.optionExclusions ?? []).map(e => e.conditionId)].filter((key): key is NonNullable<typeof key> => key !== undefined);
      for (const key of conditionKeys) one(db.conditions, key, "conditions");
    }
    const sections = order(db.pageSections.filter(s => s.pageKey === assignment.pageKey)).map(s => ({ key: s.key, definition: { ...definition("pageSections", s), value: { ...s.definition,
      fieldIds: order(db.pageSectionFields.filter(f => f.sectionKey === s.key)).map(f => f.fieldKey as typeof s.definition.fieldIds[number]),
    } }, fields: order(db.pageSectionFields.filter(f => f.sectionKey === s.key)).map(f => {
      const field = one(db.fields, f.fieldKey, "fields");
      return { ...wrap("pageSectionFields", [f])[0], definition: field ? definition("fields", field) : null };
    }) }));
    return { key: assignment.pageKey, sections, requirement: assignment.requirement, definition: page ? definition("pages", page) : null, provenance: [source("sitePages", assignment)], fields: [...fieldKeys].map(([key, value]) => ({ key, ...value })) };
  });
  if (!pages.length) issue("pages", siteKey, "No Site page assignments");
  const flowAssignments = new Map<string, DatabaseSchema["siteFlows"][number]>();
  const flowSeen = new Set<string>();
  for (const row of scoped(db.siteFlows)) {
    const key = `${row.scope}:${row.flowId}`;
    if (flowSeen.has(key)) throw new Error(`Ambiguous flow: ${key}`);
    flowSeen.add(key); flowAssignments.set(row.flowId, row);
  }
  const flows = [...flowAssignments.values()].sort((a,b) => a.flowId.localeCompare(b.flowId)).map(assignment => {
    const flow = one(db.flows, assignment.flowKey, "flows");
    const steps = order(db.flowSteps.filter(r => r.flowKey === assignment.flowKey));
    const transitions = order(db.flowTransitions.filter(r => r.flowKey === assignment.flowKey));
    for (const edge of transitions) {
      if (!steps.some(s => s.key === edge.sourceStepKey) || !steps.some(s => s.key === edge.targetStepKey)) issue("flows", edge.key, "Missing flow endpoint", [source("flowTransitions", edge)]);
      if (edge.definition.condition) issue("flows", edge.key, "Branch label has no executable normalized predicate", [source("flowTransitions", edge)]);
    }
    return { key: assignment.flowId, executionStatus: "unresolved" as const, definition: flow ? definition("flows", flow) : null, provenance: [source("siteFlows", assignment)], steps: wrap("flowSteps", steps), transitions: wrap("flowTransitions", transitions) };
  });
  if (!flows.length) issue("flows", siteKey, "No flow assignments");
  const rules = scoped(db.ruleAssignments).map(assignment => {
    const row = one(db.rules, assignment.ruleKey, "rules");
    const conditions = order(db.ruleConditions.filter(r => r.ruleKey === assignment.ruleKey)).map(r => {
      const condition = one(db.conditions, r.conditionKey, "conditions");
      return { provenance: [source("ruleConditions", r)], condition: condition ? definition("conditions", condition) : null };
    });
    const actions = order(db.ruleActions.filter(action => action.ruleKey === assignment.ruleKey)).map(action => {
      const resolved = wrap("ruleActions", [{ ...action, definition: row ? materializeRuleDocumentation(row, action) : action.definition }])[0];
      if (row && action.definition.kind === "rule-documentation") resolved.provenance.push(source("rules", row));
      return resolved;
    });
    const executable = routing?.ruleKeys.includes(assignment.ruleKey) ?? false;
    if (!executable) issue("rules", assignment.ruleKey, "Documented rule actions are not executable", [source("ruleAssignments", assignment)]);
    return { key: assignment.ruleKey, executionStatus: executable ? "resolved" as const : "documented" as const, definition: row ? definition("rules", row) : null, provenance: [source("ruleAssignments", assignment)], conditions, actions };
  });
  const features = order(db.siteFeatures.filter(r => r.siteKey === siteKey)).map(r => {
    const row = one(db.features, r.featureKey, "features");
    return { key: r.featureKey, enabled: r.enabled, provenance: [source("siteFeatures", r)], definition: row ? definition("features", row) : null };
  });
  const lifeAggregates = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-life-aggregate");
  const ratePresentationPolicies = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-rate-presentation");
  const lifeAggregateParticipation = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-life-aggregate-participation");
  const beneficiaryParticipationPolicies = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-beneficiary-participation");
  if (beneficiaryParticipationPolicies.length > 1) throw new Error("Ambiguous beneficiary participation policy");
  for (const policy of beneficiaryParticipationPolicies) {
    if (!isBeneficiaryParticipationPolicy(policy.value) || policy.value.rules.some(rule => !db.products.some(product => product.key === rule.productKey))) throw new Error("Invalid beneficiary participation policy or scope");
  }
  const beneficiaryNotePolicies = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-beneficiary-notes");
  if (beneficiaryNotePolicies.length > 1) throw new Error("Ambiguous beneficiary note policy");
  for (const policy of beneficiaryNotePolicies) {
    if (!isBeneficiaryNotePolicy(policy.value) || policy.value.notes.some(note => note.productKeys.some(key => !db.products.some(product => product.key === key)))) throw new Error("Invalid beneficiary note policy or product scope");
  }
  const reviewPolicies = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-review-policy");
  const financialQuestionnairePolicies = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-financial-questionnaire");
  if (financialQuestionnairePolicies.length > 1 || financialQuestionnairePolicies.some(row => !isFinancialQuestionnairePolicy(row.value) || row.value.rules.some(rule => rule.productKeys.some(key => !productKeys.includes(key))))) throw new Error("Invalid financial questionnaire policy or product scope");
  const categoryEligibilityPolicies = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-category-eligibility");
  const healthQuestionnairePolicies = configurations.filter(configuration => db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.target?.kind === "site-health-questionnaires").map(configuration => ({ ...configuration, fields: isHealthQuestionnairePolicy(configuration.value) ? healthQuestionnaireFieldKeys(configuration.value).flatMap(key => {
    const row = one(db.fields, key, "fields");
    if (!row) return [];
    const resolved = resolveSharedFieldDefinition(row, db.validationRules, fieldDefinitionOwnership);
    return [{ key, definition: resolved.definition, provenance: resolved.provenance }];
  }) : [] }));
  return { financialQuestionnairePolicies, beneficiaryParticipationPolicies, beneficiaryNotePolicies, healthQuestionnairePolicies, siteStructureOwnership, productAvailabilityOwnership, fieldDefinitionOwnership, pageParticipation, routing, lifeAggregateParticipation, reviewPolicies, categoryEligibilityPolicies, products, pages, flows, rules, conditions: wrap("conditions", order(db.conditions)), content, configurations, lifeAggregates, ratePresentationPolicies, branding, support, features, issues };
}
export type EffectiveConfiguration = ReturnType<typeof resolveEffectiveConfiguration>;

export type AmountFacts = { applicantKey: string; applicantClass?: string; associationKey?: string; amount?: number | string; baseAmount?: number };
export type EffectiveAmountDecision = { status: "resolved" | "needs-information" | "unresolved"; allowed?: boolean; derivedAmount?: number; provenance: RuleProvenance[] };
/** Evaluates one explicit Site/applicant amount assignment. Overlapping scopes never win implicitly. */
export function resolveEffectiveAmount(configuration: EffectiveConfiguration, productKey: string, facts: AmountFacts): EffectiveAmountDecision {
  const product = configuration.products.find(p => p.productKey === productKey);
  const applicantRules = product?.applicantRules.filter(r => r.value.applicantTypeKey === facts.applicantKey) ?? [];
  if (applicantRules.length !== 1 || !applicantRules[0].value.eligible || applicantRules[0].value.conditionKey !== null) return { status: "unresolved", provenance: applicantRules.flatMap(r => r.provenance) };
  const assignment = resolveConfiguredAssociationAmounts(configuration, productKey, facts.associationKey);
  if (assignment.status !== "resolved") return { status: assignment.status, provenance: product?.associationAmounts.flatMap(rule => rule.provenance) ?? [] };
  const rules = assignment.rules.filter(r => (r.value.applicantTypeKey === null || r.value.applicantTypeKey === facts.applicantKey) && (r.value.applicantClass === null || r.value.applicantClass === facts.applicantClass));
  const provenance = [...applicantRules.flatMap(r => r.provenance), ...rules.flatMap(r => [...r.provenance, ...(r.amount ? [...r.amount.pattern.provenance, ...r.amount.bands.flatMap(b => b.provenance), ...r.amount.options.flatMap(o => o.provenance)] : [])])];
  if (rules.length !== 1 || rules[0].status !== "resolved" || rules[0].amount?.status !== "resolved") return { status: "unresolved", provenance };
  const amount = rules[0].amount, pattern = amount.pattern.value;
  if (pattern.amountType === "fixed") return { status: "resolved", derivedAmount: pattern.minimum!, provenance };
  if (pattern.amountType === "multiplier") {
    if (facts.baseAmount === undefined || !Number.isFinite(facts.baseAmount) || facts.baseAmount < 0) return { status: "needs-information", provenance };
    const derivedAmount = facts.baseAmount * pattern.multiplier!;
    return Number.isFinite(derivedAmount) ? { status: "resolved", derivedAmount, provenance } : { status: "unresolved", provenance };
  }
  if (facts.amount === undefined || typeof facts.amount === "number" && (!Number.isFinite(facts.amount) || facts.amount < 0)) return { status: "needs-information", provenance };
  if (pattern.amountType !== "named-option" && typeof facts.amount !== "number") return { status: "needs-information", provenance };
  const selected = facts.amount;
  const allowed = amount.options.some(o => o.value.value === String(selected)) || typeof selected === "number" && amount.bands.some(({ value: b }) => selected >= b.minimum! && selected <= b.maximum! && Math.abs((selected - b.minimum!) / b.increment! - Math.round((selected - b.minimum!) / b.increment!)) < 1e-9);
  return { status: "resolved", allowed, provenance };
}
