/** Compile the explicit Step 3 crosswalk and first reviewed adoption; no database writes. */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "vite";
import { JSDOM } from "jsdom";
const checking = process.argv.includes("--check");
if (process.argv.slice(2).some(argument => argument !== "--check")) throw new Error("Usage: npm run migration:adoption-review -- [--check]");
const dom = new JSDOM("", { url: "http://localhost/" });
globalThis.window = dom.window;
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" });
try {
  const { activeSiteMigrationScope } = await server.ssrLoadModule("/src/migration/activeSiteScope.ts");
  const source = activeSiteMigrationScope.sources.mcr;
  if (createHash("sha256").update(await readFile(source.snapshotPath)).digest("hex") !== source.snapshotSha256) throw new Error("MCR snapshot changed; review the source contract.");
  const { createMigrationDatabase, createReviewedMigrationDatabase } = await server.ssrLoadModule("/src/migration/fixtures.tsx");
  const { mcrSource } = await server.ssrLoadModule("/src/migration/mcr.ts");
  const { reviewActiveSiteIdentities } = await server.ssrLoadModule("/src/migration/activeSiteIdentity.ts");
  const { resolveDatabaseSite } = await server.ssrLoadModule("/src/migration/resolve.ts");
  const { validateMigrationDatabase } = await server.ssrLoadModule("/src/migration/integrity.ts");
  const baseline = createMigrationDatabase();
  const candidate = createReviewedMigrationDatabase();
  const errors = validateMigrationDatabase(candidate);
  if (errors.length) throw new Error(errors.join("\n"));
  const report = reviewActiveSiteIdentities(baseline, mcrSource.cells);
  const resolved = new Map(activeSiteMigrationScope.sites.map(site => [site.key, resolveDatabaseSite(baseline, site.key)]));
  for (const assignment of report.assignments) {
    const product = resolved.get(assignment.siteKey).coverage.find(product => product.id === assignment.productKey).effective;
    assignment.prototype = { name: product.name, gNumber: product.gNumber ?? null, planCode: product.planCode, applicants: product.applicants };
  }
  report.adoptions = candidate.semanticRequirements.filter(row => row.domain === "reviewed-site-adoption");
  const candidateIdentities = reviewActiveSiteIdentities(candidate, mcrSource.cells);
  report.candidateIdentitySummary = candidateIdentities.summary;
  report.candidateAssignments = candidateIdentities.assignments;
  report.adoptedRows = {
    nso: {
      productIdentifiers: candidate.productIdentifiers.filter(row => row.siteKey === "nso" && row.sourceReference?.startsWith("Main!")),
      productAmountRules: candidate.productAmountRules.filter(row => row.siteKey === "nso" && row.sourceReference?.startsWith("Main!")),
      eligibilityConstraints: candidate.eligibilityConstraints.filter(row => row.siteKey === "nso" && row.sourceReference?.startsWith("Main!")),
      siteProductApplicants: candidate.siteProductApplicants.filter(row => row.siteKey === "nso" && row.sourceReference?.startsWith("Main!")),
      aggregateLimits: candidate.aggregateLimits.filter(row => row.siteKey === "nso" && row.sourceReference?.startsWith("Main!")),
      sitePolicies: candidate.sitePolicies.filter(row => row.siteKey === "nso"),
      amountBands: candidate.amountBands.filter(row => row.key.startsWith("nso.") && row.key.includes(".mcr.")),
      coverageAmountPatterns: candidate.coverageAmountPatterns.filter(row => row.key.startsWith("nso.") && row.key.includes(".mcr.")),
    },
    underwritingBands: candidate.underwritingBands.filter(row => row.siteKey === "waepa-gi"),
    sitePolicies: candidate.sitePolicies.filter(row => row.siteKey === "waepa-gi"),
    siteProducts: candidate.siteProducts.filter(row => row.siteId === "waepa-gi"),
    siteProductApplicants: candidate.siteProductApplicants.filter(row => row.siteKey === "waepa-gi"),
    productIdentifiers: candidate.productIdentifiers.filter(row => row.siteKey === "waepa-gi" && (row.sourceReference === "Main!E386" || row.sourceReference === "Main!G386")),
    productAmountRules: candidate.productAmountRules.filter(row => row.siteKey === "waepa-gi" && row.sourceReference === "Main!H386"),
    coverageAmountPatterns: candidate.coverageAmountPatterns.filter(row => row.key === "waepa-gi.li-group-term.mcr-fixed-member-offer.pattern"),
    requirementTargets: candidate.requirementTargets.filter(row => row.key.startsWith("migration-decision.waepa-gi.member-fixed-offer.")),
  };
  report.adoptedRows.activeNumeric = {
    amountRules: candidate.productAmountRules.filter(row => row.key.includes(".reviewed-numeric.")),
    amountPatterns: candidate.coverageAmountPatterns.filter(row => row.key.includes(".reviewed-numeric.")),
    bands: candidate.amountBands.filter(row => row.key.includes(".reviewed-numeric.")),
    options: candidate.amountOptions.filter(row => row.key.includes(".reviewed-numeric.")),
    applicants: candidate.siteProductApplicants.filter(row => row.key.includes(".reviewed-numeric.")),
  };
  report.adoptedRows.scalarIdentifiers = candidate.productIdentifiers.filter(row => row.key.includes(".reviewed-identifier."));
  report.adoptedRows.ageConstraints = candidate.eligibilityConstraints.filter(row => row.siteKey !== null && row.sourceReference?.startsWith("Main!") && row.siteKey !== "nso");
  report.adoptedRows.giEligibilityFacts = candidate.configurationValues.filter(row => row.key.endsWith(".military-exclusion"));
  report.adoptedRows.ratePresentation = candidate.configurationValues.filter(row => row.configurationKey === "rates.reviewed-presentation");
  report.adoptedRows.executablePolicies = candidate.configurationValues.filter(row => /\.reviewed-(benefit-policy|dependent-policy|life-aggregate|residency)$/.test(row.key));
  report.executablePolicySummary = {
    benefitProducts: candidate.configurationValues.filter(row => row.key.endsWith(".reviewed-benefit-policy")).length,
    dependentProducts: candidate.configurationValues.filter(row => row.key.endsWith(".reviewed-dependent-policy")).length,
    residencyProducts: candidate.configurationValues.filter(row => row.key.endsWith(".reviewed-residency")).length,
    lifeAggregateSites: candidate.configurationValues.filter(row => row.key.endsWith(".reviewed-life-aggregate")).length,
    journeyProducts: candidate.configurationValues.filter(row => row.key.endsWith(".journey-policy")).length,
    reviewPolicySites: candidate.configurationValues.filter(row => row.key.endsWith(".review-policy")).length,
    rateInputProducts: candidate.configurationValues.filter(row => row.key.endsWith(".rate-input-policy")).length,
    rateModifierProducts: candidate.configurationValues.filter(row => row.key.endsWith(".rate-modifier-policy")).length,
    conditionalMappings: candidate.configurationValues.filter(row => row.key.endsWith(".journey-policy")).reduce((count, row) => count + row.value.mappings.length, 0),
  };
  report.ratePresentationClarification = { reference: "docs/step3-major-outstanding-items.md", globalPraseDefault: false, cseaPraseConfigured: false, referenceAssetSupplied: false, drawerConsumer: "ReferenceRateTableLink", runtimeActivation: "pending" };
  report.step3Complete = true;
  report.step3CompletionScope = "Provisional prototype migration candidate: captured Library contracts, mock PRASE, serialized/PostgreSQL acceptance. Source fidelity, insurer destinations, publication and prototype cutover remain separate.";
  report.sourceParityCertified = false;
  report.prototypeCutover = "deferred-by-user";
  report.provisionalDecisions = candidate.semanticRequirements.filter(row => row.domain === "provisional-source-decision");
  report.remainingSourceConflicts = [];
  report.deferredSourceConflicts = [
    { reference: "Main!B246", reason: "Main label remains GI; use row 246 for standard identity provisionally and revisit." },
    { reference: "Main!O321", reason: "NSO DI lists ages 64 and 59 together; maximum 59 chosen provisionally." },
    { reference: "Main!O189/P189", reason: "AVMA 20-year entry ages list 69 and 59 together; maximum 59 chosen provisionally." },
    { reference: "Main!J124/Q124", reason: "AMA Preferred child ages disagree; 14 days through 26 without FTS chosen provisionally." },
    { reference: "Main!D286", reason: "ISI Critical Illness Stage 2 incomplete; retain numeric/age evidence and other existing candidate terms provisionally." },
    { reference: "Main!AN:AR / linked rate sources", reason: "Missing base premiums return unavailable with prices suppressed; revisit authoritative rate inputs." },
  ];
  report.sourceSnapshotSha256 = source.snapshotSha256;
  const safe = value => String(value).replaceAll("|", "/").replaceAll("\n", " ");
  const lines = [
    "# Step 3 identity crosswalk", "",
    "Generated from the reviewed semantic mapping and pinned MCR snapshot. This is a product evidence crosswalk, not approval of every policy in a linked row. See [the adoption decisions and remaining work](step3-active-site-adoption.md).", "",
    `**${report.summary.assignments} assignments:** ${report.summary.sourceLinked} source-linked, ${report.summary.blocked} blocked and ${report.summary.synthetic} synthetic demo fixtures.`, "",
    `The reviewed candidate has **${report.candidateIdentitySummary.assignments} enabled assignments** and **${report.candidateIdentitySummary.blocked} unresolved identity mappings**. Standard CSEA DI uses a documented provisional row 246 mapping. Its user-confirmed standalone member AD&D product remains enabled in the mock scope with unresolved exact source identifiers. The WAEPAGI inherited disability assignment is disabled by the approved source-first portfolio decision. Source reconciliation is deferred by the October 2 user instruction; [the provisional decisions](step3-provisional-decisions.md) must be revisited.`, "",
    "| Site | Prototype product | MCR product row | Prototype plan | MCR plan evidence | Status |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.assignments.map(row => `| ${row.siteKey} | ${row.productKey} | ${row.row ? `Main!D${row.row}` : "—"} | ${safe(row.prototype.planCode.primary)} | ${safe(row.evidence?.identity.find(cell => cell.reference === `Main!G${row.row}`)?.value ?? "—")} | ${row.status} |`),
    "", "## Reviewed candidate identity follow-ups", "",
    ...report.candidateAssignments.filter(row => row.status === "blocked").map(row => `- **${row.key}:** ${row.reason}`),
    "", "## Original compatibility identity blockers", "",
    ...report.assignments.filter(row => row.status === "blocked").map(row => `- **${row.key}:** ${row.reason}`),
    "", "## Standard CSEA source discovery", "",
    ...report.sourceDiscoveries.map(row => row.explanation),
    "", "## Portfolio gaps", "",
    ...report.portfolioReview.map(row => `- **${row.siteKey}${row.row ? ` / Main!D${row.row}` : ""}:** ${row.reason}`),
    "", "## Evidence and adoption", "",
    "[active-site-identity-review.json](active-site-identity-review.json) retains literal source evidence for identity, amounts, applicants, eligibility, dependencies/riders, residency, underwriting/questions, payment and rates. It preserves multiline identifiers and association/class conditions; they must not be reduced to the first number in a cell. It also records the original prototype identifiers and the exact reviewed adoption record.", "",
    "WAEPAGI's fixed member amount, G-number/plan-code, member-only life portfolio, empty rider set and approved Bank/Card Monthly payment policy are adopted in `createReviewedMigrationDatabase()`. Compatibility fixture exports and live consumers continue to use their existing sources. NSO life identities, adult ranges, fixed child benefits, age constraints, per-person life aggregate and payment policy are also adopted in the reviewed candidate. Amount and aggregate validation execute over captured Library rows, while age certification and remaining eligibility/health rules remain pending. An additional 21 products have explicit numeric choices/applicant presence adopted across ABE, AMA, ASCE and AVMA. Unqualified adult entry ages and scalar Site G-number/plan identities are also adopted; multiline role mappings and contradictory ages stay pending. WAEPAGI age and military exclusion execute from the captured configuration. These slices do not certify the surrounding dependent caps, applicant classes, income, health, rider, residency or rate policies. Remaining linked policy stays source evidence until its scoped typed definitions and operations are reviewed. Source-linked does not mean migrated or production-ready.", "",
    "[Step 3 prototype acceptance](step3-prototype-acceptance.md) closes the agreed provisional/mock candidate scope. Source parity is not certified. The [local cutover acceptance](prototype-cutover-acceptance.md) records the subsequent Library-driven mock runtime; production publication and activation remain gated. The [major outstanding items register](step3-major-outstanding-items.md) explains remaining clarification requests and the confirmed PRASE/reference-table behavior. Rate presentation settings execute in the unpublished candidate; authoritative pricing and production activation remain pending.", "",
    `The candidate has **${report.executablePolicySummary.journeyProducts} product journey contracts** and **${report.executablePolicySummary.conditionalMappings} conditional submission mappings**. The [exception acceptance and runtime data audit](step3-exception-adoption.md) records executable applicant/class/association/period/mode checks, portfolio payment/aggregate checks and the remaining completion boundaries. The local mock applicant runtime consumes the reviewed Library snapshot. Compatibility inspection retains source-authored reference views. All-client browser acceptance remains open; ASCE browser evidence does not establish acceptance for other clients.`, "",
    `The reviewed candidate also has executable benefit policies for **${report.executablePolicySummary.benefitProducts} disability/overhead products**, dependent policies for **${report.executablePolicySummary.dependentProducts} Site/product assignments**, and explicit life-aggregate groups for **${report.executablePolicySummary.lifeAggregateSites} Sites**, plus residency policies for **${report.executablePolicySummary.residencyProducts} CSEA/WAEPA assignments**. These execute applicable income, age/class, expense/loan and dependent calculations, period coupling and election cleanup. [The benefit/dependent adoption record](step3-benefit-dependent-adoption.md) records the scope and remaining acceptance work.`, "",
    "Regenerate with `npm run migration:adoption-review`; verify drift with `npm run migration:adoption-review -- --check`.", "",
  ];
  for (const [path, contents] of [["docs/active-site-identity-review.json", JSON.stringify(report, null, 2) + "\n"], ["docs/step3-identity-crosswalk.md", lines.join("\n")]]) {
    if (checking) { if (await readFile(path, "utf8") !== contents) throw new Error(`Stale ${path}`); }
    else await writeFile(path, contents);
  }
  console.log(JSON.stringify({ ...report.summary, candidateSummary: report.candidateIdentitySummary, reviewedAdoptions: report.adoptions.length, mode: checking ? "checked" : "generated" }, null, 2));
} finally {
  await server.close();
  dom.window.close();
  delete globalThis.window;
}
