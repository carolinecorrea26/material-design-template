import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CrosswalkRow } from "./requirementCrosswalk";

const evidence: Record<string, string> = {
  "src/domain/tobaccoLookback.ts": "9252c8abcde5243695b00293f83ba1b5c60c7e13633fc6efc1dd7f9f1a329f33",
  "src/domain/rateInputPolicy.ts": "7c845023e8c79d40206f96539bd67107b741b682c29e2938e04c8c0c23d93c68",
  "src/domain/rateClassPolicy.ts": "7e50bdb4e9e1458f16132719a77be7bc569fdfff90b145226986bdc9ba309b69",
  "src/domain/mockRating.ts": "f823f0c685704e0227d8c8f2183d46912bce15b9e028084995e362f041d4fca7",
  "src/app/usePrototypeRates.ts": "f8c56a086720e473e188c6ed20b0ee374be94ca5634965f022cd35768f9eef17",
  "src/migration/tobaccoLookbackAdoption.ts": "1a1e4ddeb30968813eb942895567863e5eb0a7e408722c456e8763b29c8350f1",
  "src/migration/tobaccoLookbackAdoption.test.ts": "f0e6f694132388998519f7bbf52d915d9ef4c8cb79da8abbaf6c92f07d8378c9",
  "src/migration/reviewAndRateAcceptance.test.ts": "d76107fdcfe5d65a85766f8f597bee3af0f17c5ad22c4c6520387a5699d1b4c6"
};
export function reviewedTobaccoLookbackCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence).length > 0 && Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
/** Only the two explicit lookback statements; the adjoining question/version
 * instruction and other products retain their separate reviews. */
export function reviewTobaccoSourceLookbacks(rows: CrosswalkRow[]) {
  for (const [reference, text, suffix] of [["Main!AD278", "12 months", "general"], ["Main!AD179", "24 months lookback", "atpe"]]) {
    const adopted = rows.find(row => row.id === `atomic.adopted.isitrust.group-term-tobacco.${suffix}`);
    if (!adopted) continue;
    for (const row of rows.filter(row => row.kind === "source-clause" && row.sourceReferences[0] === reference && row.expectedBehavior === text)) {
      row.atomization = "reviewed"; row.scope = structuredClone(adopted.scope);
      row.executionOwners = structuredClone(adopted.executionOwners); row.ownerCandidates = []; row.ownerResolution = adopted.ownerResolution;
      row.implementationReferences = [...adopted.implementationReferences]; row.verificationReferences = [...adopted.verificationReferences]; row.verificationStatus = adopted.verificationStatus;
      row.disposition = adopted.verificationStatus === "recorded-evidence" ? "reviewed-current-template-functionality" : "review-pending";
      row.finding = "Reviewed tobacco lookback: exact source months map to the captured Group Term rating policy and explicit Association override. Mock rating normalizes class/input without altering original answers; ATPE suppression and other source clauses remain separate.";
    }
  }
}
