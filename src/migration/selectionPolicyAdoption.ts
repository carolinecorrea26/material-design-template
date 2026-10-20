import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isSelectionPolicy, type SelectionPolicy } from "../domain/coverageSelectionPolicy";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { provisionalDecisionAuthority, provisionalDecisionReference } from "./provisionalSourceDecisions";

const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, provisionalDecisionReference) });
/** Complete selection contract for the existing active portfolio. Defaults are
 * explicitly provisional, never inferred source approval or submission readiness. */
export function applySelectionPolicyAdoption(db: DatabaseSchema) {
  // Capture assignments before writing so no later slice reads its own mutations.
  for (const scoped of activeSiteMigrationScope.sites) {
    const site = db.sites.find(s => s.key === scoped.key)!;
    const assignments = db.siteProducts.filter(p => p.siteId === site.id && p.enabled);
    for (const assignment of assignments) {
    const product = { productKey: assignment.productKey };
    const applicable = (row: { scope: string; siteKey: string | null; clientKey: string | null }) => row.scope === "global" || row.scope === "client" && row.clientKey === scoped.clientKey || row.scope === "site" && row.siteKey === scoped.key;
    const markerKeys = new Set(db.configurationDefinitions.filter(d => d.definition.target?.kind === "product-rider-set" && d.definition.target.productKey === product.productKey).map(d => d.key));
    const rank: Record<string, number> = { global: 0, client: 1, site: 2 };
    const marker = db.configurationValues.filter(v => applicable(v) && markerKeys.has(v.configurationKey)).sort((a, b) => rank[a.scope] - rank[b.scope]).at(-1);
    const riders = db.productRiders.filter(r => r.productKey === product.productKey && applicable(r) && r.scope === (marker?.scope ?? "global")).filter(r => db.siteRiders.find(s => s.siteId === site.id && s.riderKey === r.riderKey)?.enabled !== false).map(r => ({ key: r.riderKey, definition: db.riders.find(d => d.key === r.riderKey)!.definition }));
    const waepa = scoped.key === "waepa" && product.productKey === "li-group-term";
    const csea = scoped.key === "csea" && product.productKey === "di-ltd";
    const policy: SelectionPolicy = {
      version: 1, modes: waepa ? ["new", "increase", "rider-only"] : ["new", "increase"],
      amountMeaning: "resulting-total", existingPolicyRequired: true,
      riderOnlyApplicants: waepa ? ["member", "spouse"] : [],
      riders: riders.map(r => ({
        key: r.key, applicants: r.definition.applicants ?? ["member", "spouse"], included: false,
        minimumBase: waepa ? r.definition.id === "cir" ? 50000 : 100000 : 0,
        ...(waepa && r.definition.id === "abi" ? { maximumBase: 1750000 } : {}),
        maximumAge: waepa ? r.definition.id === "abi" ? 49 : r.definition.id === "cir" ? 64 : null : null, requires: [], incompatible: [], amount: { kind: "none" },
        excludedJurisdictions: waepa && r.definition.id === "cir" ? ["US-CT", "US-ID", "US-LA", "US-MA", "US-MN", "US-MO", "US-MT", "US-NC", "US-NY", "US-OH", "US-SD", "US-UT", "US-WA", "US-AS", "US-GU", "US-MP", "US-PR", "US-VI"] : [],
      })),
      childSchedule: waepa ? { bands: [{ minimumAgeDays: 0, maximumAgeDays: 182, amount: 1000 }, { minimumAgeDays: 183, maximumAgeDays: 9496, amount: 10000 }], memberMaximumFraction: .5 } : null,
      skipPaymentForExisting: waepa, skipPaymentForChildOnly: waepa, healthForRiderOnly: waepa,
      provisional: scoped.mcrRequired, revisit: scoped.mcrRequired ? [
        "Existing-policy verification requires a service; a supplied verification fact is candidate input only. Resulting-total amount semantics are provisional for increase mode.",
        "Preserve current rider assignments provisionally. Unspecified rider caps, dependencies and incompatibilities require product document review; empty lists are explicit working choices.",
        ...(waepa ? ["WAEPA child attachment is missing: use $1,000 for 0–182 days, $10,000 thereafter through 25, capped at 50% of member coverage provisionally. Replace with age/spouse schedule when provided.", "WAEPA CIR filing restriction note says no offering until VA approval. Treat listed current jurisdiction exclusions as provisional; filing currency and approval need review.", "Rider-only is restricted to existing member/spouse coverage; no separate Site added. Payment skip and verification must be reconciled with existing-policy service."] : []),
      ] : [],
    };
    if (csea) policy.riders = policy.riders.map(r => ({ ...r, amount: r.key === "csea.spouse-accident" ? { kind: "choices" as const, values: [500, 1000], default: 500 } : { kind: "none" as const } }));
    if (!isSelectionPolicy(policy)) throw new Error(`Invalid selection policy ${scoped.key}/${product.productKey}`);
    const key = `${scoped.key}.${product.productKey}.selection-policy`;
    db.configurationDefinitions = db.configurationDefinitions.filter(r => r.key !== key);
    db.configurationValues = db.configurationValues.filter(r => r.key !== key);
    db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { provisional: true, revisit: true }, target: { kind: "product-selection-policy", productKey: product.productKey } } });
    db.configurationValues.push({ ...meta("configurationValues", key), position: 0, scope: "site", siteKey: scoped.key, clientKey: null, configurationKey: key, value: policy as unknown as Json });
    const decisionKey = `provisional-decision.${key}`;
    if (!scoped.mcrRequired) continue;
    db.semanticRequirements = db.semanticRequirements.filter(r => r.key !== decisionKey);
    db.semanticRequirements.push({ ...meta("semanticRequirements", decisionKey), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: scoped.key, predicate: "selection-policy", status: "documented", value: { authority: provisionalDecisionAuthority, revisit: true, selected: policy as unknown as Json, sourceReferences: waepa ? ["Main!H379", "Main!I379", "Main!J379", "Main!L379", "Main!N379"] : [], sourceReconciliation: "deferred", runtimeActivation: "pending", fullPolicyAcceptance: "pending", destinations: [{ table: "configurationValues", key, column: "value" }] } });
    }
  }
}
