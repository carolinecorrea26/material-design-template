import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import type { EffectiveSiteData } from "./effectiveSite";
import { buildPrototypeAssociationContext } from "./prototypeAssociationProjection";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { getAssociation, getAssociationsForClient, getAssociationsForSite, getClient, getClientForSite, getSite, getSiteAssociations, getSitesForClient, getTpa, getTpaForClient, siteRepository } from "../repositories/sites";
import { resolveActiveAssociation } from "../data/associationSelection";
import { resolveEffectiveBranding } from "../data/resolvers";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";

let data: EffectiveSiteData;
beforeAll(() => { data = createReviewedMigrationDatabase(); });
afterEach(() => { installPrototypeLibrary(null); vi.restoreAllMocks(); window.history.replaceState(null, "", "/"); window.sessionStorage.clear(); });

it("uses captured membership definitions and enablement without a static read", () => {
  const changed = structuredClone(data);
  const links = changed.siteAssociations.filter(row => row.siteKey === "isitrust");
  const association = changed.associations.find(row => row.key === links[0].associationKey)!;
  association.definition.name = "Stored membership organization";
  links[1].enabled = false;
  const staticRead = vi.spyOn(siteRepository, "getAssociationsForSite");
  const installed = resolvePrototypeLibrary(changed, "isitrust", "captured");
  installPrototypeLibrary(installed);
  expect(getSite("isitrust")?.associationSelection?.mode).toBe("select");
  expect(getAssociationsForSite("isitrust")).toHaveLength(25);
  expect(resolveActiveAssociation("isitrust", { selectedAssociationId: association.key }).association?.name).toBe("Stored membership organization");
  expect(resolveActiveAssociation("isitrust", { selectedAssociationId: links[1].associationKey }).status).toBe("invalid");
  window.history.replaceState(null, "", "/membership?site=isitrust");
  expect(getClientPageFields("membership").find(field => field.id === "membership")?.options).toContainEqual({ value: association.key, label: "Stored membership organization" });
  expect(staticRead).not.toHaveBeenCalled();
  association.definition.name = "Later mutation";
  const returned = getAssociationsForSite("isitrust");
  returned[0].name = "Consumer mutation";
  expect(resolveActiveAssociation("isitrust", { selectedAssociationId: association.key }).association?.name).toBe("Stored membership organization");
});

it.each(["waepa", "waepa-gi"])("preserves fixed Association selection for %s", siteKey => {
  installPrototypeLibrary(resolvePrototypeLibrary(data, siteKey, "fixed"));
  expect(resolveActiveAssociation(siteKey)).toMatchObject({ status: "resolved", association: { id: "waepa", clientId: "waepa" } });
  if (siteKey === "waepa") expect(resolveActiveAssociation("waepa-standard").status).toBe("resolved");
});

it("uses stored URL policy and Association branding, including missing-logo fallback", () => {
  const changed = structuredClone(data);
  const policy = changed.sitePolicies.find(row => row.siteKey === "asce")!;
  policy.definition.associationSelection = { mode: "url-parameter", urlParameter: "association" };
  policy.definition.associationBranding = { useAssociationLogo: true };
  const link = changed.siteAssociations.find(row => row.siteKey === "asce")!;
  const association = changed.associations.find(row => row.key === link.associationKey)!;
  association.definition.logo = "/association/stored-logo.svg";
  association.definition.logoAlt = "Stored Association logo";
  installPrototypeLibrary(resolvePrototypeLibrary(changed, "asce", "url"));
  expect(resolveActiveAssociation("asce").status).toBe("missing");
  expect(resolveActiveAssociation("asce", { urlAssociationId: "foreign" }).status).toBe("invalid");
  expect(resolveActiveAssociation("asce", { urlAssociationId: association.key }).status).toBe("resolved");
  expect(resolveEffectiveBranding({ siteId: "asce", associationId: association.key })).toMatchObject({ logo: "/association/stored-logo.svg", logoAlt: "Stored Association logo" });
  delete association.definition.logo;
  const installed = resolvePrototypeLibrary(changed, "asce", "no-logo");
  installPrototypeLibrary(installed);
  expect(resolveEffectiveBranding({ siteId: "asce", associationId: association.key }).logo).toBe(installed.client.branding.logo);
});

