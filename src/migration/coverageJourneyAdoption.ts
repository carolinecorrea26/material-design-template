import type { DatabaseSchema, Json } from "../persistence/types";
import type { ConfigurationTarget } from "../persistence/types/content";
import { libraryMetadata } from "../domain/provenance";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { isSelectionPolicy, type SelectionPolicy, type RiderAmount } from "../domain/coverageSelectionPolicy";
import { isCoverageJourneyPolicy, type CoverageJourneyPolicy, type IdentifierRoles, type MappingDimensions } from "../domain/coverageJourneyPolicy";
import type { PaymentPolicy } from "../domain/paymentPolicy";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { provisionalDecisionAuthority } from "./provisionalSourceDecisions";
import { mcrSource } from "./mcr";
import { isBenefitPolicy } from "../domain/benefitPolicy";
import { usJurisdictions, type ResidencyPolicy } from "../domain/residencyPolicy";

const reference = "docs/step3-journey-adoption.md";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
function persist(db: DatabaseSchema, siteKey: string, key: string, target: ConfigurationTarget, value: unknown, sourceReferences: string[], preserveDecision = false) {
  // Explicitly reviewed association portfolios own their authored mappings and
  // product choices. A legacy derivation cannot add newly enabled Associations
  // to every product or replace reviewed identifier roles on a later pass.
  if (target.kind === "product-journey-policy" && db.semanticRequirements.some(row => {
    if (row.domain !== "approved-business-decision" || !["association-portfolio", "std-underwriting", "shared-source-life-questionnaires", "combined-life-health", "mcr-processing-and-inline-attestation", "abe-source-health-questionnaires"].includes(row.predicate) || !row.value || typeof row.value !== "object" || Array.isArray(row.value) || row.value.approvalStatus !== "approved" || !Array.isArray(row.value.destinations)) return false;
    return row.value.destinations.some(destination => destination && typeof destination === "object" && !Array.isArray(destination) && destination.table === "configurationValues" && destination.key === key);
  })) return;
  if (preserveDecision && target.kind === "product-selection-policy" && db.configurationValues.some(row => row.key === key && row.value !== null && typeof row.value === "object" && !Array.isArray(row.value) && row.value.version === 2 && row.value.amountSource === "rider-amount-rules")) return;
  db.configurationDefinitions = db.configurationDefinitions.filter(r => r.key !== key);
  db.configurationValues = db.configurationValues.filter(r => r.key !== key);
  db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { provisional: true, revisit: true }, target } });
  db.configurationValues.push({ ...meta("configurationValues", key), position: 0, scope: "site", siteKey, clientKey: null, configurationKey: key, value: value as Json });
  const decisionKey = `provisional-decision.${key}`;
  // Ownership consolidation changes executable keys; retain the original decision evidence.
  if (preserveDecision && db.semanticRequirements.some(r => r.key === decisionKey)) return;
  db.semanticRequirements = db.semanticRequirements.filter(r => r.key !== decisionKey);
  if (siteKey === "demo") return;
  db.semanticRequirements.push({ ...meta("semanticRequirements", decisionKey), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: siteKey, predicate: target.kind, status: "documented", value: { authority: provisionalDecisionAuthority, revisit: true, selected: value as Json, sourceReferences, sourceReconciliation: "deferred", runtimeActivation: "pending", serviceDestination: "mock-coverage-v1", destinations: [{ table: "configurationValues", key, column: "value" }] } });
}
const range = (min: number, max: number, step: number): RiderAmount => ({ kind: "choices", values: Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step), default: min });
const lookup = new Map(mcrSource.cells.map(c => [`${c.sheet}!${c.cell}`, c.value]));
const main = (row: number | undefined, col: string) => row ? String(lookup.get(`Main!${col}${row}`) ?? "") : "";
const states = "Alabama:AL|Alaska:AK|Arizona:AZ|Arkansas:AR|California:CA|Colorado:CO|Connecticut:CT|Delaware:DE|District of Columbia:DC|Florida:FL|Georgia:GA|Hawaii:HI|Idaho:ID|Illinois:IL|Indiana:IN|Iowa:IA|Kansas:KS|Kentucky:KY|Louisiana:LA|Louisisana:LA|Maine:ME|Maryland:MD|Massachusetts:MA|Michigan:MI|Minnesota:MN|Mississippi:MS|Missouri:MO|Montana:MT|Nebraska:NE|Nevada:NV|New Hampshire:NH|New Jersey:NJ|New Mexico:NM|New York:NY|North Carolina:NC|North Dakota:ND|Ohio:OH|Oklahoma:OK|Oregon:OR|Pennsylvania:PA|Rhode Island:RI|South Carolina:SC|South Dakota:SD|Tennessee:TN|Texas:TX|Utah:UT|Vermont:VT|Virginia:VA|Washington:WA|West Virginia:WV|Wisconsin:WI|Wyoming:WY".split("|").map(pair => pair.split(":"));
/** Explicit reviewed spelling repairs; prose remains in the source register. */
function exclusions(prose: string): string[] {
  let text = prose.replaceAll("VTVA", "VT VA").replace(/\bMV\b/g, "MT").replace(/\bTE\b/g, "TN").replace(/\bYT\b/g, "UT");
  const values = new Set<string>();
  for (const [name, code] of [...states].sort((a,b) => b[0].length - a[0].length)) {
    const re = new RegExp(`\\b${name}\\b`, "gi");
    if (re.test(text)) { values.add(`US-${code}`); text = text.replace(re, " "); }
  }
  for (const word of text.match(/\b[A-Z]{2}\b/g) ?? []) if (usJurisdictions.includes(`US-${word}`)) values.add(`US-${word}`);
  return [...values].sort();
}
function billing(siteKey: string, collection: PaymentPolicy["collection"]): PaymentPolicy {
  const common = { collection, defaultMethod: "bank-account" as const, defaultFrequency: "monthly" as const, frequencyLocked: false, synchronizeAcrossProducts: true };
  if (siteKey === "csea") return { ...common, collection: "none", methods: [], defaultMethod: null, defaultFrequency: null };
  if (siteKey.startsWith("waepa")) return { ...common, methods: [{ method: "bank-account", frequencies: ["monthly"] }, { method: "credit-card", frequencies: ["monthly"] }], frequencyLocked: true };
  if (siteKey === "isitrust") return { ...common, methods: [{ method: "bank-account", frequencies: ["monthly"] }, { method: "bill-me", frequencies: ["monthly"] }], frequencyLocked: true };
  if (siteKey === "avma") return { ...common, defaultMethod: "bill-me", defaultFrequency: "semiannual", methods: ["bank-account", "bill-me"].map(method => ({ method: method as "bank-account" | "bill-me", frequencies: ["monthly", "quarterly", "semiannual"] })) };
  if (siteKey === "asce" || siteKey === "nso") return { ...common, methods: [{ method: "bank-account", frequencies: ["monthly", "quarterly", "semiannual", "annual"] }, { method: "bill-me", frequencies: siteKey === "nso" ? ["quarterly", "semiannual", "annual"] : ["monthly", "quarterly", "semiannual", "annual"] }] };
  return { ...common, methods: [{ method: "bank-account", frequencies: ["monthly"] }, { method: "bill-me", frequencies: ["quarterly", "semiannual", "annual"] }] };
}
function identifierRoles(definition: Record<string, unknown>, fallback: string): IdentifierRoles {
  const primary = typeof definition.primary === "string" && definition.primary ? definition.primary : fallback;
  return { display: primary, rating: primary, issue: primary, xml: typeof definition.xml === "string" ? definition.xml : primary, pdf: typeof definition.pdf === "string" ? definition.pdf : primary, portalDummy: typeof definition.dummy === "string" ? definition.dummy : null };
}

