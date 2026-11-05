import { patternCatalog } from "../domain/libraryCatalog";
import raw from "./sources/mcr.json";
import reference from "./sources/canonical.json";
import type { DatabaseSchema, Json } from "../persistence/types";
import type { SourceRequirements } from "../persistence/types/provenanceCanonical";
import { libraryMetadata, providedByTags } from "../domain/provenance";
import { identity, globalScope } from "./values";

export type SourceCell = { sheet: string; cell: string; value: Json; formula: string | null; comment: string | null; hyperlink: string | null };
type Checklist = { sheet: string; cell: string; notes: string | null; displayedContent: Json };
/** Historical compiler evidence. New requirement review uses currentMcr.ts;
 * replacing this extract would rewrite the provenance of accepted migrations. */
export const mcrSource = raw as unknown as { workbook: string; sha256: string; checklistSha256: string; sheets: Array<{ name: string; cells: number; mergedRanges: string[]; images: number }>; cells: SourceCell[]; checklist: Checklist[] };
export const canonicalReference = reference;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const row = (table: string, key: string, source: string) => ({ ...identity(key), ...libraryMetadata(table, key, source) });
const sourceKey = (sheet: string, cell: string) => `mcr.${slug(sheet)}.${cell}`;
const needsConfirmation = /\b(TBD|TBC|confirm|confirmation|check with|to be determined|analysis needed|information needed)\b/i;

export { parseAmount } from "./amountParser";
import { parseAmount } from "./amountParser";
import { extractMcrSemantics } from "./semanticExtraction";
import { reviewCategories } from "./reviewCategories";
import { validateMigrationDatabase } from "./integrity";

import { curateSourcePromotions, implementedSiteBlockers, promotionStates } from "./promotion";
import { inspectAsceBusinessDecisions } from "./asceBusinessDecisions";

const sourcePromotion = { promotionState: "SOURCE_ONLY" as const, promotionReason: "Pending curation; archive only.", activeSiteKeys: [] };

