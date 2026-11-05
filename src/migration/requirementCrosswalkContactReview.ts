import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CrosswalkRow } from "./requirementCrosswalk";

const evidence = {
  "src/utils/fieldValidation.ts": "e482e3b197dcfc2354e436b386e4d99ef67fba90380be0ed3d69759324dbdb75",
  "src/migration/requirementCrosswalkFieldReview.ts": "7b645424cb6eadcf1bae87be0ba9b95de5612e18197347dd326c102173438879",
  "src/migration/profileCollectionReview.test.ts": "c23c178c95c4df3511336dedec2ea0cf78f963bf52ec7d4fcb4aa8b25e7b1faf",
  "src/pages/Contact.tsx": "b830f56a217983239b3804c525c80bdda55ff99f31768f7b2fbf26b5d32af6de",
  "src/domain/applicantExperience.ts": "0847a51ca17e8fed0ed442c32d812f561d98f8a612dd553bd6765d01401e6099",
  "src/config/clientFields/getClientPageFields.ts": "e5ec338bf8203e8fd6e8862f96107ef66e383667316a56c5b89a1305191592d1",
  "src/config/applicationTransitions/applicationTransitions.ts": "0da5c76f31ad330e3dff1a1b0d4ec9829fe1b265d207f7a586f8399f4213f499",
  "src/config/applicationTransitions/executeApplicationTransition.ts": "6bbc48bd08d4cbfc4dea73c368f8e2da29207279d73ebb296792964b68f022bb",
  "src/pages/Contact.test.tsx": "9c1dbcc0db2d36578ff06414403a2479d5c95d36143686f2cc7f451dce01188b",
  "src/config/applicationTransitions/applicationTransitions.test.ts": "1591efe5edbece8392993b59d7a41ad446ed28888e6d2aa29557f79985c90858",
};
export function reviewedContactCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
export function reviewContactRequirements(rows: CrosswalkRow[]) {
  const matches = reviewedContactCodeMatches();
  for (const [sourceSuffix, adoptionSuffix] of [["phone-not-contact", "telephone-placement"], ["no-business-address", "life-business-hidden"]]) {
    const source = rows.find(row => row.id === `atomic.waepa.li-group-term.${sourceSuffix}`);
    const adopted = rows.find(row => row.id === `atomic.adopted.waepa.contact.${adoptionSuffix}`);
    if (!source || !adopted) continue;
    source.executionOwners = adopted.executionOwners; source.ownerCandidates = []; source.ownerResolution = adopted.ownerResolution;
    source.implementationReferences = ["src/domain/applicantExperience.ts", "src/config/clientFields/getClientPageFields.ts", "src/pages/Contact.tsx"];
    source.verificationReferences = ["src/pages/Contact.test.tsx"];
    source.verificationStatus = matches && adopted.verificationStatus === "recorded-evidence" ? "recorded-evidence" : "not-verified";
    source.disposition = source.verificationStatus === "recorded-evidence" ? "reviewed-current-template-functionality" : "review-pending";
    source.finding = "Bounded source clause matches the separately approved WAEPA Contact owners: telephone remains on Membership; Life-only hides business details while STD has its explicit exception. Source and regression-test fingerprints must match.";
  }
  for (const row of rows.filter(row => row.kind === "template-behavior" && row.area === "Contact")) {
    row.codeOwner = row.ruleKeys.includes("rule-contact-eligibility-address-carry-forward") ? "contactCarryForwardTransition and executeApplicationTransition" : "ContactFields/renderBusinessFields and captured applicant-experience Contact configuration";
    row.ownerResolution = "code-owned";
    row.verificationReferences = ["src/pages/Contact.test.tsx", "src/config/applicationTransitions/applicationTransitions.test.ts"];
    row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = matches ? "Reviewed shared Contact behavior: empty-only location carry-forward, captured STD/Life/GI visibility, DI/OO/correspondence defaults and same-as-home copying. Source and rendered/boundary regression-test fingerprints match." : "Contact implementation or verification evidence changed; repeat the bounded review before closing this behavior.";
  }
}
