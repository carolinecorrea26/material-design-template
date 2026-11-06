import { reviewedRateClass } from "./rateClassAdoption";
import type { RateModifierPolicy } from "../domain/rateModifiers";
import type { DatabaseSchema, Json } from "../persistence/types";
import type { ConfigurationTarget } from "../persistence/types/content";
import { libraryMetadata } from "../domain/provenance";
import { reviewPolicyForSite } from "../content/reviewPolicies";
import { fieldCatalog } from "../config/fields";
import { getEffectiveSiteConfig } from "../data/registry";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { activeSiteMigrationScope } from "./activeSiteScope";
import type { RateInputPolicy } from "../domain/rateInputPolicy";
import { mcrSource } from "./mcr";
import { provisionalDecisionAuthority } from "./provisionalSourceDecisions";

/** Compiler boundary only: JSON policies live in normalized configuration tables. */
export function applyReviewAndRateAdoption(db: DatabaseSchema) {
  const persist = (siteKey: string, key: string, target: ConfigurationTarget, value: unknown) => {
    db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== key);
    db.configurationValues = db.configurationValues.filter(row => row.key !== key);
    const metadata = { id: key, key, ...libraryMetadata("configurationDefinitions", key, "docs/archive/step3-review-and-rating.md") };
    db.configurationDefinitions.push({ ...metadata, position: 0, definition: { path: null, metadata: { version: 1 }, target } });
    db.configurationValues.push({ ...metadata, ...libraryMetadata("configurationValues", key, "docs/archive/step3-review-and-rating.md"), position: 0, scope: "site", siteKey, clientKey: null, configurationKey: key, value: value as Json });
  };
  const cells = new Map(mcrSource.cells.map(cell => [`${cell.sheet}!${cell.cell}`, String(cell.value)]));
  for (const scope of activeSiteMigrationScope.sites) {
    const client = getEffectiveSiteConfig(scope.key);
    const aggregateKeys = new Set(db.configurationDefinitions.filter(definition => definition.definition.target?.kind === "site-life-aggregate").map(definition => definition.key));
    const hasAggregate = db.configurationValues.some(value => value.siteKey === scope.key && aggregateKeys.has(value.configurationKey)) || db.aggregateLimits.some(limit => limit.siteKey === scope.key && limit.categoryKey === "LI" && limit.productKey === null);
    const aggregateParticipation = { version: 1, mode: hasAggregate ? "configured" : "individual-only", provisional: !hasAggregate, reason: hasAggregate ? "Captured aggregate rules are required" : "No joint life cap established in candidate: retain individual product limits provisionally; source reconciliation required before publication", authority: provisionalDecisionAuthority };
    persist(scope.key, `${scope.key}.life-aggregate-participation`, { kind: "site-life-aggregate-participation" }, aggregateParticipation);
    if (!hasAggregate && scope.mcrRequired) {
      const key = `provisional-decision.${scope.key}.life-aggregate-participation`;
      db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== key);
      db.semanticRequirements.push({ id: key, key, ...libraryMetadata("semanticRequirements", key, "docs/archive/step3-review-and-rating.md"), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: scope.key, predicate: "life-aggregate-participation", status: "documented", value: { authority: provisionalDecisionAuthority, selected: aggregateParticipation, revisit: true, sourceReconciliation: "deferred", runtimeActivation: "pending", destinations: [{ table: "configurationValues", key: `${scope.key}.life-aggregate-participation`, column: "value" }] } });
    }
    const review = reviewPolicyForSite(scope.key, client.reviewPolicy);
    // Explicit reviewed consent survives reapplying the historical compiler.
    const reviewedConsent = db.semanticRequirements.some(row => row.domain === "approved-business-decision" && ["conditional-consent", "association-questionnaires-and-rate-suppression", "medical-authorization-applicability", "approved-abe-review-and-membership"].includes(row.predicate) && row.subjectKey === scope.key);
    if (!reviewedConsent) persist(scope.key, `${scope.key}.review-policy`, { kind: "site-review-policy" }, review);
    for (const [position, id] of [...new Set(review.blocks.flatMap(block => block.fields))].entries()) {
      if (!db.fields.some(field => field.key === id)) db.fields.push({ id, key: id, ...libraryMetadata("fields", id, "src/config/fields/index.ts"), position: 0, definition: fieldCatalog[id] });
      const key = `${scope.key}.review.${id}.notice`;
      db.siteFieldConfigurations = db.siteFieldConfigurations.filter(row => row.key !== key);
      db.siteFieldConfigurations.push({ id: key, key, ...libraryMetadata("siteFieldConfigurations", key, review.blocks.find(block => block.fields.includes(id))!.sourceReferences.join("; ")), position: 30000 + position, scope: "site", siteKey: scope.key, clientKey: null, pageKey: "review", fieldKey: id, include: true, hidden: false, values: {} });
    }
    const site = db.sites.find(site => site.key === scope.key)!;
    for (const assignment of db.siteProducts.filter(product => product.siteId === site.id && product.enabled)) {
      const productKey = assignment.productKey;
      const category = db.products.find(product => product.key === productKey)!.categoryKey;
      const row = activeSiteMainRows[scope.key]?.[productKey];
      const sourceReferences = row ? [`Main!AO${row}`, `Main!AP${row}`, `Main!AR${row}`] : ["prototype:rating-input-assumption"];
      const prose = sourceReferences.map(ref => cells.get(ref) ?? "").join(" ");
      const dimensions: RateInputPolicy["dimensions"] = { amount: "required", applicant: "required", age: "provisional", jurisdiction: "provisional", gender: "provisional", tobacco: ["LI", "SH"].includes(category) ? "provisional" : "ignored" };
      if (/unisex|no variations other/i.test(prose) && !/MT.*unisex/i.test(prose)) dimensions.gender = "ignored";
      else if (/gender|\bsex\b|male\s*\/\s*female/i.test(prose)) dimensions.gender = "required";
      if (/unismoker|no variations other/i.test(prose)) dimensions.tobacco = "ignored";
      else if (/smoker|tobacco|risk class/i.test(prose)) dimensions.tobacco = "required";
      if (/attained age|\bage\b/i.test(prose)) dimensions.age = "required";
      if (/state|jurisdiction/i.test(prose)) dimensions.jurisdiction = "required";
      if (category === "DI" || category === "OO") { dimensions.waitingPeriod = "provisional"; dimensions.benefitPeriod = "provisional"; }
      if (scope.key === "ama") dimensions.membership = "required";
      const modifiers: RateModifierPolicy = { version: 1, rules: [], provisional: true, revisit: ["Synthetic base prices; volume discounts without supplied percentages remain zero; child flat premiums and modifier ordering require source reconciliation before publication"] };
      if (scope.key === "ama") {
        const fees: Record<string, number> = { "sh-hospital-income": 45, "di-step-rated": 55, "di-level-rated": 55, "li-10yr": 50, "li-15yr": 50, "li-20yr": 50, "li-term": 50, "li-preferred": 50, "oo-office-overhead": 45, "li-premier-accident": 45 };
        const credits: Record<string, number> = { "di-step-rated": .35, "di-level-rated": .35, "li-10yr": .08, "li-15yr": .08, "li-20yr": .08, "li-preferred": .08, "oo-office-overhead": .35, "li-premier-accident": .2 };
        if (credits[productKey]) modifiers.rules.push({ key: "member-credit", when: { membership: true }, effect: { kind: "multiply", value: 1 - credits[productKey] }, sourceReferences: [`Main!AR${row}`] });
        if (["di-step-rated", "di-level-rated"].includes(productKey)) for (const [jurisdictions, factor] of [[["CA", "FL"], 1.4], [["AK", "AL", "AZ", "GA", "HI", "LA", "MS", "NM", "OR", "SC", "TX", "WA"], 1.2]] as const) modifiers.rules.push({ key: `state-surcharge-${factor}`, when: { jurisdictions: [...jurisdictions] }, effect: { kind: "multiply", value: factor }, sourceReferences: [`Main!AR${row}`] });
        if (productKey === "li-premier-accident") modifiers.rules.push({ key: "monthly-eft-credit", when: { method: "bank-account", frequency: "monthly" }, effect: { kind: "multiply", value: .95 }, sourceReferences: [`Main!AR${row}`] });
        if (fees[productKey]) modifiers.rules.push({ key: "non-member-fee", when: { membership: false }, effect: { kind: "annual-fee", value: fees[productKey] }, sourceReferences: [`Main!AR${row}`] });
      }
      persist(scope.key, `${scope.key}.${productKey}.rate-modifier-policy`, { kind: "product-rate-modifier-policy", productKey }, modifiers);
      const rateClass = reviewedRateClass(row, cells, !!client.coverages.hideSmokerQuestion || !!client.fields.home?.hidden?.includes("smoker"));
      if (rateClass.selection === "fixed" || rateClass.selection === "single" || client.coverages.hideSmokerQuestion) dimensions.tobacco = "ignored";
      dimensions.rateClass = "required";
      const policy: RateInputPolicy = client.coverages.overrides?.[productKey]?.rateInputs ?? { version: 1, rateClass, dimensions, sourceReferences, authority: "provisional", ...(/MT.*unisex/i.test(prose) ? { overrides: [{ jurisdictions: ["MT"], dimensions: { gender: "ignored" as const }, sourceReferences }] } : {}) };
      const key = `${scope.key}.${productKey}.rate-input-policy`;
      persist(scope.key, key, { kind: "product-rate-input-policy", productKey }, policy);
      if (!scope.mcrRequired) continue;
      const decisionKey = `provisional-decision.${key}`;
      db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decisionKey);
      db.semanticRequirements.push({ id: decisionKey, key: decisionKey, ...libraryMetadata("semanticRequirements", decisionKey, "docs/archive/step3-review-and-rating.md"), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: scope.key, predicate: "rate-input-policy", status: "documented", value: { authority: provisionalDecisionAuthority, selected: policy as unknown as Json, sourceReferences, sourceReconciliation: "deferred", runtimeActivation: "pending", revisit: true, destinations: [{ table: "configurationValues", key, column: "value" }] } });
    }
  }
}
