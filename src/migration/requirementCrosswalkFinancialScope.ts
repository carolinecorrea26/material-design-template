import { isFinancialQuestionnairePolicy } from "../domain/financialQuestionnaire";
import type { DatabaseSchema } from "../persistence/types";
import type { SourceCell } from "./mcr";
import { activeSiteMainRows } from "./activeSiteIdentity";

/** Scope review of the dedicated full financial questionnaire. Income limits,
 * other-insurance fields and AVMA loan statements are separate requirements. */
export function financialQuestionnaireSourceReview(db: DatabaseSchema, cells: readonly SourceCell[], businessSites: readonly string[]) {
  const activeRows = new Set([...Object.values(activeSiteMainRows).flatMap(products => Object.values(products)), 246, ...Array.from({ length: 7 }, (_, index) => 179 + index)]);
  const main = cells.filter(cell => cell.sheet === "Main");
  const triggers = main.filter(cell => cell.cell !== "Y1" && /financial\s+question(?:s|naire)/i.test(String(cell.value ?? "")));
  const activeFinancialFlags = main.filter(cell => /^Y\d+$/.test(cell.cell) && activeRows.has(Number(cell.cell.slice(1))) && !/^(?:no|n\/?a)?$/i.test(String(cell.value ?? "").trim()));
  const financialSetKeys = new Set(db.questionSets.filter(row => ["financial", "financial-questions"].includes(row.questionType ?? "")).map(row => row.key));
  const assignments = db.productQuestionSets.filter(row => financialSetKeys.has(row.questionSetKey));
  const currentAssignments = businessSites.flatMap(siteKey => {
    const siteId = db.sites.find(row => row.key === siteKey)?.id;
    const products = new Set(db.siteProducts.filter(row => row.siteId === siteId && row.enabled).map(row => row.productKey));
    return assignments.filter(row => products.has(row.productKey)).map(row => ({ siteKey, assignmentKey: row.key, productKey: row.productKey, questionSetKey: row.questionSetKey }));
  });
  const sourceIdentity = main.find(cell => cell.cell === "B80")?.value === "ACS (Surgeons)" && main.find(cell => cell.cell === "D80")?.value === "Long-Term Disability Insurance";
  const reviewed = sourceIdentity && triggers.length === 1 && triggers[0].cell === "R80" && !activeFinancialFlags.length && !currentAssignments.length;
  const abeIdentity = cells.find(cell => cell.sheet === "SUP DI Health questions" && cell.cell === "A50");
  const abeTrigger = cells.find(cell => cell.sheet === "SUP DI Health questions" && cell.cell === "U50");
  const abePending = businessSites.includes("abe") && String(abeIdentity?.value ?? "").trim() === "ABE" && /7,000/.test(String(abeTrigger?.value ?? ""));
  const nativeSitePolicies = db.configurationValues.filter(row => row.scope === "site" && row.siteKey === "abe" && db.configurationDefinitions.some(definition => definition.key === row.configurationKey && definition.definition.target?.kind === "site-financial-questionnaire"));
  const abeAdopted = abePending && nativeSitePolicies.length === 1 && isFinancialQuestionnairePolicy(nativeSitePolicies[0].value) && nativeSitePolicies[0].value.enabled && nativeSitePolicies[0].value.rules.length === 1 && nativeSitePolicies[0].value.rules[0].minimumAmount === 7000 && nativeSitePolicies[0].value.rules[0].inclusive && JSON.stringify(nativeSitePolicies[0].value.rules[0].productKeys) === JSON.stringify(["di-ltd-plus", "di-ltd", "di-mtd"]);
  return {
    status: reviewed ? abeAdopted ? "reviewed-abe-assignment" : abePending ? "reviewed-abe-decision-pending" : "reviewed-no-current-assignment" : "scope-review-pending",
    nativeSitePolicies,
    pendingSiteKeys: abePending && !abeAdopted ? ["abe"] : [],
    sourceReferences: ["Main!B80", "Main!R80", ...(abePending ? ["SUP DI Health questions!A50", "SUP DI Health questions!O50", "SUP DI Health questions!U50", "SUP DI Health questions!V50"] : []), ...cells.filter(cell => cell.sheet === "Financial questions").map(cell => `Financial questions!${cell.cell}`)],
    currentAssignments, nativeAssignments: assignments,
    triggerReferences: [...triggers.map(cell => `Main!${cell.cell}`), ...(abePending ? ["SUP DI Health questions!U50"] : [])], activeFinancialFlags: activeFinancialFlags.map(cell => `Main!${cell.cell}`),
    reviewedCurrentSiteKeys: [...businessSites],
    finding: abeAdopted ? "Approved October 22: ABE financial questionnaire is member-only on the existing Profile section below Other coverage, using combined selected DI at $7,000 or more, excluding OO. No QD Life or health-completion prerequisite. Explicit Site configuration owns activation, product list and inclusive amount; the user's placement decision supersedes the legacy after-Health instruction." : reviewed ? abePending ? "No full financial questionnaire is currently assigned to ABE, but SUP DI Health questions U50 explicitly requires it at $7,000 or more combined member DI (excluding OO). The same cell both says without regard to QD Life and requires both Life/DI questions first. ABE-07 in abe-review-questions.md asks which trigger to use. This supersedes the earlier Main-only no-current-source-trigger conclusion; blank Main Y cells do not disprove the supplemental-sheet requirement. No prototype fields are activated before the user answers." : "The dedicated full Financial questions sheet has no current Site/product assignment. Main R80 requests it for ACS (Surgeons), outside current Library Sites. Preserve the archived assignment and source without activation; other-insurance and income eligibility remain separate." : "Financial questionnaire applicability changed: inspect new source triggers, flags or current assignments before accepting this source scope.",
    revisitTrigger: "A current Site/product receives a financial question-set assignment, an affirmative financial flag, or a new dedicated source trigger",
    implementationReferences: ["src/domain/financialQuestionnaire.ts", "src/pages/Profile.tsx"],
    verificationReferences: ["src/domain/financialQuestionnaire.test.ts", "src/migration/requirementCrosswalk.test.ts"],
  };
}
