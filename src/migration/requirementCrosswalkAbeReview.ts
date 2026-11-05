import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import namedEvidence from "../../docs/project-review/step1-owner-review-evidence.json";
import { reviewedNamedOwnerCodeMatches } from "./requirementCrosswalkOwnerReview";
const evidence: Record<string, string> = {
  "src/content/reviewPolicies.ts": "5865dd450b95ae6f04635033baebaaf62f65101d9e9d3c4802e08b0f1641e931",
  "src/content/reviewNoticeSource.json": "1123376877b6f3fb249ef98d0043a7256dbddf13948ffda43d2617a825896a73",
  "src/domain/reviewPolicy.ts": "9c022d981faa8283af86d001ea8e7be2a94c04709f646163a4b7754078e21d65",
  "src/config/reviewExperience.ts": "366407fbb671a83d79bf8bfa0627235893ba0ed0abefb87c13e4754ee950360c",
  "src/pages/Review.tsx": "757ace4d1bcf8aef21fa408af0ef12cb5b6db007b6facc584bc659226b2027a5",
  "src/migration/reviewAndRateAcceptance.test.ts": "d76107fdcfe5d65a85766f8f597bee3af0f17c5ad22c4c6520387a5699d1b4c6",
  "src/pages/Review.consent.test.tsx": "1bf6f6e54cc20a89197cac1f95c97ab75729eafce4c4e2b37d2e95edc6d9f981"
};
export function reviewedAbeReviewCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence).length > 0 && Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
export function abeDividendOwnerSnapshot(db: DatabaseSchema) {
  const site = resolveEffectiveSite(db, "abe");
  const page = site.configuration.pages.find(page => page.key === "review")!;
  const policies = site.configuration.reviewPolicies;
  const definitions = db.configurationDefinitions.filter(row => policies.some(policy => policy.key === row.key));
  const owners = [...page.provenance, ...page.fields.flatMap(field => field.provenance), ...policies.flatMap(policy => policy.provenance), ...definitions.map(row => ({ table: "configurationDefinitions", key: row.key }))]
    .filter((owner, index, owners) => owners.findIndex(other => other.table === owner.table && other.key === owner.key) === index);
  return { owners, value: { policies, definitions, page } };
}
export function abeDividendOwnerHash(db: DatabaseSchema) {
  return createHash("sha256").update(JSON.stringify(abeDividendOwnerSnapshot(db))).digest("hex");
}
export function reviewAcceptedAbeDividendRequirements(db: DatabaseSchema, rows: CrosswalkRow[]) {
  const owner = db.configurationValues.find(row => row.key === "abe.review-policy");
  const snapshot = abeDividendOwnerSnapshot(db);
  const matches = reviewedAbeReviewCodeMatches() && reviewedNamedOwnerCodeMatches() && abeDividendOwnerHash(db) === namedEvidence.native["abe-dividend"] && createHash("sha256").update(JSON.stringify(owner?.value)).digest("hex") === "7c0ce84b9b80cf7310565f39df9b0996f8a97168c4107f1caf5d72b00b0cc975";
  for (const row of rows) {
    const atom = row.kind === "source-requirement" && /^atomic\.abe\.[^.]+\.dividend-(paragraph|note)-online$/.test(row.id);
    const clause = row.kind === "source-clause" && /^Read & Sign!(?:[BC]111|[BC](?:12[5-9]|13\d))$/.test(row.sourceReferences[0]);
    const unique = row.id === "atomic.unique-dividend-notice";
    const legalClause = row.kind === "source-clause" && /^Legal Disclosures![ABCD]10$/.test(row.sourceReferences[0]);
    if (!atom && !clause && !unique && !legalClause) continue;
    row.atomization = "reviewed"; row.scope.siteKeys = ["abe"]; row.scope.unresolved = [];
    if (unique || legalClause) {
      row.scope.modes = ["online"]; row.scope.applicantKeys = ["member"];
      row.scope.productKeys = resolveEffectiveSite(db, "abe").configuration.products.map(product => product.productKey);
    }
    row.executionOwners = [{ table: "configurationValues", key: "abe.review-policy", column: "value" }]; row.ownerCandidates = [];
    if (unique || legalClause) row.executionOwners = snapshot.owners;
    row.codeOwner = "Review and the accepted ABE dividend blocks"; row.ownerResolution = "code-owned";
    row.implementationReferences = ["src/content/reviewPolicies.ts", "src/pages/Review.tsx", "src/domain/reviewPolicy.ts"];
    row.verificationReferences = ["src/migration/reviewAndRateAcceptance.test.ts", "src/pages/Review.consent.test.tsx"];
    row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = matches ? "User explicitly preserves accepted ABE Review: required dividend acknowledgement, always-visible optional identity fields, no election checkbox and captured dividend blocks. This is an accepted new-template exception to conflicting legacy per-product/new/change presentation; detailed PDF remains separate. The landing viewer has its own owner and verification." : "ABE accepted Review owner, source content, rendering or test evidence changed; repeat this bounded exception review.";
  }
}
