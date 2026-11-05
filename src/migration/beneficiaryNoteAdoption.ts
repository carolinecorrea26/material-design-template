import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isBeneficiaryNotePolicy, type BeneficiaryNotePolicy } from "../domain/beneficiaryNotes";
import { currentMcrSource } from "./currentMcr";
import { activeSiteMigrationScope } from "./activeSiteScope";

export const beneficiaryNoteDecisionPrefix = "business-decision.rules-review.beneficiary-notes";
const reference = "User decision October 20, 2026; Beneficiary Note!C2:C3/C6: apply the common notes to current Sites with CSEA's dedicated AD&D wording; child automatic beneficiaries and PDF scope remain separate";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
export function applyBeneficiaryNoteAdoption(db: DatabaseSchema) {
  const text = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Beneficiary Note" && row.cell === cell)?.value ?? "").trim();
  const other = text("C3"), common = other.slice(other.indexOf("I make the following")), firstToDie = other.split('"')[1];
  if (![text("C2"), common, text("C6")].every(copy => copy.startsWith("I make the following beneficiary designation")) || !firstToDie?.startsWith(" Unless otherwise designated")) throw new Error("Beneficiary note source boundaries changed");
  const configurationKey = "shared.beneficiary-notes";
  if (!db.configurationDefinitions.some(row => row.key === configurationKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-beneficiary-notes" } } });
  for (const scope of activeSiteMigrationScope.sites.filter(site => site.mcrRequired)) {
    const site = db.sites.find(site => site.key === scope.key)!;
    const notes: BeneficiaryNotePolicy["notes"] = [];
    for (const link of db.siteProducts.filter(link => link.siteId === site.id && link.enabled)) {
      const product = db.products.find(product => product.key === link.productKey)!;
      if (!["LI", "AD"].includes(product.categoryKey)) continue;
      const applicants = db.siteProductApplicants.filter(row => row.siteKey === scope.key && row.productKey === product.key && ["member", "spouse"].includes(row.applicantKey)).map(row => row.applicantKey as "member" | "spouse");
      if (!applicants.length) continue;
      const cell = scope.key === "csea" && product.categoryKey === "AD" ? "C6" : ["li-10yr", "li-15yr", "li-20yr"].includes(product.key) ? "C2" : "C3";
      const copy = cell === "C3" ? `${product.key === "li-first-to-die" ? `${firstToDie.trim()}\n\n` : ""}${common}` : text(cell);
      notes.push({ productKeys: [product.key], applicants, text: copy, sourceReferences: [`Beneficiary Note!${cell}`, reference] });
    }
    if (!notes.length) continue;
    const policy: BeneficiaryNotePolicy = { version: 1, notes };
    if (!isBeneficiaryNotePolicy(policy)) throw new Error(`Invalid adopted beneficiary notes ${scope.key}`);
    const key = `${scope.key}.beneficiary-notes`, row = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: scope.key, clientKey: null, configurationKey, value: policy as unknown as Json };
    const index = db.configurationValues.findIndex(row => row.key === key);
    if (index < 0) db.configurationValues.push(row); else db.configurationValues[index] = row;
    const decisionKey = `${beneficiaryNoteDecisionPrefix}.${scope.key}`;
    const decision = { ...meta("semanticRequirements", decisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: scope.key, predicate: "beneficiary-designation-notes", status: "documented", value: {
      approvalStatus: "approved", authority: reference, sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", selected: policy,
      sourceReferences: ["Beneficiary Note!A2:C3", ...(scope.key === "csea" ? ["Beneficiary Note!A6:C6"] : [])],
      destinations: [{ table: "configurationValues", key, column: "value" }], preserved: "Automatic child beneficiaries, collection/percentage validation, existing CSEA provisional product identity and deferred PDF work; ABE Review is unchanged",
    } as unknown as Json };
    const decisionIndex = db.semanticRequirements.findIndex(row => row.key === decisionKey);
    if (decisionIndex < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[decisionIndex] = decision;
  }
}
