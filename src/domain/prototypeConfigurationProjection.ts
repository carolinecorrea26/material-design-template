import { isCoverageProductOrder } from "./coveragePresentation";
import { isApplicantExperience } from "./applicantExperience";
import { buildPrototypeAmounts, buildPrototypeRiders } from "./prototypeProductProjection";
import type { ClientConfig } from "./configuration";
import type { EffectiveSite, EffectiveSiteData } from "./effectiveSite";
import type { SiteContent } from "../content/types";

type PrototypeClientProjection = {
  client: ClientConfig;
  settings: Record<string, unknown>;
  clientIdentity: EffectiveSiteData["clients"][number];
};

function put(root: Record<string, unknown>, path: string[], value: unknown) {
  if (!path.length || path.some(key => ['__proto__', 'constructor', 'prototype'].includes(key))) throw new Error('Unsafe Library path');
  let cursor = root;
  for (const key of path.slice(0, -1)) {
    if (!cursor[key] || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[path.at(-1)!] = structuredClone(value);
}
/** Legacy path assembly is confined here. These assertions describe compatibility
 * shapes; they do not validate the complete ClientConfig or SiteContent contracts.
 */
export function buildPrototypeClient(data: EffectiveSiteData, site: EffectiveSite): PrototypeClientProjection {
  const siteKey = site.siteKey;
  const root: Record<string, unknown> = { id: site.clientKey, branding: {}, support: {}, pages: {}, fields: {}, coverages: {}, features: {}, flows: {} };
  for (const row of site.configuration.configurations) {
    const path = data.configurationDefinitions.find(d => d.key === row.key)?.definition.path;
    if (path) put(root, path, row.value);
  }
  if (!site.configuration.routing) throw new Error("Missing stored routing policy");
  root.routingGates = structuredClone(site.configuration.routing.definitions);
  root.branding = structuredClone(Object.fromEntries(site.configuration.branding.map(row => [row.key, row.value])));
  root.support = structuredClone(Object.fromEntries(site.configuration.support.map(row => [row.key, row.value])));
  const client = root as unknown as ClientConfig;
  if (client.coverages.productOrder !== undefined && !isCoverageProductOrder(client.coverages.productOrder, data.products.map(product => product.key))) throw new Error("Invalid configured product order");
  const identity = data.sites.find(s => s.key === siteKey);
  if (!identity) throw new Error(`Unavailable Site: ${siteKey}`);
  const clientIdentity = data.clients.find(c => c.id === identity.clientId);
  if (!clientIdentity) throw new Error(`Unavailable Client: ${identity.clientId}`);
  client.features = { ...client.features, defaultTemplate: identity.templateType };
  if (client.applicantExperience !== undefined && !isApplicantExperience(client.applicantExperience)) throw new Error("Invalid applicant experience configuration");
  if (client.applicantExperience?.contact?.businessAddressProducts?.some(key => !site.products.some(product => product.productKey === key))) throw new Error("Invalid business-address product scope");
  if (site.configuration.pageParticipation.source === "sitePages") {
    const modes = data.pages.map(page => ({ id: page.definition.id, requirement: site.configuration.pages.find(assignment => assignment.key === page.key)?.requirement ?? "none" as const }));
    client.pages = { participationSource: "sitePages", requirements: Object.fromEntries(modes.map(page => [page.id, page.requirement])),
      excluded: modes.filter(page => page.requirement === "none").map(page => page.id),
      optional: modes.filter(page => page.requirement === "optional").map(page => page.id) };
  }
  client.coverages.enabled = site.products.map(p => p.productKey);
  client.coverages.coverageAmounts = Object.fromEntries(site.configuration.products.map(product => [product.productKey, buildPrototypeAmounts(product)]));
  for (const product of site.configuration.products.filter(product => product.riderOwnership === "relational")) {
    client.coverages.overrides = { ...client.coverages.overrides, [product.productKey]: { ...client.coverages.overrides?.[product.productKey], riders: buildPrototypeRiders(product) } };
  }
  client.reviewPolicy = site.configuration.reviewPolicies[0]?.value as ClientConfig['reviewPolicy'];
  const rates = site.configuration.ratePresentationPolicies[0]?.value as { praseConfigured: boolean; quoteToolEnabled: boolean };
  if (!rates?.praseConfigured || !rates.quoteToolEnabled) client.features = { ...client.features, homePageVariant: 'hero-image' };
  client.fields = Object.fromEntries(site.configuration.pages.map(page => [page.key, {
    hidden: page.fields.filter(field => !field.included).map(field => field.key),
    extra: site.configuration.siteStructureOwnership === "stored-structure"
      ? page.fields.filter(field => field.included && !data.pageFields.some(placement => placement.pageKey === page.key && placement.fieldKey === field.key)
        && !data.pageSectionFields.some(placement => placement.fieldKey === field.key && data.pageSections.some(section => section.key === placement.sectionKey && section.pageKey === page.key && !section.definition.collectionName))).map(field => field.key)
      : client.fields[page.key as keyof typeof client.fields]?.extra ?? [],
    overrides: Object.fromEntries(page.fields.map(field => [field.key, field.definition])),
  }]));
  return { client, settings: root, clientIdentity: structuredClone(clientIdentity) };
}

export function buildPrototypeContent(data: EffectiveSiteData, site: EffectiveSite): SiteContent {
  const content: Record<string, unknown> = {};
  for (const value of site.configuration.content) {
    const path = data.contentEntries.find(entry => entry.key === value.key)?.definition.path;
    if (path) put(content, path, value.value);
  }
  return content as unknown as SiteContent;
}
