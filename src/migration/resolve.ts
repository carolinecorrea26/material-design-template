import { materializeRuleDocumentation } from "../domain/ruleDocumentation";
/** Review resolver: accepts a database value only. Never imports legacy registries or runtime resolvers. */
import type { DatabaseSchema, Scope, ConfigurationValueRow, ContentValueRow } from "../persistence/types";
import { prototypeProductDefinition } from "./values";
import type { ClientConfigurationDefaults } from "../domain/organizations";
import type { ClientBranding, ClientSupport } from "../domain/configuration";
import type { FieldDefinition } from "../domain/fields";
import type { CoverageDefinition, CoverageAmountAssignment, ScopedIdentifierSet, ProductIdentifierSet } from "../domain/coverage";
import type { ConditionDefinition } from "../domain/rules";
import { applicable, merge, put, scopeRank } from "./values";

type PositionedScope = Scope & { position: number };
const ordered = <T extends { position: number }>(rows: T[]) => [...rows].sort((a, b) => a.position - b.position);
const scoped = <T extends PositionedScope>(rows: T[], siteKey: string, clientKey: string) => rows.filter((r) => applicable(r, siteKey, clientKey)).sort((a, b) => scopeRank[a.scope] - scopeRank[b.scope] || a.position - b.position);
function requireRow<T extends { key: string }>(rows: T[], key: string): T {
  const row = rows.find((r) => r.key === key);
  if (!row) throw new Error(`Missing migration reference: ${key}`);
  return row;
}
function valuesTree(db: DatabaseSchema, rows: (ConfigurationValueRow | ContentValueRow)[], siteKey: string, clientKey: string) {
  let result: Record<string, unknown> = {};
  for (const scope of ["global", "client", "site"] as const) {
    const layer: Record<string, unknown> = {};
    for (const value of scoped(rows, siteKey, clientKey).filter((r) => r.scope === scope)) {
      const definition = "configurationKey" in value ? requireRow(db.configurationDefinitions, value.configurationKey) : requireRow(db.contentEntries, value.contentKey);
      if (definition.definition.path) put(layer, definition.definition.path, value.value);
    }
    result = merge(result, layer);
  }
  return result;
}
function mergeAssignments<T extends { scope?: { applicantType?: string; applicantClassId?: string } }>(base: T[] | undefined, override: T[] | undefined): T[] | undefined {
  if (override === undefined) return base;
  const key = (r: T) => `${r.scope?.applicantType ?? "*"}:${r.scope?.applicantClassId ?? "*"}`;
  const replaced = new Set(override.map(key));
  return [...(base ?? []).filter((r) => !replaced.has(key(r))), ...override];
}
function identifiers(base: ScopedIdentifierSet<ProductIdentifierSet> | undefined, override: ScopedIdentifierSet<ProductIdentifierSet> | undefined) {
  if (!override) return base;
  if (!base) return override;
  return { ...base, ...override, scoped: mergeAssignments(base.scoped ?? [], override.scoped ?? []) };
}

