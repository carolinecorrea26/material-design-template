import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const waepaCirQuestionnaireDeferralKey = "business-decision.rules-review.waepa-cir-questionnaire-deferral";
export function recordWaepaCirQuestionnaireDeferral(db: DatabaseSchema) {
  const key = waepaCirQuestionnaireDeferralKey, authority = "User decision October 21, 2026: retain current WAEPA CIR health flow; flag incomplete dedicated questionnaire as nonblocking";
  const cells = currentMcrSource.cells.filter(row => row.sheet === "WAEPA CIR questions");
  if (!cells.some(row => row.cell === "A9" && String(row.value).startsWith("7 ")) || !cells.some(row => row.cell === "B2" && String(row.value).includes("9 & 10"))) throw new Error("Re-review WAEPA CIR source completeness");
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "cir-questionnaire-deferral", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "deferred-by-user", completionBlocking: false, scope: ["waepa"], productKeys: ["li-group-term"], sourceReferences: cells.map(row => `WAEPA CIR questions!${row.cell}`),
    selected: "Retain current shared Life questionnaire flow for WAEPA CIR applications provisionally. Do not activate a partial dedicated form or fabricate questions 8–10.",
    missingArtifact: "Complete approved WAEPA CIR questionnaire, including the missing later questions and explanation instructions", revisitTrigger: "User provides the complete CIR form or an authoritative replacement", preserved: "Approved eligibility, processing, Life question participation, rider-only controls and ABE Review",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
