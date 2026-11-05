import type { DatabaseSchema, Json } from "../persistence/types";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { isReviewPolicy, type ReviewBlock } from "../domain/reviewPolicy";
import type { QuickDecisionPolicy } from "../domain/quickDecisionPolicy";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";

export const abeProcessingDecisionKey = "business-decision.rules-review.abe-mcr-processing";
const authority = "User clarification October 21, 2026: use Master Client Requirements_09_28_2026_v78 (1) for limits and amounts; otherwise eligible requests outside QD limits route to FUW. Append the Supplemental Health note within the existing Read and Sign section, not separately.";
export function applyAbeProcessingAdoption(db: DatabaseSchema) {
  const source = (sheet: string, cell: string) => {
    const value = currentMcrSource.cells.find(row => row.sheet === sheet && row.cell === cell)?.value;
    if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ABE processing source ${sheet}!${cell}`);
    return value.trim();
  };
  const selected: Array<{ key: string; quickDecision: QuickDecisionPolicy }> = [];
  const references: string[] = [];
  for (const [productKey, sheet, row] of [["li-term", "QD LI", 6], ["li-10yr", "QD LI", 7], ["li-20yr", "QD LI", 8], ["di-ltd-plus", "QD DI", 2], ["di-ltd", "QD DI", 3], ["di-mtd", "QD DI", 4]] as const) {
    const record = db.configurationValues.find(value => value.key === `abe.${productKey}.journey-policy`);
    if (!record || !isCoverageJourneyPolicy(record.value)) throw new Error(`Invalid ABE journey owner ${productKey}`);
    const ages = source(sheet, `O${row}`).match(/\d+/g)!.map(Number);
    if (sheet === "QD LI" && JSON.stringify(source(sheet, `P${row}`).match(/\d+/g)?.map(Number)) !== JSON.stringify(ages)) throw new Error(`ABE spouse QD age scope changed ${productKey}`);
    const amounts = source(sheet, `J${row}`).split("\n")[0].replaceAll(",", "").match(/\d+/g)!.map(Number);
    if (ages.length !== 2 || amounts.length !== 2) throw new Error(`Ambiguous ABE processing bounds ${productKey}`);
    const firstExclusionLine = source(sheet, `N${row}`).split("\n")[0].replace(/\uFFA0/g, "").trim();
    // N8 names only foreign/territory/military regions, already outside the
    // retained base residency scope; it has no mainland-state QD exclusion list.
    const excludedJurisdictions = firstExclusionLine === "Newfoundland and Labrador" ? [] : firstExclusionLine.split(",").map(s => s.trim()).filter(Boolean);
    if (!excludedJurisdictions.every(state => /^[A-Z]{2}$/.test(state))) throw new Error(`Ambiguous ABE QD exclusions ${productKey}`);
    const fixedTerm = productKey === "li-10yr" || productKey === "li-20yr";
    const quickDecision: QuickDecisionPolicy = {
      applicants: sheet === "QD LI" ? ["member", "spouse"] : ["member"], minimumAgeYears: ages[0], maximumAgeYears: ages[1], minimumAmount: amounts[0], maximumAmount: amounts[1], excludedJurisdictions,
      ...(fixedTerm ? { aggregate: { maximum: 500000, productKeys: ["li-term", "li-10yr", "li-20yr", "li-50plus"] }, spouseRequiresMember: true as const } : {}),
    };
    if (fixedTerm && (!source(sheet, `J${row}`).includes("Max $500,000 across life coverages") || !source(sheet, `K${row}`).includes("Spouse cannot exceed the member"))) throw new Error("ABE fixed-term QD aggregate/dependent source changed");
    record.value = { ...record.value, quickDecision, defaultUnderwritingPathway: "FUW", healthPageByUnderwriting: { ...record.value.healthPageByUnderwriting, QD: "health-qd", FUW: null } } as unknown as Json;
    selected.push({ key: record.key, quickDecision });
    references.push(...["D", "J", "K", "N", "O", "P"].map(column => `${sheet}!${column}${row}`));
  }
  // FUW is post-submission processing and does not assign an online form.
  // Explicit TELE, CI and supplemental DI collection remains separate; shared
  // forms and other Sites are preserved.
  const fuwHealthPages: string[] = [];
  for (const record of db.configurationValues.filter(row => row.siteKey === "abe" && row.key.endsWith(".journey-policy"))) {
    if (!isCoverageJourneyPolicy(record.value)) continue;
    const category = db.products.find(product => product.key === record.key.slice("abe.".length, -".journey-policy".length))?.categoryKey;
    if (!["LI", "DI", "OO"].includes(category ?? "")) continue;
    record.value.healthPageByUnderwriting = { ...record.value.healthPageByUnderwriting, FUW: null };
    if (record.value.defaultUnderwritingPathway === "FUW") record.value.questions = record.value.questions.map(question => ({ ...question, healthPage: null }));
    fuwHealthPages.push(record.key);
  }
  // TELE processing does not itself assign an online medical questionnaire.
  const fiftyPlus = db.configurationValues.find(row => row.key === "abe.li-50plus.journey-policy");
  if (!fiftyPlus || !isCoverageJourneyPolicy(fiftyPlus.value)) throw new Error("Missing ABE 50+ Life journey");
  fiftyPlus.value.healthPageByUnderwriting = { ...fiftyPlus.value.healthPageByUnderwriting, TELE: null };
  fiftyPlus.value.questions = fiftyPlus.value.questions.map(question => ({ ...question, healthPage: null }));
  const review = db.configurationValues.find(row => row.key === "abe.review-policy");
  if (!review || !isReviewPolicy(review.value)) throw new Error("Missing ABE Review policy");
  const block: ReviewBlock = { key: "supplemental-health-attestation", title: "Supplemental Health attestation", paragraphs: [source("Read & Sign", "B116")], fields: [], placement: "read-and-sign-appendix", fontSizePt: 14, when: { products: ["sh-critical-illness", "sh-hospital-money"] }, sourceReferences: ["Main!R47", "Main!S47", "Read & Sign!B115:B116"] };
  if (!source("Read & Sign", "B115").includes("14pt")) throw new Error("ABE source attestation typography changed");
  review.value = { ...review.value, blocks: [...review.value.blocks.map(previous => previous.key === block.key ? block : previous), ...(!review.value.blocks.some(previous => previous.key === block.key) ? [block] : [])] } as unknown as Json;
  references.push("Main!R47", "Main!S47", "Read & Sign!B115", "Read & Sign!B116");
  const key = abeProcessingDecisionKey;
  const decision = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "abe", predicate: "mcr-processing-and-inline-attestation", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", workbook: currentMcrSource.workbook, workbookSha256: currentMcrSource.sha256, sourceReferences: references, selected, reviewBlock: block, fuwHealthPages, questionnaireAuthority: "User clarification October 23, 2026: FUW sends the submitted application to underwriters for health checks. FUW alone has no online questionnaire; only explicitly assigned TELE questions are moved online. Existing TELE routes and forms are preserved. Preserve explicit CI and supplemental DI forms and other Sites’ updated health forms.",
    interpretation: "General amounts and eligibility remain owned by Main and explicit approved ages. QD LI/DI age, amount and jurisdiction limits govern processing only; otherwise eligible requests use FUW. Fixed-term QD includes the source per-person Life aggregate and member/spouse relationship guards. FUW does not activate a generic Life, DI or Overhead online questionnaire. Explicit online questionnaire assignments remain independent of processing. Older QA release projections do not remove literal exclusions. Children retain their explicit NA override. The CI note is appended within the existing Read and Sign content, at 14pt with no answer or checkbox. Existing ABE dividend blocks are preserved.",
    fiftyPlusHealthFollowUp: "User correction October 23, 2026: the tested member-only 50+ Life path (AL, born 1960-01-01, $25,000) skips the generic online health questionnaire. Set an explicit null TELE health page for ABE 50+ Life; retain processing independently of online collection. Medical authorization remains required under the separate Review policy.",
    supersedes: "The six provisional underwriting defaults, the previous absence of the CI note, and ABE 50+ Life's inherited generic online questionnaire. Other journey, rate, residency, rider, collection and production-service deferrals remain separate.",
    destinations: [...fuwHealthPages.flatMap(key => ["healthPageByUnderwriting", "questions"].map(field => ({ table: "configurationValues", key, column: `value.${field}` }))), ...selected.flatMap(row => ["quickDecision", "defaultUnderwritingPathway", "healthPageByUnderwriting"].map(field => ({ table: "configurationValues", key: row.key, column: `value.${field}` }))), { table: "configurationValues", key: review.key, column: "value.blocks", blockKey: block.key }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
}
