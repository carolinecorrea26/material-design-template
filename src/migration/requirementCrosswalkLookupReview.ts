import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CrosswalkRow } from "./requirementCrosswalk";
const evidence: Record<string, string> = {
  "src/migration/reviewAndRateAcceptance.test.ts": "d76107fdcfe5d65a85766f8f597bee3af0f17c5ad22c4c6520387a5699d1b4c6",
  "src/domain/rateModifiers.ts": "b34a110e69e773a6b2395c518955b39a99e2c46c509ef22dfc6dee5af7c22d50",
  "src/domain/membershipLookup.ts": "df54df2f0d8550ee0d89aeacf44abf4363fd3f5d3c5d7311007c23d845146f68",
  "src/domain/membershipLookup.test.ts": "e9755112138acf968f414c5354221828d29b4fda71412e02bafe112a9c80077f",
  "src/domain/applicantExperience.ts": "0847a51ca17e8fed0ed442c32d812f561d98f8a612dd553bd6765d01401e6099",
  "src/services/membershipLookupService.ts": "b86c9c5a3857a34bda4ad5b7b116b786b8f293817e564f2e990bcb7f50cf630f",
  "src/pages/Membership.tsx": "e96e704925285686029caaed412f26d6e5490eeb21e3bc08a419fce676cc820c",
  "src/pages/Membership.lookup.test.tsx": "9ddd79cb8e7ad8b5769d8746df9eb3a162410627526739deed8cc4d7329d2c57",
  "src/pages/Home.tsx": "8e710c5553d9ee834e1b859e8851c0898abde9f5fc6f465c49a834821977be94",
  "src/pages/Home.notice.test.tsx": "bdfdf5d31fa20a34e39ed27f9e5049a861ec8b3d020f74275c509550a02b24a4",
  "src/app/usePrototypeRates.ts": "f8c56a086720e473e188c6ed20b0ee374be94ca5634965f022cd35768f9eef17",
  "src/migration/membershipLookupAndLandingAdoption.ts": "1a13e6b55d0c66f047827a3a1f688c38d3267843aa4952197865e23e3a0f877a",
  "src/migration/membershipLookupAndLandingAdoption.test.ts": "303588d078a12c0b99396915e7e062d2e09ad60ffee24ece49b2b95f0f136d41",
  "scripts/mock-platform.mjs": "605266242ac764f14fd71ab6740dc3173bb299c71d320486bd6b10b30e8ce5dd",
  "scripts/mock-platform.test.mjs": "83a8fe630b5536423403fce73c60db2c82a0e1cf105e0e8ef8684e8907d6fc74",
  "src/migration/sources/mcr-v78.json": "a93cb29e6ed20aa05b67e3bf22bb4554baf3a58ebf5d1df7b539a5466a49471a"
};
export function reviewedLookupAndLandingCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence).length > 0 && Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
export function reviewLookupAndLandingRequirements(rows: CrosswalkRow[]) {
  const codeMatches = reviewedLookupAndLandingCodeMatches();
  const lookup = rows.find(row => row.id === "atomic.adopted.ama.mock-membership-lookup");
  const landing = rows.find(row => row.id === "atomic.adopted.abe.landing-dividend-notice");
  for (const adopted of [lookup, landing]) if (adopted && !codeMatches) { adopted.verificationStatus = "not-verified"; adopted.disposition = "review-pending"; adopted.finding = "Mock lookup/landing code or tests changed; repeat the bounded verification before accepting this requirement."; }
  const matchesLookup = codeMatches && lookup?.verificationStatus === "recorded-evidence";
  const matchesLanding = codeMatches && landing?.verificationStatus === "recorded-evidence";
  for (const row of rows) {
    const sourceLookup = row.kind === "source-requirement" && /^atomic\.ama\.di-(step|level)-rated\.(name-before-lookup|dob-before-lookup|ama-api-transfer|medical-education-number-api|nonmember-participation)$/.test(row.id);
    const sourceLanding = row.kind === "source-clause" && ["Legal Disclosures!A11", "Legal Disclosures!B11", "Legal Disclosures!C11"].includes(row.sourceReferences[0]);
    if (!sourceLookup && !sourceLanding) continue;
    const adopted = sourceLookup ? lookup : landing, matches = sourceLookup ? matchesLookup : matchesLanding;
    row.atomization = "reviewed"; row.scope.siteKeys = [sourceLookup ? "ama" : "abe"]; row.scope.unresolved = []; row.scope.modes = [sourceLookup ? "application" : "landing", "mock"];
    row.scope.basis = "Explicit source Site label and the user's approved mock lookup/landing interpretation; detailed XML and production API remain separate requirements.";
    row.executionOwners = adopted?.executionOwners ?? []; row.ownerCandidates = []; row.codeOwner = sourceLookup ? "AMA lookup service; applicant-facing dialog removed after review" : "Home Apply navigation and native landingNotice content";
    row.ownerResolution = "code-owned"; row.verificationReferences = adopted?.verificationReferences ?? []; row.implementationReferences = adopted?.implementationReferences ?? [];
    row.verificationStatus = matches ? "recorded-evidence" : "not-verified"; row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = matches ? sourceLookup ? "Reviewed mock lookup: validated name/DOB request, synthetic matched/non-member/no-match responses, retryable failure, saved ME result and DOB, and stale-record rejection. Non-member entry is permitted; this is no claim of real AMA verification or Full XML delivery." : "Reviewed ABE landing viewer: source dividend copy, Cancel/Continue navigation, captured edits, quote-first entry and other-Site isolation. Accepted ABE Review remains unchanged." : "Lookup/landing owner, source or code/test evidence changed; reverify this bounded interpretation.";
  }
}
