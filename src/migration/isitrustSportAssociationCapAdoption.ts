import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const sportAssociationCapDecisionKey = "business-decision.rules-review.isitrust-sport-association-member-caps";
export const sportAssociationKeys = ["usa-fencing", "us-equestrian-federation"];
export function applyIsitrustSportAssociationCapAdoption(db: DatabaseSchema) {
  const authority = "User decision October 21, 2026; Attestation Online and PDF!C86: USA Fencing/US Equestrian Federation member AD&D and Group Term Life maximum $500,000";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const source = String(currentMcrSource.cells.find(row => row.sheet === "Attestation Online and PDF" && row.cell === "C86")?.value ?? "");
  if (!["USA Fencing", "US Equestrian Federation", "G-31132-0", "G-31136-0", "$500,000"].every(value => source.includes(value)) || sportAssociationKeys.some(key => !db.siteAssociations.some(link => link.siteKey === "isitrust" && link.associationKey === key))) throw new Error("ISITRUST sport Association source scope changed");
  const selected = ["li-add", "li-group-term"].map(productKey => {
    const base = db.productAmountRules.find(row => row.siteKey === "isitrust" && row.productKey === productKey && row.applicantTypeKey === "member" && row.applicantClass === null);
    const baseBands = db.amountBands.filter(row => row.amountPatternKey === base?.amountPatternKey);
    const band = baseBands[0];
    if (!base || baseBands.length !== 1 || !band || band.conditionKey || band.minimum === null || band.maximum === null || band.increment === null || band.increment <= 0 || band.minimum > 500000 || band.maximum < 500000 || (500000 - band.minimum) % band.increment) throw new Error(`Review member increment before applying cap: ${productKey}`);
    const { minimum, increment } = band, amountPatternKey = `shared.range.${minimum}-500000-by-${increment}`;
    if (!db.coverageAmountPatterns.some(row => row.key === amountPatternKey)) {
      db.coverageAmountPatterns.push({ ...meta("coverageAmountPatterns", amountPatternKey), patternKey: "coverage-amount-options", amountType: "range", minimum: null, maximum: null, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
      db.amountBands.push({ ...meta("amountBands", `${amountPatternKey}.band`), amountPatternKey, minimum, maximum: 500000, increment, conditionKey: null, position: 0 });
    }
    const configurationKey = `shared.${productKey}.association-amount-restrictions`, key = `isitrust.${productKey}.sport-association-member-amounts`;
    if (!db.configurationDefinitions.some(row => row.key === configurationKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "product-association-amounts", productKey } } });
    const value = { version: 1, associationKeys: [...sportAssociationKeys], amounts: [{ applicantKey: "member", amountPatternKey }] };
    const row = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "isitrust", clientKey: null, configurationKey, value: value as unknown as Json };
    const index = db.configurationValues.findIndex(row => row.key === key); if (index < 0) db.configurationValues.push(row); else db.configurationValues[index] = row;
    return { productKey, key, value, minimum, increment, amountPatternKey, band: structuredClone(db.amountBands.find(row => row.amountPatternKey === amountPatternKey)!) };
  });
  const key = sportAssociationCapDecisionKey, row = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "association-member-amount-cap", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", sourceReferences: ["Attestation Online and PDF!C86"], selected,
    interpretation: "USA Fencing and US Equestrian Federation member AD&D and Group Term Life each cap at $500,000, preserving the existing minimum and increment. Group Term already has this maximum in the general prototype; its explicit assignment retains the source exception independently. Spouse/child amounts, other Associations, ATPE and eligibility remain separate.",
    destinations: selected.flatMap(row => [{ table: "configurationValues", key: row.key, column: "value" }, { table: "amountBands", key: row.band.key }]),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
