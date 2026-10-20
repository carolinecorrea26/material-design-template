import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { asceBusinessDecisions } from "../domain/asceBusinessDecisions";
import { mcrSource, type SourceCell } from "./mcr";

const metadata = (table: string, key: string, reference: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
/** Only a complete, unqualified age cell matches. No first-number extraction,
 * date approximation for months, or silent repair of contradictory ages.
 */
export function parseUnqualifiedAge(text: string) {
  const adult = /^(?:ages?\s+)?(\d+)\s*(?:-\s*)?(?:through\s*(?:age\s*)?|[-–]\s*)(\d+)$/i.exec(text.trim());
  if (!adult || Number(adult[1]) > Number(adult[2])) return null;
  return { minimumAgeYears: Number(adult[1]), maximumAgeYears: Number(adult[2]) };
}

export function applyActiveSiteAgeAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const actual = new Map(cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const expected = new Map(mcrSource.cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const work = Object.entries(activeSiteMainRows).flatMap(([siteKey, products]) => Object.entries(products).flatMap(([productKey, row]) => ["member", "spouse", "child"].flatMap((applicantTypeKey, index) => {
    if (siteKey === "nso" || siteKey.startsWith("waepa-")) return [];
    const reference = `Main!${["O", "P", "Q"][index]}${row}`;
    const cell = actual.get(reference);
    if (JSON.stringify(cell) !== JSON.stringify(expected.get(reference))) throw new Error(`Age adoption source changed: ${reference}`);
    if (!cell || !db.siteProductApplicants.some(a => a.siteKey === siteKey && a.productKey === productKey && a.applicantKey === applicantTypeKey)) return [];
    // Exact ASCE approvals have precedence; no MCR replacement of those targets.
    if (asceBusinessDecisions.some(decision => decision.targets.some(target => target.table === "eligibilityConstraints" && target.values.siteKey === siteKey && target.values.productKey === productKey && target.values.applicantTypeKey === applicantTypeKey))) return [];
    const ages = parseUnqualifiedAge(String(cell.value));
    if (!ages) return [];
    return [{ siteKey, productKey, applicantTypeKey, reference, ages }];
  })));
  for (const item of work) {
    const { siteKey, productKey, applicantTypeKey, reference, ages } = item;
    const key = `${siteKey}.${productKey}.reviewed-age.${applicantTypeKey}`;
    // Adopt the age dimension without clearing separately recorded work/unmarried
    // constraints. Provenance for any other dimension remains on its own source.
    const existing = db.eligibilityConstraints.filter(c => c.siteKey === siteKey && c.productKey === productKey && c.applicantTypeKey === applicantTypeKey);
    if (existing.length > 1) throw new Error(`Ambiguous age target: ${key}`);
    const other = existing[0];
    const constraintKey = other?.key ?? key;
    const constraint = { ...metadata("eligibilityConstraints", constraintKey, other && [other.minimumAgeDays, other.studentMaximumAgeYears, other.unmarried, other.minimumWorkHours].some(value => value !== null) ? `${reference}; other dimensions: ${other.sourceReference}` : reference), productKey, siteKey, applicantTypeKey, minimumAgeDays: other?.minimumAgeDays ?? null, ...ages, studentMaximumAgeYears: other?.studentMaximumAgeYears ?? null, unmarried: other?.unmarried ?? null, minimumWorkHours: other?.minimumWorkHours ?? null };
    db.eligibilityConstraints = db.eligibilityConstraints.filter(c => c.siteKey !== siteKey || c.productKey !== productKey || c.applicantTypeKey !== applicantTypeKey);
    db.eligibilityConstraints.push(constraint);
    const requirementKey = `mcr.main.${reference.split("!")[1]}`;
    const source = db.sourceRequirements.find(r => r.key === requirementKey)!;
    source.promotionState = "SITE_CONFIGURATION";
    source.promotionReason = "Inclusive completed-year age boundaries adopted; other eligibility dimensions remain separate.";
    source.activeSiteKeys = [...new Set([...(Array.isArray(source.activeSiteKeys) ? source.activeSiteKeys as string[] : []), siteKey])];
    for (const column of ["minimumAgeYears", "maximumAgeYears"]) {
      const targetKey = `migration-decision.${key}.${column}`;
      db.requirementTargets = db.requirementTargets.filter(t => t.key !== targetKey);
      db.requirementTargets.push({ ...metadata("requirementTargets", targetKey, reference), requirementKey, targetTable: "eligibilityConstraints", targetKey: constraintKey, targetColumn: column });
    }
  }
}
