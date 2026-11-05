import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { asceBusinessDecisions, inspectAsceBusinessDecisions } from "../domain/asceBusinessDecisions";
import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";

const evidence: Record<string, string> = {
  "src/domain/effectiveSite.ts": "de9dc7ce0f98622b45147ac4a6ebac62e948176d8eccc7bc86d6515dc4055f60",
  "src/domain/coverageRuntime.ts": "76382b6aab9ef6a233bbadf266458e6ffdc0db63cb18d0d7854bb31e2efb304c",
  "src/domain/fieldCollections.ts": "3100997a191634bc6b81a117158fdcdca6d518fb94256bd36d6b1912a746bdb5",
  "src/utils/applicantFacts.ts": "f052270a1977a6e47c49c5da8345edfbd0967ed1ddd67d32b5e41f8cac0a1e63",
  "src/domain/asceBusinessDecisions.ts": "f966edb7575d746e458f7f605de3c5dba30829733b0f2c2bcd495858b45cdfc0",
  "src/migration/asceBusinessDecisions.test.ts": "06ee00b0c22073b2a16c9a61996831de7e9c84227e572b7619e1a24fcd328aed",
  "src/migration/nsoAccidentAgeAdoption.ts": "02482be8e2250d78dce100ea695bdce7d98098832ce2b8f0eb80a2ddf2b3729c",
  "src/migration/nsoAccidentAgeAdoption.test.ts": "ec03c051b23f013053e7ee1ad2088af080563a500cbebb9ad70b3651054233fc",
  "src/migration/sources/mcr-v78.json": "a93cb29e6ed20aa05b67e3bf22bb4554baf3a58ebf5d1df7b539a5466a49471a",
  "src/migration/activeSiteIdentity.ts": "9eab31a2302b78da245e8e23306ecd176022560f601ae9a60dfbdadde4b45ac0",
  "src/migration/activeSiteEligibilityAdoption.ts": "807a44e48511a1d835d61a49cfe0aa214189bc9655bee560a7cfb1ccdc6d0097",
  "src/migration/canonicalAgeSourceReview.test.ts": "c66a40e0b01b918d93ec20df6872fae408a1ef85004af58a33db7139b084eaa5"
};
export function reviewedAgeCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence).length > 0 && Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
/** Exact source statements only. Other product ages and qualifiers remain separate. */
export function reviewAgeSourceStatements(db: DatabaseSchema, rows: CrosswalkRow[]) {
  for (const [cell, applicant] of [["O320", "member"], ["P320", "spouse"], ["Q320", "child"]]) {
    const atoms = rows.filter(row => row.id.startsWith(`atomic.adopted.nso.accident-ages.${applicant}.`));
    if (!atoms.length) continue;
    const expected = applicant === "child" ? "through age 18 (through age 25 full time student)" : "17- through 69";
    for (const row of rows.filter(row => row.kind === "source-clause" && row.sourceReferences[0] === `Main!${cell}` && row.expectedBehavior === expected)) {
      const matches = atoms.length === 2 && atoms.every(atom => atom.verificationStatus === "recorded-evidence");
      row.atomization = "reviewed"; row.scope = structuredClone(atoms[0].scope);
      row.executionOwners = structuredClone(atoms[0].executionOwners); row.ownerCandidates = []; row.ownerResolution = "recorded-review";
      row.implementationReferences = [...atoms[0].implementationReferences]; row.verificationReferences = [...atoms[0].verificationReferences]; row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
      row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
      row.finding = "Reviewed NSO accident ages: this source range is reconciled with its two separately enumerated age bounds and native applicant constraint. Child student status uses the shared collection. Family amounts and other source instructions remain separate.";
    }
  }
  const groups = new Map<string, CrosswalkRow[]>();
  for (const atom of rows.filter(row => row.id.startsWith("atomic.adopted.canonical-age."))) {
    const source = atom.sourceReferences[0]; groups.set(source, [...(groups.get(source) ?? []), atom]);
  }
  for (const [source, atoms] of groups) for (const row of rows.filter(row => row.kind === "source-clause" && row.sourceReferences[0] === source)) {
    const matches = atoms.length === 2 && atoms.every(atom => atom.verificationStatus === "recorded-evidence");
    row.atomization = "reviewed"; row.scope = structuredClone(atoms[0].scope);
    row.executionOwners = structuredClone(atoms[0].executionOwners); row.ownerCandidates = []; row.ownerResolution = "recorded-review";
    row.implementationReferences = [...atoms[0].implementationReferences]; row.verificationReferences = [...atoms[0].verificationReferences]; row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = "Reviewed unqualified source ages: the complete anchored age statement is split into its minimum and maximum completed-year bounds, with a unique canonical Site/product/applicant constraint. Only those dimensions are compared. Qualified source ranges and other predicates retain their separate review.";
  }
  const approvals = inspectAsceBusinessDecisions(db);
  for (const [sourceRow, product, expected] of [[165, "li-10yr", "17- through age 64"], [166, "li-20yr", "17 - through age 54"]] as const) {
    const decision = asceBusinessDecisions.find(row => row.key === `asce.${product}.base-eligibility-ages`)!;
    const matches = reviewedAgeCodeMatches() && approvals.find(row => row.key === decision.key)?.approved === true;
    for (const column of ["O", "P"]) for (const row of rows.filter(row => row.kind === "source-clause" && row.sourceReferences[0] === `Main!${column}${sourceRow}` && row.expectedBehavior === expected)) {
      row.atomization = "reviewed"; row.scope.siteKeys = ["asce"]; row.scope.productKeys = [product]; row.scope.applicantKeys = [column === "O" ? "member" : "spouse"]; row.scope.unresolved = [];
      row.executionOwners = decision.targets.filter(target => target.values.applicantTypeKey === row.scope.applicantKeys[0]).map(({ table, key }) => ({ table, key })); row.ownerCandidates = []; row.ownerResolution = "recorded-review";
      row.codeOwner = "Canonical eligibility evaluation; existing explicit ASCE approval supersedes this source age range";
      row.implementationReferences = ["src/domain/asceBusinessDecisions.ts", "src/domain/effectiveSite.ts"];
      row.verificationReferences = ["docs/asce-business-decisions.md", "src/migration/asceBusinessDecisions.test.ts", "src/migration/nsoAccidentAgeAdoption.test.ts"];
      row.verificationStatus = matches ? "recorded-evidence" : "not-verified"; row.disposition = matches ? "superseded-by-user-decision" : "review-pending";
      row.finding = `Reviewed ASCE approved ages: retain ${decision.answer} The prior explicit approval takes precedence over this source range. Exact persisted approval and applicant constraints are validated; other eligibility and underwriting requirements retain their separate scope.`;
    }
  }
}