export function resolveDatabaseSite(db: DatabaseSchema, siteKey: string) {
  const site = requireRow(db.sites, siteKey);
  const client = db.clients.find((r) => r.id === site.clientId);
  if (!client) throw new Error(`Missing client for ${siteKey}`);
  const settings = valuesTree(db, db.configurationValues, siteKey, client.key) as ClientConfigurationDefaults & { routingGates: { pageId: string; gate: Record<string, unknown> }[]; coveragePolicy: { categoryMaxAggregate: Record<string, string | null>; aggregateNotes: Record<string, { member: string; spouse: string; child?: string } | null>; questionRequirements: Record<string, Partial<Record<"self" | "spouse", string[]>>> } };
  const branding = scoped(db.brandingProfiles, siteKey, client.key).reduce((base, r) => merge(base, r.definition), {} as ClientBranding);
  const support = scoped(db.supportProfiles, siteKey, client.key).reduce((base, r) => merge(base, r.definition), {} as ClientSupport);
  const policy = requireRow(db.sitePolicies, siteKey).definition;
  const associations = ordered(db.siteAssociations.filter((r) => r.siteKey === siteKey && r.enabled)).map((r) => {
    const association = requireRow(db.associations, r.associationKey);
    if (association.clientKey !== client.key) throw new Error(`Cross-client association ${r.key}`);
    return { id: association.key, clientId: association.clientKey, ...association.definition };
  });
  const pages = ordered(db.pages).map((page) => {
    const assignment = db.sitePages.find((r) => r.siteKey === siteKey && r.pageKey === page.key);
    if (!assignment) throw new Error(`Missing page assignment ${siteKey}.${page.key}`);
    const requirement = page.definition.healthGate ? "required" : assignment.requirement;
    return { id: page.key, path: page.definition.path, included: requirement !== "none", requirement };
  });
  const fieldDefinition = (key: string): FieldDefinition => {
    const definition = structuredClone(requireRow(db.fields, key).definition);
    return ordered(db.validationRules.filter((r) => r.fieldKey === key)).reduce((field, rule) => ({ ...field, ...rule.definition }), definition);
  };
  const fields = ordered(db.pages).map((page) => {
    const resolved = new Map<string, { included: boolean; field: FieldDefinition }>();
    for (const assignment of ordered(db.pageFields.filter((r) => r.pageKey === page.key))) resolved.set(assignment.fieldKey, { included: true, field: fieldDefinition(assignment.fieldKey) });
    for (const override of scoped(db.siteFieldConfigurations.filter((r) => r.pageKey === page.key), siteKey, client.key)) {
      let value = resolved.get(override.fieldKey);
      if (!value && override.include) value = { included: true, field: fieldDefinition(override.fieldKey) };
      if (!value) continue;
      resolved.set(override.fieldKey, { included: override.hidden === null ? value.included : !override.hidden, field: { ...value.field, ...override.values } });
    }
    return { pageId: page.key, fields: [...resolved.values()] };
  }).filter((r) => r.fields.length);
  const coverage = ordered(db.products).filter(product => db.siteProducts.some(assignment => assignment.siteId === site.id && assignment.productKey === product.key)).map((product) => {
    const base = prototypeProductDefinition(product);
    const enabled = db.siteProducts.some((r) => r.siteId === site.id && r.productKey === product.key && r.enabled);
    const override = enabled ? settings.coverages.overrides?.[base.id as keyof NonNullable<typeof settings.coverages.overrides>] : undefined;
    const amounts = enabled ? settings.coverages.coverageAmounts?.[base.id as keyof NonNullable<typeof settings.coverages.coverageAmounts>] : undefined;
    const description = enabled ? settings.coverages.descriptions?.[base.id as keyof NonNullable<typeof settings.coverages.descriptions>] : undefined;
    const effective: CoverageDefinition = { ...base, ...override,
      requirements: override?.requirements ? { ...base.requirements, ...override.requirements } : base.requirements,
      coverageAmounts: mergeAssignments<CoverageAmountAssignment>(base.coverageAmounts, amounts),
      description: description ?? base.description,
      planCode: { primary: "" },
    };
    for (const kind of ["gNumber", "planCode"] as const) {
      const rows = scoped(db.productIdentifiers.filter((r) => r.productKey === product.key && r.kind === kind), siteKey, client.key).filter((r) => enabled || r.scope === "global");
      const value = rows.reduce<ScopedIdentifierSet<ProductIdentifierSet> | undefined>((acc, r) => identifiers(acc, r.definition as ScopedIdentifierSet<ProductIdentifierSet>), undefined);
      if (value && kind === "gNumber") effective.gNumber = value;
      if (value && kind === "planCode") effective.planCode = value as CoverageDefinition["planCode"];
    }
    const resolvedRider = (key: string) => {
      const rider = requireRow(db.riders, key).definition;
      if (rider.premiumFactor === null) throw new Error(`Unconfirmed rider premium factor: ${key}`);
      return { ...rider, premiumFactor: rider.premiumFactor };
    };
    const baseRiders = ordered(db.productRiders.filter((r) => r.productKey === product.key && r.scope === "global")).map((r) => resolvedRider(r.riderKey));
    const riderAssignment = scoped(db.configurationValues.filter((r) => {
      const path = requireRow(db.configurationDefinitions, r.configurationKey).definition.path;
      return path?.join(".") === `coverages.overrides.${product.key}.riders`;
    }), siteKey, client.key).at(-1);
    effective.riders = enabled && riderAssignment
      ? ordered(db.productRiders.filter((r) => r.productKey === product.key && r.scope === riderAssignment.scope && r.clientKey === riderAssignment.clientKey && r.siteKey === riderAssignment.siteKey)).map((r) => resolvedRider(r.riderKey))
      : baseRiders.length ? baseRiders : undefined;
    if (enabled) effective.applicants = ordered(db.siteProductApplicants.filter((r) => r.siteKey === siteKey && r.productKey === product.key)).map((r) => requireRow(db.applicantTypes, r.applicantKey).definition.applicantType);
    return { id: product.key, enabled, effective };
  });
  const rules = ordered(db.rules).filter((r) => db.ruleAssignments.some((a) => a.ruleKey === r.key && applicable(a, siteKey, client.key))).map((r) => ({ ...r.definition, conditionIds: ordered(db.ruleConditions.filter((c) => c.ruleKey === r.key)).map((c) => c.conditionKey), actions: ordered(db.ruleActions.filter((a) => a.ruleKey === r.key)).map((a) => materializeRuleDocumentation(r, a)) }));
  const flowAssignments = new Map<string, string>();
  for (const assignment of scoped(db.siteFlows, siteKey, client.key)) flowAssignments.set(assignment.flowId, assignment.flowKey);
  const flows = [...flowAssignments.values()].map((key) => ({ ...requireRow(db.flows, key).definition,
    nodes: ordered(db.flowSteps.filter((r) => r.flowKey === key)).map((r) => r.definition),
    edges: ordered(db.flowTransitions.filter((r) => r.flowKey === key)).map((r) => ({ ...r.definition, source: requireRow(db.flowSteps, r.sourceStepKey).definition.id, target: requireRow(db.flowSteps, r.targetStepKey).definition.id })),
  }));
  const email = settings.emailSupport;
  const emailConfiguration = { hideContactBox: Boolean(email?.hideContactBox), name: email?.contactOverride?.name || client.name, acronym: email?.contactOverride?.acronym || client.acronym,
    phone: email?.supportOverride?.phone || support.phoneDisplay || support.phone || "", email: email?.supportOverride?.email || support.email || "", website: email?.supportOverride?.website || support.website || "" };
  return { site, client, branding, support, associations, policy, pages, fields, coverage, rules, flows,
    features: settings.features, coveragePolicy: settings.coveragePolicy, content: valuesTree(db, db.contentValues, siteKey, client.key), configurations: settings, emailConfiguration };
}

