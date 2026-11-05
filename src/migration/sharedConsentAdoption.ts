import type { DatabaseSchema, Json } from "../persistence/types";
import { isReviewPolicy, type ReviewPolicy } from "../domain/reviewPolicy";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
import { activeSiteMigrationScope } from "./activeSiteScope";

export const sharedConsentDecisionPrefix = "business-decision.rules-review.shared-consent";
const reference = "User decision October 20, 2026: shared B78/B93 consent follows actual health-question participation; preserve AMA, ABE and dedicated WAEPA wording";
export function applySharedConsentAdoption(db: DatabaseSchema) {
  const text = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Read & Sign" && row.cell === cell)?.value ?? "").trim().replace("{Link to IMPORTANT NOTICE}", "IMPORTANT NOTICE");
  if (!["B78", "B93", "C86", "C114"].every(cell => text(cell).startsWith("CONSENT:"))) throw new Error("Shared consent source changed");
  for (const scope of activeSiteMigrationScope.sites.filter(site => site.mcrRequired && !["abe", "ama"].includes(site.key))) {
    const row = db.configurationValues.find(row => row.key === `${scope.key}.review-policy`);
    if (!row || !isReviewPolicy(row.value) || !row.value.authorization) throw new Error(`Missing shared consent owner ${scope.key}`);
    const dedicated = scope.key === "waepa" ? "C86" : scope.key === "waepa-gi" ? "C114" : null;
    const consent: NonNullable<ReviewPolicy["consent"]> = {
      underwrittenWhen: [], underwrittenWhenHealthQuestions: true,
      underwrittenText: text(dedicated ?? "B78"), otherText: text(dedicated ?? "B93"),
      sourceReferences: [...(dedicated ? [`Read & Sign!${dedicated}`] : ["Read & Sign!B77:B78", "Read & Sign!B92:B93"]), reference],
    };
    row.value = { ...row.value, consent } as unknown as Json;
    const key = `${sharedConsentDecisionPrefix}.${scope.key}`;
    const decision = { id: key, key, ...libraryMetadata("semanticRequirements", key, reference), domain: "approved-business-decision", subjectTable: "sites", subjectKey: scope.key, predicate: "shared-conditional-consent", status: "documented", value: {
      approvalStatus: "approved", authority: reference, sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", selected: consent,
      sourceReferences: consent.sourceReferences, destinations: [{ table: "configurationValues", key: row.key, column: "value.consent" }],
      interpretation: "Use the configured actual-health-question participation result; missing participation cannot select consent. WAEPA retains dedicated C86 and WAEPA GI uses its dedicated C114. The source Important Notice link placeholder is presented as the notice label; detailed PDF routing remains deferred.",
    } as unknown as Json };
    const index = db.semanticRequirements.findIndex(row => row.key === key);
    if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
  }
}
