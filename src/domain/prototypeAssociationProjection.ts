import type { Association, AssociationBranding, AssociationSelection } from "./associations";
import type { EffectiveSiteData } from "./effectiveSite";
import type { Tpa } from "./organizations";

export type PrototypeAssociationContext = {
  associations: Association[];
  selection?: AssociationSelection;
  branding?: AssociationBranding;
  tpa: Tpa;
  tpaKey: string;
  allAssociations: Association[];
  links: EffectiveSiteData["siteAssociations"];
  sites: EffectiveSiteData["sites"];
};

/** Project persisted compatibility identities without inferring canonical aliases,
 * changing tenancy, or consulting source registries. Selection values retain their
 * stored keys until the identity reconciliation gate is complete.
 */
export function buildPrototypeAssociationContext(data: EffectiveSiteData, siteKey: string): PrototypeAssociationContext {
  if (!Array.isArray(data.associations) || !Array.isArray(data.siteAssociations) || !Array.isArray(data.sitePolicies)) {
    throw new Error("Association snapshot unavailable. Create a new draft/release with stored Association tables.");
  }
  const site = data.sites.find(row => row.key === siteKey);
  const client = site && data.clients.find(row => row.id === site.clientId);
  if (!site || !client) throw new Error(`Unavailable Association Site: ${siteKey}`);
  if (!Array.isArray(data.organizations) || !Array.isArray(data.organizationProfiles)) throw new Error("TPA snapshot unavailable. Create a new draft/release with stored TPA tables.");
  const organizations = data.organizations.filter(row => row.id === client.organizationId);
  if (organizations.length !== 1 || !organizations[0].key || !organizations[0].name) throw new Error(`Missing or ambiguous TPA: ${client.organizationId}`);
  const organization = organizations[0];
  const profiles = data.organizationProfiles.filter(row => row.organizationKey === organization.key);
  if (profiles.length !== 1) throw new Error(`Missing or ambiguous TPA profile: ${organization.key}`);
  // The organization owns identity; a copied profile name cannot override it.
  const tpa: Tpa = { ...structuredClone(profiles[0].definition), id: organization.id, name: organization.name };
  const policies = data.sitePolicies.filter(row => row.siteKey === siteKey);
  if (policies.length !== 1) throw new Error(`Missing or ambiguous Site association policy: ${siteKey}`);
  const policy = policies[0].definition;
  const links = data.siteAssociations.filter(row => row.siteKey === siteKey);
  if (new Set(links.map(row => row.associationKey)).size !== links.length) throw new Error(`Duplicate Site Association: ${siteKey}`);
  const associations = links.filter(row => row.enabled)
    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key))
    .map(link => {
      const definitions = data.associations.filter(row => row.key === link.associationKey);
      if (definitions.length !== 1) throw new Error(`Missing or ambiguous Association: ${link.associationKey}`);
      const row = definitions[0];
      if (row.clientKey !== client.key) throw new Error(`Association belongs to another hosting identity: ${row.key}`);
      return { ...structuredClone(row.definition), id: row.key, clientId: client.key };
    });
  return { associations, tpa, tpaKey: organization.key,
    allAssociations: data.associations.filter(row => row.clientKey === client.key).map(row => ({ ...structuredClone(row.definition), id: row.key, clientId: client.key })),
    links: structuredClone(data.siteAssociations.filter(row => data.sites.some(site => site.key === row.siteKey && site.clientId === client.id))),
    sites: structuredClone(data.sites.filter(row => row.clientId === client.id)),
    selection: structuredClone(policy.associationSelection), branding: structuredClone(policy.associationBranding) };
}
