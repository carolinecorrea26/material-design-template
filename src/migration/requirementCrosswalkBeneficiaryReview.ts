import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { activeSiteMigrationScope } from "./activeSiteScope";

const evidence: Record<string, string> = {
  "src/utils/applicantFacts.ts": "f052270a1977a6e47c49c5da8345edfbd0967ed1ddd67d32b5e41f8cac0a1e63",
  "src/domain/eligibilityFacts.ts": "73a09d0e241061854fe5aba5cd56f2eaf5a0bc49a537a95189fdb7884cd89e5c",
  "src/domain/portfolioHealthParticipation.ts": "e587df2a1a6cdfb9dab8a6237a6de3014720bb99a0f6a9aa70d476dc05120c01",
  "src/domain/coverageJourneyUnderwriting.ts": "4c157dfeaece2d1290a0301f265a3ad3a2e36be36b042f9681f481925beb8df1",
  "src/pages/Beneficiary.tsx": "d7798550f9a989a6125db428297b82ded18ae930ffdf838ebdc3628298fcc917",
  "src/domain/beneficiaryParticipation.ts": "e9787e063de7247e0c8cff3c08fc4dbe4ec8d2e957634a9385fbc3ec1c76ab22",
  "src/domain/beneficiaryValidation.ts": "8fac7385c29a20e36d55dd27d8b6bdd8872dc5ce9bf11ce237359c9aad3b6348",
  "src/domain/beneficiaryNotes.ts": "461f9e51705b5e978a4ab064c1b3ad84113d3cf13cefac006d0f167127ce0a18",
  "src/domain/coverageJourney.ts": "e553a0e2f5a4ef5c40938faa0c960da9415f8f4ebaf3e331c3e224c3ddb2fa50",
  "src/domain/effectiveConfiguration.ts": "643059204c92644dadf272c5a061355cd04199356ff0b52f311dcb6c7fe88efe",
  "src/domain/effectiveSite.ts": "de9dc7ce0f98622b45147ac4a6ebac62e948176d8eccc7bc86d6515dc4055f60",
  "src/config/flowGates.ts": "5512a8cfd8c173dc3c9611023f23c804ab8cee2d3444e6154e9a9c45882a2933",
  "src/config/fields/storedSurfaces.ts": "84f02d94caaea46ae40590d15a30c22db931f4b680aef27809ad09eab1be83e2",
  "src/config/client/getClientPageRequirement.ts": "ca0cd544d79eb023a636af3bfdbf922cd74aecd9bcfe81bddf64833e08295d5f",
  "src/pages/Beneficiary.test.tsx": "55118884d784608b04a039e2db5a762a24f110ec3a226046c632872ac1abbbf5",
  "src/domain/beneficiaryValidation.test.ts": "b3675975347d9a7d0c7b9deee745a78882f2aa2432ee7ebe54764438ab004185",
  "src/migration/beneficiaryParticipationAdoption.test.tsx": "075631f3fa959b888df3d1396596ea97bc2fe1d0f028c02d49de71092c537cda",
  "src/migration/beneficiaryNoteAdoption.test.tsx": "a1bcbe2a7685252bd08033d797bdcf5c11e613989a26c8c821eaf5ec4b286187",
  "src/config/flowGates.test.ts": "d29c8ea362df1746fcee6fbe1b0a4ec663318558ed85e1ed4e413e33be463c04"
};
export function reviewedBeneficiaryCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence).length > 0 && Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
export function beneficiaryOwnerEvidenceHash(db: DatabaseSchema) {
  // Configuration record positions shift when an unrelated setting is compiled.
  // Nested field order and all routing/assignment positions remain evidence.
  const definitions = db.configurationDefinitions.filter(row => ["site-beneficiary-participation", "site-beneficiary-notes", "site-routing-policy", "site-page-participation"].includes(row.definition.target?.kind ?? "") || row.definition.path?.join(".") === "fieldSurfaces").map(row => ({ ...row, position: 0 }));
  const keys = new Set(definitions.map(row => row.key));
  const values = db.configurationValues.filter(row => keys.has(row.configurationKey)).map(row => ({ ...row, position: 0 }));
  const fields = db.fields.filter(row => row.key.startsWith("beneficiary-") || row.key === "beneficiaryType");
  const fieldKeys = new Set(fields.map(row => row.key));
  return createHash("sha256").update(JSON.stringify({ definitions, values, fields, validationRules: db.validationRules.filter(row => fieldKeys.has(row.fieldKey)), sitePages: db.sitePages.filter(row => row.pageKey === "beneficiary"), siteProducts: db.siteProducts, siteProductApplicants: db.siteProductApplicants, siteAssociations: db.siteAssociations, routingRules: db.rules.filter(row => row.definition.execution?.kind === "page-routing"), ruleAssignments: db.ruleAssignments, ruleConditions: db.ruleConditions })).digest("hex");
}
export function reviewBeneficiaryRequirements(db: DatabaseSchema, rows: CrosswalkRow[]) {
  const matches = reviewedBeneficiaryCodeMatches() && beneficiaryOwnerEvidenceHash(db) === "1b1c2f90809f02e859a192e87320eed4b0b455340a13260e436c5eae21410236";
  const sites = activeSiteMigrationScope.sites.filter(row => row.mcrRequired).map(row => row.key);
  const general = db.siteAssociations.filter(row => row.siteKey === "isitrust" && row.enabled && row.associationKey !== atpeAssociationKey).map(row => row.associationKey);
  const tests = ["src/migration/beneficiaryParticipationAdoption.test.tsx", "src/migration/beneficiaryNoteAdoption.test.tsx", "src/pages/Beneficiary.test.tsx", "src/domain/beneficiaryValidation.test.ts"];
  function reviewed(row: CrosswalkRow, finding: string) {
    row.atomization = "reviewed"; row.scope.unresolved = []; row.scope.modes = ["application"];
    row.codeOwner = "Beneficiary, collectsBeneficiaries, native participation/note policies and captured beneficiary field surfaces";
    row.ownerResolution = "code-owned"; row.implementationReferences = ["src/pages/Beneficiary.tsx", "src/domain/beneficiaryParticipation.ts", "src/domain/beneficiaryValidation.ts", "src/config/flowGates.ts"];
    row.verificationReferences = tests; row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = matches ? finding : "Beneficiary source/native/code/test evidence changed; repeat the bounded review before closing.";
  }
  for (const row of rows.filter(row => row.area === "Beneficiary")) {
    if (row.kind === "template-behavior") reviewed(row, "Rendered tests verify product/applicant selection, optional/required page contracts, restored Edit/removal, designation/trust limits, allocation controls and copying with independent IDs. Saved-record validation uses authored field bindings; incompatible copy targets are blocked. Source flags and captured native owners match the reviewed snapshot.");
    if (row.kind !== "source-clause") continue;
    const reference = row.sourceReferences[0];
    if (/^Main!AB\d+$/.test(reference)) {
      if (reference === "Main!AB185" && !/^n\/?a$/i.test(row.expectedBehavior)) { row.area = "Payment and rates"; row.finding = "Smoking/rate instructions are misplaced in the source Beneficiary column. Retain them for the separate smoking/rate review; they do not change the beneficiary flag."; continue; }
      if (reference === "Main!AB278") row.scope.associationKeys = general;
      row.scope.applicantKeys = ["member", "spouse"];
      reviewed(row, "Current Main flag reconciled against each product's native collection and actual routing, including the approved AMA/ISITRUST spouse exclusions, dedicated ATPE CI/AD&D/Graded Benefit flags and general ISITRUST AD&D exclusion. CIR-only zero-base selections skip the page. Applicant eligibility, positive amounts and child automatic rules remain separate.");
      continue;
    }
    const coordinate = /^Beneficiary Note!([A-E])(\d+)$/.exec(reference);
    if (!coordinate) continue;
    const [, column, number] = coordinate, sourceRow = Number(number);
    if (![2, 3, 6].includes(sourceRow) || sourceRow === 3 && /First-to-Die/.test(row.expectedBehavior)) {
      row.atomization = "reviewed"; row.scope.siteKeys = []; row.scope.unresolved = [];
      row.disposition = "source-reference"; row.verificationStatus = matches ? "recorded-evidence" : "not-verified"; row.verificationReferences = tests;
      row.finding = "Explicit CRBG, CAT, LifeHelp, ACEP, ASAE and AMA GI variants and First-to-Die behavior have no current Site/product assignment. Preserve their source without importing it into current Sites.";
      continue;
    }
    row.scope.siteKeys = sourceRow === 6 ? ["csea"] : sites;
    row.scope.applicantKeys = ["member", "spouse"]; row.scope.unresolved = [];
    if (column === "D") {
      row.atomization = "reviewed"; row.scope.modes = ["PDF"]; row.disposition = "deferred";
      row.finding = "Detailed PDF output retains the user's separate deferred scope. Online designation wording has its reviewed native owner.";
    } else reviewed(row, "The user's approved common C2/C3 mapping and dedicated current CSEA C6 wording have captured native assignments and rendering tests. Row/product headings establish source scope; wording and beneficiary participation have separate owners.");
  }
}
