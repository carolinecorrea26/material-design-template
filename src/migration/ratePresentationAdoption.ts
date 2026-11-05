import { cseaDiTable } from "./cseaRateTables";
import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { defaultRatePresentation } from "../domain/ratePresentation";
import { activeSiteMigrationScope } from "./activeSiteScope";
const reference = "docs/step3-major-outstanding-items.md";
const key = "rates.reviewed-presentation";
const metadata = (table: string, identity: string) => ({ id: identity, key: identity, ...libraryMetadata(table, identity, reference) });
export function applyRatePresentationAdoption(db: DatabaseSchema) {
  db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== key);
  db.configurationDefinitions.push({ ...metadata("configurationDefinitions", key), definition: { path: null, metadata: { authority: "User clarification, October 2, 2026", runtimeActivation: "pending" }, target: { kind: "site-rate-presentation" } }, position: 0 });
  const clientKeys = [...new Set(activeSiteMigrationScope.sites.filter(site => site.mcrRequired).map(site => site.clientKey))];
  const reviewedAssignments = new Set(db.semanticRequirements.filter(row => row.domain === "approved-business-decision").flatMap(row => {
    const value = row.value as { destinations?: Array<{ table: string; key: string }> } | null;
    return value?.destinations?.filter(destination => destination.table === "configurationValues").map(destination => destination.key) ?? [];
  }));
  db.configurationValues = db.configurationValues.filter(row => row.configurationKey !== key || row.scope === "site" && reviewedAssignments.has(row.key));
  db.configurationValues.push({ ...metadata("configurationValues", `${key}.global`), scope: "global", clientKey: null, siteKey: null, configurationKey: key, value: defaultRatePresentation as unknown as Json, position: 0 });
  for (const clientKey of clientKeys) {
    const configured = clientKey !== "csea";
    db.configurationValues.push({ ...metadata("configurationValues", `${key}.${clientKey}`), scope: "client", clientKey, siteKey: null, configurationKey: key,
      value: { version: 1, praseConfigured: configured, quoteToolEnabled: configured, coverageQuoteEnabled: configured }, position: 0 });
  }
  // Supplied reference rates; no calculated pricing is enabled.
  const tableKey = "csea.di-ltd.provisional-reference-table";
  const table = cseaDiTable;
  db.configurationDefinitions = db.configurationDefinitions.filter(r => r.key !== tableKey);
  db.configurationValues = db.configurationValues.filter(r => r.key !== tableKey);
  db.configurationDefinitions.push({ ...metadata("configurationDefinitions", tableKey), definition: { path: null, metadata: { provisional: true, revisit: true, authority: "User supplied reference table, October 5, 2026" }, target: { kind: "product-reference-rate-table", productKey: "di-ltd" } }, position: 0 });
  db.configurationValues.push({ ...metadata("configurationValues", tableKey), scope: "site", clientKey: null, siteKey: "csea", configurationKey: tableKey, value: table as unknown as Json, position: 0 });
  const tableDecisionKey = `provisional-decision.${tableKey}`;
  db.semanticRequirements = db.semanticRequirements.filter(r => r.key !== tableDecisionKey);
  db.semanticRequirements.push({ ...metadata("semanticRequirements", tableDecisionKey), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: "csea", predicate: "reference-table", status: "documented", value: { authority: "User supplied reference table, October 5, 2026", selected: table, revisit: true, sourceReconciliation: "deferred", rateAsset: "User supplied PDF and image, October 5, 2026", runtimeActivation: "pending", destinations: [{ table: "configurationValues", key: tableKey, column: "value" }] } });
  const decisionKey = "migration-decision.rate-presentation";
  db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decisionKey);
  db.semanticRequirements.push({ ...metadata("semanticRequirements", decisionKey), domain: "reviewed-site-adoption", subjectTable: "configurationDefinitions", subjectKey: key, predicate: "rate-presentation", status: "partial", value: {
    authority: "User clarification, October 2, 2026", globalDefault: false, cseaPraseConfigured: false, otherActiveBusinessClientsPraseConfigured: true,
    quotePresentationDefaults: "Enabled for PRASE-capable business clients as a working presentation choice; independently configurable", referenceTableAsset: "provisional HTML reference configured; authoritative rate asset pending", realRateIntegration: "pending", runtimeActivation: "pending", fullPolicyAcceptance: "pending" } });
}
