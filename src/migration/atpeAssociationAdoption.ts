import { isAssociationAmountPolicy } from "../domain/associationAmountPolicy";
import type { ConfigurationTarget, DatabaseSchema, Json } from "../persistence/types";
import type { CoverageApplicantId } from "../domain/coverage";
import type { AssociationEligibilityPolicy } from "../domain/associationEligibilityPolicy";
import type { AssociationUnderwriting } from "../domain/associationUnderwriting";
import { isDependentPolicy } from "../domain/dependentPolicy";
import { libraryMetadata } from "../domain/provenance";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { isResidencyPolicy, usJurisdictions } from "../domain/residencyPolicy";
import { currentMcrSource } from "./currentMcr";

export const atpeAssociationKey = "association-of-texas-professional-educators";
export const atpePortfolioDecisionKey = "business-decision.rules-review.atpe-portfolio";
export const atpeProducts = [
  { row: 179, productKey: "li-group-term", excluded: "FL MT NV VT" },
  { row: 180, productKey: "li-10yr", excluded: "AK CO FL ID KY LA MD MN MS MO MT NV NH NM NY NC ND OH OR SC SD TN TX UT VT WA" },
  { row: 181, productKey: "li-20yr", excluded: "AK CO FL ID LA MD MN MS MO MT NV NH NM NY NC ND OH OR SC SD TN TX UT VT WA" },
  { row: 182, productKey: "li-add", excluded: "AR DE KY MN MO NC CT FL IL MT NH NM NY LA ME MD MS VA WV OH SC TX UT VT WA WY ND WI OR SD AK CO ID NV TN KS" },
  { row: 183, productKey: "sh-hospital-income", excluded: "AK CO FL ID LA ME MN MS MO MT NV NH NM NY NC ND OH OR SC SD TN UT VT WA" },
  { row: 184, productKey: "sh-critical-illness", excluded: "AK AR AZ CA CO CT FL GA ID KY LA ME MD MN MS MO MT NV NH NM NY NC ND OH OR SC SD TN TX UT VT VA WA WI WY" },
  { row: 185, productKey: "li-50plus", excluded: "AK AZ CO CT DE FL HI ID IL IN IA KY LA ME MD MA MI MN MS MT NV NH NM NY NC ND OH OR PA RI SC SD TX UT VT WA WV WI WY" },
] as const;
type AmountSelection = { minimum: number; maximum: number; increment: number } | readonly number[];
const range = (minimum: number, maximum: number, increment: number): AmountSelection => ({ minimum, maximum, increment });
export const atpeAmountSelections: Array<{ productKey: string; row: number; amounts: Partial<Record<CoverageApplicantId, AmountSelection>> }> = [
  { productKey: "li-group-term", row: 179, amounts: { member: range(50000, 1500000, 50000), spouse: range(50000, 500000, 50000), child: [5000, 10000] } },
  { productKey: "li-10yr", row: 180, amounts: { member: range(10000, 1000000, 10000), spouse: range(10000, 500000, 5000) } },
  { productKey: "li-20yr", row: 181, amounts: { member: range(10000, 1000000, 10000), spouse: range(10000, 500000, 5000) } },
  { productKey: "li-add", row: 182, amounts: { member: range(25000, 750000, 25000) } },
  { productKey: "sh-hospital-income", row: 183, amounts: { member: [100, 200, 300, 400], spouse: [100, 200, 300, 400], child: [100, 200, 300, 400] } },
  { productKey: "sh-critical-illness", row: 184, amounts: { member: range(5000, 100000, 5000), spouse: range(5000, 100000, 5000) } },
  { productKey: "li-50plus", row: 185, amounts: { member: range(5000, 50000, 5000), spouse: range(5000, 50000, 5000) } },
];
export const atpeEligibilitySelections: Array<{ productKey: string; row: number; rules: AssociationEligibilityPolicy["rules"] }> = [
  ...["li-10yr", "li-20yr"].map((productKey, index) => ({ productKey, row: 180 + index, rules: [
    ...(["member", "spouse"] as const).map(applicantKey => ({ associationKey: atpeAssociationKey, applicantKey, eligible: true, minimumAgeYears: 20, maximumAgeYears: 54, ageBounds: "replace" as const })),
    { associationKey: atpeAssociationKey, applicantKey: "child" as const, eligible: false },
  ] })),
  ...[{ productKey: "li-group-term", row: 179 }, { productKey: "li-add", row: 182 }, { productKey: "sh-hospital-income", row: 183 }, { productKey: "sh-critical-illness", row: 184 }].map(slice => ({ ...slice, rules: [
    ...(["member", "spouse"] as const).map(applicantKey => ({ associationKey: atpeAssociationKey, applicantKey, eligible: true, minimumAgeYears: 18, maximumAgeYears: 64, ageBounds: "replace" as const })),
    ...([179, 183].includes(slice.row) ? [{ associationKey: atpeAssociationKey, applicantKey: "child" as const, eligible: true, minimumAgeDays: 0, minimumAgeYears: 0, maximumAgeYears: 25, ageBounds: "replace" as const, unmarried: true }] : slice.row === 182 ? [{ associationKey: atpeAssociationKey, applicantKey: "child" as const, eligible: true, minimumAgeYears: 0, maximumAgeYears: 19, studentMaximumAgeYears: 26, ageBounds: "replace" as const }] : []),
  ] })),
  { productKey: "li-50plus", row: 185, rules: (["member", "spouse"] as const).map(applicantKey => ({ associationKey: atpeAssociationKey, applicantKey, eligible: true, minimumAgeYears: 18, maximumAgeYears: 64, ageBounds: "replace" as const })) },
];
export const atpeUnderwritingSelections: Array<{ productKey: string; row: number; rules: AssociationUnderwriting[] }> = [
  { productKey: "li-group-term", row: 179, rules: [
    ...(["member", "spouse"] as const).map(applicantKey => ({ associationKey: atpeAssociationKey, applicantKey, bands: [
      ...([{ minimumAgeYears: 18, maximumAgeYears: 49, maximumAmount: 250000 }, { minimumAgeYears: 50, maximumAgeYears: 59, maximumAmount: 150000 }]).flatMap(band => [
        { ...band, pathway: "SI" as const, healthPage: "health-si" as const },
        { minimumAgeYears: band.minimumAgeYears, maximumAgeYears: band.maximumAgeYears, minimumAmount: band.maximumAmount, minimumAmountExclusive: true, pathway: applicantKey === "member" ? "QD" as const : "FUW" as const, healthPage: "health-li" as const },
      ]),
      { minimumAgeYears: 60, maximumAgeYears: 64, pathway: applicantKey === "member" ? "QD" as const : "FUW" as const, healthPage: "health-li" as const },
    ] })),
    { associationKey: atpeAssociationKey, applicantKey: "child", bands: [{ minimumAgeYears: 0, maximumAgeYears: 25, pathway: "NA", healthPage: null }] },
  ] },
  ...([{ productKey: "li-10yr", row: 180, minimumAgeYears: 20, maximumAgeYears: 54, pathway: "QD" as const, healthPage: "health-li" as const }, { productKey: "li-20yr", row: 181, minimumAgeYears: 20, maximumAgeYears: 54, pathway: "QD" as const, healthPage: "health-li" as const }, { productKey: "sh-critical-illness", row: 184, minimumAgeYears: 18, maximumAgeYears: 64, pathway: "FUW" as const, healthPage: "health-li" as const }, { productKey: "li-50plus", row: 185, minimumAgeYears: 18, maximumAgeYears: 64, pathway: "GI" as const, healthPage: null }]).map(({ productKey, row, ...band }) => ({ productKey, row, rules: (["member", "spouse"] as const).map(applicantKey => ({ associationKey: atpeAssociationKey, applicantKey, bands: [band] })) })),
  ...([{ productKey: "li-add", row: 182 }, { productKey: "sh-hospital-income", row: 183 }]).map(slice => ({ ...slice, rules: (["member", "spouse", "child"] as const).map(applicantKey => ({ associationKey: atpeAssociationKey, applicantKey, bands: [{ minimumAgeYears: applicantKey === "child" ? 0 : 18, maximumAgeYears: applicantKey === "child" ? slice.row === 182 ? 26 : 25 : 64, pathway: "GI" as const, healthPage: null }] })) })),
];
const reference = "User approval October 20, 2026: add ATPE to ISITRUST with all seven ATPE products; Group Term uses current Main!N179";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
const countryScope = usJurisdictions.filter(code => !["AS", "GU", "MP", "PR", "VI", "AA", "AE", "AP"].includes(code.slice(3)));

