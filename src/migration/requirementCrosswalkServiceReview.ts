import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Reviewed October 20, 2026 after the recovery boundary, restart, isolation,
 * client-save and rendered resume tests passed. Code/test changes require review. */
const evidence = {
  "scripts/applicant-saves.mjs": "c5183a708bd6f3fdf694542796c18f9233059598edbd3c4f9b12582579e59c29",
  "src/services/applicantSaveService.ts": "b65f9f1781855bf8cdbf2644a8693ef4a928531f12b225ce6ba6f7a59392c7cc",
  "scripts/applicant-saves.test.mjs": "4580ef1ecf17a5c1f738ee5e85e4d4648eec595e697ed5dae806e3a3e27cd07d",
  "src/services/applicantSaveService.test.ts": "1d6d967ba1c0fc2baa658a28da866cd26e7bbd2208c3e7ea601a35ec1760bb5a",
  "src/pages/ResumeFlow.test.tsx": "02ae8bca58cd66fb38a46f4d29e176810332cec367a80a0beaab02e1028ab99b",
};
export function reviewedRecoveryServiceMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.entries(evidence).every(([path, expected]) => createHash("sha256").update(read(path)).digest("hex") === expected);
}
const persistenceEvidence = {
  "src/config/client/coverageProductScope.test.ts": "f50411fa97d15ab6488e72ad1209670f2ee712fe4ed77b8eefa1afe5e6184302",
  "src/app/ApplicationFormContext.entryScope.test.tsx": "f995fc6806d025bbee81eb842eb576e5ed27bfcfc71f9cd9344231cdc7ad7932",
  "src/config/client/getActiveClientCoverages.ts": "4acd89d512ae1181737bc236e346d0dcde11c4f97777c4e7c61a7a13487ce578",
  "src/config/client/coverageCategoryScope.ts": "8b16a70a2d480818e5746fc5123329928aab0806b8b5e2a99751392f76961f92",
  "src/config/client/coverageProductScope.ts": "de8ef410a1ac9180f9142f6139357db59c72ab958b25793e6d80923764e8262c",
  "src/app/RoutePage.tsx": "0758c408d2246da3e4cb59a0c5370c913a047c4c110792ec1bcd3a13fd555ae3",
  "src/app/RoutePage.persistence.test.tsx": "ac452c633f02bc37208d00d6c05b011afd4ffaafa68ef6dca619286c7dca0abe",
  "src/app/ApplicationFormContext.tsx": "670e261fe696434a78fb77d7fb19ae79d92854d2257b6f253e08a63fce729639",
  "src/components/layout/SinglePageSections.tsx": "85eb91654952b83a96284b092994b08cf60192d029ee86082b85bcd0deef8f40",
  "src/components/feedback/AppSnackbar.tsx": "626d7fc3c5a64691d740c4a509b89d4d9a2e9ab7ae9f29156a756b282136df57",
  "src/components/feedback/AppSnackbar.test.tsx": "6d3f7f05d33082a9e48c8a4b59750f39d94b74391600f72c766d115b8de5a542",
  "src/pages/Payment.tsx": "0331b9ef6a870d7fc6e47b60928e20a957c1c899e03d5b968d947ae77a2193c5",
  "src/pages/Payment.revalidation.test.tsx": "92c018cecb74c4574965bae7ebf288dc114ee8a1483d1844fd6c257638e2e0f3",
  "src/migration/ruleOwnerReferences.ts": "8b612a2d0db9af6b705e18b1951ba95c1848a5a1734663b3f657cc0674cccaf1",
  "src/content/docs/siteRules.ts": "99f9c3dacfccbc8337504d8f27a0f6eb9734f903aab73e573100a1ce0739e356",
};
export function reviewedPersistenceUiMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return reviewedRecoveryServiceMatches(read) && Object.entries(persistenceEvidence).every(([path, expected]) => createHash("sha256").update(read(path)).digest("hex") === expected);
}
