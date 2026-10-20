import type { PersistenceAdapter } from "../persistence/adapter";
import type { Scope } from "../persistence/types";
import type { ClientConfigurationDefaults } from "../domain/organizations";
import type { ClientBranding, ClientSupport } from "../domain/configuration";
import type { ClientId } from "../types";
import type { SiteReadAdapter, SiteSnapshot } from "./siteRepository";

/** Hydrate the compatibility authoring projection, never normalized rule tables.
 * Callers await this before constructing a repository. No implicit fallback,
 * MCR compilation, or incomplete normalized rule activation is permitted.
 */
export async function loadPersistedSiteAdapter(adapter: PersistenceAdapter): Promise<SiteReadAdapter> {
  const [clients, sites, organizations, profiles, associations, relationships, policies,
    definitions, values, branding, support, flows, steps, transitions, assignments] = await Promise.all([
    adapter.list("clients"), adapter.list("sites"), adapter.list("organizations"), adapter.list("organizationProfiles"),
    adapter.list("associations"), adapter.list("siteAssociations"), adapter.list("sitePolicies"),
    adapter.list("configurationDefinitions"), adapter.list("configurationValues"),
    adapter.list("brandingProfiles"), adapter.list("supportProfiles"), adapter.list("flows"),
    adapter.list("flowSteps"), adapter.list("flowTransitions"), adapter.list("siteFlows"),
  ]);
  const sameScope = (row: Scope, scope: "client" | "site", key: string) => row.scope === scope && (scope === "client" ? row.clientKey : row.siteKey) === key;
  const ordered = <T extends { position: number }>(rows: T[]) => [...rows].sort((a, b) => a.position - b.position);
  function settings(scope: "client" | "site", key: string): Partial<ClientConfigurationDefaults> {
    const result: Record<string, unknown> = {};
    for (const row of ordered(values.filter(v => sameScope(v, scope, key)))) {
      const definition = definitions.find(d => d.key === row.configurationKey);
      if (!definition) throw new Error(`Missing compatibility configuration definition: ${row.configurationKey}`);
      const path = definition.definition.path;
      if (!path?.length || ["coveragePolicy", "routingGates"].includes(path[0])) continue;
      let target = result;
      for (const part of path.slice(0, -1)) {
        if (["__proto__", "prototype", "constructor"].includes(part)) throw new Error("Invalid configuration path");
        target[part] ??= {};
        target = target[part] as Record<string, unknown>;
      }
      const last = path[path.length - 1];
      if (["__proto__", "prototype", "constructor"].includes(last)) throw new Error("Invalid configuration path");
      target[last] = row.value;
    }
    const overrides = Object.fromEntries(ordered(assignments.filter(a => sameScope(a, scope, key))).map(a => {
      const flow = flows.find(f => f.key === a.flowKey);
      if (!flow) throw new Error(`Missing compatibility flow: ${a.flowKey}`);
      return [a.flowId, { ...flow.definition,
        nodes: ordered(steps.filter(s => s.flowKey === flow.key)).map(s => s.definition),
        edges: ordered(transitions.filter(t => t.flowKey === flow.key)).map(t => t.definition),
      }];
    }));
    if (Object.keys(overrides).length) result.flows = { overrides };
    return result as Partial<ClientConfigurationDefaults>;
  }
  const clientEntities: SiteSnapshot["clientEntities"] = clients.filter(c => sites.some(s => !s.deletedAt && s.clientId === c.id)).map(client => {
    const organization = organizations.find(o => o.id === client.organizationId);
    const clientBranding = branding.find(r => sameScope(r, "client", client.key));
    const clientSupport = support.find(r => sameScope(r, "client", client.key));
    const defaults = settings("client", client.key);
    if (!organization || !clientBranding || !clientSupport || !defaults.coverages) throw new Error(`Incomplete compatibility client: ${client.key}`);
    return { id: client.key, tpaId: organization.key, name: client.name, acronym: client.acronym,
      branding: clientBranding.definition as ClientBranding, support: clientSupport.definition as ClientSupport,
      configurationDefaults: defaults as ClientConfigurationDefaults };
  });
  const siteEntities: SiteSnapshot["siteEntities"] = sites.filter(s => !s.deletedAt).map(site => {
    const client = clients.find(c => c.id === site.clientId);
    const policy = policies.find(p => p.siteKey === site.key);
    if (!client || !policy) throw new Error(`Incomplete compatibility site: ${site.key}`);
    const overrides = settings("site", site.key);
    return { id: site.key, clientId: client.key, name: site.name, templateType: site.templateType,
      status: site.status === "active" ? "active" : "inactive",
      ...policy.definition,
      ...(Object.keys(overrides).length ? { configurationOverrides: overrides } : {}),
      ...(branding.some(r => sameScope(r, "site", site.key)) ? { brandingOverride: branding.find(r => sameScope(r, "site", site.key))!.definition } : {}),
      ...(support.some(r => sameScope(r, "site", site.key)) ? { supportOverride: support.find(r => sameScope(r, "site", site.key))!.definition } : {}),
    };
  });
  const snapshot: SiteSnapshot = {
    clientEntities, siteEntities,
    tpaEntities: organizations.filter(o => clientEntities.some(c => c.tpaId === o.key)).map(o => {
      const profile = profiles.find(p => p.organizationKey === o.key);
      if (!profile) throw new Error(`Missing compatibility organization: ${o.key}`);
      return { id: o.key, ...profile.definition };
    }),
    associationEntities: ordered(associations.filter(a => clientEntities.some(c => c.id === a.clientKey))).map(a => ({ id: a.key, clientId: a.clientKey, ...a.definition })),
    siteAssociationEntities: ordered(relationships.filter(r => siteEntities.some(s => s.id === r.siteKey))).map(r => ({ id: r.key, siteId: r.siteKey, associationId: r.associationKey, enabled: r.enabled })),
    siteCoverageEntities: siteEntities.flatMap(site => {
      const client = clientEntities.find(c => c.id === site.clientId)!;
      return (site.configurationOverrides?.coverages?.enabled ?? client.configurationDefaults.coverages.enabled ?? []).map(coverageId => ({ id: `${site.id}--${coverageId}`, siteId: site.id, coverageId, enabled: true }));
    }),
    aliases: sites.filter(s => !s.deletedAt).map(s => {
      if (!s.legacyClientId) throw new Error(`Missing compatibility alias: ${s.key}`);
      return [s.legacyClientId as ClientId, s.key];
    }),
  };
  return { read: () => snapshot };
}
