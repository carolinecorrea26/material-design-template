import type { DatabaseSchema, TableName } from "../persistence/types";
import { resolveSnapshotSite as resolveEffectiveSite } from "../domain/effectiveSite";
import { activeSiteMigrationScope, coverageAcceptanceDomains } from "./activeSiteScope";
import { resolveDatabaseSite } from "./resolve";

type SourceSnapshot = { workbook: string; sha256: string; checklistSha256: string };
type Evidence = { table: string; key: string; sourceReference: string | null };
type InspectionRow = { id: string; key?: string; productKey?: string; siteKey?: string | null; siteId?: string;
  scope?: string; clientKey?: string | null; sourceReference?: string | null; definition?: { productKey?: string | null } };
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const text = (value: string | undefined) => value?.trim().toLowerCase() ?? "";

/** Review inventory only. A candidate match, row count or capability is never adoption approval. */
export function createActiveSiteAudit(db: DatabaseSchema, snapshot: SourceSnapshot) {
  const contract = activeSiteMigrationScope;
  if (snapshot.workbook !== contract.sources.mcr.name || snapshot.sha256 !== contract.sources.mcr.sha256 || snapshot.checklistSha256 !== contract.sources.checklist.sha256) {
    throw new Error("Source snapshot changed. Review and version the active Site source contract before regenerating the register.");
  }
  const scopeErrors: string[] = [];
  for (const scoped of contract.sites) {
    const matches = db.sites.filter(site => site.key === scoped.key);
    const site = matches[0];
    if (matches.length !== 1 || !site || site.deletedAt || site.status !== "active") {
      scopeErrors.push(`Missing, duplicate or inactive scoped Site: ${scoped.key}`);
      continue;
    }
    const client = db.clients.find(row => row.id === site.clientId);
    if (client?.key !== scoped.clientKey || client.status !== "active") scopeErrors.push(`Client ownership mismatch: ${scoped.key}`);
    const assignments = db.siteProducts.filter(row => row.siteId === site.id && row.enabled);
    if (new Set(assignments.map(row => row.productKey)).size !== assignments.length) scopeErrors.push(`Duplicate enabled products: ${scoped.key}`);
    if (!assignments.length) scopeErrors.push(`No enabled products: ${scoped.key}`);
    for (const row of assignments) if (db.products.filter(product => product.key === row.productKey).length !== 1) scopeErrors.push(`Missing or duplicate product: ${scoped.key}/${row.productKey}`);
  }
  const inScope = new Set<string>(contract.sites.map(site => site.key));
  const additionalSites = db.sites.filter(site => !site.deletedAt && site.status === "active" && !inScope.has(site.key)).map(site => site.key).sort(compare);
  if (additionalSites.length) scopeErrors.push(`Active Sites outside the approved scope require a scope decision: ${additionalSites.join(", ")}`);
  if (scopeErrors.length) throw new Error(scopeErrors.join("\n"));

  const reference = (table: string, row: Pick<InspectionRow, "id" | "key" | "sourceReference">): Evidence => ({ table, key: row.key ?? row.id, sourceReference: row.sourceReference ?? null });
  const mainProducts = db.products.filter(product => /^Main!D\d+$/.test(product.sourceReference ?? ""));
  const mainEvidence = new Map<string, DatabaseSchema["sourceRequirements"]>();
  const mainCells = new Map(db.sourceRequirements.filter(row => row.sheetKey === "main").map(row => [row.cell, row]));
  for (const row of mainCells.values()) {
    const number = /\d+$/.exec(row.cell)?.[0];
    if (number && row.value !== null && String(row.value).trim()) mainEvidence.set(number, [...mainEvidence.get(number) ?? [], row]);
  }
  const clients = [...new Set(contract.sites.filter(site => site.mcrRequired).map(site => site.clientKey))];
  const clientCatalogs = clients.sort(compare).map(clientKey => {
    const owned = new Set(db.productClients.filter(row => row.clientKey === clientKey).map(row => row.productKey));
    const hints = contract.clientIdentityReviewHints.filter(hint => hint.clientKey === clientKey);
    const hinted = new Set(mainProducts.filter(product => {
      const rowNumber = Number(product.sourceReference!.replace("Main!D", ""));
      const acronym = mainCells.get(`B${rowNumber}`)?.value;
      return typeof acronym === "string" && hints.some(hint => text(hint.sourceAcronym) === text(acronym));
    }).map(product => product.key));
    return { clientKey, identityReviewHints: hints, products: mainProducts.filter(product => owned.has(product.key) || hinted.has(product.key)).sort((a, b) => compare(a.key, b.key)).map(product => {
      const rowNumber = Number(product.sourceReference!.replace("Main!D", ""));
      const evidence = mainEvidence.get(String(rowNumber)) ?? [];
      return { productKey: product.key, name: product.definition.name, categoryKey: product.categoryKey,
        sourceReference: product.sourceReference, rowNumber,
        ownership: owned.has(product.key) ? "existing-extracted-client-relationship" : "review-hint-only",
        gNumbers: db.productIdentifiers.filter(row => row.productKey === product.key && row.kind === "gNumber").map(row => row.definition),
        planCodes: db.productIdentifiers.filter(row => row.productKey === product.key && row.kind === "planCode").map(row => row.definition),
        extractionCounts: Object.fromEntries([...new Set(evidence.map(row => row.classification))].sort(compare).map(key => [key, evidence.filter(row => row.classification === key).length])),
        sourceIssues: evidence.filter(row => !["MAPPED", "INTENTIONALLY_EXCLUDED", "NON_FUNCTIONAL_OR_REFERENCE"].includes(row.classification)).map(row => ({ key: row.key, cell: row.cell, classification: row.classification, reason: row.reason })),
      };
    }) };
  });
  const primary = (value: unknown): string => value && typeof value === "object" && "primary" in value && typeof value.primary === "string" ? text(value.primary) : "";
  const sites = contract.sites.map(scoped => {
    const site = db.sites.find(row => row.key === scoped.key)!;
    const resolved = resolveDatabaseSite(db, scoped.key);
    let capabilities: ReturnType<typeof resolveEffectiveSite>["resolution"]["implementedScopes"] = [];
    let candidateIssues: ReturnType<typeof resolveEffectiveSite>["configuration"]["issues"] = [];
    let candidateError: string | null = null;
    try {
      const candidate = resolveEffectiveSite(db, scoped.key);
      capabilities = candidate.resolution.implementedScopes;
      candidateIssues = candidate.configuration.issues;
    } catch (error) { candidateError = error instanceof Error ? error.message : String(error); }
    const clientCatalog = clientCatalogs.find(catalog => catalog.clientKey === scoped.clientKey);
    const enabled = resolved.coverage.filter(product => product.enabled).sort((a, b) => compare(a.id, b.id));
    const products = enabled.map(({ effective: product }) => {
      // Only compare primary identifiers as an exact pair. Scoped variants require separate review.
      // A name match is another review hint, never a fallback identity assignment.
      const g = text(product.gNumber?.primary), plan = text(product.planCode.primary);
      const identityCandidates = (clientCatalog?.products ?? []).flatMap(candidate => {
        const reasons: string[] = [];
        if (g && plan && candidate.gNumbers.some(value => primary(value) === g) && candidate.planCodes.some(value => primary(value) === plan)) reasons.push("exact-primary-g-number-and-plan-code");
        if (text(product.name) === text(candidate.name)) reasons.push("exact-name");
        return reasons.length ? [{ productKey: candidate.productKey, sourceReference: candidate.sourceReference, ownership: candidate.ownership, reasons }] : [];
      });
      const adoptedSources = db.sourceRequirements.filter(row => row.promotionState === "SITE_CONFIGURATION" && Array.isArray(row.activeSiteKeys) && row.activeSiteKeys.includes(scoped.key) && db.requirementTargets.some(target => target.requirementKey === row.key && target.targetTable === "products" && target.targetKey === product.id)).map(row => reference("sourceRequirements", row));
      const domains = coverageAcceptanceDomains.map(domain => {
        const rows = domain.tables.flatMap(table => (db[table as TableName] as unknown as InspectionRow[]).filter(row => {
          if ((table === "products" ? row.key : row.productKey ?? row.definition?.productKey) !== product.id) return false;
          if (row.siteId && row.siteId !== site.id || row.siteKey && row.siteKey !== scoped.key) return false;
          if (row.scope === "client" && row.clientKey !== scoped.clientKey || row.scope === "site" && row.siteKey !== scoped.key) return false;
          return true;
        }).map(row => reference(table, row))).sort((a, b) => compare(`${a.table}/${a.key}`, `${b.table}/${b.key}`));
        return { domain: domain.key, label: domain.label, acceptance: domain.acceptance,
          representation: rows.length ? "records-present" : "review-needed",
          evidence: rows,
          sourceValidation: scoped.mcrRequired ? "pending" : "not-applicable-synthetic-demo",
          adoptionValidation: "pending",
          executionValidation: "pending",
          publicationValidation: "pending",
          disposition: "open",
        };
      });
      return { productKey: product.id, name: product.name, categoryKey: product.categoryId, applicants: product.applicants,
        identifiers: { gNumber: product.gNumber ?? null, planCode: product.planCode },
        identity: { status: scoped.mcrRequired ? "review-required" : "not-applicable-synthetic-demo", candidates: identityCandidates, adoptedSources },
        candidateCapabilities: capabilities.filter(capability => capability.productKey === product.id),
        unresolvedPrototypeRequirements: product.requirements?.unresolved ?? [],
        domains,
      };
    });
    return { siteKey: site.key, clientKey: scoped.clientKey, name: `${resolved.branding.name} / ${site.name}`, mcrRequired: scoped.mcrRequired,
      status: "review-required", candidateError, candidateIssues,
      experience: { validation: "pending", evidence: {
        pages: db.sitePages.filter(row => row.siteKey === site.key).map(row => reference("sitePages", row)),
        branding: db.brandingProfiles.filter(row => row.scope === "global" || row.scope === "client" && row.clientKey === scoped.clientKey || row.scope === "site" && row.siteKey === site.key).map(row => reference("brandingProfiles", row)),
      }, acceptance: "Verify pages, fields, sections, flows, content, support, branding, feature assignments, ordering and provenance against the current template and recorded intentional changes." },
      products,
    };
  });
  const ownedMainKeys = new Set(clientCatalogs.flatMap(catalog => catalog.products.map(product => product.productKey)));
  const extractedOwnedMainKeys = new Set(db.productClients.map(row => row.productKey));
  return { version: 1, scope: contract,
    purpose: "Step 1 review register. Record presence and candidate capabilities do not establish MCR parity or authorize activation.",
    summary: { sites: sites.length, businessSites: sites.filter(site => site.mcrRequired).length,
      enabledSiteProducts: sites.reduce((count, site) => count + site.products.length, 0),
      openDomainReviews: sites.reduce((count, site) => count + site.products.reduce((total, product) => total + product.domains.length, 0), 0),
      scopedMcrReviewProducts: ownedMainKeys.size,
      clientIdentityHintProducts: clientCatalogs.reduce((count, catalog) => count + catalog.products.filter(product => product.ownership === "review-hint-only").length, 0),
      otherOwnedMcrCatalogProducts: mainProducts.filter(product => !ownedMainKeys.has(product.key) && extractedOwnedMainKeys.has(product.key)).length,
      unassignedMcrCatalogProducts: mainProducts.filter(product => !ownedMainKeys.has(product.key) && !extractedOwnedMainKeys.has(product.key)).length,
      migrationComplete: false, runtimeActivationReady: false,
    }, clientCatalogs, sites,
    unassignedMainProducts: mainProducts.filter(product => !ownedMainKeys.has(product.key) && !extractedOwnedMainKeys.has(product.key)).map(product => ({ productKey: product.key, sourceReference: product.sourceReference })).sort((a, b) => compare(a.productKey, b.productKey)),
    sharedSourceReview: "QD, disability, overhead, riders, questions, consent, disclosures, associations and URLs require explicit applicability review. Extracted Main ownership and explicit identity hints are only triage boundaries; they do not assign products to Sites. Shared or unowned source evidence is retained for review, not automatically deferred.",
  };
}
