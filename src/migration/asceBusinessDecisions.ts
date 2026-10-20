import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { asceBusinessDecisions, decisionRecord, reference } from "../domain/asceBusinessDecisions";
export { asceBusinessDecisions, inspectAsceBusinessDecisions } from "../domain/asceBusinessDecisions";

/** Fixture/export compiler only. Never called by compatibility or runtime repositories. */
export function applyAsceBusinessDecisions(db: DatabaseSchema) {
  for (const decision of asceBusinessDecisions) {
    for (const target of decision.targets) {
      const rows = db[target.table] as unknown as Array<Record<string, unknown>>;
      const record = { id: target.key, key: target.key, ...target.values,
        ...libraryMetadata(target.table, target.key, reference(decision)) };
      const index = rows.findIndex(row => row.key === target.key);
      if (index < 0) rows.push(record); else rows[index] = record;
    }
    const record = decisionRecord(decision);
    const index = db.semanticRequirements.findIndex(row => row.key === record.key);
    if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
  }
}