it("rejects missing tables, broken references, duplicate links and foreign ownership", () => {
  const missing = structuredClone(data);
  Reflect.deleteProperty(missing, "associations");
  expect(() => buildPrototypeAssociationContext(missing, "asce")).toThrow("Association snapshot unavailable");
  for (const mutation of ["missing", "duplicate", "foreign"] as const) {
    const changed = structuredClone(data);
    const link = changed.siteAssociations.find(row => row.siteKey === "asce")!;
    if (mutation === "missing") link.associationKey = "missing-association";
    if (mutation === "duplicate") changed.siteAssociations.push({ ...link, id: "duplicate", key: "duplicate" });
    if (mutation === "foreign") changed.associations.find(row => row.key === link.associationKey)!.clientKey = "ama";
    expect(() => buildPrototypeAssociationContext(changed, "asce")).toThrow();
  }
});

it("keeps Association context attached to the installed Site and uses catalog mode when uninstalled", () => {
  installPrototypeLibrary(resolvePrototypeLibrary(data, "asce", "isolation"));
  expect(getAssociationsForSite("asce").every(row => row.clientId === "asce")).toBe(true);
  expect(resolveActiveAssociation("asce", { selectedAssociationId: "waepa" }).association?.id).not.toBe("waepa");
  installPrototypeLibrary(null);
  expect(resolveActiveAssociation("waepa").status).toBe("resolved");
});

it("uses captured TPA and Association identity for template lookups even when IDs differ from keys", () => {
  const changed = structuredClone(data);
  const client = changed.clients.find(row => row.key === "waepa")!;
  const organization = changed.organizations.find(row => row.id === client.organizationId)!;
  organization.id = "persisted-tpa-uuid";
  organization.name = "Captured administrator";
  const oldClientId = client.id;
  client.id = "persisted-association-uuid";
  client.organizationId = organization.id;
  client.name = "Captured hosting Association";
  for (const site of changed.sites.filter(row => row.clientId === oldClientId)) site.clientId = client.id;
  const profile = changed.organizationProfiles.find(row => row.organizationKey === organization.key)!;
  profile.definition.name = "Stale copied profile name";
  profile.definition.support = { email: "captured@example.test" };
  const association = changed.associations.find(row => row.key === "waepa")!;
  association.definition.name = "Captured membership Association";
  const tpaRead = vi.spyOn(siteRepository, "getTpaForClient");
  const associationRead = vi.spyOn(siteRepository, "getAssociation");
  installPrototypeLibrary(resolvePrototypeLibrary(changed, "waepa-gi", "captured-identity"));
  expect(getClientForSite("waepa-gi")).toMatchObject({ id: "waepa", name: client.name, tpaId: organization.id });
  expect(getClient("waepa")?.name).toBe(client.name);
  expect(getTpaForClient("waepa")).toMatchObject({ id: organization.id, name: organization.name, support: { email: "captured@example.test" } });
  expect(getTpa(organization.id)?.name).toBe(organization.name);
  expect(getSitesForClient("waepa").map(row => row.id).sort()).toEqual(["waepa", "waepa-gi"]);
  expect(getSiteAssociations("waepa-gi").map(row => row.associationId)).toEqual(["waepa"]);
  expect(getAssociation("waepa")?.name).toBe(association.definition.name);
  expect(getAssociationsForClient("waepa").map(row => row.name)).toContain(association.definition.name);
  expect(getAssociation("unknown")).toBeUndefined();
  expect(tpaRead).not.toHaveBeenCalled();
  expect(associationRead).not.toHaveBeenCalled();
  client.name = "Later source mutation";
  expect(getClientForSite("waepa-gi")?.name).toBe("Captured hosting Association");
  getTpaForClient("waepa")!.support!.email = "mutated@example.test";
  expect(getTpaForClient("waepa")?.support?.email).toBe("captured@example.test");
});

it.each(["organizations", "organizationProfiles", "missing-tpa", "duplicate-profile"])("rejects an incomplete captured TPA context: %s", mutation => {
  const changed = structuredClone(data);
  if (mutation === "organizations" || mutation === "organizationProfiles") Reflect.deleteProperty(changed, mutation);
  else if (mutation === "missing-tpa") changed.clients.find(row => row.key === "asce")!.organizationId = "unknown";
  else {
    const profile = changed.organizationProfiles.find(row => row.organizationKey === changed.organizations.find(row => row.id === changed.clients.find(row => row.key === "asce")!.organizationId)!.key)!;
    changed.organizationProfiles.push({ ...profile, id: "duplicate", key: "duplicate" });
  }
  expect(() => resolvePrototypeLibrary(changed, "asce", "invalid-identity")).toThrow(/TPA/);
});