export function databaseCoverageUnlocksPage(db: DatabaseSchema, siteKey: string, pageId: string, product: CoverageDefinition) {
  const gate = resolveDatabaseSite(db, siteKey).configurations.routingGates.find((r) => r.pageId === pageId)?.gate;
  if (!gate) return true;
  switch (gate.kind) {
    case "selected-category": return (gate.categoryIds as string[]).includes(product.categoryId);
    case "selected-underwriting-type": return (gate.underwritingTypes as string[]).includes(product.underwritingType);
    case "selected-coverage": return gate.categoryId === product.categoryId && gate.underwritingType === product.underwritingType;
    case "selected-rider": return product.riders?.some((r) => r.id === gate.riderId) ?? false;
    default: throw new Error(`Unknown routing gate ${String(gate.kind)}`);
  }
}

export function evaluateDatabaseCondition(db: DatabaseSchema, conditionKey: string, values: Record<string, unknown>): boolean {
  const definition: ConditionDefinition = requireRow(db.conditions, conditionKey).definition;
  const results = definition.conditions.map((clause) => {
    const actual = values[clause.fieldId];
    if (clause.operator === "equals") return actual === clause.value;
    if (clause.operator === "notEquals") return actual !== clause.value;
    return Array.isArray(actual) && typeof clause.value === "string" && actual.includes(clause.value);
  });
  return definition.match === "all" ? results.every(Boolean) : results.some(Boolean);
}
export function resolveDatabaseBranding(db: DatabaseSchema, siteKey: string, associationId?: string) {
  const site = resolveDatabaseSite(db, siteKey);
  const association = site.associations.find((r) => r.id === associationId);
  return site.policy.associationBranding?.useAssociationLogo && association?.logo
    ? { ...site.branding, logo: association.logo, logoAlt: association.logoAlt ?? `${association.name} logo` } : site.branding;
}

export function resolveDatabaseAssociation(db: DatabaseSchema, siteKey: string, context: { urlAssociationId?: string | null; selectedAssociationId?: string | null } = {}) {
  const site = resolveDatabaseSite(db, siteKey);
  const selection = site.policy.associationSelection;
  if (!selection) return { status: "not-configured" };
  const id = selection.mode === "fixed" ? selection.fixedAssociationId : selection.mode === "url-parameter" ? context.urlAssociationId : context.selectedAssociationId;
  if (!id && selection.mode !== "fixed") return { status: selection.mode === "url-parameter" ? "missing" : "unselected" };
  const association = site.associations.find((r) => r.id === id);
  return association ? { status: "resolved", associationId: association.id } : { status: "invalid" };
}

/** Question participation is evaluated from the persisted category-to-field relationships. */
export function databaseQuestionFields(site: ReturnType<typeof resolveDatabaseSite>, categories: string[], applicant: "self" | "spouse") {
  const fields = new Set<string>();
  const smokerFields = new Set(["smoker", "tobacco-last-used", "tobacco-products", "spouse-smoker", "spouse-tobacco-last-used", "spouse-tobacco-products"]);
  for (const category of categories) for (const field of site.coveragePolicy.questionRequirements[category]?.[applicant] ?? []) {
    if (!site.configurations.coverages.hideSmokerQuestion || !smokerFields.has(field)) fields.add(field);
  }
  return [...fields];
}
