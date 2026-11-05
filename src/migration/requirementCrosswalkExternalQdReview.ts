import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const evidence: Record<string, string> = {
  "src/pages/HealthQd.tsx": "065aaa30db2e466e4ce70d0cf6eaed952470166815c9e92ef62ab4b7f1d08838",
  "src/config/reviewExperience.ts": "366407fbb671a83d79bf8bfa0627235893ba0ed0abefb87c13e4754ee950360c",
  "src/domain/reviewPolicy.ts": "9c022d981faa8283af86d001ea8e7be2a94c04709f646163a4b7754078e21d65",
  "src/migration/reviewAuthorizationAdoption.ts": "11e839a0e63de208ce8a6dc8781486ece4c7a645eb2bb0dbf37143bc0e70b0c4",
  "src/migration/externalQdQuestionnaireDecision.test.ts": "893ffb4b451fe25f1e8a8d0beeb0446bcad31ed4d4b355e7ea7e18e79da4f3f7",
  "src/migration/externalQdQuestionnaireDecision.ts": "f5c718117fa9b492428d432c1fd2d5ba207ad90775aef817c0b922e81d274615"
};
export function reviewedExternalQdCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
