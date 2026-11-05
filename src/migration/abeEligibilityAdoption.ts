import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
import type { FieldCollectionDefinition } from "../domain/fieldCollections";

export const abeEligibilityDecisionKey = "business-decision.rules-review.abe-eligibility-ages";
/** Explicit ABE approval of qualified source cells; no change to the strict general parser. */
export function applyAbeEligibilityAdoption(db: DatabaseSchema) {
  const authority = "User decision October 21, 2026: adopt later effective ABE adult Life ages and workbook dependent ages, including Hospital Money's honorable-discharge extension; retain DI spouse 30-hour minimum; child unmarried requirement is a note without a question";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const refs: string[] = [];
  const owners: Array<{ table: keyof DatabaseSchema; key: string; reviewedValue: unknown }> = [];
  const source = (cell: string, expected: string) => {
    const actual = currentMcrSource.cells.find(row => row.sheet === "Main" && row.cell === cell);
    if (actual?.value !== expected) throw new Error(`ABE eligibility source changed: Main!${cell}`);
    refs.push(`Main!${cell}`);
  };
  const update = (productKey: string, applicant: string, values: Partial<DatabaseSchema["eligibilityConstraints"][number]>) => {
    const rows = db.eligibilityConstraints.filter(row => row.siteKey === "abe" && row.productKey === productKey && row.applicantTypeKey === applicant);
    if (rows.length !== 1) throw new Error(`Missing unique ABE eligibility owner: ${productKey}/${applicant}`);
    Object.assign(rows[0], values);
    const productRows: Record<string, number> = { "li-term": 39, "li-10yr": 40, "li-20yr": 41, "li-add": 43, "di-ltd-plus": 44, "di-ltd": 45, "di-mtd": 46, "sh-hospital-money": 49 };
    const row = productRows[productKey];
    const exact = applicant === "child" ? [`Main!Q${row}`, `Main!T${row}`] : productKey.startsWith("di-") ? [`Main!S${row}`] : [`Main!${applicant === "member" ? "O" : "P"}${row}`];
    const note = `ABE source review: ${exact.join("; ")}`;
    if (!rows[0].sourceReference?.includes(note)) rows[0].sourceReference = `${rows[0].sourceReference}; ${note}`;
    owners.push({ table: "eligibilityConstraints", key: rows[0].key, reviewedValue: structuredClone(rows[0]) });
  };
  for (const [product, row, oldMaximum, maximum] of [["li-10yr", 40, 64, 69], ["li-20yr", 41, 54, 59]] as const) for (const [applicant, column] of [["member", "O"], ["spouse", "P"]] as const) {
    source(`${column}${row}`, `17 - through age ${oldMaximum} Effective 6/1/24 through age ${maximum}`);
    update(product, applicant, { minimumAgeYears: 17, maximumAgeYears: maximum });
  }
  for (const [product, row, days] of [["li-term", 39, 14], ["li-10yr", 40, 14], ["li-20yr", 41, 14], ["li-add", 43, 0]] as const) {
    source(`Q${row}`, `${days} days - through age 26`); source(`T${row}`, row === 39 ? "Unmarried" : "unmarried");
    update(product, "child", { minimumAgeDays: days, minimumAgeYears: 0, maximumAgeYears: 26 });
  }
  source("Q49", "0- through age 25 (unmarried)\n26 - 29 if honorably discharged from active or reserve services");
  source("T49", "unmarried (see age)\nhonorably discharges from active or\nreserve services (see age)");
  update("sh-hospital-money", "child", { minimumAgeDays: 0, minimumAgeYears: 0, maximumAgeYears: 25 });
  for (const [product, row] of [["di-ltd-plus", 44], ["di-ltd", 45], ["di-mtd", 46]] as const) {
    source(`S${row}`, "Can be a Member,\nMembership ID optional\nSS# required\nFull-time work requirement: 30 hours");
    update(product, "spouse", { minimumWorkHours: 30 });
  }
  const upsert = <T extends { key: string }>(rows: T[], row: T) => { const index = rows.findIndex(item => item.key === row.key); if (index < 0) rows.push(row); else rows[index] = row; };
  const fieldKey = "child-honorably-discharged-service-member";
  if (!db.fields.some(row => row.key === fieldKey)) db.fields.push({ ...meta("fields", fieldKey), position: 30011, definition: { id: fieldKey, label: "Was the child honorably discharged from active or reserve military service?", inputType: "radio", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }], required: true } });
  const definitionKey = "shared.sh-hospital-money.child-service-age-extension", valueKey = "abe.sh-hospital-money.child-service-age-extension";
  upsert(db.configurationDefinitions, { ...meta("configurationDefinitions", definitionKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "product-eligibility-facts", productKey: "sh-hospital-money", applicantKey: "child" } } });
  upsert(db.configurationValues, { ...meta("configurationValues", valueKey), position: 0, scope: "site", siteKey: "abe", clientKey: null, configurationKey: definitionKey, value: [{ fact: "honorablyDischargedServiceMember", extendsMaximumAgeTo: 29 }] });
  for (const key of [fieldKey]) if (!db.siteFieldConfigurations.some(row => row.siteKey === "abe" && row.pageKey === "eligibility" && row.fieldKey === key && row.include === true)) db.siteFieldConfigurations.push({ ...meta("siteFieldConfigurations", `site:abe.eligibility.${key}.include`), position: 30011, scope: "site", siteKey: "abe", clientKey: null, pageKey: "eligibility", fieldKey: key, include: true, hidden: null, values: {} });
  const section = db.pageSections.find(row => row.definition.collectionName === "children")!;
  if (!db.pageSectionFields.some(row => row.sectionKey === section.key && row.fieldKey === fieldKey)) db.pageSectionFields.push({ ...meta("pageSectionFields", `${section.key}.${fieldKey}`), sectionKey: section.key, fieldKey, position: 30011 });
  const globalCollections = db.configurationValues.find(row => row.configurationKey === "field-collections" && row.scope === "global")!;
  const collections = structuredClone(globalCollections.value) as unknown as Record<string, FieldCollectionDefinition>;
  collections.children.fields.push({ fieldKey, valueKey: "honorablyDischargedServiceMember" });
  upsert(db.configurationValues, { ...meta("configurationValues", "abe.field-collections"), position: 0, scope: "site", siteKey: "abe", clientKey: null, configurationKey: "field-collections", value: collections as unknown as Json });
  for (const table of ["configurationValues", "siteFieldConfigurations", "fields", "pageSectionFields"] as const) for (const row of db[table]) if (row.key === valueKey || row.key === "abe.field-collections" || row.key === fieldKey || row.key === `${section.key}.${fieldKey}` || table === "siteFieldConfigurations" && "siteKey" in row && row.siteKey === "abe" && "fieldKey" in row && row.fieldKey === fieldKey) owners.push({ table, key: row.key, reviewedValue: structuredClone(row) });
  upsert(db.semanticRequirements, { ...meta("semanticRequirements", abeEligibilityDecisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "abe", predicate: "source-eligibility-adoption", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", scope: ["abe"], sourceReferences: [...new Set(refs)], owners,
    interpretation: "Inclusive completed-year upper bounds; 14 completed days for Life children. Hospital Money requires honorable discharge only for ages 26–29 and never accepts age 30. Unmarried-child wording remains the existing child-section note, with no additional answer or eligibility fact. User clarification retains the DI spouse 30-hour minimum in Main S44–S46. This decision supersedes only those provisional facets; underwriting/QD ages, amounts, other products and other Sites retain separate owners.",
  } as unknown as Json });
}
