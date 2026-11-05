import type { ConfigurationTarget, DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { organizeRule } from "../domain/ruleOrganization";

const authority = "Main!R118/R119; User decision October 20, 2026";
const siteKey = "ama";
const products = ["di-step-rated", "di-level-rated"];
const ruleKey = "rule-coverage-ama-active-work";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
function upsert<T extends { key: string }>(rows: T[], row: T) {
  const index = rows.findIndex(previous => previous.key === row.key);
  if (index < 0) rows.push(row);
  else rows[index] = row;
}

/** Reviewed Library data only. DI has an attestation, never a numeric hours gate. */
export function applyAmaActiveWorkAdoption(db: DatabaseSchema) {
  const store = (key: string, value: Json, target?: ConfigurationTarget, path?: string[]) => {
    upsert(db.configurationDefinitions, { ...meta("configurationDefinitions", key), position: 0, definition: { path: path ?? null, metadata: { authority }, ...(target ? { target } : {}) } });
    upsert(db.configurationValues, { ...meta("configurationValues", key), position: 0, scope: "site", siteKey, clientKey: null, configurationKey: key, value });
  };
  store("ama.coverage-question-overrides", { DI: { self: ["gender", "actively-at-work", "average-monthly-income"] } }, undefined, ["coveragePolicy", "questionOverrides"]);
  // Home uses the same stored field and DI applicability when a quote tool is enabled.
  const quotePlacement = db.siteFieldConfigurations.find(row => row.siteKey === siteKey && row.pageKey === "home" && row.fieldKey === "actively-at-work");
  if (!quotePlacement) throw new Error("Missing AMA active-work quote placement");
  quotePlacement.hidden = false;
  for (const productKey of products) {
    const constraints = db.eligibilityConstraints.filter(row => row.siteKey === siteKey && row.productKey === productKey && row.applicantTypeKey === "member");
    if (constraints.length !== 1) throw new Error(`Missing unique AMA DI eligibility: ${productKey}`);
    constraints[0].minimumWorkHours = null;
    store(`ama.${productKey}.active-work`, [{ fact: "activelyAtWork", equals: true }], { kind: "product-eligibility-facts", productKey, applicantKey: "member" });
  }
  upsert(db.rules, { ...meta("rules", ruleKey), position: 3000, definition: {
    id: ruleKey, area: "Coverage", categories: ["Applicant eligibility"], sequence: 3000, documentationStatus: "current", documentedIn: "rules",
    rule: "AMA disability requires actively performing occupation",
    behavior: "When DI is selected, ask: Are you actively at work performing the normal duties of your occupation? Yes/No replaces the DI work-hours question. No makes both AMA DI products ineligible; the standard category eligibility alert applies for one or multiple selected categories. No specific hours threshold. Stored product eligibility facts own execution; this record documents that owner.",
    ref: "src/migration/amaActiveWorkAdoption.ts; src/domain/effectiveSite.ts; src/domain/coverageRequirements.ts; src/components/coverage/ProductCatalog.tsx",
  } });
  const authoredRule = db.rules.find(row => row.key === ruleKey)!;
  authoredRule.definition.organization = organizeRule(authoredRule.definition);
  upsert(db.ruleAssignments, { ...meta("ruleAssignments", `${ruleKey}.ama`), ruleKey, position: 0, scope: "site", siteKey, clientKey: null });
  for (const cell of ["R118", "R119"]) {
    const key = `requirement-target.ama.active-work.${cell}`;
    upsert(db.requirementTargets, { ...meta("requirementTargets", key), requirementKey: `mcr.main.${cell}`, targetTable: "rules", targetKey: ruleKey, targetColumn: "definition" });
  }
}
