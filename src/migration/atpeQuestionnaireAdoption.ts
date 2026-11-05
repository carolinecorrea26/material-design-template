import { isReviewPolicy } from "../domain/reviewPolicy";
import type { DatabaseSchema, Json } from "../persistence/types";
import type { FieldDefinition } from "../domain/fields";
import type { HealthItem, HealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { isRatePresentationPolicy } from "../domain/ratePresentation";

export const atpeQuestionnaireDecisionKey = "business-decision.rules-review.atpe-questionnaires-and-rates";
const reference = "User decisions October 20, 2026: adopt ATPE source questionnaires and suppress ATPE premium estimates";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });

export function applyAtpeQuestionnaireAdoption(db: DatabaseSchema) {
  const cells = new Map(currentMcrSource.cells.filter(cell => cell.sheet === "Health Questions").map(cell => [cell.cell, String(cell.value)]));
  const text = (cell: string) => { const value = cells.get(cell); if (!value) throw new Error(`Missing reviewed health source ${cell}`); return value; };
  const fields: FieldDefinition[] = [];
  const field = (name: string, label: string, options: Partial<FieldDefinition> = {}) => {
    const id = `health-source-${name.replaceAll(".", "-")}`;
    if (!fields.some(field => field.id === id)) fields.push({ id, label, inputType: "text", required: true, labelVariant: "standard", ...options });
    return id;
  };
  const detail = (name: string, label: string, maxLength?: number, options: Partial<FieldDefinition> = {}) => field(`detail.${name}`, label, { ...(maxLength ? { maxLength, multiline: true, minRows: 2 } : {}), ...options });
  const details = detail("details", "Details", 500), month = detail("month", "Date (MM/YYYY)", undefined, { format: "month-year" });
  const medical = [detail("onset", "Date of onset (MM/YYYY)", undefined, { format: "month-year" }), detail("illness", "Illness or injury", 300), detail("symptoms", "Symptoms", 300), detail("last-treatment", "Last date of treatment (MM/YYYY)", undefined, { format: "month-year" }), detail("episodes", "Number of attacks", 300), detail("treatment-results", "Treatment and results", 300), detail("physician-hospital", "Name and address of physician and hospital", 300)];
  const source = (cell: string) => [`Health Questions!${cell}`];
  const yesNo = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
  const question = (key: string, label: string, cell: string, fieldKeys: string[] = [], extra: Partial<HealthItem> = {}): HealthItem => ({ key: `health-source-${key.replaceAll(".", "-")}`, questionFieldKey: field(key, label.replace(/^\s*\d+\.\s*/, "").trim(), { inputType: "radio", options: yesNo }), fieldKeys, sourceReferences: source(cell), ...extra });
  const firstQuestion = (cell: string, start = "") => { if (start && !text(cell).includes(start)) throw new Error(`Question marker changed ${cell}/${start}`); const value = start ? text(cell).slice(text(cell).indexOf(start) + start.length) : text(cell); const end = value.indexOf("?"); if (end >= 0) return value.slice(0, end + 1).trim(); const answer = value.indexOf("Yes/No"); if (answer >= 0) return value.slice(0, answer).trim(); throw new Error(`Question boundary changed ${cell}/${start}`); };
  const full: HealthItem[] = [
    question("tele.weight-change", firstQuestion("B87"), "B87", [detail("weight-change", "Amount (lbs)", undefined, { inputType: "number", allowDecimal: true }), detail("weight-reason", "Reason", 500)]),
    question("tele.insurance-history", firstQuestion("B88", "a)"), "B88", [details]),
    question("tele.benefits", firstQuestion("B88", "b)"), "B88", [details]),
    question("tele.contemplated-treatment", firstQuestion("B89", "a)"), "B89", [month, detail("treatment", "Treatment", 300), detail("condition", "Condition"), medical[6]], { repeated: true }),
    question("tele.current-treatment", firstQuestion("B89", "b)"), "B89", [detail("medication", "Medication", 300), detail("dosage", "Dosage", 300), detail("frequency", "Frequency", 300), detail("reason-for-use", "Reason for use of medication"), medical[6]], { repeated: true }),
    question("tele.pregnant", firstQuestion("B89", "c)"), "B89", [detail("due-date", "Expected due date", undefined, { inputType: "date" })], { when: { gender: "female" } }),
    question("tele.pregnancy-complications", firstQuestion("B89", "d)"), "B89", [details], { when: { gender: "female" } }),
    { key: "health-source-tele-attending-physician", sourceReferences: source("B90"), fieldKeys: [detail("physician-name", "Name of regular attending physician", 500), detail("physician-street", "Street Address or P.O. Box", 500), detail("physician-street2", "Street Address 2", undefined, { required: false }), detail("physician-city", "City"), detail("physician-state", "State/Province"), detail("physician-zip", "Zip Code"), detail("physician-phone", "Phone number", undefined, { format: "phone", showPhoneTypeSelector: false }), detail("physician-ext", "Ext.", undefined, { required: false }), detail("last-consult", "Date of last consult (MM/YYYY)", undefined, { format: "month-year" }), detail("consult-reason", "Reason for last consult", 500), detail("diagnosis-results", "Diagnosis, results, treatment given or medications prescribed", 500)] },
    question("tele.diagnostic-tests", firstQuestion("B90", "d)"), "B90", [details]),
  ];
  for (const [index, marker] of "abcdefghijkl".split("").entries()) {
    const label = firstQuestion("B91", `${marker})`);
    full.push(question(`tele.condition-${index + 1}`, `During the past five years have you ever been medically diagnosed by a physician as having or been treated for ${label}`, "B91", medical, { repeated: true }));
  }
  const alcohol = [detail("alcohol-frequency", "Frequency", undefined, { inputType: "dropdown", options: ["Daily", "Weekly", "Monthly"].map(value => ({ value, label: value })) }), ...["Wine", "Beer", "Liquor"].map(label => detail(`alcohol-${label.toLowerCase()}`, label, undefined, { inputType: "number", allowDecimal: true }))];
  full.push(question("tele.alcohol-current", firstQuestion("B96", "a)"), "B96", alcohol));
  full.push(question("tele.alcohol-previous", "In the past five years have you consumed any alcoholic beverages?", "B96", alcohol, { when: { answerKey: "health-source-tele-alcohol-current", answer: "no" } }));
  full.push(question("tele.alcohol-increased", firstQuestion("B96", "b)"), "B96", [month, details]));
  const drugFields = [detail("last-use", "Date of last use (MM/YYYY)", undefined, { format: "month-year" }), detail("frequency", "Frequency", 300), detail("drug", "Drug", 300), detail("drug-details", "Details", 300)];
  for (const [key, marker] of [["sedatives", "c)"], ["drugs", "d)"]]) full.push(question(`tele.${key}`, firstQuestion("B96", marker), "B96", drugFields, { repeated: true }));
  full.push(question("tele.nicotine", firstQuestion("B96", "e)"), "B96", [detail("nicotine-last-use", "When did you last use tobacco or nicotine products?", undefined, { inputType: "date" }), detail("nicotine-products", "Product(s) used")]));
  full.push(question("tele.alcohol-drug-treatment", firstQuestion("B96", "f)"), "B96", [month, details, detail("physician-hospital-500", "Name and address of physician and hospital", 500)]));
  full.push(question("tele.driving", firstQuestion("B98"), "B98", [month, details], { repeated: true }));
  for (const local of [false, true]) full.push(question(`tele.crime-${local ? "mn-ct" : "other"}`, firstQuestion("B98", local ? "For residents of Minnesota and Connecticut  -" : "All states except of Minnesota and Connecticut -"), "B98", [month, details], { repeated: true, when: local ? { jurisdictions: ["MN", "CT"] } : { exceptJurisdictions: ["MN", "CT"] } }));
  full.push(question("tele.family", firstQuestion("B99"), "B99", [detail("family-member", "Family member", undefined, { inputType: "dropdown", options: ["Father", "Mother", "Brother", "Sister"].map(value => ({ value, label: value })) }), detail("family-onset", "Age of onset", undefined, { inputType: "number" }), detail("family-status", "Status", undefined, { inputType: "dropdown", options: ["Living", "Deceased"].map(value => ({ value, label: value })) })]));
  const ciExtra = ["organ transplant", "coma", "dementia or problems with memory or ability to think or reason"].map((condition, index) => question(`tele.ci-${index + 1}`, `During the past five years have you ever been medically diagnosed by a physician as having been treated for ${condition}?`, "B100", medical, { repeated: true }));
  const ciOnly = [81, 82, 83].map((row, index) => question(`ci.${index + 1}`, firstQuestion(`B${row}`), `B${row}`, medical, { repeated: true }));
  const ciText = text("B84");
  const prefix = ciText.slice(0, ciText.indexOf("a.")).replace(/^\s*4\.\s*/, "").trim();
  const ciLabels = ciText.slice(ciText.indexOf("a."), ciText.indexOf("=========")).split(/\n(?=[a-l]\.\s)/);
  if (ciLabels.length !== 12) throw new Error("CI source subquestion boundaries changed");
  for (const [index, label] of ciLabels.entries()) {
    const cleaned = label.replace(/^[a-l]\.\s*/, "").trim();
    if (index === 8) {
      ciOnly.push(question("ci.4i", `${prefix} ${cleaned}`, "B84", medical, { repeated: true, when: { exceptJurisdictions: ["CA"] } }));
      ciOnly.push(question("ci.4i-ca", `${prefix} Substance Abuse?`, "B84", medical, { repeated: true, when: { jurisdictions: ["CA"] } }));
    } else if (index === 11) {
      const subquestions = cleaned.split(/\n(?=\(i{1,3}\))/).slice(1);
      if (subquestions.length !== 3) throw new Error("CI impairment subquestion boundaries changed");
      subquestions.forEach((label, part) => ciOnly.push(question(`ci.4l-${part + 1}`, `${prefix} Other health or physical impairment including ${label.replace(/^\(i+\)\s*/, "").trim()}`, "B84", medical, { repeated: true })));
    } else ciOnly.push(question(`ci.4${"abcdefghijkl"[index]}`, `${prefix} ${cleaned}`, "B84", medical, { repeated: true }));
  }
  const policy: HealthQuestionnairePolicy = { version: 1, associationKeys: [atpeAssociationKey], pageId: "health-li", variants: [
    { key: "life", when: { none: ["sh-critical-illness"] }, items: full },
    { key: "ci-only", when: { only: ["sh-critical-illness"] }, items: ciOnly },
    { key: "ci-mixed", when: { any: ["sh-critical-illness"], otherThan: ["sh-critical-illness"] }, items: [...full, ...ciExtra], supersededPages: ["health-si"] },
  ] };
  for (const [position, definition] of fields.entries()) {
    const record = { ...meta("fields", definition.id), definition, position: 30000 + position };
    const index = db.fields.findIndex(row => row.key === definition.id);
    if (index < 0) db.fields.push(record); else db.fields[index] = record;
  }
  const configurationKey = "shared.health-questionnaires", key = "isitrust.atpe.health-questionnaires";
  if (!db.configurationDefinitions.some(row => row.key === configurationKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-health-questionnaires" } } });
  const value = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "isitrust", clientKey: null, configurationKey, value: policy as unknown as Json };
  const index = db.configurationValues.findIndex(row => row.key === key);
  if (index < 0) db.configurationValues.push(value); else db.configurationValues[index] = value;
  const rateKey = "isitrust.reviewed-rate-presentation";
  const existing = db.configurationValues.find(row => row.key === "rates.reviewed-presentation.isitrust");
  if (!existing || !isRatePresentationPolicy(existing.value)) throw new Error("Missing ISITRUST rate presentation baseline");
  // Use the same existing definition identity for Site precedence; a second
  // identity would create two effective policies rather than a scoped override.
  const rate = { ...meta("configurationValues", rateKey), position: 0, scope: "site" as const, siteKey: "isitrust", clientKey: null, configurationKey: existing.configurationKey, value: { ...existing.value, suppressedAssociationKeys: [atpeAssociationKey] } as unknown as Json };
  const rateIndex = db.configurationValues.findIndex(row => row.key === rateKey);
  if (rateIndex < 0) db.configurationValues.push(rate); else db.configurationValues[rateIndex] = rate;
  const review = db.configurationValues.find(row => row.key === "isitrust.review-policy");
  if (!review || !isReviewPolicy(review.value)) throw new Error("Missing ISITRUST Review policy");
  const notice = text("B84").split('"')[1];
  if (!notice?.startsWith("The undersigned applicant")) throw new Error("Virginia CI notice boundary changed");
  const previousReviewDefinition = review.configurationKey;
  review.configurationKey = "shared.review-policy";
  if (previousReviewDefinition !== review.configurationKey && !db.configurationValues.some(row => row.configurationKey === previousReviewDefinition)) db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== previousReviewDefinition);
  const certification: import("../domain/reviewPolicy").ReviewBlock = { key: "ci-virginia-certification", title: "Virginia applicant certification", paragraphs: [notice], fields: [], placement: "before-signature", when: { products: ["sh-critical-illness"], associationKeys: [atpeAssociationKey], jurisdictions: ["VA"] }, sourceReferences: ["Health Questions!B84", reference] };
  const blocks = [...review.value.blocks], certificationIndex = blocks.findIndex(block => block.key === certification.key);
  if (certificationIndex < 0) blocks.push(certification); else blocks[certificationIndex] = certification;
  review.value = { ...review.value, blocks } as unknown as Json;
  if (!isReviewPolicy(review.value)) throw new Error("Invalid ATPE certification policy");
  const decisionKey = atpeQuestionnaireDecisionKey;
  const decision = { ...meta("semanticRequirements", decisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "association-questionnaires-and-rate-suppression", status: "documented", value: { authority: reference, approvalStatus: "approved", sourceReconciliation: "approved", runtimeActivation: "reviewed-seed", scope: ["isitrust"], associationKey: atpeAssociationKey, sourceReferences: ["Health Questions!A81:C84", "Health Questions!A86:C100", "Attestation Online and PDF!C86"], selected: { policy, fields, rate: rate.value, review: { version: 1, fraud: review.value.fraud, blocks: review.value.blocks.filter(block => block.key === "ci-virginia-certification") } }, destinations: [{ table: "configurationValues", key: review.key, column: "value" }, { table: "configurationValues", key, column: "value" }, { table: "configurationValues", key: rateKey, column: "value" }, ...fields.map(field => ({ table: "fields", key: field.id, column: "definition" }))] } as unknown as Json };
  const decisionIndex = db.semanticRequirements.findIndex(row => row.key === decisionKey);
  if (decisionIndex < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[decisionIndex] = decision;
}
