import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";
import { entryUrlDecisionKey } from "./entryUrlReviewDecisions";
import { activeSiteMigrationScope } from "./activeSiteScope";

const evidence: Record<string, string> = {
  "src/utils/coverageDisplay.ts": "cf89df976bb1c8a5bf9a377046a0d561d90695cc24ec31cbea4a5d82ce366eb9",
  "src/app/sections/ConfiguredCoverageQuestions.tsx": "c4747adf3e5d64c7f86900ad0a49c5f3c02c7c2892cfa64543494ba14503f1c0",
  "src/app/sections/ConfiguredCoverageOptionsPanel.tsx": "2371899a378d4fc8c180c7ca005927dd71624cddbc608dfb9d957760ce996445",
  "src/app/sections/ConfiguredProductCatalog.tsx": "ce53878b6e86fa8496683f4f96d76cdc2201ba246d0fb4243e04db69ca637b65",
  "src/config/fields/coverageFactFields.ts": "6b12d8919d844a111adddbd3a2e9711e693c36a2ba0ea8d3c29065a194902fb7",
  "src/components/coverage/QuoteCalculator.prefill.test.tsx": "f71772471486e9f6493f124f6c4797316e48aa8782fc85a165a8315699b474b4",
  "src/components/coverage/CoverageOptionsPanel.tsx": "f6ab5fe2638ba85842ab631045713518fb95b1ab364e6924b57ad43695d21005",
  "src/components/coverage/ProductCatalog.tsx": "7a05a4ed583f47e95c5466e4ce412853239d6d5636e29c95fe7c0576b4fcde87",
  "src/app/useCoverageState.ts": "973ec57600673584be90595a576d78edf140a5599783fdc41e266ce14a7e746d",
  "src/migration/amaProductOrderAdoption.test.tsx": "0afa74ff4c30b6d6b6799c33078b0e24807d991d11e2d2b75b3999e9e0e5e1f6",
  "src/migration/amaProductOrderAdoption.ts": "77104573fc21b19e0343eaade1304d52e3f563670f903e3d78e59df5b968872b",
  "src/domain/configuration.ts": "d228a543f5ee039fd6373445f51b4c53d75dd780c214ba87126be51e1e6e908c",
  "src/domain/prototypeConfigurationProjection.ts": "2487ab68310e6b9ff65b76e9cc4bdf4feb8814e5d36c98dd19a2e5794d5022db",
  "src/domain/coveragePresentation.test.ts": "9bef9cf96356cdad21340e379a2258d368306400978d668b1490a857189842d1",
  "src/domain/coveragePresentation.ts": "815e95b010b47cd4b89bd32ac802ca65e9bbfd7dbc6ce56d10e30390c8dee528",
  "src/config/client/coverageCategoryScope.ts": "8b16a70a2d480818e5746fc5123329928aab0806b8b5e2a99751392f76961f92",
  "src/config/client/coverageProductScope.ts": "de8ef410a1ac9180f9142f6139357db59c72ab958b25793e6d80923764e8262c",
  "src/config/client/getActiveClientCoverages.ts": "4acd89d512ae1181737bc236e346d0dcde11c4f97777c4e7c61a7a13487ce578",
  "src/app/ApplicationFormContext.tsx": "f2dd93ad1e04997a3061ffbd7612aa81693a917c26984e8c4a04fd5b4a47634d",
  "src/pages/Coverage.tsx": "bc3834e29b207d044bedcf45ecd4e7f11cef58b4094c32a81e5837d4d9bb19b0",
  "src/app/workflows/QuoteCalculator.tsx": "2c8f3dd6de6d9709cac7e6f4eb4cb023f6cf67180841d1a89bb18dc5bf9720d4",
  "src/config/client/coverageProductScope.test.ts": "f50411fa97d15ab6488e72ad1209670f2ee712fe4ed77b8eefa1afe5e6184302",
  "src/config/client/coverageCategoryScope.test.ts": "9d4b8c9e45e0323cf4db476fb212e9f36b1d394f4a73349fb46098aac85f43bf",
  "src/app/ApplicationFormContext.entryScope.test.tsx": "f995fc6806d025bbee81eb842eb576e5ed27bfcfc71f9cd9344231cdc7ad7932",
  "src/pages/Coverage.entryScope.test.tsx": "da137e484f18b3d48934490b324f076edb3f36ac425ddbf9e6094507a1e948b1"
};
export function reviewedEntryCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence).length > 0 && Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
export function reviewEntryRequirements(db: DatabaseSchema, rows: CrosswalkRow[]) {
  const decision = db.semanticRequirements.find(row => row.key === entryUrlDecisionKey)?.value as { approvalStatus?: string; deferredOtherUrlBehavior?: { completionBlocking: boolean; parameterNames: string[] } } | undefined;
  if (decision?.approvalStatus !== "approved") return;
  const matches = reviewedEntryCodeMatches() && ["category", "prods", "featured_prod"].every(key => db.urlParameters.some(row => row.key === key && row.parameter === key));
  const tests = ["src/config/client/coverageProductScope.test.ts", "src/config/client/coverageCategoryScope.test.ts", "src/app/ApplicationFormContext.entryScope.test.tsx", "src/pages/Coverage.entryScope.test.tsx", "src/migration/amaProductOrderAdoption.test.tsx", "src/domain/coveragePresentation.test.ts"];
  for (const parameter of ["category", "prods", "featured_prod"]) rows.push({
    id: `atomic.entry-url.${parameter}`, kind: "source-requirement", area: "Coverage",
    scope: { siteKeys: activeSiteMigrationScope.sites.filter(site => site.mcrRequired).map(site => site.key), productKeys: [], applicantKeys: [], modes: ["application", "quote"], basis: "Approved global entry protocol over each current Site's captured available products and G-number mappings", unresolved: [] },
    sourceReferences: ["src/content/docs/urlParameters.ts", "User decisions October 20–21, 2026", ...(parameter === "prods" ? ["Attestation Online and PDF!C3"] : [])], sourceKey: null,
    expectedBehavior: parameter === "category" ? "Restrict available categories to the comma-separated category values, intersected with the current Site portfolio. Keep the restriction across routes and in captured application context; category=all resets it." : parameter === "prods" ? "With category present, restrict products by comma-separated captured G-numbers, including Association mappings. Unknown/incompatible identifiers produce no products. Preserve answers and restore each application's own scope; unavailable old selections require explicit removal." : "An available featured_prod product and its category precede configured product/category order. Preserve the remaining configured sequence, product filtering and each saved application's own presentation context. Unknown or filtered-out IDs do not broaden the portfolio.",
    context: "URL filtering narrows presentation and available choices; it does not replace native applicant/Association eligibility or enable other Sites' products. Protocol metadata and the code executor are separate owners.",
    ruleKeys: [], rationale: null, atomization: "reviewed", executionOwners: [{ table: "urlParameters", key: parameter }], ownerCandidates: [], serviceOwner: null, codeOwner: "getActiveClientCoverages, category/product scope resolvers and ApplicationFormContext capture/restore", ownerResolution: "code-owned",
    implementationReferences: ["src/config/client/coverageCategoryScope.ts", "src/config/client/coverageProductScope.ts", "src/config/client/getActiveClientCoverages.ts", "src/app/ApplicationFormContext.tsx", "src/domain/coveragePresentation.ts"], verificationReferences: tests,
    verificationStatus: matches ? "recorded-evidence" : "not-verified", disposition: "adopted-user-decision", finding: matches ? "Code/test fingerprints match the reviewed native filtering, captured-ID, Site-isolation, rendered Coverage and application restoration checks." : "Entry executor or evidence changed; reverify before closing this leaf requirement.",
  });
  for (const suffix of ["di-rate-choice-show", "di-rate-choice-tooltip", "di-single-url-hide-choice"]) {
    const row = rows.find(row => row.id === `atomic.ama.membership.${suffix}`);
    if (!row) continue;
    row.disposition = "superseded-by-user-decision"; row.scope.unresolved = [];
    row.verificationReferences = tests; row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.codeOwner = "Membership and separate captured AMA Coverage product choices"; row.ownerResolution = "code-owned";
    row.finding = "The user retains separate Step Rated and Level Rated Coverage choices and omits the duplicate Membership selector and its selector-only tooltip. Product-level eligibility and the separately reviewed mutual-exclusion requirement retain their own scope.";
  }
  for (const suffix of ["di-step-selection", "di-level-selection"]) {
    const row = rows.find(row => row.id === `atomic.ama.membership.${suffix}`);
    const style = rows.find(row => row.id === "atomic.adopted.ama.premium-style-exclusive");
    if (!row || !style) continue;
    row.executionOwners = style.executionOwners; row.ownerCandidates = []; row.ownerResolution = style.ownerResolution;
    row.scope.unresolved = []; row.verificationReferences = [...tests, ...style.verificationReferences];
    row.implementationReferences = [...style.implementationReferences, "src/pages/Coverage.tsx"];
    row.verificationStatus = matches && style.verificationStatus === "recorded-evidence" ? "recorded-evidence" : "not-verified";
    row.disposition = row.verificationStatus === "recorded-evidence" ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = "The approved new template presents separate Step/Level Coverage cards with one premium style per application; the duplicate Membership selector is omitted. The source product choice survives through those cards and captured prods filtering.";
  }
  const singleProduct = rows.find(row => row.id === "atomic.ama.membership.di-single-url-product");
  if (singleProduct) {
    singleProduct.executionOwners = [{ table: "urlParameters", key: "prods" }]; singleProduct.ownerCandidates = [];
    singleProduct.codeOwner = "getActiveClientCoverages and captured G-number product filtering"; singleProduct.ownerResolution = "code-owned";
    singleProduct.verificationReferences = tests; singleProduct.verificationStatus = matches ? "recorded-evidence" : "not-verified"; singleProduct.disposition = "adopted-user-decision";
    singleProduct.scope.unresolved = []; singleProduct.finding = "Approved category/prods implementation selects the actual captured Step/Level G-number. DI_STEP_GNUM and DI_LEVEL_GNUM remain source variable names, not invented URL identifier values.";
  }
}
