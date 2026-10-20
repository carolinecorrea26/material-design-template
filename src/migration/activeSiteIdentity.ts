import type { DatabaseSchema } from "../persistence/types";
import { activeSiteMigrationScope } from "./activeSiteScope";
import type { SourceCell } from "./mcr";

/** Reviewed semantic crosswalk, not a name/plan-code heuristic or activation list.
 * A source row identifies evidence to review; it does not adopt its whole policy.
 */
export const activeSiteMainRows: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "abe": { "li-term": 39, "li-10yr": 40, "li-20yr": 41, "li-50plus": 42, "li-add": 43, "di-ltd-plus": 44, "di-ltd": 45, "di-mtd": 46, "sh-critical-illness": 47, "oo-professional": 48, "sh-hospital-money": 49 },
  "ama": { "sh-hospital-income": 117, "di-step-rated": 118, "di-level-rated": 119, "li-10yr": 120, "li-15yr": 121, "li-20yr": 122, "li-term": 123, "li-preferred": 124, "oo-office-overhead": 125, "li-premier-accident": 126 },
  "asce": { "li-10yr": 165, "li-20yr": 166, "li-term": 167, "li-add": 168, "di-ltd": 169 },
  "avma": { "li-group-term": 187, "li-10yr": 188, "li-20yr": 189, "li-50plus": 190, "li-add": 191, "di-ltd": 192, "di-ltd-plus": 193, "di-short-term": 194, "sh-critical-illness": 195, "oo-professional": 196, "li-term": 197, "sh-hospital-income": 198 },
  "nso": { "li-term": 318, "li-50plus": 319, "li-add": 320, "di-ltd": 321, "li-10yr": 322, "li-20yr": 323 },
  "isitrust": { "li-group-term": 278, "di-ltd": 279, "oo-professional": 280, "di-short-term": 281, "li-add": 282, "li-10yr": 283, "li-20yr": 284, "sh-hospital-income": 285, "sh-critical-illness": 286, "li-50plus": 287 },
  "waepa": { "li-group-term": 379, "di-short-term": 380 },
  "waepa-gi": { "li-group-term": 386 },
};
const sourceOwners: Record<string, string> = {
  "abe": "ABE", "ama": "AMA", "asce": "ASCE", "avma": "AVMA LIFE",
  "nso": "NSO", "isitrust": "ISI", "waepa": "WAEPA",
  "waepa-gi": "WAEPA - GI\n\nSite turn on on May21st 2024",
};
const blocked: Record<string, string> = {
  "csea.li-add": "User-confirmed October 5 member-only optional AD&D product with the supplied reference rate table. No exact standalone Main product row or approved G-number/plan/document identifiers are established; retain the enabled mock scope and reconcile those identifiers separately. Do not adopt another client’s AD&D identity or treat the DI included $5,000 benefit as this standalone product.",
  "csea.di-ltd": "Standard CSEA is explicitly documented in URLs row 64 and Attestation row 69. Main row 246 matches its dependent/rider behavior but is labeled CSEA GI; preserve it as a variant-review candidate, not an adopted standard identity. Row 247 and the separate CSEAGI Site remain outside initial migration.",
  "waepa-gi.di-short-term": "Inherited from the shared WAEPA client in the prototype. No disability product is established for WAEPAGI by Main row 386 or the scoped legacy reference. Reconcile the GI portfolio before activation; do not use standard row 380 as GI authority.",
};
export const identityDomainColumns = {
  identity: ["B", "C", "D", "E", "F", "G"], applicantsAndAmounts: ["H", "I", "J"],
  dependenciesAndRiders: ["K", "L"], residency: ["M", "N"], eligibility: ["O", "P", "Q"],
  underwritingAndQuestions: ["R", "S", "T", "U", "V", "W"],
  payment: ["AE", "AF", "AG", "AH", "AI", "AJ", "AK"], rates: ["AN", "AO", "AP", "AQ", "AR"],
} as const;

/** Fail closed on scope/ownership drift and account for every enabled assignment.
 * Does not infer applicant classes, dummy/XML/PDF identifiers or policy from prose.
 */
