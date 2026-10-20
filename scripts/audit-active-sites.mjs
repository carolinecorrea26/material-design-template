/** Compile review documentation only. Does not install data or contact a database. */
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "vite";
import { JSDOM } from "jsdom";
import { createHash } from "node:crypto";

const checking = process.argv.includes("--check");
if (process.argv.slice(2).some(argument => argument !== "--check")) throw new Error("Usage: npm run migration:scope-audit -- [--check]");
// Existing authoring modules read window at import time; this isolated compiler
// has its own browser state and never opens or modifies the running prototype.
const dom = new JSDOM("", { url: "http://localhost/" });
globalThis.window = dom.window;
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" });
try {
  const { activeSiteMigrationScope } = await server.ssrLoadModule("/src/migration/activeSiteScope.ts");
  const source = activeSiteMigrationScope.sources.mcr;
  if (createHash("sha256").update(await readFile(source.snapshotPath)).digest("hex") !== source.snapshotSha256) throw new Error("Source snapshot bytes changed. Review and version the source contract before regenerating the register.");
  const { createMigrationDatabase } = await server.ssrLoadModule("/src/migration/fixtures.tsx");
  const { mcrSource } = await server.ssrLoadModule("/src/migration/mcr.ts");
  const { createActiveSiteAudit } = await server.ssrLoadModule("/src/migration/activeSiteAudit.ts");
  const report = createActiveSiteAudit(createMigrationDatabase(), mcrSource);
  const safe = value => String(value).replaceAll("|", "/").replaceAll("\n", " ");
  const lines = [
    "# Active Site migration inventory", "",
    "This generated inventory implements the scope and acceptance register in [the migration contract](active-site-migration-contract.md). It inventories the current checked-in compiler output. It does not verify a hosted database, establish MCR parity, or activate runtime data.", "",
    `There are **${report.summary.sites} scoped Sites**, **${report.summary.enabledSiteProducts} enabled Site/product assignments**, and **${report.summary.openDomainReviews} open product/domain reviews**. Demo is synthetic; the other nine Sites require MCR review. Each assignment has thirteen acceptance domains. Missing records remain review work; optionality is not inferred from absence.`, "",
    "## Site inventory", "",
    "| Site | Client | Enabled products | Main source review candidates | Candidate resolver issues |", "| --- | --- | ---: | ---: | ---: |",
    ...report.sites.map(site => `| ${site.siteKey} | ${site.clientKey} | ${site.products.length} | ${report.clientCatalogs.find(catalog => catalog.clientKey === site.clientKey)?.products.length ?? "Not applicable"} | ${site.candidateError ? safe(site.candidateError) : site.candidateIssues.length} |`),
    "",
    "WAEPA Standard and GI remain separate Sites sharing one client. Their source catalog counts overlap and must not be summed. AVMA LIFE and ISI source rows enter this review through explicit identity hints, not adopted ownership. CSEA GI is excluded as identity evidence for the confirmed standard CSEA Site. Candidate issues are resolver findings, not counts of MCR defects or independently verified production failures.", "",
    "## Enabled products", "",
    "Candidate source matches use an existing extracted client relationship or an explicit client identity hint, plus an exact primary G-number/plan-code pair or exact product name. Matches are suggestions for review. Scoped identifier variants and category equivalence still require review. A single candidate is not an adopted identity.", "",
    "| Site | Product | Name | Main identity candidates | Candidate decision capabilities |", "| --- | --- | --- | ---: | --- |",
    ...report.sites.flatMap(site => site.products.map(product => `| ${site.siteKey} | ${product.productKey} | ${safe(product.name)} | ${site.mcrRequired ? product.identity.candidates.length : "Not applicable"} | ${safe(product.candidateCapabilities.map(capability => `${capability.applicantKey}: ${capability.decisions.join(", ")}`).join("; ")) || "Not advertised"} |`)),
    "",
    "Candidate capabilities describe the existing partial persisted resolver. They do not establish full product execution, source validation, or publication readiness.", "",
    "## Source triage", "",
    `${report.summary.scopedMcrReviewProducts} distinct Main catalog products are queued for the eight scoped business clients, including ${report.summary.clientIdentityHintProducts} through identity hints requiring review. ${report.summary.otherOwnedMcrCatalogProducts} other catalog products have extracted ownership outside this review set. ${report.summary.unassignedMcrCatalogProducts} more lack extracted ownership and still require applicability triage. Those counts do not certify that extraction identified every applicable row.`, "",
    "Other clients stay in the source archive for a later scope version. The full workbook is retained; current work is prioritized by explicit scoped ownership and reviewed shared applicability. Client-level source rows do not create new Sites or enable extra products.", "",
    "## Detailed review register", "",
    "[active-site-coverage-audit.json](active-site-coverage-audit.json) records every enabled Site/product, its thirteen acceptance domains, normalized evidence references, existing candidate capabilities, unresolved prototype requirements, identity suggestions, and same-client Main source issues. All validation stages remain pending until actual review evidence is recorded. Demo only exempts source validation; it still requires behavior and publication checks.", "",
    "Regenerate with `npm run migration:scope-audit`. Check for drift with `npm run migration:scope-audit -- --check`. Neither command writes database configuration or changes the running prototype.", "",
  ];
  const artifacts = [
    ["docs/active-site-coverage-audit.json", JSON.stringify(report, null, 2) + "\n"],
    ["docs/active-site-migration-inventory.md", lines.join("\n")],
  ];
  for (const [path, contents] of artifacts) {
    if (checking) {
      if (await readFile(path, "utf8") !== contents) throw new Error(`Stale ${path}. Run npm run migration:scope-audit and review the changes.`);
    } else await writeFile(path, contents);
  }
  console.log(JSON.stringify({ ...report.summary, artifacts: artifacts.map(([path]) => path), mode: checking ? "checked" : "generated" }, null, 2));
} finally {
  await server.close();
  dom.window.close();
  delete globalThis.window;
}
