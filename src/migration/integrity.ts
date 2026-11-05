import { isBeneficiaryParticipationPolicy } from "../domain/beneficiaryParticipation";
import { isBeneficiaryNotePolicy } from "../domain/beneficiaryNotes";
import { healthQuestionnaireFieldKeys, isHealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { isConditionDefinition } from "../domain/conditionValidation";
import { materializeRuleDocumentation } from "../domain/ruleDocumentation";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { isRateInputPolicy } from "../domain/rateInputPolicy";
import { isRateModifierPolicy } from "../domain/rateModifiers";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { isSelectionPolicy } from "../domain/coverageSelectionPolicy";
import { isRatePresentationPolicy, isReferenceRateTable } from "../domain/ratePresentation";
import { isResidencyPolicy } from "../domain/residencyPolicy";
import type { DatabaseSchema } from "../persistence/types";
import { tableNames } from "../persistence/supabaseAdapter";
import { expandedTableSpecs as migrationTableSpecs } from "./canonical";

import { promotionIntegrityErrors } from "./promotion";
import { isBenefitPolicy } from "../domain/benefitPolicy";
import { isDependentPolicy } from "../domain/dependentPolicy";
import { isLifeAggregatePolicy } from "../domain/lifeAggregatePolicy";
import { resolveEffectiveConfiguration } from "../domain/effectiveConfiguration";
import { isAmountCapPolicy, resolveNormalizedAmountCap } from "../domain/amountCapPolicy";
import { riderOverrideProperties } from "../domain/riderOverrides";
import { isAssociationEligibilityPolicy } from "../domain/associationEligibilityPolicy";
import { associationAmountKeys, isAssociationAmountPolicy } from "../domain/associationAmountPolicy";

const snake = (s: string) => s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
export function validateMigrationDatabase(db: DatabaseSchema): string[] {
  const errors: string[] = promotionIntegrityErrors(db);
  const tables: Record<string, Record<string, unknown>[]> = Object.fromEntries(Object.entries(db).map(([name, rows]) => [tableNames[name as keyof DatabaseSchema], rows.map((row: object) => Object.fromEntries(Object.entries(row).map(([key, value]) => [snake(key), value])))]));
  const keys = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, new Set(rows.map(r => r.key))]));
  for (const name of ["organizations", "clients", "sites", "site_coverages", "site_products", "site_riders"]) {
    const rows = tables[name];
    for (const column of ["key", "display_id"]) if (new Set(rows.map(r => r[column])).size !== rows.length) errors.push(`${name}: duplicate ${column}`);
    for (const row of rows) {
      if (typeof row.key !== "string" || !row.key || !Number.isSafeInteger(row.display_id) || Number(row.display_id) <= 0) errors.push(`${name}: invalid identity`);
      if (!("provided_by" in row) || row.provided_by !== null && !keys.provenance_tags.has(row.provided_by)) errors.push(`${name}: invalid provenance`);
    }
  }
  for (const [name, spec] of Object.entries(migrationTableSpecs)) {
    const rows = tables[name];
    if (!rows) { errors.push(`Missing table ${name}`); continue; }
    for (const column of ["id", "key", "display_id"]) {
      if (new Set(rows.map((r) => r[column])).size !== rows.length) errors.push(`${name}: duplicate ${column}`);
    }
    for (const row of rows) {
      for (const column of Object.keys(row)) if (!(column in spec.columns)) errors.push(`${name}.${row.key}: unmapped column ${column}`);
      for (const [column, type] of Object.entries(spec.columns)) {
        const value = row[column];
        if (value === undefined || (value === null && !type.startsWith("jsonb") && (type.includes("not null") || type.includes("primary key")))) errors.push(`${name}.${row.key}: missing ${column}`);
        const ref = /references public\.(\w+)\(key\)/.exec(type);
        if (ref && value !== null && !keys[ref[1]]?.has(value)) errors.push(`${name}.${row.key}: orphan ${column}=${String(value)}`);
        if (column === "display_id" && (!Number.isSafeInteger(value) || Number(value) <= 0)) errors.push(`${name}.${row.key}: invalid display ID`);
        if (column === "key" && (typeof value !== "string" || !value.trim())) errors.push(`${name}: empty semantic key`);
        const allowed = /check \(\w+ in \(([^)]+)\)\)/.exec(type);
        if (allowed && !allowed[1].split(",").map(s => s.trim().replaceAll("'", "")).includes(String(value))) errors.push(`${name}.${row.key}: invalid ${column}`);
      }
      if ("scope" in row) {
        const valid = row.scope === "global" ? row.client_key === null && row.site_key === null : row.scope === "client" ? typeof row.client_key === "string" && row.site_key === null : row.scope === "site" && typeof row.site_key === "string" && row.client_key === null;
        if (!valid) errors.push(`${name}.${row.key}: invalid scope`);
      }
    }
    for (const constraint of spec.constraints) {
      const match = /^unique(?: nulls not distinct)?\(([^)]+)\)$/.exec(constraint);
      if (match) {
        const keys = rows.map((r) => JSON.stringify(match[1].split(",").map((c) => r[c.trim()])));
        if (new Set(keys).size !== keys.length) errors.push(`${name}: duplicate relationship ${constraint}`);
      }
    }
  }
  const targetKeys = new Map(Object.entries(db).map(([name, rows]) => [name, new Map((rows as unknown as Array<Record<string, unknown>>).map(row => [row.key, row]))]));
  const effectiveBenefits = new Map<string, ReturnType<typeof resolveEffectiveConfiguration>>();
  const effectiveConfiguration = (site: DatabaseSchema["sites"][number], products: Set<string>) => {
    let configuration = effectiveBenefits.get(site.key);
    if (!configuration) {
      const client = db.clients.find(client => client.id === site.clientId);
      if (!client) throw new Error("Missing policy Client");
      configuration = resolveEffectiveConfiguration(db, site.key, client.key, site.id, [...products]);
      effectiveBenefits.set(site.key, configuration);
    }
    return configuration;
  };
  for (const row of db.configurationValues) {
    const target = db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.target;
    if (target?.kind === "product-rider-override") {
      let valid = row.scope !== "global" && riderOverrideProperties.some(property => property === target.property) && db.riders.some(rider => rider.key === target.riderKey);
      const sites = db.sites.filter(site => row.scope === "site" ? site.key === row.siteKey : db.clients.some(client => client.id === site.clientId && client.key === row.clientKey));
      if (!sites.length) valid = false;
      let assigned = false;
      for (const site of sites) try {
        const products = new Set(db.siteProducts.filter(product => product.siteId === site.id && product.enabled).map(product => product.productKey));
        const product = effectiveConfiguration(site, products).products.find(product => product.productKey === target.productKey);
        if (product?.riders.some(rider => rider.key === target.riderKey)) {
          assigned = true;
          if (product.riderOwnership !== "relational") valid = false;
        } else if (row.scope === "site") valid = false;
      } catch { valid = false; }
      if (!valid || !assigned) errors.push(`Invalid rider property override ${row.key}`);
      continue;
    }
    if (target?.kind === "field-definition-ownership") {
      try {
        for (const site of db.sites.filter(site => site.status === "active")) {
          const products = new Set(db.siteProducts.filter(product => product.siteId === site.id && product.enabled).map(product => product.productKey));
          if (effectiveConfiguration(site, products).fieldDefinitionOwnership === "legacy") throw new Error("Missing field ownership");
        }
      } catch { errors.push(`Invalid shared field definition ownership ${row.key}`); }
      continue;
    }
    if (target?.kind === "site-structure-ownership") {
      const site = db.sites.find(site => site.key === row.siteKey);
      let valid = row.scope === "site" && row.clientKey === null && !!site;
      if (site) try {
        const products = new Set(db.siteProducts.filter(product => product.siteId === site.id && product.enabled).map(product => product.productKey));
        valid = valid && effectiveConfiguration(site, products).siteStructureOwnership === "stored-structure";
      } catch { valid = false; }
      if (!valid) errors.push(`Invalid Site structure ownership policy ${row.key}`);
      continue;
    }
    if (target?.kind === "site-product-availability") {
      const site = db.sites.find(site => site.key === row.siteKey);
      let valid = row.scope === "site" && row.clientKey === null && !!site;
      if (site) try {
        const products = new Set(db.siteProducts.filter(product => product.siteId === site.id && product.enabled).map(product => product.productKey));
        valid = valid && effectiveConfiguration(site, products).productAvailabilityOwnership === "siteProducts";
      } catch { valid = false; }
      if (!valid) errors.push(`Invalid Site product availability policy ${row.key}`);
      continue;
    }
    if (target?.kind === "site-page-participation") {
      const site = db.sites.find(site => site.key === row.siteKey);
      let valid = row.scope === "site" && row.clientKey === null && !!site;
      if (site) try {
        const products = new Set(db.siteProducts.filter(product => product.siteId === site.id && product.enabled).map(product => product.productKey));
        valid = valid && effectiveConfiguration(site, products).pageParticipation.source === "sitePages";
      } catch { valid = false; }
      if (!valid) errors.push(`Invalid Site page participation policy ${row.key}`);
      continue;
    }
    if (target?.kind === "site-routing-policy") {
      const sites = db.sites.filter(site => row.scope === "global" || row.scope === "site" && site.key === row.siteKey || row.scope === "client" && db.clients.some(client => client.id === site.clientId && client.key === row.clientKey));
      let valid = sites.length > 0;
      for (const site of sites) try {
        const products = new Set(db.siteProducts.filter(product => product.siteId === site.id && product.enabled).map(product => product.productKey));
        if (!effectiveConfiguration(site, products).routing) valid = false;
      } catch { valid = false; }
      if (!valid) errors.push(`Invalid executable routing policy ${row.key}`);
      continue;
    }
    if (target?.kind === "site-beneficiary-participation") {
      const site = db.sites.find(site => site.key === row.siteKey);
      const products = new Set(db.siteProducts.filter(product => product.siteId === site?.id).map(product => product.productKey));
      if (row.scope !== "site" || !site || !isBeneficiaryParticipationPolicy(row.value)) errors.push(`Invalid beneficiary participation policy ${row.key}`);
      else if (row.value.rules.some(rule => !products.has(rule.productKey) || rule.associationKeys?.some(key => !db.siteAssociations.some(link => link.siteKey === row.siteKey && link.associationKey === key)))) errors.push(`Orphan beneficiary participation scope ${row.key}`);
      continue;
    }
    if (target?.kind === "site-beneficiary-notes") {
      const site = db.sites.find(site => site.key === row.siteKey);
      const products = new Set(db.siteProducts.filter(product => product.siteId === site?.id).map(product => product.productKey));
      if (row.scope !== "site" || !site || !isBeneficiaryNotePolicy(row.value)) errors.push(`Invalid beneficiary note policy ${row.key}`);
      else if (row.value.notes.some(note => note.productKeys.some(key => !products.has(key)))) errors.push(`Orphan beneficiary note product ${row.key}`);
      continue;
    }
    if (target?.kind === "site-health-questionnaires") {
      if (row.scope !== "site" || !isHealthQuestionnairePolicy(row.value)) errors.push(`Invalid health questionnaire policy ${row.key}`);
      else {
        if (healthQuestionnaireFieldKeys(row.value).some(key => !db.fields.some(field => field.key === key))) errors.push(`Orphan health questionnaire field ${row.key}`);
        if (row.value.associationKeys.some(key => !db.siteAssociations.some(link => link.siteKey === row.siteKey && link.associationKey === key))) errors.push(`Orphan health questionnaire association ${row.key}`);
        const site = db.sites.find(site => site.key === row.siteKey);
        const products = new Set(db.siteProducts.filter(link => link.siteId === site?.id).map(link => link.productKey));
        if (row.value.variants.some(variant => Object.values(variant.when).some(keys => keys?.some(key => !products.has(key))))) errors.push(`Orphan health questionnaire product ${row.key}`);
        if (row.value.variants.some(variant => variant.items.some((item, index) => item.when?.answerKey && !variant.items.slice(0, index).some(previous => previous.questionFieldKey === item.when!.answerKey)))) errors.push(`Invalid health questionnaire answer dependency ${row.key}`);
      }
      continue;
    }
    if (target?.kind === "site-rate-presentation") {
      if (!isRatePresentationPolicy(row.value)) errors.push(`Invalid rate presentation policy ${row.key}`);
      else if (row.value.suppressedAssociationKeys?.some(key => !db.siteAssociations.some(link => link.siteKey === row.siteKey && link.associationKey === key))) errors.push(`Orphan rate suppression association ${row.key}`);
      continue;
    }
    if (target?.kind === "product-reference-rate-table") {
      if (!isReferenceRateTable(row.value)) errors.push(`Invalid reference rate table ${row.key}`);
      if (!db.products.some(product => product.key === target.productKey)) errors.push(`Orphan reference rate product ${row.key}`);
      continue;
    }
    if (!target || !["product-rate-input-policy", "product-rate-modifier-policy", "site-review-policy", "site-life-aggregate-participation", "product-journey-policy", "product-selection-policy", "product-benefit-policy", "product-amount-cap-policy", "product-dependent-policy", "site-life-aggregate", "product-residency-policy", "product-reference-rate-table", "product-association-eligibility", "product-association-amounts"].includes(target.kind)) continue;
    const site = db.sites.find(site => site.key === row.siteKey);
    const products = new Set(db.siteProducts.filter(product => product.siteId === site?.id).map(product => product.productKey));
    if (row.scope !== "site" || !site || "productKey" in target && !products.has(target.productKey)) errors.push(`Invalid executable policy scope ${row.key}`);
    if (target.kind === "site-review-policy") {
      if (!isReviewPolicy(row.value)) errors.push(`Invalid Review policy ${row.key}`);
      else if (row.value.blocks.some(block => block.fields.some(key => !db.fields.some(field => field.key === key)))) errors.push(`Orphan Review field ${row.key}`);
      else {
        const consent = row.value.consent;
        if (consent && (consent.underwrittenWhen.some(rule => !products.has(rule.productKey) || rule.applicants.some(key => !db.applicantTypes.some(applicant => applicant.key === key))) || consent.otherOpening && !db.fields.some(field => field.key === consent.otherOpening!.fieldId))) errors.push(`Orphan Review consent scope ${row.key}`);
      }
    } else if (target.kind === "product-rate-input-policy") {
      if (!isRateInputPolicy(row.value)) errors.push(`Invalid rate input policy ${row.key}`);
      else if (row.value.tobaccoLookback?.associationOverrides?.some(override => override.associationKeys.some(key => !db.siteAssociations.some(link => link.siteKey === row.siteKey && link.associationKey === key)))) errors.push(`Orphan tobacco lookback Association ${row.key}`);
    } else if (target.kind === "product-rate-modifier-policy") {
      if (!isRateModifierPolicy(row.value)) errors.push(`Invalid rate modifier policy ${row.key}`);
    } else if (target.kind === "site-life-aggregate-participation") {
      if (!row.value || typeof row.value !== "object" || Array.isArray(row.value) || row.value.version !== 1 || !["configured", "individual-only"].includes(String(row.value.mode)) || typeof row.value.provisional !== "boolean" || typeof row.value.reason !== "string" || !row.value.reason) errors.push(`Invalid life aggregate participation ${row.key}`);
    } else if (target.kind === "product-journey-policy") {
      if (!isCoverageJourneyPolicy(row.value)) errors.push(`Invalid executable journey policy ${row.key}`);
      else {
        if (row.value.associationChoices.some(a => !db.siteAssociations.some(link => link.siteKey === row.siteKey && link.associationKey === a.key))) errors.push(`Orphan journey association ${row.key}`);
        if (row.value.questions.some(q => [...q.financialFields, ...q.tobaccoFields].some(key => !db.fields.some(f => f.key === key)))) errors.push(`Orphan journey question field ${row.key}`);
        if (row.value.mappings.some(m => Object.keys(m.riderCodes).some(key => !db.riders.some(r => r.key === key)))) errors.push(`Orphan journey rider mapping ${row.key}`);
      }
    } else if (target.kind === "product-selection-policy") {
      let policy: unknown = row.value;
      if (policy !== null && typeof policy === "object" && !Array.isArray(policy) && "version" in policy && policy.version === 2 && site) {
        try { policy = effectiveConfiguration(site, products).products.find(product => product.productKey === target.productKey)?.selectionPolicies.find(policy => policy.key === row.configurationKey)?.value; }
        catch { policy = undefined; }
      }
      if (!isSelectionPolicy(policy)) errors.push(`Invalid executable selection policy ${row.key}`);
    } else if (target.kind === "product-association-eligibility") {
      if (!isAssociationEligibilityPolicy(row.value)) errors.push(`Invalid association eligibility policy ${row.key}`);
      else if (row.value.rules.some(rule => !db.siteAssociations.some(link => link.siteKey === row.siteKey && link.associationKey === rule.associationKey) || !db.siteProductApplicants.some(applicant => applicant.siteKey === row.siteKey && applicant.productKey === target.productKey && applicant.applicantKey === rule.applicantKey))) errors.push(`Orphan association eligibility scope ${row.key}`);
    } else if (target.kind === "product-association-amounts") {
      const policy = row.value;
      if (!isAssociationAmountPolicy(policy)) errors.push(`Invalid association amount policy ${row.key}`);
      else if (associationAmountKeys(policy).some(key => !db.siteAssociations.some(link => link.siteKey === row.siteKey && link.associationKey === key)) || policy.amounts.some(assignment => !db.coverageAmountPatterns.some(pattern => pattern.key === assignment.amountPatternKey) || !db.siteProductApplicants.some(applicant => applicant.siteKey === row.siteKey && applicant.productKey === target.productKey && applicant.applicantKey === assignment.applicantKey))) errors.push(`Orphan association amount scope ${row.key}`);
    } else if (target.kind === "product-residency-policy") {
      if (!isResidencyPolicy(row.value)) errors.push(`Invalid executable residency policy ${row.key}`);
      else if (row.value.associationAllowedJurisdictions) {
        const journey = db.configurationValues.filter(value => {
          const definition = db.configurationDefinitions.find(definition => definition.key === value.configurationKey)?.definition.target;
          return value.siteKey === row.siteKey && definition?.kind === "product-journey-policy" && definition.productKey === target.productKey;
        });
        const policy = journey.length === 1 && isCoverageJourneyPolicy(journey[0].value) ? journey[0].value : null;
        if (!policy || Object.keys(row.value.associationAllowedJurisdictions).some(key => !policy.associationChoices.some(choice => choice.key === key))) errors.push(`Orphan residency association ${row.key}`);
      }
    } else if (target.kind === "product-benefit-policy") {
      let policy: unknown = row.value;
      if (policy !== null && typeof policy === "object" && !Array.isArray(policy) && "version" in policy && policy.version === 2 && site) {
        try {
          policy = effectiveConfiguration(site, products).products.find(product => product.productKey === target.productKey)?.benefitPolicies.find(policy => policy.key === row.configurationKey)?.value;
        } catch { policy = undefined; }
      }
      if (!isBenefitPolicy(policy)) errors.push(`Invalid executable benefit policy ${row.key}`);
      else if ([...policy.exclusiveProducts, ...(policy.aggregate?.productKeys ?? [])].some(key => !products.has(key))) errors.push(`Orphan benefit policy product ${row.key}`);
    } else if (target.kind === "product-amount-cap-policy") {
      let valid = isAmountCapPolicy(row.value) && !!site;
      if (valid && site) try {
        valid = resolveNormalizedAmountCap({ siteKey: site.key, configuration: effectiveConfiguration(site, products) }, target.productKey, "member", 40).status === "resolved";
      } catch { valid = false; }
      if (!valid) errors.push(`Invalid executable amount-cap policy ${row.key}`);
    } else if (target.kind === "product-dependent-policy") {
      const policy = row.value;
      if (!isDependentPolicy(policy)) errors.push(`Invalid executable dependent policy ${row.key}`);
      else {
        const rules = [...policy.rules, ...Object.values(policy.associationRules ?? {}).flat()];
        if (rules.some(rule => rule.maximumPlans?.productKeys.some(key => !products.has(key)))) errors.push(`Orphan dependent policy product ${row.key}`);
        if (Object.keys(policy.associationRules ?? {}).some(key => !db.siteAssociations.some(link => link.siteKey === row.siteKey && link.associationKey === key))) errors.push(`Orphan dependent association ${row.key}`);
        if (rules.some(rule => rule.noticeContentKey && !db.contentEntries.some(content => content.key === rule.noticeContentKey))) errors.push(`Orphan dependent notice ${row.key}`);
      }
    } else if (target.kind === "site-life-aggregate") {
      if (!isLifeAggregatePolicy(row.value)) errors.push(`Invalid executable life aggregate ${row.key}`);
      else if (row.value.groups.some(group => group.productKeys.some(key => !products.has(key)))) errors.push(`Orphan life aggregate product ${row.key}`);
    }
  }
  for (const fact of db.semanticRequirements) {
    if (!targetKeys.get(fact.subjectTable)?.has(fact.subjectKey)) errors.push(`Orphan semantic subject ${fact.key}`);
    const relations: Record<string, string> = { ruleKey: 'rules', flagKey: 'flagDefinitions', contentKey: 'contentEntries', productKey: 'products', questionKey: 'questionDefinitions', clientKey: 'clients' };
    const inspect = (value: unknown) => {
      if (Array.isArray(value)) { value.forEach(inspect); return; }
      if (!value || typeof value !== 'object') return;
      for (const [field, target] of Object.entries(value)) {
        if (field in relations && typeof target === 'string' && !targetKeys.get(relations[field])?.has(target)) errors.push(`Orphan semantic relationship ${fact.key}.${field}`);
        inspect(target);
      }
    };
    inspect(fact.value);
    if (!fact.predicate.trim() || !fact.domain.trim()) errors.push(`Missing semantic predicate/domain ${fact.key}`);
  }
  for (const resolution of db.identityResolutions) {
    if (!Array.isArray(resolution.candidateKeys) || resolution.candidateKeys.some(key => typeof key !== 'string' || !targetKeys.get('products')?.has(key))) errors.push(`Invalid identity candidates ${resolution.key}`);
    if (resolution.productKey !== null && (!Array.isArray(resolution.candidateKeys) || resolution.candidateKeys.length !== 1 || resolution.candidateKeys[0] !== resolution.productKey)) errors.push(`Unsafe identity resolution ${resolution.key}`);
    if (['multi-match', 'no-match'].includes(resolution.strategy) && resolution.productKey !== null) errors.push(`Unsafe identity strategy ${resolution.key}`);
  }
  const mappedRequirements = new Set(db.requirementTargets.map(t => t.requirementKey));
  for (const target of db.requirementTargets) {
    const row = targetKeys.get(target.targetTable)?.get(target.targetKey);
    if (!row || !(target.targetColumn in row)) errors.push(`Orphan requirement destination ${target.key}`);
  }
  for (const requirement of db.sourceRequirements) {
    if (!requirement.reason.trim()) errors.push(`Missing accounting reason ${requirement.key}`);
    if (requirement.classification === "MAPPED" && !mappedRequirements.has(requirement.key)) errors.push(`Mapped requirement without destination ${requirement.key}`);
  }
  for (const assignment of db.flagAssignments) {
    const scope = [assignment.clientKey, assignment.siteKey, assignment.productKey, assignment.coverageKey, assignment.riderKey, assignment.applicantKey, assignment.applicationId];
    if (scope.filter(v => v !== null).length > 1) errors.push(`Invalid flag assignment scope ${assignment.key}`);
  }
  for (const assignment of [...db.flagAssignments, ...db.ruleFlags]) {
    const flag = db.flagDefinitions.find(f => f.key === assignment.flagKey);
    if (flag?.valueType === "boolean" && typeof assignment.value !== "boolean") errors.push(`Invalid flag value ${assignment.key}`);
    if (flag?.valueType === "enum" && Array.isArray(flag.allowedValues) && !flag.allowedValues.includes(assignment.value)) errors.push(`Invalid flag enum ${assignment.key}`);
  }
  for (const pattern of db.coverageAmountPatterns) {
    if (pattern.minimum !== null && pattern.maximum !== null && pattern.minimum > pattern.maximum) errors.push(`Reversed amount range ${pattern.key}`);
    if (pattern.increment !== null && pattern.increment <= 0) errors.push(`Invalid increment ${pattern.key}`);
  }
  for (const assignment of db.siteRiders) if (!db.riders.some(r => r.key === assignment.riderKey)) errors.push(`Missing canonical site rider ${assignment.id}`);
  for (const link of db.siteEnvironmentLinks) {
    if (!["prototype", "test", "pre-production", "production", "automation"].includes(link.environment) || !["launch", "campaign", "apply", "returning", "reference"].includes(link.linkType) || !/^https?:\/\//.test(link.url) || !link.label.trim()) errors.push(`Invalid environment link ${link.key}`);
  }
  for (const relation of db.siteAssociations) {
    const site = db.sites.find((r) => r.key === relation.siteKey);
    const client = db.clients.find((r) => r.id === site?.clientId);
    const association = db.associations.find((r) => r.key === relation.associationKey);
    if (client?.key !== association?.clientKey) errors.push(`Cross-client association ${relation.key}`);
  }
  for (const condition of db.conditions) if (!isConditionDefinition(condition.definition) || condition.key !== condition.definition.id
    || condition.definition.conditions.some(clause => !db.fields.some(field => field.key === clause.fieldId))) errors.push(`Invalid executable condition ${condition.key}`);
  for (const action of db.ruleActions) try {
    const rule = db.rules.find(rule => rule.key === action.ruleKey);
    if (!rule) throw new Error("Missing documentation rule");
    materializeRuleDocumentation(rule, action);
  } catch { errors.push(`Invalid rule documentation ${action.key}`); }
  for (const edge of db.flowTransitions) {
    for (const key of [edge.sourceStepKey, edge.targetStepKey]) if (!db.flowSteps.some((s) => s.key === key && s.flowKey === edge.flowKey)) errors.push(`Cross-flow transition ${edge.key}`);
  }
  for (const field of db.fields) {
    if (field.definition.visibilityConditionId && !db.conditions.some((r) => r.key === field.definition.visibilityConditionId)) errors.push(`Missing visibility condition ${field.key}`);
  }
  for (const section of db.pageSections) {
    for (const field of section.definition.fieldIds) if (!db.fields.some((r) => r.key === field)) errors.push(`Missing section field ${section.key}.${field}`);
    if (section.definition.visibilityConditionId && !db.conditions.some((r) => r.key === section.definition.visibilityConditionId)) errors.push(`Missing section condition ${section.key}`);
  }
  for (const row of db.siteFieldConfigurations) {
    if (row.values.visibilityConditionId && !db.conditions.some((r) => r.key === row.values.visibilityConditionId)) errors.push(`Missing override condition ${row.key}`);
  }
  return errors;
}