/** Step 3 only: candidate contracts in existing Library tables, no live adapter,
 * Builder, release, authentication, or activation changes. */
export function applyCoverageJourneyAdoption(db: DatabaseSchema) {
  for (const scope of activeSiteMigrationScope.sites) {
    for (const assignment of db.siteProducts.filter(p => p.siteId === db.sites.find(s => s.key === scope.key)!.id && p.enabled)) {
      const productKey = assignment.productKey, siteKey = scope.key;
      const row = siteKey === "csea" && productKey === "di-ltd" ? 246 : activeSiteMainRows[siteKey]?.[productKey];
      const candidateApplicants = db.siteProductApplicants.filter(a => a.siteKey === siteKey && a.productKey === productKey);
      const constraintDestinations: Array<{ table: string; key: string; column: string }> = [];
      for (const applicant of candidateApplicants) {
        let constraint = db.eligibilityConstraints.find(c => c.siteKey === siteKey && c.productKey === productKey && c.applicantTypeKey === applicant.applicantKey);
        if (!constraint) {
          const key = `${siteKey}.${productKey}.${applicant.applicantKey}.journey-eligibility`;
          constraint = { ...meta("eligibilityConstraints", key), siteKey, productKey, applicantTypeKey: applicant.applicantKey, minimumAgeDays: null, minimumAgeYears: null, maximumAgeYears: null, studentMaximumAgeYears: null, unmarried: null, minimumWorkHours: null };
          db.eligibilityConstraints.push(constraint);
        }
        if (constraint.minimumAgeYears === null && constraint.minimumAgeDays === null) { constraint.minimumAgeYears = applicant.applicantKey === "child" ? 0 : 18; constraintDestinations.push({ table: "eligibilityConstraints", key: constraint.key, column: "minimumAgeYears" }); }
        if (constraint.maximumAgeYears === null) { constraint.maximumAgeYears = applicant.applicantKey === "child" ? 25 : scope.mcrRequired ? 64 : 75; constraintDestinations.push({ table: "eligibilityConstraints", key: constraint.key, column: "maximumAgeYears" }); }
      }
      if (constraintDestinations.length && scope.mcrRequired) {
        const key = `provisional-decision.${siteKey}.${productKey}.journey-eligibility`;
        db.semanticRequirements = db.semanticRequirements.filter(r => r.key !== key);
        db.semanticRequirements.push({ ...meta("semanticRequirements", key), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: siteKey, predicate: "eligibility-fallback", status: "documented", value: { authority: provisionalDecisionAuthority, revisit: true, sourceReconciliation: "deferred", selected: { missingAdultMinimum: 18, missingAdultMaximum: 64, missingChildMinimum: 0, missingChildMaximum: 25, preserveAdoptedConstraints: true }, destinations: constraintDestinations, runtimeActivation: "pending" } });
      }
      let site = resolveEffectiveSite(db, siteKey);
      let product = site.configuration.products.find(p => p.productKey === productKey)!;
      const applicants = site.products.find(p => p.productKey === productKey)!.applicants.map(a => a.applicantKey);
      const sourceRefs = row ? ["E", "G", "L", "M", "N", "R", "S", "T", "AE", "AF", "AG", "AH", "AI"].map(col => `Main!${col}${row}`) : [];
      // Missing AVMA CIR/FPO are riders on existing products, not new products/Sites.
      const additional = product.riderOwnership === "relational" ? [] : siteKey === "avma" && productKey === "li-group-term" ? [{ id: "cir", code: "R44", name: "Chronic Illness Rider (CIR)" }] : siteKey === "avma" && productKey === "di-ltd" ? [{ id: "fpo", code: "R32", name: "Future Purchase Option (FPO)" }] : [];
      if (additional.length) {
        const keys = product.riders.map(r => r.key);
        for (const r of additional) {
          const key = `step3.${siteKey}.${productKey}.${r.id}`;
          if (!db.riders.some(row => row.key === key)) db.riders.push({ ...meta("riders", key), position: 0, definition: { id: r.id, name: r.name, description: "Source-linked candidate rider; rates unavailable.", premiumFactor: null, applicants: applicants.filter(a => a !== "child") as ("member" | "spouse")[] } });
          const link = `${key}.assignment`;
          db.productRiders = db.productRiders.filter(r => r.key !== link);
          db.productRiders.push({ ...meta("productRiders", link), scope: "site", siteKey, clientKey: null, productKey, riderKey: key, position: keys.includes(key) ? keys.indexOf(key) : keys.length });
          if (!keys.includes(key)) keys.push(key);
        }
        persist(db, siteKey, `${siteKey}.${productKey}.journey-rider-set`, { kind: "product-rider-set", productKey }, keys, sourceRefs);
        site = resolveEffectiveSite(db, siteKey); product = site.configuration.products.find(p => p.productKey === productKey)!;
      }
      const selection = structuredClone(product.selectionPolicies[0].value) as SelectionPolicy;
      for (const r of product.riders) if (!selection.riders.some(rule => rule.key === r.key)) selection.riders.push({ key: r.key, applicants: applicants.filter(a => a !== "child"), included: false, minimumBase: 0, maximumAge: null, requires: [], incompatible: [], amount: { kind: "none" }, excludedJurisdictions: [] });
      const riderCodes: Record<string, string> = {};
      for (const r of selection.riders) {
        const id = db.riders.find(d => d.key === r.key)!.definition.id;
        const code = id === "cir" ? siteKey === "asce" ? "R37" : siteKey === "avma" ? "R44" : siteKey === "abe" ? "R28" : "R34" : id === "abi" ? "R16a" : id === "fpo" ? "R32" : id === "wop" ? "R38" : id === "add" ? productKey === "li-preferred" ? "R40" : "R39" : id === "cola" ? "R4a" : id === "catastrophic" ? "R22" : id === "true-own-specialty" ? "R59" : id === "mcr.rider.r25" ? "R25" : `mock:${id}`;
        riderCodes[r.key] = code;
        r.applicants = r.applicants.filter(a => applicants.includes(a));
        if (id === "cir" && ["asce", "avma", "abe"].includes(siteKey)) {
          r.minimumAge = 17; r.maximumAge = 64; r.minimumBase = siteKey === "asce" ? 25000 : 1;
          r.excludedJurisdictions = (siteKey === "asce" ? "CT ID LA MA MN MT NC OH SD UT WA" : "CT FL ID LA MN MO MT NC OH SD TX UT WA MA" + (siteKey === "avma" ? " VA" : "")).split(" ").map(s => `US-${s}`);
          if (siteKey === "asce") { r.amount = range(50000, 1000000, 50000); r.amountByApplicant = { spouse: range(25000, 1000000, 25000) }; r.amountCap = { baseFraction: 1 }; }
        }
        if (id === "wop" && siteKey === "ama") { r.minimumAge = 17; r.maximumAge = productKey === "li-term" ? 44 : productKey === "li-preferred" ? 54 : 55; }
        if (id === "add" && siteKey === "ama") { r.minimumAge = 17; r.maximumAge = 60; r.minimumBase = 25000; r.amount = range(25000, 1000000, 25000); r.amountByApplicant = { spouse: range(25000, 1000000, 1000) }; r.amountCap = { baseFraction: 1 }; }
        if (id === "catastrophic" && siteKey === "ama") r.minimumBase = 3000;
        if (id === "fpo" && siteKey === "avma") { r.minimumAge = 17; r.maximumAge = 49; r.amount = range(100, 7000, 100); r.amountCap = { baseFraction: 1, combinedMaximum: 12500, minimumNewAmount: 500 }; }
      }
      const cirOnly = (siteKey === "asce" && productKey === "li-term") || (siteKey === "avma" && productKey === "li-group-term");
      if (cirOnly) { selection.modes = ["new", "increase", "rider-only"]; selection.riderOnlyApplicants = applicants.filter(a => a !== "child"); selection.skipPaymentForExisting = true; selection.healthForRiderOnly = true; }
      if (selection.childSchedule) {
        selection.childSchedule.primaryCoverageBasis = "member-or-spouse";
        selection.childSchedule.maximumAgeYears = 25;
        selection.revisit.push("Child schedules use each child's calendar age and 50% of the higher explicit member/spouse life amount provisionally. Spouse-only attachment supersedes the prior member-only candidate dependency for scheduled child amounts; revisit the authoritative attachment schedule.");
      }
      if (siteKey === "csea") selection.skipPaymentForExisting = true;
      selection.revisit = [...new Set([...selection.revisit, "Mock verification replaces the caller boolean at the journey boundary. Real policy lookup and effective-date/billing acceptance await integration.", "Added source-linked CIR, WOP, AD&D, CAT and AVMA FPO caps are candidate rules; unresolved rider definitions remain explicitly provisional."])];
      if (!isSelectionPolicy(selection)) throw new Error(`Invalid expanded selection ${siteKey}/${productKey}`);
      persist(db, siteKey, `${siteKey}.${productKey}.selection-policy`, { kind: "product-selection-policy", productKey }, selection, sourceRefs, product.riderOwnership === "relational");
      const methods = billing(siteKey, db.sitePages.find(row => row.siteKey === siteKey && row.pageKey === "payment")?.requirement ?? "required");
      const associationChoices = siteKey === "isitrust" ? db.siteAssociations.filter(a => a.siteKey === siteKey && a.enabled &&
        // User-confirmed Main R285/R286 restrictions; Site membership remains intact.
        (!['sh-hospital-income', 'sh-critical-illness'].includes(productKey) ||
          !['student-osteopathic-medical-association', 'national-press-club'].includes(a.associationKey))).map(a => ({ key: a.associationKey, label: db.associations.find(d => d.key === a.associationKey)!.definition.name })) : [];
      const benefit = product.benefitPolicies.length === 1 && isBenefitPolicy(product.benefitPolicies[0].value) ? product.benefitPolicies[0].value : null;
      const underwritingOverrides = site.configuration.configurations.filter(c => {
        const target = db.configurationDefinitions.find(d => d.key === c.key)?.definition.target;
        return target?.kind === "product-presentation" && target.productKey === productKey && target.property === "underwritingType";
      });
      if (underwritingOverrides.length > 1) throw new Error("Ambiguous underwriting default");
      const authoredPathway = underwritingOverrides[0]?.value ?? db.products.find(p => p.key === productKey)!.definition.underwritingType;
      const defaultUnderwritingPathway = siteKey === "waepa-gi" ? "GI" : product.catalog!.value.categoryKey === "AD" ? "NA" : ["QD", "FUW", "GI", "SI", "NA", "NCGI", "TELE"].includes(String(authoredPathway)) ? authoredPathway as CoverageJourneyPolicy["defaultUnderwritingPathway"] : "FUW";
      const policy: CoverageJourneyPolicy = {
        underwritingByApplicant: Object.fromEntries(applicants.flatMap(applicant => {
          const column = { member: 'U', spouse: 'V', child: 'W' }[applicant];
          const value = row ? mcrSource.cells.find(cell => cell.sheet === 'Main' && cell.cell === `${column}${row}`)?.value : undefined;
          return /^no$/i.test(String(value).trim()) ? [[applicant, 'NA' as const]] : [];
        })),
        version: 1, applicants, associationChoices, defaultUnderwritingPathway, membershipRequired: scope.mcrRequired, ageBasis: "age-last-birthday-on-application-date", payment: methods,
        billing: { annualFactors: siteKey === "ama" ? { annual: 1, semiannual: .52, quarterly: .265, monthly: .083 } : { annual: 1, semiannual: .5, quarterly: .25, monthly: 1 / 12 }, feePerCollection: { "bank-account": 0, "credit-card": 0, "bill-me": 0 }, annualCredit: 0, currency: "USD" },
        dependentElections: siteKey === "csea" && productKey === "di-ltd" ? [
          { key: "spouse-accident-disability", applicantKey: "spouse", defaultSelected: true, amountChoices: [500, 1000], fixedAmount: null, maximumAgeYears: null, attestation: "I elect accident disability coverage for my spouse.", signatureRequired: false, visitsPerYear: null },
          { key: "child-outpatient-accident", applicantKey: "child", defaultSelected: true, amountChoices: [], fixedAmount: 50, maximumAgeYears: 18, attestation: "My child(ren) is/are under age 19 as of the date of this application.", signatureRequired: false, visitsPerYear: 2 },
        ] : [],
        questions: applicants.flatMap(applicantKey => selection.modes.map(mode => {
          const category = product.catalog!.value.categoryKey;
          const prefix = applicantKey === "spouse" ? "spouse-" : "";
          const financialFields = applicantKey === "child" ? [] : ["DI", "OO"].includes(category) ? category === "OO" ? ["monthly-business-expenses", "business-expense-responsibility", "hours-worked-per-week"] : [`${prefix}average-monthly-income`, `${prefix}hours-worked-per-week`] : [];
          const tobaccoFields = applicantKey === "child" || !["LI", "SH"].includes(category) ? [] : [`${prefix}smoker`, `${prefix}tobacco-last-used`, `${prefix}tobacco-products`];
          const authored = defaultUnderwritingPathway;
          const healthPage = applicantKey === "child" || category === "AD" || ["GI", "NA", "NCGI"].includes(authored) ? null : mode === "rider-only" && selection.healthForRiderOnly ? "health-li" : authored === "QD" ? "health-qd" : authored === "SI" ? "health-si" : category === "DI" || category === "OO" ? "health-di" : "health-li";
          return { applicantKey, modes: [mode], healthPage, financialFields, tobaccoFields, attestationKey: `${siteKey}.${productKey}.${applicantKey}.${mode}.attestation`, attestationText: "Provisional mock attestation: I confirm the information supplied for this application is accurate. Replace with the approved product attestation before publication." };
        })), mappings: [], provisional: scope.mcrRequired,
        revisit: ["Use current ISI association list, all enabled plans for each association and common identifiers provisionally. ATPE is not enabled; no ATPE exception is silently applied.", "Membership is an explicit applicant declaration for candidate acceptance, not a verified external membership service. Age is last birthday on application date; revisit source-specific age conventions.", "Reuse current health fields without adding medical rejection criteria. Health pathway, financial/tobacco triggers and synthetic attestation require current product-specific question/document review.", "PRASE unavailable remains a null premium. Non-AMA modal factors use pro rata annual fractions, fees and credits are zero; WAEPA card conflict uses the agreed mock card option. Existing billing remains unchanged only after policy verification.", "Submission is a mock-coverage-v1 role mapping, not insurer XML/PDF service certification. Unspecified roles use the primary identifier provisionally; portal dummy identifiers never enter issue/rating/XML/PDF by default."] };
      for (const applicantKey of applicants) for (const mode of selection.modes.filter(m => m !== "rider-only" || selection.riderOnlyApplicants.includes(applicantKey))) {
        const identifierClasses = product.identifiers.flatMap(i => {
          const d = i.value.definition;
          if (!d || typeof d !== "object" || Array.isArray(d) || !Array.isArray(d.scoped)) return [];
          return d.scoped.flatMap(v => {
            if (!v || typeof v !== "object" || Array.isArray(v) || !v.scope || typeof v.scope !== "object" || Array.isArray(v.scope)) return [];
            return (!v.scope.applicantType || v.scope.applicantType === applicantKey) && typeof v.scope.applicantClassId === "string" ? [v.scope.applicantClassId] : [];
          });
        });
        const classes = [...new Set([undefined, ...identifierClasses, ...product.amounts.filter(a => !a.value.applicantTypeKey || a.value.applicantTypeKey === applicantKey).map(a => a.value.applicantClass).filter((v): v is string => !!v), ...(benefit?.applicants.filter(a => a.applicantKey === applicantKey).map(a => a.applicantClass).filter((v): v is string => !!v) ?? [])])];
        for (const applicantClass of classes) {
          const b = benefit?.applicants.find(a => a.applicantKey === applicantKey && a.applicantClass === applicantClass) ?? benefit?.applicants.find(a => a.applicantKey === applicantKey && a.applicantClass === undefined);
          if (benefit && !b) continue;
          const periods = b ? b.periodPairs ?? b.waitingPeriods.flatMap(w => b.benefitPeriods.map(benefitPeriod => ({ waitingKey: w.key, benefitPeriod }))) : [];
          for (const period of periods.length ? periods : [undefined]) for (const associationKey of associationChoices.length ? associationChoices.map(a => a.key) : [undefined]) {
            const when: MappingDimensions = { applicantKey, mode, ...(applicantClass ? { applicantClass } : {}), ...(associationKey ? { associationKey } : {}), ...(period ? { waitingPeriod: period.waitingKey, benefitPeriod: period.benefitPeriod } : {}) };
            const resolve = (kind: "gNumber" | "planCode") => {
              const rows = product.identifiers.filter(i => i.value.kind === kind);
              const rank = { global: 0, client: 1, site: 2 };
              const selected = rows.sort((a,b) => rank[a.value.scope] - rank[b.value.scope]).at(-1)?.value.definition;
              const definition: Record<string, unknown> = selected && typeof selected === "object" && !Array.isArray(selected) ? { ...selected } : {};
              const variants = Array.isArray(definition.scoped) ? definition.scoped as Array<{ scope?: { applicantType?: string; applicantClassId?: string }; value: Record<string, unknown> }> : [];
              const matching = variants.filter(v => (!v.scope?.applicantType || v.scope.applicantType === applicantKey) && (!v.scope?.applicantClassId || v.scope.applicantClassId === applicantClass)).sort((a,b) => Object.keys(a.scope ?? {}).length - Object.keys(b.scope ?? {}).length);
              if (matching.length > 1 && Object.keys(matching.at(-1)!.scope ?? {}).length === Object.keys(matching.at(-2)!.scope ?? {}).length) throw new Error("Ambiguous conditional identifier");
              Object.assign(definition, matching.at(-1)?.value ?? {});
              const g = main(row, "E").match(/G-\d+-\d+/g) ?? [];
              const sourcePrimary = kind === "gNumber" ? g[0] : main(row,"G").match(/^\d+(?:-[a-z])?/)?.[0];
              const result = identifierRoles(definition, sourcePrimary ?? `mock:${siteKey}:${productKey}:${kind}`);
              if (g.length > 1 && kind === "gNumber") { result.display = g[1]; result.portalDummy = g[1]; result.rating = result.issue = result.xml = result.pdf = g[0]!; }
              // Multiline sources skipped by scalar adoption carry the exact source plan.
              if (kind === "planCode" && sourcePrimary && !rows.some(r => r.value.scope === "site")) result.display = result.rating = result.issue = result.xml = result.pdf = sourcePrimary;
              return result;
            };
            policy.mappings.push({ when, identifiers: { gNumber: resolve("gNumber"), planCode: resolve("planCode") }, riderCodes });
          }
        }
      }
      if (!isCoverageJourneyPolicy(policy)) throw new Error(`Invalid journey ${siteKey}/${productKey}`);
      persist(db, siteKey, `${siteKey}.${productKey}.journey-policy`, { kind: "product-journey-policy", productKey }, policy, sourceRefs, product.riderOwnership === "relational");
      if (!product.residencyPolicies.length) {
        // Main M cells list restricted locations; missing overseas/territory
        // dimensions use an explicit mainland-US working choice.
        const excluded = exclusions(main(row, "N").split("(Association of Texas")[0].split("For spouse only:")[0]);
        const residency: ResidencyPolicy = { version: 1, ...(siteKey === "asce" && productKey === "di-ltd" ? { applicantExcludedJurisdictions: { spouse: ["US-NH"] } } : {}), allowedJurisdictions: usJurisdictions.filter(code => !["AS", "GU", "MP", "PR", "VI", "AA", "AE", "AP"].includes(code.slice(3)) && !excluded.includes(code)), excludeActiveMilitary: false, provisional: scope.mcrRequired, revisit: ["Mainland US plus DC only provisionally; Canadian/territory/foreign address behavior needs source review. Main N exclusions parsed after explicit spelling repairs: VTVA → VT/VA, MV → MT, TE → TN, YT → UT, Louisisana → Louisiana. Revisit those repairs.", "ASCE spouse-only NH restriction is persisted in applicantExcludedJurisdictions; no source country or military status is inferred."] };
        persist(db, siteKey, `${siteKey}.${productKey}.journey-residency`, { kind: "product-residency-policy", productKey }, residency, sourceRefs);
      }
    }
  }
}