/** Reuse dedicated journey/residency contracts. This pass adopts membership,
 * the seven-product portfolio, identifier roles and explicit residency lists;
 * it does not certify the other ATPE benefit/age/health/rating instructions. */
export function applyAtpeAssociationAdoption(db: DatabaseSchema) {
  const cells = new Map(currentMcrSource.cells.filter(cell => cell.sheet === "Main").map(cell => [cell.cell, cell.value]));
  const targetFor = (productKey: string, kind: "product-journey-policy" | "product-residency-policy"): ConfigurationTarget => ({ kind, productKey });
  const sharedDefinition = (productKey: string, kind: "product-journey-policy" | "product-residency-policy") => `shared.${productKey}.${kind === "product-journey-policy" ? "journey-policy" : "residency-policy"}`;
  const ownerRows = db.configurationValues.filter(row => row.siteKey === "isitrust" && db.configurationDefinitions.some(definition => definition.key === row.configurationKey && definition.definition.target?.kind === "product-journey-policy"));
  for (const value of ownerRows) {
    if (!isCoverageJourneyPolicy(value.value)) throw new Error(`Invalid ATPE journey owner: ${value.key}`);
    const target = db.configurationDefinitions.find(row => row.key === value.configurationKey)!.definition.target!;
    if (!("productKey" in target)) throw new Error("Missing ATPE product scope");
    const shared = db.configurationDefinitions.find(row => row.key === sharedDefinition(target.productKey, "product-journey-policy"));
    if (shared && JSON.stringify(shared.definition.target) !== JSON.stringify(targetFor(target.productKey, "product-journey-policy"))) throw new Error("Conflicting shared journey definition");
  }
  for (const slice of atpeProducts) {
    if (cells.get(`B${slice.row}`) !== "ATPE" || !/^G-\d+-\d+$/.test(String(cells.get(`E${slice.row}`))) || !/^\d+$/.test(String(cells.get(`G${slice.row}`)))) throw new Error(`ATPE product source changed: Main!${slice.row}`);
    if (!ownerRows.some(row => row.key === `isitrust.${slice.productKey}.journey-policy`)) throw new Error(`Missing ATPE journey assignment: ${slice.productKey}`);
    const residency = db.configurationValues.find(row => row.key === `isitrust.${slice.productKey}.journey-residency`);
    if (!residency || !isResidencyPolicy(residency.value)) throw new Error(`Missing ATPE residency assignment: ${slice.productKey}`);
  }
  function assignSharedDefinition(row: DatabaseSchema["configurationValues"][number], productKey: string, kind: "product-journey-policy" | "product-residency-policy") {
    const key = sharedDefinition(productKey, kind), previous = row.configurationKey;
    if (!db.configurationDefinitions.some(definition => definition.key === key)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: targetFor(productKey, kind) } });
    row.configurationKey = key;
    if (previous !== key && !db.configurationValues.some(value => value.configurationKey === previous)) db.configurationDefinitions = db.configurationDefinitions.filter(definition => definition.key !== previous);
  }
  if (!db.associations.some(row => row.key === atpeAssociationKey)) db.associations.push({ ...meta("associations", atpeAssociationKey), clientKey: "isitrust", position: db.associations.filter(row => row.clientKey === "isitrust").length,
    definition: { name: "Association of Texas Professional Educators", acronym: "ATPE" } });
  const linkKey = `isitrust--${atpeAssociationKey}`;
  if (!db.siteAssociations.some(row => row.key === linkKey)) db.siteAssociations.push({ ...meta("siteAssociations", linkKey), siteKey: "isitrust", associationKey: atpeAssociationKey, enabled: true, position: Math.max(...db.siteAssociations.filter(row => row.siteKey === "isitrust").map(row => row.position)) + 1 });
  for (const row of ownerRows) {
    if (!isCoverageJourneyPolicy(row.value)) throw new Error("Invalid journey policy");
    const productKey = (db.configurationDefinitions.find(definition => definition.key === row.configurationKey)!.definition.target as { productKey: string }).productKey;
    const slice = atpeProducts.find(slice => slice.productKey === productKey);
    const policy = structuredClone(row.value);
    if (productKey === "li-50plus") policy.associationDisplayNames = { ...policy.associationDisplayNames, [atpeAssociationKey]: "Graded Benefit Life" };
    const underwriting = atpeUnderwritingSelections.find(slice => slice.productKey === productKey);
    if (underwriting) {
      const previous = policy.associationUnderwriting ?? [];
      policy.associationUnderwriting = [
        ...previous.flatMap(rule => rule.associationKey !== atpeAssociationKey ? [rule] : underwriting.rules.filter(replacement => replacement.applicantKey === rule.applicantKey)),
        ...underwriting.rules.filter(rule => !previous.some(old => old.associationKey === atpeAssociationKey && old.applicantKey === rule.applicantKey)),
      ];
    }
    policy.associationChoices = policy.associationChoices.filter(choice => choice.key !== atpeAssociationKey);
    policy.mappings = policy.mappings.filter(mapping => mapping.when.associationKey !== atpeAssociationKey);
    if (slice) {
      policy.associationChoices.push({ key: atpeAssociationKey, label: "Association of Texas Professional Educators" });
      for (const mapping of policy.mappings.filter(mapping => mapping.when.associationKey === "akron-bar-association")) {
        if (atpeEligibilitySelections.find(rule => rule.productKey === productKey)?.rules.some(rule => rule.applicantKey === mapping.when.applicantKey && !rule.eligible)) continue;
        const additional = structuredClone(mapping);
        additional.when.associationKey = atpeAssociationKey;
        for (const kind of ["gNumber", "planCode"] as const) {
          const primary = String(cells.get(`${kind === "gNumber" ? "E" : "G"}${slice.row}`));
          additional.identifiers[kind] = { display: primary, rating: primary, issue: primary, xml: primary, pdf: primary, portalDummy: null };
        }
        policy.mappings.push(additional);
      }
      const residency = db.configurationValues.find(row => row.key === `isitrust.${productKey}.journey-residency`)!;
      if (!isResidencyPolicy(residency.value)) throw new Error("Invalid residency policy");
      const exclusions = new Set(slice.excluded.split(" ").map(code => `US-${code}`));
      residency.value = { ...residency.value, associationAllowedJurisdictions: { ...residency.value.associationAllowedJurisdictions, [atpeAssociationKey]: countryScope.filter(code => !exclusions.has(code)) } } as unknown as Json;
      if (!residency.sourceReference?.includes(`${currentMcrSource.workbook}#Main!N${slice.row}`)) residency.sourceReference = `${residency.sourceReference}; ${currentMcrSource.workbook}#Main!N${slice.row}; ${reference}`;
      assignSharedDefinition(residency, productKey, "product-residency-policy");
    }
    policy.revisit = policy.revisit.filter(note => !note.includes("ATPE is not enabled") && !note.startsWith("ATPE is explicitly") && !note.startsWith("ATPE has explicit"));
    policy.revisit.push("ATPE has explicit portfolio, residency, identifier, age, amount and health-flow assignments from Main!179:185 and user decisions. Detailed question wording, collection, rating and other source instructions retain their separate review dispositions. ATPE 20-Year uses approved QD processing for all permitted amounts based on QD LI row 79; its earlier provisional FUW choice is superseded. Core/Expanded QD distinctions remain source evidence.");
    row.value = policy as unknown as Json;
    assignSharedDefinition(row, productKey, "product-journey-policy");
  }
  // Explicit Association ages replace only base age bounds.
  for (const { productKey, row: sourceRow, rules } of atpeEligibilitySelections) {
    const definitionKey = `shared.${productKey}.association-eligibility`;
    const key = `isitrust.${productKey}.association-eligibility`;
    if (!db.configurationDefinitions.some(row => row.key === definitionKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", definitionKey), position: 0,
      definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "product-association-eligibility", productKey } } });
    const existing = db.configurationValues.find(row => row.key === key)?.value as unknown as { rules?: typeof rules } | undefined;
    const value = { version: 1, rules: [...rules, ...(existing?.rules ?? []).filter(rule => rule.associationKey !== atpeAssociationKey)] };
    const record = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "isitrust", clientKey: null, configurationKey: definitionKey, value: value as unknown as Json, sourceReference: `Main!${sourceRow === 180 ? "R180/S180" : `O${sourceRow}/P${sourceRow}/Q${sourceRow}/T${sourceRow}`}; Main!J${sourceRow}; ${reference}` };
    const index = db.configurationValues.findIndex(row => row.key === key);
    if (index < 0) db.configurationValues.push(record); else db.configurationValues[index] = record;
  }
  for (const slice of atpeAmountSelections) {
    const assignments = Object.entries(slice.amounts).map(([applicantKey, selection]) => {
      const band = !Array.isArray(selection) ? selection as { minimum: number; maximum: number; increment: number } : null;
      const choices = Array.isArray(selection) ? selection : [];
      const amountPatternKey = band ? `shared.range.${band.minimum}-${band.maximum}-by-${band.increment}` : `shared.choices.${choices.join("-")}`;
      if (!db.coverageAmountPatterns.some(row => row.key === amountPatternKey)) {
        db.coverageAmountPatterns.push({ ...meta("coverageAmountPatterns", amountPatternKey), patternKey: "coverage-amount-options", amountType: band ? "range" : "set", minimum: null, maximum: null, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
        if (band) db.amountBands.push({ ...meta("amountBands", `${amountPatternKey}.band`), amountPatternKey, ...band, conditionKey: null, position: 0 });
        else choices.forEach((value, position) => db.amountOptions.push({ ...meta("amountOptions", `${amountPatternKey}.${position}`), amountPatternKey, value: String(value), label: String(value), position }));
      }
      return { applicantKey, amountPatternKey };
    });
    const definitionKey = `shared.${slice.productKey}.association-amounts`, key = `isitrust.${slice.productKey}.atpe-amounts`;
    if (!db.configurationDefinitions.some(row => row.key === definitionKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", definitionKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "product-association-amounts", productKey: slice.productKey } } });
    const record = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "isitrust", clientKey: null, configurationKey: definitionKey,
      value: { version: 1, associationKey: atpeAssociationKey, amounts: assignments } as unknown as Json, sourceReference: `Main!H${slice.row}/I${slice.row}/J${slice.row}; ${reference}` };
    const index = db.configurationValues.findIndex(row => row.key === key);
    if (index < 0) db.configurationValues.push(record); else db.configurationValues[index] = record;
  }
  const dependent = db.configurationValues.find(row => row.key === "isitrust.li-group-term.reviewed-dependent-policy")!;
  if (!isDependentPolicy(dependent.value)) throw new Error("Missing Group Term dependent policy");
  const dependentDefinition = "shared.li-group-term.dependent-policy", previousDependentDefinition = dependent.configurationKey;
  if (!db.configurationDefinitions.some(row => row.key === dependentDefinition)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", dependentDefinition), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "product-dependent-policy", productKey: "li-group-term" } } });
  dependent.configurationKey = dependentDefinition;
  if (previousDependentDefinition !== dependentDefinition && !db.configurationValues.some(row => row.configurationKey === previousDependentDefinition)) db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== previousDependentDefinition);
  dependent.value = { ...dependent.value, associationRules: { ...dependent.value.associationRules, [atpeAssociationKey]: [{ applicantKey: "spouse", memberCapMultiplier: 0.5, capBehavior: "notice", noticeContentKey: "dependent.spouse-half-member-advisory" }] } } as unknown as Json;
  const noticeKey = "dependent.spouse-half-member-advisory";
  if (!db.contentEntries.some(row => row.key === noticeKey)) db.contentEntries.push({ ...meta("contentEntries", noticeKey), position: 0, definition: { path: null } });
  const noticeValueKey = `isitrust.${noticeKey}`;
  if (!db.contentValues.some(row => row.key === noticeValueKey)) db.contentValues.push({ ...meta("contentValues", noticeValueKey), position: 0, scope: "site", siteKey: "isitrust", clientKey: null, contentKey: noticeKey,
    value: "Spouse coverage should not exceed 50% of member coverage. This is an advisory comparison and does not prevent applying for an amount within the available range." });
  const amountPatternKey = "shared.range.10000-500000-by-5000", amountKey = "isitrust.li-10yr.atpe-amounts";
  const decisionKey = "business-decision.rules-review.atpe-ten-year-eligibility";
  const approval = { ...meta("semanticRequirements", decisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "association-age-and-spouse-amount", status: "documented",
    value: { authority: "User approval October 20, 2026: ATPE ages 20–54; $500,000 spouse maximum; advisory spouse-to-member comparison", approvalStatus: "approved", scope: ["isitrust"], productKeys: ["li-10yr"], sourceReferences: ["Main!R180", "Main!S180", "Main!I180"],
      selected: { associationKey: atpeAssociationKey, minimumAgeYears: 20, maximumAgeYears: 54, spouseMaximum: 500000, spouseToMemberComparison: "advisory", conflictingMillionDollarSpouseText: "superseded" },
      destinations: [{ table: "configurationValues", key: "isitrust.li-10yr.association-eligibility", column: "value" }, { table: "configurationValues", key: amountKey, column: "value" }, { table: "amountBands", key: `${amountPatternKey}.band` }, { table: "configurationValues", key: "isitrust.li-10yr.reviewed-dependent-policy", column: "value" }], runtimeActivation: "reviewed-seed" } as unknown as Json };
  const approvalIndex = db.semanticRequirements.findIndex(row => row.key === decisionKey);
  if (approvalIndex < 0) db.semanticRequirements.push(approval); else db.semanticRequirements[approvalIndex] = approval;
  const detailsKey = "business-decision.rules-review.atpe-age-name-and-underwriting";
  const details = { ...meta("semanticRequirements", detailsKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "association-age-name-and-underwriting", status: "documented", value: {
    authority: "User decisions October 20, 2026: AD&D children through 19 or 26 for full-time students; Graded Benefit Life ages 18–64 and ATPE label; Group Term SI thresholds and distinct longer-flow outcomes; 10-Year and 20-Year QD with full source Life questions; 20-Year QD LI row 79 supersedes the earlier provisional FUW selection",
    approvalStatus: "approved", scope: ["isitrust"], associationKey: atpeAssociationKey, sourceReconciliation: "approved", runtimeActivation: "reviewed-seed",
    selected: { eligibility: atpeEligibilitySelections.filter(slice => [182, 185].includes(slice.row)), underwriting: atpeUnderwritingSelections, displayName: "Graded Benefit Life", twentyYearQuickDecisionFlag: { disposition: "approved", selected: "QD", sourceReferences: ["QD LI!J79", "QD LI!K79", "QD LI!O79", "QD LI!P79"], sourceBands: { coreThrough: 500000, expandedAbove: 500000, ageRange: [20, 54] }, previous: { selected: "FUW", disposition: "superseded-user-approved-provisional" } } },
    sourceReferences: ["Main!Q182", "Main!T182", "Main!D185", "Main!O185", "Main!P185", "Main!H179", "Main!I179", "Main!Z180", "Main!AA180", "Main!Z181", "QD LI!J79", "QD LI!K79", "QD LI!O79", "QD LI!P79"],
    destinations: [...atpeUnderwritingSelections.map(slice => ({ table: "configurationValues", key: `isitrust.${slice.productKey}.journey-policy`, column: "value" })), ...atpeEligibilitySelections.filter(slice => [182, 185].includes(slice.row)).map(slice => ({ table: "configurationValues", key: `isitrust.${slice.productKey}.association-eligibility`, column: "value" }))],
  } as unknown as Json };
  const detailsIndex = db.semanticRequirements.findIndex(row => row.key === detailsKey);
  if (detailsIndex < 0) db.semanticRequirements.push(details); else db.semanticRequirements[detailsIndex] = details;
  const destinations = [{ table: "associations", key: atpeAssociationKey }, { table: "siteAssociations", key: linkKey }, ...ownerRows.map(row => ({ table: "configurationValues", key: row.key, column: "value" })), ...atpeProducts.map(slice => ({ table: "configurationValues", key: `isitrust.${slice.productKey}.journey-residency`, column: "value" }))];
  const portfolio = { ...meta("semanticRequirements", atpePortfolioDecisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "association-portfolio", status: "documented",
    value: { authority: reference, approvalStatus: "approved", scope: ["isitrust"], productKeys: atpeProducts.map(row => row.productKey), sourceReferences: atpeProducts.flatMap(slice => ["B", "E", "G", "N"].map(column => `Main!${column}${slice.row}`)), selected: { associationKey: atpeAssociationKey, productKeys: atpeProducts.map(row => row.productKey), groupTermExclusions: ["US-FL", "US-MT", "US-NV", "US-VT"], historicalTenStateException: "superseded-by-current-ATPE-N179", otherBehaviorReview: "pending" }, destinations, runtimeActivation: "reviewed-seed" } as unknown as Json };
  const portfolioIndex = db.semanticRequirements.findIndex(row => row.key === atpePortfolioDecisionKey);
  if (portfolioIndex < 0) db.semanticRequirements.push(portfolio); else db.semanticRequirements[portfolioIndex] = portfolio;
  const reviewedPatterns = new Set(db.configurationValues.filter(row => row.siteKey === "isitrust" && row.key.endsWith(".atpe-amounts") && isAssociationAmountPolicy(row.value)).flatMap(row => isAssociationAmountPolicy(row.value) ? row.value.amounts.map(amount => amount.amountPatternKey) : []));
  const reviewedOwners: Array<{ table: string; key: string; column?: string }> = [
    ...atpeProducts.flatMap(slice => ["journey-policy", "journey-residency", "atpe-amounts"].map(suffix => ({ table: "configurationValues", key: `isitrust.${slice.productKey}.${suffix}`, column: "value" }))),
    ...atpeEligibilitySelections.map(slice => ({ table: "configurationValues", key: `isitrust.${slice.productKey}.association-eligibility`, column: "value" })),
    { table: "configurationValues", key: dependent.key, column: "value" }, { table: "contentValues", key: noticeValueKey, column: "value" },
    ...db.amountBands.filter(row => reviewedPatterns.has(row.amountPatternKey)).map(row => ({ table: "amountBands", key: row.key })),
    ...db.coverageAmountPatterns.filter(row => reviewedPatterns.has(row.key)).map(row => ({ table: "coverageAmountPatterns", key: row.key })),
    ...db.amountOptions.filter(row => reviewedPatterns.has(row.amountPatternKey)).map(row => ({ table: "amountOptions", key: row.key })),
  ];
  const owners = reviewedOwners.map(owner => {
    const record = (db[owner.table as keyof DatabaseSchema] as Array<{ key: string } & Record<string, unknown>>).find(row => row.key === owner.key)!;
    return { ...owner, reviewedValue: owner.column ? record[owner.column] : record };
  });
  const reviewKey = "business-decision.rules-review.atpe-native-owners";
  const review = { ...meta("semanticRequirements", reviewKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "reviewed-association-native-owners", status: "documented", value: { authority: reference, approvalStatus: "approved", runtimeActivation: "reviewed-seed", sourceReconciliation: "approved", owners } as unknown as Json };
  const reviewIndex = db.semanticRequirements.findIndex(row => row.key === reviewKey);
  if (reviewIndex < 0) db.semanticRequirements.push(review); else db.semanticRequirements[reviewIndex] = review;
}