export function reviewActiveSiteIdentities(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const mainCells = cells.filter(cell => cell.sheet === "Main");
  const main = new Map(mainCells.map(cell => [cell.cell, cell]));
  if (main.size !== mainCells.length) throw new Error("Duplicate Main source cells");
  const evidence = (column: string, row: number) => {
    const cell = main.get(`${column}${row}`);
    return cell ? { reference: `Main!${cell.cell}`, value: cell.value, formula: cell.formula, comment: cell.comment } : null;
  };
  const assignments = activeSiteMigrationScope.sites.flatMap(scope => {
    const sites = db.sites.filter(site => site.key === scope.key);
    if (sites.length !== 1 || db.clients.find(client => client.id === sites[0].clientId)?.key !== scope.clientKey) throw new Error(`Invalid identity Site ownership: ${scope.key}`);
    const products = db.siteProducts.filter(row => row.siteId === sites[0].id && row.enabled);
    if (new Set(products.map(row => row.productKey)).size !== products.length) throw new Error(`Duplicate identity assignments: ${scope.key}`);
    for (const key of Object.keys(activeSiteMainRows[scope.key] ?? {})) if (!products.some(product => product.productKey === key)) throw new Error(`Stale crosswalk product: ${scope.key}.${key}`);
    return products.map(product => {
      const provisional = scope.key === "csea" && product.productKey === "di-ltd" && db.semanticRequirements.some(decision => {
        if (decision.key !== "provisional-decision.csea.identity" || decision.domain !== "provisional-source-decision" || !decision.value || typeof decision.value !== "object" || Array.isArray(decision.value)) return false;
        const selected = decision.value.selected;
        return decision.value.sourceReconciliation === "deferred" && decision.value.revisit === true && selected && typeof selected === "object" && !Array.isArray(selected) && selected.sourceRow === 246 && selected.siteVariant === "standard"
          && db.productIdentifiers.some(identifier => identifier.siteKey === scope.key && identifier.productKey === product.productKey && identifier.kind === "gNumber" && JSON.stringify(identifier.definition) === JSON.stringify({ primary: "G-11628-0" }))
          && db.productIdentifiers.some(identifier => identifier.siteKey === scope.key && identifier.productKey === product.productKey && identifier.kind === "planCode" && JSON.stringify(identifier.definition) === JSON.stringify({ primary: "601" }));
      });
      const row = provisional ? 246 : activeSiteMainRows[scope.key]?.[product.productKey];
      const key = `${scope.key}.${product.productKey}`;
      if (!scope.mcrRequired) return { key, siteKey: scope.key, productKey: product.productKey, status: "synthetic" as const, row: null, reason: "Demo regression fixture; no MCR policy.", evidence: null };
      if (!row) {
        if (!blocked[key]) throw new Error(`Unreviewed identity assignment: ${key}`);
        return { key, siteKey: scope.key, productKey: product.productKey, status: "blocked" as const, row: null, reason: blocked[key], evidence: null };
      }
      if (main.get(`B${row}`)?.value !== (provisional ? "CSEA GI" : sourceOwners[scope.key])) throw new Error(`Source Site variant mismatch: ${key}/Main!B${row}`);
      if (!main.get(`D${row}`)?.value || !main.get(`E${row}`)?.value || main.get(`G${row}`)?.value == null) throw new Error(`Incomplete source identity: ${key}`);
      return { key, siteKey: scope.key, productKey: product.productKey, status: "source-linked" as const, row,
        ...(provisional ? { provisional: true } : {}),
        reason: provisional ? "User-authorized provisional standard CSEA mapping to row 246. Literal GI label retained; revisit source variant and remaining policy." : "Explicit product-semantic crosswalk. Identifier roles/classes and each applicable coverage rule still require adoption and execution checks.",
        evidence: Object.fromEntries(Object.entries(identityDomainColumns).map(([domain, columns]) => [domain, columns.flatMap(column => { const cell = evidence(column, row); return cell ? [cell] : []; })])),
      };
    });
  });
  return { version: 1, sourceSha256: activeSiteMigrationScope.sources.mcr.sha256, assignments,
    summary: { assignments: assignments.length, sourceLinked: assignments.filter(row => row.status === "source-linked").length,
      blocked: assignments.filter(row => row.status === "blocked").length, synthetic: assignments.filter(row => row.status === "synthetic").length,
      runtimeActivationReady: false },
    sourceDiscoveries: [{
      siteKey: "csea", status: "standard-site-evidence-found-main-label-ambiguous",
      mainCandidateRow: 246, excludedMainRow: 247,
      explanation: "URLs A64 identifies CSEA separately from CSEAGI at A63. Attestation C69 establishes standard spouse Accident Disability and child ER benefits matching I246/J246, unlike I247/J247. This supports a possible mislabeled Main row, not automatic adoption. California CSEA/CALSEA and CSEACAP remain separate variants.",
      evidence: cells.filter(cell =>
        cell.sheet === "URLs" && ["A63", "B63", "A64", "B64", "A65", "A66"].includes(cell.cell) ||
        cell.sheet === "Attestation Online and PDF" && ["A69", "C69", "E69"].includes(cell.cell) ||
        cell.sheet === "New UX Single-Page Requirements" && ["A27", "D27", "AA27"].includes(cell.cell) ||
        cell.sheet === "Read & Sign" && ["B122", "C122"].includes(cell.cell) ||
        cell.sheet === "Associations" && ["A60", "C60", "D60"].includes(cell.cell) ||
        cell.sheet === "Main" && /^[A-Z]+24[67]$/.test(cell.cell)
      ).map(cell => ({ reference: `${cell.sheet}!${cell.cell}`, value: cell.value, formula: cell.formula, comment: cell.comment })),
    }],
    portfolioReview: [
      { siteKey: "ama", row: 118, reason: "User approved October 19: Step-rated Disability is included as di-step-rated, separately from level-rated row 119." },
      { siteKey: "csea", row: null, reason: "Standard legacy CSEA includes automatic AD&D and dependent rider behavior absent from the one-product prototype. Required applicability and representation review; CSEA GI is excluded." },
    ],
  };
}
