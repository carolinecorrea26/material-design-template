import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

/** New ABE applications use the normal benefit schedule and existing expense answer. */
export function applyAbeBenefitQuestionCleanup(db: DatabaseSchema) {
  const removed = new Set(["existingMonthlyBenefit", "retirement", "eligibleExpenseFraction"]);
  db.siteFieldConfigurations = db.siteFieldConfigurations.filter(row =>
    !(row.siteKey === "abe" && row.fieldKey.startsWith("prototype-fact:") && removed.has(row.fieldKey.split(":").at(-1)!)));

  const key = "abe.benefit-fact-sources";
  const authority = "User correction October 26, 2026: remove generated existing-benefit, retirement and expense-fraction questions from ABE; reuse expense responsibility percentage";
  const meta = (table: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const definition = { ...meta("configurationDefinitions"), position: 0, definition: { path: ["applicantExperience", "factSources"], metadata: {} } };
  const value = { ...meta("configurationValues"), position: 0, scope: "site" as const, siteKey: "abe", clientKey: null, configurationKey: key, value: {
    existingMonthlyBenefit: { value: 0 },
    retirement: { value: "no" },
    eligibleExpenseFraction: { field: "business-expense-responsibility", divisor: 100 },
  } };
  for (const [table, row] of [["configurationDefinitions", definition], ["configurationValues", value]] as const) {
    const rows = db[table] as Array<{ key: string }>;
    const index = rows.findIndex(item => item.key === key);
    if (index < 0) rows.push(row); else rows[index] = row;
  }
}