export function seedCanonicalCatalog(db: DatabaseSchema) {
  db.provenanceTags = providedByTags.map(key => ({ ...row("provenanceTags", key, "canonical controlled vocabulary"), name: key }));
  db.patterns = reference.seedPatterns.map(p => ({ ...row("patterns", p.key, `canonical:seedPatterns/${p.key}`), name: p.name, category: p.category, description: patternCatalog.find(pattern => pattern.key === p.key)?.summary ?? p.summary, version: "1", status: "draft" }));
  db.flagDefinitions = reference.seedFlags.map(f => ({ ...row("flagDefinitions", f.key, `canonical:seedFlags/${f.key}`), name: f.name, level: f.level, valueType: f.valueType, persistence: f.persistence, description: "behavior" in f ? f.behavior! : f.name, allowedValues: "allowedValues" in f ? f.allowedValues! : null, derivation: "derivation" in f ? f.derivation! : null }));
  db.flagValues = db.flagDefinitions.flatMap(f => Array.isArray(f.allowedValues) ? f.allowedValues.map(value => ({ ...row("flagValues", `${f.key}.${value}`, f.sourceReference!), flagKey: f.key, value: String(value) })) : []);
  const families = "fixed set range tiered-range range-plus-fixed conditional calculated named-option none attribute-mapped formula-capped base-reference multiplier election-only unspecified-increment".split(" ");
  for (const amountType of families) db.coverageAmountPatterns.push({ ...row("coverageAmountPatterns", `family.${amountType}`, "canonical:coverage_amount_patterns"), patternKey: "coverage-amount-options", amountType, minimum: null, maximum: null, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
  for (const config of reference.configurationAdditions) {
    db.configurationDefinitions.push({ ...identity(config.key), position: db.configurationDefinitions.length, definition: { path: null, metadata: config as unknown as Json } });
    db.patternConfigurationDefinitions.push({ ...row("patternConfigurationDefinitions", `coverage-amount-options.${config.key}`, `canonical:configurationAdditions/${config.key}`), patternKey: "coverage-amount-options", relatedKey: config.key, relationshipType: "uses" });
  }
  const key = "rule-hide-unavailable-rates";
  db.rules.push({ ...identity(key), position: db.rules.length, definition: { id: key, area: "Rates", rule: "Suppress all rate displays when rates are unavailable", behavior: "Hide rate displays when site.has-product-rates is false", ref: "canonical:seedFlags/site.has-product-rates", type: "conditional" } });
  db.ruleFlags.push({ ...row("ruleFlags", `${key}.rates`, "canonical:seedFlags/site.has-product-rates"), ruleKey: key, flagKey: "site.has-product-rates", operator: "equals", value: false });
  db.ruleActions.push({ ...identity(`${key}.hide`), position: 0, ruleKey: key, definition: { kind: "documented-behavior", description: "Suppress estimated cost, product-card rates, and rate-table actions", source: "canonical:seedFlags/site.has-product-rates" } });
  db.structuredRuleActions.push({ ...row("structuredRuleActions", `${key}.all-rates`, "canonical:seedFlags/site.has-product-rates"), ruleKey: key, actionType: "suppress-rates", value: { placements: ["estimated-cost", "product-card", "rate-table"] }, position: 0 });
  const behaviors: Array<{ pattern: string; suffix: string; fact: string; value: Json; actions: Array<[string, Json]> }> = [
    { pattern: "tpa-integration", suffix: "lookup", fact: "application.initialPageComplete", value: true, actions: [["lookup-membership", null], ["lookup-coverage", null]] },
    { pattern: "tpa-coverage-based-verification", suffix: "verify", fact: "tpa.existingCoverage", value: true, actions: [["verify-identity", "LexisNexis"]] },
    { pattern: "tpa-coverage-based-verification", suffix: "identity-pass", fact: "tpa.identityVerified", value: true, actions: [["show-portfolio", true], ["set-decision", "approve"]] },
    { pattern: "tpa-coverage-based-verification", suffix: "identity-fail-or-skipped", fact: "tpa.identityVerified", value: false, actions: [["show-portfolio", false], ["set-decision", "refer"]] },
    { pattern: "tpa-coverage-based-verification", suffix: "no-active-coverage", fact: "tpa.existingCoverage", value: false, actions: [["show-portfolio", false], ["set-decision", "refer"]] },
    { pattern: "tpa-coverage-based-verification", suffix: "no-member", fact: "tpa.existingMember", value: false, actions: [["show-portfolio", false], ["set-decision", "refer"]] },
    { pattern: "tpa-membership-based-auto-approval", suffix: "new-member", fact: "tpa.existingMember", value: false, actions: [["show-portfolio", false], ["set-decision", "approve"]] },
    { pattern: "tpa-membership-based-auto-approval", suffix: "existing-member", fact: "tpa.existingMember", value: true, actions: [["show-portfolio", false], ["set-decision", "refer"]] },
    { pattern: "di-income-replacement", suffix: "maximum", fact: "applicant.monthlyIncome", value: null, actions: [["calculate-benefit", { operation: "minimum", operands: ["income-times-replacement-fraction", "policy-cap"], subtract: "existing-coverage" }]] },
  ];
  for (const behavior of behaviors) {
    const ruleKey = `rule-${behavior.pattern}-${behavior.suffix}` as const;
    db.rules.push({ ...identity(ruleKey), position: db.rules.length, definition: { id: ruleKey, area: "Patterns", rule: behavior.suffix, behavior: behavior.pattern, ref: `canonical:seedPatterns/${behavior.pattern}`, type: "conditional" } });
    db.rulePredicates.push({ ...row("rulePredicates", ruleKey, `canonical:seedPatterns/${behavior.pattern}`), ruleKey, fact: behavior.fact, operator: behavior.value === null ? "exists" : "equals", value: behavior.value, position: 0 });
    if (behavior.pattern === "tpa-coverage-based-verification" && ["verify", "identity-pass"].includes(behavior.suffix)) {
      db.rulePredicates.push({ ...row("rulePredicates", `${ruleKey}.existing-member`, `canonical:seedPatterns/${behavior.pattern}`), ruleKey, fact: "tpa.existingMember", operator: "equals", value: true, position: 1 });
      if (behavior.suffix === "identity-pass") db.rulePredicates.push({ ...row("rulePredicates", `${ruleKey}.active-coverage`, `canonical:seedPatterns/${behavior.pattern}`), ruleKey, fact: "tpa.existingCoverage", operator: "equals", value: true, position: 2 });
    }
    for (const [position, [actionType, value]] of behavior.actions.entries()) db.structuredRuleActions.push({ ...row("structuredRuleActions", `${ruleKey}.${position}`, `canonical:seedPatterns/${behavior.pattern}`), ruleKey, actionType, value, position });
    db.patternRules.push({ ...row("patternRules", `${behavior.pattern}.${ruleKey}`, `canonical:seedPatterns/${behavior.pattern}`), patternKey: behavior.pattern, relatedKey: ruleKey, relationshipType: "implements" });
  }
  for (const pattern of db.patterns) for (const flag of db.flagDefinitions.filter(f => pattern.category === "integration" && f.key.includes("qd"))) db.patternFlagDefinitions.push({ ...row("patternFlagDefinitions", `${pattern.key}.${flag.key}`, pattern.sourceReference!), patternKey: pattern.key, relatedKey: flag.key, relationshipType: "uses" });
  for (const p of db.patterns.filter(p => p.category === "integration")) {
    // Explicit capabilities, never application client-name branches. Assignment requires confirmation.
    db.patternAssignments.push({ ...row("patternAssignments", `${p.key}.capabilities`, p.sourceReference!), patternKey: p.key, clientKey: null, siteKey: null, productKey: null, applicantKey: null, configuration: p.key === "tpa-membership-based-auto-approval" ? { membershipLookup: true, newMemberAutoApproval: true, existingMemberOutcome: "refer", lexisNexis: false, portfolio: false } : { membershipLookup: true, coverageLookup: true, lexisNexis: true, portfolio: true, fallbackOutcome: "refer" } });
  }
  const coveragePolicy = { requiresExistingMember: true, requiresActiveCoverage: true, verifiedOutcome: "approve", fallbackOutcome: "refer" };
  const lookupFields = ["first-name", "last-name", "birth-date"];
  const assignments: Array<{ clientKey: string; patternKey: string; configuration: Json }> = [
    { clientKey: "ama", patternKey: "tpa-coverage-based-verification", configuration: { ...coveragePolicy, lookupFields } },
    { clientKey: "asce", patternKey: "tpa-coverage-based-verification", configuration: { ...coveragePolicy, lookupFields: [...lookupFields, "asce-member-id"] } },
    { clientKey: "waepa", patternKey: "tpa-membership-based-auto-approval", configuration: { lookupFields, lexisNexis: false, portfolio: false, newMemberOutcome: "approve", existingMemberOutcome: "refer" } },
  ];
  for (const assignment of assignments) db.patternAssignments.push({ ...row("patternAssignments", `${assignment.clientKey}.${assignment.patternKey}`, "user:2026-09-30/tpa-flow-comparison"), patternKey: assignment.patternKey, clientKey: assignment.clientKey, siteKey: null, productKey: null, applicantKey: null, configuration: { ...(assignment.configuration as Record<string, Json>), status: "documented", active: false } });
}

/** Cell ledger is lossless. MAPPED requires a real destination, not merely archived text. */
export function seedMcr(db: DatabaseSchema) {
  const workbookKey = "mcr-20260928";
  db.sourceWorkbooks.push({ ...row("sourceWorkbooks", workbookKey, mcrSource.workbook), name: mcrSource.workbook, sha256: mcrSource.sha256 });
  const checks = new Map(mcrSource.checklist.map(c => [`${c.sheet}!${c.cell}`, c]));
  const requirements = new Map<string, SourceRequirements>();
  for (const sheet of mcrSource.sheets) db.sourceSheets.push({ ...row("sourceSheets", slug(sheet.name), `${mcrSource.workbook}#${sheet.name}`), workbookKey, name: sheet.name, cellCount: sheet.cells, mergedRanges: sheet.mergedRanges, imageCount: sheet.images });
  for (const cell of mcrSource.cells) {
    const key = sourceKey(cell.sheet, cell.cell);
    const blank = cell.value === null || String(cell.value).trim() === "";
    const requirement: SourceRequirements = { ...sourcePromotion, ...row("sourceRequirements", key, `${mcrSource.workbook}#${cell.sheet}!${cell.cell}`), sheetKey: slug(cell.sheet), cell: cell.cell, value: cell.value, formula: cell.formula, comment: cell.comment, hyperlink: cell.hyperlink,
      classification: blank && !cell.comment && !cell.hyperlink ? "INTENTIONALLY_EXCLUDED" : "UNRESOLVED",
      reason: blank ? "Whitespace/layout-only cell; original value retained." : needsConfirmation.test(String(cell.value)) ? "Source explicitly requires confirmation; no value inferred." : "Source retained; semantic mapping/conditions require review.", checklistNotes: checks.get(`${cell.sheet}!${cell.cell}`)?.notes ?? null };
    db.sourceRequirements.push(requirement); requirements.set(key, requirement);
  }
  const headerSheets = new Set(["Main", "QD LI", "QD DI", "Disability", "Overhead Expense", "Riders", "Health Questions", "WAEPA CIR questions", "Smoker Question", "Associations", "Beneficiary Note", "URLs", "Underwriting", "Legal Disclosures"]);
  for (const cell of mcrSource.cells) if (headerSheets.has(cell.sheet) && /^[A-Z]+1$/.test(cell.cell) && !needsConfirmation.test(String(cell.value))) {
    const requirement = requirements.get(sourceKey(cell.sheet, cell.cell))!;
    requirement.classification = "INTENTIONALLY_EXCLUDED"; requirement.reason = "Source column heading retained for traceability; structural label rather than a configurable entity value.";
  }
  // Embedded visual content is outside the checklist; keep it visible as an open requirement.
  for (const sheet of mcrSource.sheets.filter(s => s.images)) {
    const key = sourceKey(sheet.name, "embedded-images");
    db.sourceRequirements.push({ ...sourcePromotion, ...row("sourceRequirements", key, `${mcrSource.workbook}#${sheet.name}`), sheetKey: slug(sheet.name), cell: "embedded-images", value: sheet.images, formula: null, comment: null, hyperlink: null, classification: "UNRESOLVED", reason: "Embedded images require visual review and asset extraction; checklist omits image-only content.", checklistNotes: null });
  }
  // Checklist-only cells must not silently disappear when the two supplied files disagree.
  for (const check of mcrSource.checklist) if (!requirements.has(sourceKey(check.sheet, check.cell))) {
    const key = sourceKey(check.sheet, check.cell);
    const r: SourceRequirements = { ...sourcePromotion, ...row("sourceRequirements", key, `05-requirements-to-fill-out-checklist.xlsx#${check.sheet}!${check.cell}`), sheetKey: slug(check.sheet), cell: check.cell, value: check.displayedContent, formula: null, comment: null, hyperlink: null, classification: "UNRESOLVED", reason: "Checklist reference absent from supplied source workbook.", checklistNotes: check.notes };
    db.sourceRequirements.push(r); requirements.set(key, r);
  }
  function mapped(sheet: string, cell: string, targetTable: string, targetKey: string, targetColumn: string) {
    const r = requirements.get(sourceKey(sheet, cell));
    if (!r) return;
    db.requirementTargets.push({ ...row("requirementTargets", `${r.key}.${targetTable}.${targetKey}.${targetColumn}`, r.sourceReference!), requirementKey: r.key, targetTable, targetKey, targetColumn });
    if (!needsConfirmation.test(String(r.value))) { r.classification = "MAPPED"; r.reason = `Represented by ${targetTable}.${targetColumn}.`; }
  }
  const lookup = new Map(mcrSource.cells.map(c => [`${c.sheet}!${c.cell}`, c.value]));
  const value = (sheet: string, column: string, n: number) => String(lookup.get(`${sheet}!${column}${n}`) ?? "").trim();
  const timestamp = { createdAt: "2026-09-28T00:00:00.000Z", updatedAt: "2026-09-28T00:00:00.000Z" };
  const associationRows = [...new Set(mcrSource.cells.filter(c => c.sheet === "Associations").map(c => Number(c.cell.replace(/[A-Z]/g, ""))))].filter(n => n > 1);
  for (const n of associationRows) {
    const tpa = value("Associations", "B", n), acronym = value("Associations", "C", n), name = value("Associations", "A", n);
    if (!tpa || !acronym || !name || /\n|\//.test(acronym) || needsConfirmation.test(tpa)) continue;
    const tpaNames: Record<string, string> = { ABE: 'American Bar Endowment', AMAIA: 'AMA Insurance Agency, Inc.', AAFPIS: 'AAFP Insurance Services, Inc.', Lockton: 'Lockton Affinity, LLC', USI: 'USI Affinity', Pearl: 'Pearl Insurance', PCA: 'Pearl Carroll & Associates, LLC', WAEPA: 'Worldwide Assurance for Employees of Public Agencies, Inc.' };
    let organization = db.organizations.find(o => o.name.toLowerCase() === tpa.toLowerCase() || o.name === tpaNames[tpa] || o.key.toLowerCase() === tpa.toLowerCase() || tpa === "Pearl" && o.name === "Pearl Insurance");
    if (!organization) { const key = `mcr.tpa.${slug(tpa)}`; organization = { ...identity(key), ...libraryMetadata("organizations", key, `Associations!B${n}`), name: tpaNames[tpa] ?? tpa, type: "TPA", status: "inactive", ...timestamp }; db.organizations.push(organization); }
    let client = db.clients.find(c => c.acronym.toLowerCase() === acronym.toLowerCase() || acronym === "ISI" && c.key === "isitrust");
    if (!client) { const key = `mcr.client.${slug(acronym)}`; client = { ...identity(key), ...libraryMetadata("clients", key, `Associations!A${n}:C${n}`), name, acronym, organizationId: organization.id, status: "inactive", ...timestamp }; db.clients.push(client); }
    // MCR replaces synthetic compatibility ownership; established named ownership is retained.
    const previousOrganization = db.organizations.find(o => o.id === client.organizationId);
    if (previousOrganization?.name.startsWith("Compatibility TPA for")) client.organizationId = organization.id;
    const contact = value("Associations", "D", n);
    let profile = db.organizationProfiles.find(p => p.organizationKey === organization!.key);
    if (!profile) { profile = { ...identity(`profile.${organization.key}`), ...libraryMetadata("organizationProfiles", `profile.${organization.key}`, `Associations!B${n}:D${n}`), organizationKey: organization.key, position: db.organizationProfiles.length, definition: { name: organization.name, acronym: tpa, provisional: false, administrationContacts: [] } }; db.organizationProfiles.push(profile); }
    profile.definition.acronym = tpa;
    profile.definition.administrationContacts ??= [];
    if (contact && !profile.definition.administrationContacts.some(c => c.clientKey === client!.key && c.details === contact)) profile.definition.administrationContacts.push({ clientKey: client.key, details: contact, source: `Associations!D${n}` });
    if (client.organizationId !== organization.id) {
      const requirement = requirements.get(sourceKey("Associations", `B${n}`)); if (requirement) requirement.reason = "MCR TPA differs from the current client ownership; requires identity reconciliation.";
    } else mapped("Associations", `B${n}`, "organizations", organization.key, "name");
    mapped("Associations", `C${n}`, "clients", client.key, "acronym");
    const associationKey = `mcr.association.${slug(acronym)}.${n}`;
    db.associations.push({ ...identity(associationKey), ...libraryMetadata("associations", associationKey, `Associations!A${n}:C${n}`), clientKey: client.key, definition: { name, acronym }, position: db.associations.length });
    mapped("Associations", `A${n}`, "associations", associationKey, "definition");
  }
  // Keep missing source identities explicit, but never present compatibility labels as TPAs.
  const referencedOrganizations = new Set(db.clients.map(c => c.organizationId));
  db.organizations = db.organizations.filter(o => referencedOrganizations.has(o.id) || !o.name.startsWith("Compatibility TPA for"));
  for (const organization of db.organizations.filter(o => o.name.startsWith("Compatibility TPA for"))) organization.name = organization.key === "tpa-demo" ? "Demo administrator" : "TPA not recorded in MCR";
  db.organizationProfiles = db.organizationProfiles.filter(p => db.organizations.some(o => o.key === p.organizationKey));
  const mainRows = [...new Set(mcrSource.cells.filter(c => c.sheet === "Main").map(c => Number(c.cell.replace(/[A-Z]/g, ""))))].filter(n => n > 1);
  for (const n of mainRows) {
    const name = value("Main", "D", n), acronym = value("Main", "B", n), category = value("Main", "C", n);
    if (!name || !acronym || !category) continue;
    const categoryKey = db.coverageCategories.some(c => c.key === category) ? category : `mcr.category.${slug(category)}`;
    if (!db.coverageCategories.some(c => c.key === categoryKey)) db.coverageCategories.push({ ...identity(categoryKey), ...libraryMetadata("coverageCategories", categoryKey, `Main!C${n}`), position: db.coverageCategories.length, definition: { label: category, iconKey: "" } });
    // Row identity distinguishes duplicate product names/codes without fabricated client/site records.
    const key = `mcr.${slug(acronym)}.${slug(name)}.${n}`;
    db.products.push({ ...identity(key), ...libraryMetadata("products", key, `Main!D${n}`), position: db.products.length, categoryKey, definition: { id: key, name, code: null, categoryId: categoryKey, groupPolicySitus: value("Main", "F", n) || undefined, underwritingType: "UNRESOLVED", definition: `MCR catalog product; source Main!D${n}`, applicants: [], options: [] } });
    const owner = db.clients.find(c => c.acronym.toLowerCase() === acronym.toLowerCase());
    if (owner) { const relationKey = `${key}.${owner.key}`; db.productClients.push({ ...row("productClients", relationKey, `Main!B${n}`), productKey: key, clientKey: owner.key }); mapped("Main", `B${n}`, "productClients", relationKey, "clientKey"); }
    mapped("Main", `D${n}`, "products", key, "definition"); mapped("Main", `C${n}`, "products", key, "categoryKey");
    if (value("Main", "F", n)) mapped("Main", `F${n}`, "products", key, "definition");
    for (const [col, kind] of [["E", "gNumber"], ["G", "planCode"]] as const) if (value("Main", col, n)) {
      const idKey = `${key}.${kind}`;
      db.productIdentifiers.push({ ...identity(idKey), ...libraryMetadata("productIdentifiers", idKey, `Main!${col}${n}`), ...globalScope, productKey: key, kind, position: 0, definition: { primary: value("Main", col, n) } }); mapped("Main", `${col}${n}`, "productIdentifiers", idKey, "definition");
    }
    for (const [col, applicantTypeKey] of [["H", "member"], ["I", "spouse"], ["J", "child"]] as const) {
      const parsed = parseAmount(value("Main", col, n)); if (!parsed) continue;
      const amountKey = `${key}.${applicantTypeKey}`;
      db.coverageAmountPatterns.push({ ...row("coverageAmountPatterns", amountKey, `Main!${col}${n}`), patternKey: "coverage-amount-options", amountType: parsed.amountType, minimum: parsed.minimum, maximum: parsed.maximum, increment: parsed.increment, formula: parsed.base ?? null, baseProductKey: null, baseApplicantKey: parsed.base === "member coverage" ? "member" : null, baseApplicantClass: null, multiplier: parsed.multiplier ?? null });
      db.productAmountRules.push({ ...row("productAmountRules", amountKey, `Main!${col}${n}`), productKey: key, applicantTypeKey, applicantClass: null, amountPatternKey: amountKey, conditionKey: null, clientKey: null, siteKey: null, position: 0 });
      db.productApplicantEligibility.push({ ...row("productApplicantEligibility", amountKey, `Main!${col}${n}`), productKey: key, applicantTypeKey, siteKey: null, eligible: parsed.amountType !== "none", conditionKey: null });
      parsed.options.forEach((value, position) => db.amountOptions.push({ ...row("amountOptions", `${amountKey}.${position}`, `Main!${col}${n}`), amountPatternKey: amountKey, value: String(value), label: String(value), position }));
      mapped("Main", `${col}${n}`, "coverageAmountPatterns", amountKey, "amountType");
    }
    // Distinct product-level information requirements share the configuration catalog.
    // Values retain source text; behavioral prose is not marked implemented.
    for (const col of ["AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR", "AS"]) {
      const text = value("Main", col, n); if (!text) continue;
      const configurationKey = `mcr.product.${slug(value("Main", col, 1))}`;
      if (!db.configurationDefinitions.some(c => c.key === configurationKey)) db.configurationDefinitions.push({ ...identity(configurationKey), ...libraryMetadata("configurationDefinitions", configurationKey, `Main!${col}1`), position: db.configurationDefinitions.length, definition: { path: null, metadata: { name: value("Main", col, 1), valueType: "source-text", requiresInterpretation: true } } });
      const configKey = `${key}.${configurationKey}`;
      db.productConfigurationValues.push({ ...row("productConfigurationValues", configKey, `Main!${col}${n}`), productKey: key, configurationKey, value: text });
      // Simple, authoritative scalar configuration can be represented without interpreting prose.
      if (/^(yes|no|n\/?a|monthly|quarterly|annually|annual|semi-annually|age last birthday|age nearest birthday|\d+(\.\d+)?)$/i.test(text) || ["AA", "AL", "AK"].includes(col) && text.length < 80 && !/\n|\b(if|when|except|must)\b/i.test(text)) mapped("Main", `${col}${n}`, "productConfigurationValues", configKey, "value");
      else db.requirementTargets.push({ ...row("requirementTargets", `${sourceKey("Main", `${col}${n}`)}.config`, `Main!${col}${n}`), requirementKey: sourceKey("Main", `${col}${n}`), targetTable: "productConfigurationValues", targetKey: configKey, targetColumn: "value" });
    }
    for (const [col, applicantTypeKey] of [["U", "member"], ["V", "spouse"], ["W", "child"]] as const) {
      const pathway = value("Main", col, n);
      if (!/^(FUW|GI|SI|QD|TELE|NCGI|NA|N\/A)$/i.test(pathway)) continue;
      const bandKey = `${key}.${applicantTypeKey}.underwriting`;
      db.underwritingBands.push({ ...row("underwritingBands", bandKey, `Main!${col}${n}`), productKey: key, applicantTypeKey, siteKey: null, pathway, minimumAge: null, maximumAge: null, minimumAmount: null, maximumAmount: null, minimumAmountExclusive: false, applicantClass: null, mortalityMorbidity: null, conditionKey: null, status: "documented" });
      mapped("Main", `${col}${n}`, "underwritingBands", bandKey, "pathway");
    }
    db.patternProducts.push({ ...row("patternProducts", `coverage-amount-options.${key}`, `Main!D${n}`), patternKey: "coverage-amount-options", relatedKey: key, relationshipType: "uses" });
  }
  // DI/OE plan IDs are reusable definitions referenced by Main, not duplicate products.
  const planLookup = new Map<string, string>();
  for (const [sheet, coverageType, amountColumn, waitingColumn, benefitColumn] of [["Disability", "disability", "D", "F", "G"], ["Overhead Expense", "overhead-expense", "C", "E", "F"]]) {
    const sourceRows = [...new Set(mcrSource.cells.filter(c => c.sheet === sheet).map(c => Number(c.cell.replace(/[A-Z]/g, ""))))].filter(n => n > 1).sort((a, b) => a - b);
    let planKey: string | null = null;
    for (const n of sourceRows) {
      const name = value(sheet, "A", n);
      if (name) {
        const code = /^(D\d+[a-z]?|OE\d+)\b/i.exec(name)?.[1];
        planKey = `mcr.plan.${slug(sheet)}.${code?.toLowerCase() ?? slug(name)}`;
        if (db.coveragePlanDefinitions.some(p => p.key === planKey)) { planKey = null; continue; }
        db.coveragePlanDefinitions.push({ ...row("coveragePlanDefinitions", planKey, `${sheet}!A${n}`), name, coverageType });
        if (code) planLookup.set(code.toLowerCase(), planKey);
        mapped(sheet, `A${n}`, "coveragePlanDefinitions", planKey, "name");
      }
      if (!planKey || !value(sheet, amountColumn, n)) continue;
      const variantKey = `${planKey}.${n}`;
      const applicant = sheet === "Disability" ? value(sheet, "C", n).toLowerCase() : "";
      db.coveragePlanVariants.push({ ...row("coveragePlanVariants", variantKey, `${sheet}!B${n}`), planKey, name: value(sheet, "B", n) || null, applicantTypeKey: ["member", "spouse", "child"].includes(applicant) ? applicant : null, position: n });
      if (value(sheet, "B", n) && value(sheet, "B", n).length < 100 && !/\b(if|when|question|maximum)\b/i.test(value(sheet, "B", n))) mapped(sheet, `B${n}`, "coveragePlanVariants", variantKey, "name");
      if (["member", "spouse", "child"].includes(applicant)) mapped(sheet, `C${n}`, "coveragePlanVariants", variantKey, "applicantTypeKey");
      const parsed = parseAmount(value(sheet, amountColumn, n));
      if (parsed) {
        const amountKey = `${variantKey}.amount`;
        db.coverageAmountPatterns.push({ ...row("coverageAmountPatterns", amountKey, `${sheet}!${amountColumn}${n}`), patternKey: "coverage-amount-options", amountType: parsed.amountType, minimum: parsed.minimum, maximum: parsed.maximum, increment: parsed.increment, formula: parsed.base ?? null, baseProductKey: null, baseApplicantKey: parsed.base === "member coverage" ? "member" : null, baseApplicantClass: null, multiplier: parsed.multiplier ?? null });
        db.planAmountRules.push({ ...row("planAmountRules", amountKey, `${sheet}!${amountColumn}${n}`), variantKey, amountPatternKey: amountKey, conditionKey: null });
        mapped(sheet, `${amountColumn}${n}`, "coverageAmountPatterns", amountKey, "amountType");
      }
      for (const [column, kind] of [[waitingColumn, "waiting"], [benefitColumn, "benefit"]]) {
        const period = /^(\d+(?:\s*,\s*\d+)*)\s*[- ]?\s*(days?|months?|years?)$/i.exec(value(sheet, column, n));
        if (!period) continue;
        const unit = period[2].toLowerCase().replace(/s$/, "") + "s";
        for (const [position, amount] of period[1].split(",").entries()) {
          const key = `${variantKey}.${kind}.${position}`;
          db.planBenefitPeriods.push({ ...row("planBenefitPeriods", key, `${sheet}!${column}${n}`), variantKey, kind, unit, value: Number(amount.trim()), position });
          mapped(sheet, `${column}${n}`, "planBenefitPeriods", key, "value");
        }
      }
    }
  }
  for (const n of mainRows) {
    const product = db.products.find(p => p.sourceReference === `Main!D${n}`); if (!product) continue;
    for (const [column, applicantTypeKey] of [["H", "member"], ["I", "spouse"], ["J", "child"]] as const) {
      const code = value("Main", column, n), planKey = planLookup.get(code.toLowerCase()); if (!planKey) continue;
      const key = `${product.key}.${applicantTypeKey}.plan`;
      db.productCoveragePlans.push({ ...row("productCoveragePlans", key, `Main!${column}${n}`), productKey: product.key, planKey, applicantTypeKey });
      mapped("Main", `${column}${n}`, "productCoveragePlans", key, "planKey");
    }
  }
  // Riders are a shared catalog. Amounts are separate from the product/rider junction.
  const riderRows = [...new Set(mcrSource.cells.filter(c => c.sheet === "Riders").map(c => Number(c.cell.replace(/[A-Z]/g, ""))))].filter(n => n > 1);
  for (const n of riderRows) {
    const name = value("Riders", "B", n), identifier = value("Riders", "A", n); if (!name || !identifier) continue;
    const key = `mcr.rider.${slug(identifier)}`;
    if (db.riders.some(r => r.key === key)) continue;
    // Premium factor is deliberately not inferred; these records are not runtime assigned.
    db.riders.push({ ...identity(key), ...libraryMetadata("riders", key, `Riders!A${n}:B${n}`), position: db.riders.length, definition: { id: key, name, description: "MCR source catalog; premium factor unconfirmed", premiumFactor: null } });
    mapped("Riders", `A${n}`, "riders", key, "key"); mapped("Riders", `B${n}`, "riders", key, "definition");
    for (const [col, applicantTypeKey] of [["C", "member"], ["D", "spouse"], ["E", "child"]] as const) {
      const parsed = parseAmount(value("Riders", col, n)); if (!parsed) continue;
      const amountKey = `${key}.${applicantTypeKey}`;
      db.coverageAmountPatterns.push({ ...row("coverageAmountPatterns", amountKey, `Riders!${col}${n}`), patternKey: "coverage-amount-options", amountType: parsed.amountType, minimum: parsed.minimum, maximum: parsed.maximum, increment: parsed.increment, formula: parsed.base ?? null, baseProductKey: null, baseApplicantKey: parsed.base === "member coverage" ? "member" : null, baseApplicantClass: null, multiplier: parsed.multiplier ?? null });
      db.riderAmountRules.push({ ...row("riderAmountRules", amountKey, `Riders!${col}${n}`), riderKey: key, applicantTypeKey, amountPatternKey: amountKey, baseProductKey: null, conditionKey: null });
      parsed.options.forEach((value, position) => db.amountOptions.push({ ...row("amountOptions", `${amountKey}.${position}`, `Riders!${col}${n}`), amountPatternKey: amountKey, value: String(value), label: String(value), position }));
      mapped("Riders", `${col}${n}`, "coverageAmountPatterns", amountKey, "amountType");
    }
  }
  // Verbatim reusable question text; adjacent rule prose remains unresolved until formalized.
  const questionColumns: Record<string, string> = { "Health Questions": "B", "Financial questions": "B", "WAEPA CIR questions": "A", "Underwriting": "B", "Smoker Question": "B", "SUP DI Health questions": "G", "Attestation Online and PDF": "C" };
  for (const [sheet, column] of Object.entries(questionColumns)) {
    const setKey = `mcr.${slug(sheet)}`;
    db.questionSets.push({ ...row("questionSets", setKey, `${sheet}!${column}`), name: sheet, questionType: slug(sheet), version: null, description: "Verbatim source question catalog; conditional behavior requires separate review." });
    for (const cell of mcrSource.cells.filter(c => c.sheet === sheet && c.cell.startsWith(column) && Number(c.cell.slice(column.length)) > 1 && String(c.value ?? "").trim())) {
      const key = sourceKey(sheet, cell.cell);
      db.questionDefinitions.push({ ...row("questionDefinitions", key, `${sheet}!${cell.cell}`), text: String(cell.value), responseType: null, status: "unresolved" });
      db.questionSetQuestions.push({ ...row("questionSetQuestions", key, `${sheet}!${cell.cell}`), questionSetKey: setKey, questionKey: key, position: Number(cell.cell.slice(column.length)), conditionKey: null });
      // Archiving a mixed question/instruction cell is not proof of semantic mapping.
      db.requirementTargets.push({ ...row("requirementTargets", `${key}.question`, `${sheet}!${cell.cell}`), requirementKey: key, targetTable: "questionDefinitions", targetKey: key, targetColumn: "text" });
    }
  }
  const contentColumns: Record<string, string[]> = {
    "Legal Disclosures": ["A"], "Beneficiary Note": ["C", "D"], "Standard Decision Wording ": ["B"],
    "ElectrConsent": ["A"],
  };
  for (const [sheet, columns] of Object.entries(contentColumns)) for (const cell of mcrSource.cells.filter(c => c.sheet === sheet && columns.includes(c.cell.replace(/\d/g, "")) && Number(c.cell.replace(/[A-Z]/g, "")) > 1 && String(c.value ?? "").trim())) {
    const key = sourceKey(sheet, cell.cell);
    db.contentEntries.push({ ...identity(key), ...libraryMetadata("contentEntries", key, `${sheet}!${cell.cell}`), position: db.contentEntries.length, definition: { path: null } });
    db.contentValues.push({ ...identity(key), ...libraryMetadata("contentValues", key, `${sheet}!${cell.cell}`), ...globalScope, contentKey: key, value: cell.value, position: 0 });
    mapped(sheet, cell.cell, "contentValues", key, "value");
  }
  db.flagDefinitions.push({ ...row("flagDefinitions", "application.has-underwritten-coverage", "Read & Sign!B3:B4"), name: "Application has underwritten coverage", level: "application", valueType: "boolean", persistence: "derived-runtime", description: "Read & Sign visibility flag", allowedValues: null, derivation: "True for selected member/spouse Life, Disability or Office Overhead; false for child-only Life or only AD&D/HI." });
  for (const cell of ["B3", "B4"]) {
    const requirement = requirements.get(sourceKey("Read & Sign", cell));
    if (requirement) { requirement.reason = "Derivation captured in application.has-underwritten-coverage; product-category taxonomy reconciliation and executable validation remain required."; db.requirementTargets.push({ ...row("requirementTargets", `${requirement.key}.flag`, `Read & Sign!${cell}`), requirementKey: requirement.key, targetTable: "flagDefinitions", targetKey: "application.has-underwritten-coverage", targetColumn: "derivation" }); }
  }
  // Client URLs are catalog data and do not create or activate a runnable Site.
  const urlRows = [...new Set(mcrSource.cells.filter(c => c.sheet === "URLs").map(c => Number(c.cell.replace(/[A-Z]/g, ""))))].filter(n => n > 1);
  for (const n of urlRows) {
    const owner = db.clients.find(c => c.acronym.toLowerCase() === value("URLs", "A", n).toLowerCase()); if (!owner) continue;
    for (const [column, environment] of [["B", "production"], ["C", "test"], ["D", "pre-production"], ["E", "automation"]]) {
      const url = value("URLs", column, n); if (!/^https?:\/\/\S+$/.test(url)) continue;
      const key = sourceKey("URLs", `${column}${n}`);
      db.clientEnvironmentLinks.push({ ...row("clientEnvironmentLinks", key, `URLs!${column}${n}`), clientKey: owner.key, environment, url });
      mapped("URLs", `${column}${n}`, "clientEnvironmentLinks", key, "url");
    }
  }
  // QD is an overlay. Join only an unambiguous exact G-number + plan-code pair.
  for (const sheet of ["QD LI", "QD DI"]) {
    const rows = [...new Set(mcrSource.cells.filter(c => c.sheet === sheet).map(c => Number(c.cell.replace(/[A-Z]/g, ""))))].filter(n => n > 1);
    for (const n of rows) {
      const g = value(sheet, "D", n), plan = value(sheet, "F", n); if (!g || !plan) continue;
      const candidates = db.products.filter(p => db.productIdentifiers.some(i => i.productKey === p.key && i.kind === "gNumber" && typeof i.definition === "object" && i.definition !== null && !Array.isArray(i.definition) && i.definition.primary === g) && db.productIdentifiers.some(i => i.productKey === p.key && i.kind === "planCode" && typeof i.definition === "object" && i.definition !== null && !Array.isArray(i.definition) && i.definition.primary === plan));
      if (candidates.length !== 1) continue;
      const productKey = candidates[0].key;
      for (const [amountCol, ageCol, applicantTypeKey] of [["J", "O", "member"], ["K", "P", "spouse"], ["L", "Q", "child"]] as const) {
        const amount = parseAmount(value(sheet, amountCol, n));
        const age = /^(\d+)\s*[-–]\s*(\d+)$/.exec(value(sheet, ageCol, n));
        if (!amount || !age || amount.amountType === "none") continue;
        const key = `${sourceKey(sheet, `${amountCol}${n}`)}.${applicantTypeKey}`;
        db.underwritingBands.push({ ...row("underwritingBands", key, `${sheet}!${amountCol}${n}/${ageCol}${n}`), productKey, applicantTypeKey, siteKey: null, pathway: "QD", minimumAge: Number(age[1]), maximumAge: Number(age[2]), minimumAmount: amount.minimum, maximumAmount: amount.maximum, minimumAmountExclusive: false, applicantClass: null, mortalityMorbidity: value(sheet, "G", n) || null, conditionKey: null, status: "requires-underwriting-confirmation" });
        // Headers request UW/contracts confirmation; even structurally mapped bands remain unresolved.
        for (const [col, targetColumn] of [[amountCol, "minimumAmount"], [ageCol, "minimumAge"]]) {
          const requirementKey = sourceKey(sheet, `${col}${n}`);
          db.requirementTargets.push({ ...row("requirementTargets", `${requirementKey}.band`, `${sheet}!${col}${n}`), requirementKey, targetTable: "underwritingBands", targetKey: key, targetColumn });
          const requirement = requirements.get(requirementKey)!; requirement.reason = "QD band structurally represented; UW/contracts confirmation explicitly required by worksheet headers.";
        }
      }
    }
  }
  // Preserve all specifically identified canonical open items even if a parser recognized a value.
  for (const item of reference.mcrOpenItems) for (const r of db.sourceRequirements) {
    if (item.sheet.split("/").includes(db.sourceSheets.find(s => s.key === r.sheetKey)?.name ?? "") && item.cell.split("/").includes(r.cell)) { r.classification = "UNRESOLVED"; r.reason = item.issue; }
  }
  extractMcrSemantics(db, mcrSource);
  curateSourcePromotions(db);
}

export function mcrCoverageReport(db: DatabaseSchema) {
  const counts = Object.fromEntries(reviewCategories.map(category => [category, db.sourceRequirements.filter(r => r.classification === category).length]));
  const integrityErrors = validateMigrationDatabase(db);
  const implemented = implementedSiteBlockers(db);
  const unresolved = db.sourceRequirements.filter(r => r.promotionState === 'UNRESOLVED');
  const blocking = [...implemented, ...unresolved.map(r => ({ key: r.key, siteKey: null, category: r.classification, reason: r.promotionReason, source: r.sourceReference }))];
  // Compatibility consumers do not execute normalized eligibility/UW decisions.
  // The six ASCE decisions are approved; no historical-key exemptions remain.
  // Missing approvals, changed canonical rules and new unknowns fail closed.
  const phase5Blockers = blocking;
  const promotionCounts = Object.fromEntries(promotionStates.map(state => [state, db.sourceRequirements.filter(r => r.promotionState === state).length]));
  return { workbookSha256: mcrSource.sha256, checklistSha256: mcrSource.checklistSha256,
    promotionCounts,
    extractionPromotionCounts: Object.fromEntries(reviewCategories.map(category => [category, Object.fromEntries(promotionStates.map(state => [state, db.sourceRequirements.filter(r => r.classification === category && r.promotionState === state).length]))])),
    implementedSiteConfigurationRecords: Object.fromEntries(db.sites.map(site => [site.key, {
      pages: db.sitePages.filter(r => r.siteKey === site.key).length,
      fields: db.siteFieldConfigurations.filter(r => r.siteKey === site.key).length,
      products: db.siteProducts.filter(r => r.siteId === site.id && r.enabled).length,
      configurations: db.configurationValues.filter(r => r.siteKey === site.key).length,
    }])),
    implementedSiteBlockers: implemented,
    businessDecisions: inspectAsceBusinessDecisions(db),
    canonicalModelBlockers: unresolved.filter(r => !Array.isArray(r.activeSiteKeys) || !r.activeSiteKeys.length),
    integrityBlockers: integrityErrors,
    identityBlockersAffectingActiveSites: unresolved.filter(r => r.classification === 'IDENTITY_CONFLICT' && Array.isArray(r.activeSiteKeys) && r.activeSiteKeys.length),
    sourceOnlyRecords: promotionCounts.SOURCE_ONLY,
    patternCandidates: promotionCounts.PATTERN_CANDIDATE,
    trueUnresolvedActiveRequirements: blocking,
    counts, sheets: db.sourceSheets.map(sheet => ({ sheet: sheet.name, sourceCells: sheet.cellCount, ...Object.fromEntries(reviewCategories.map(status => [status, db.sourceRequirements.filter(r => r.sheetKey === sheet.key && r.classification === status).length])) })),
    semanticDomains: Object.fromEntries([...new Set(db.semanticRequirements.map(r => r.domain))].map(domain => [domain, db.semanticRequirements.filter(r => r.domain === domain).length])),
    identity: Object.fromEntries(['exact', 'semantic-key', 'g-number', 'plan-code', 'g-number+plan-code', 'multi-match', 'no-match'].map(strategy => [strategy, db.identityResolutions.filter(r => r.strategy === strategy).length])),
    pendingSemanticMapping: counts.UNMAPPED_SEMANTIC, blockingCount: blocking.length, integrityErrors,
    blockers: blocking,
    phase5Blockers,
    phase5BlockingCount: phase5Blockers.length,
    phase5Ready: phase5Blockers.length === 0 && integrityErrors.length === 0,
    phase6Ready: blocking.length === 0 && integrityErrors.length === 0,
  };
}
