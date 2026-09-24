import { beforeEach, describe, expect, it } from "vitest";
import { getClientPageFields, resolveAssociationMembershipField } from "../config/clientFields/getClientPageFields";
import type { FieldDefinition } from "../config/fields/types";
import {
  associationEntities,
  getAssociation,
  getAssociationsForClient,
  getAssociationsForSite,
  getSite,
  getSiteAssociations,
  getSitesForAssociation,
  isitrustAssociationCount,
  resolveActiveAssociation,
  resolveAssociationSelection,
  resolveBranding,
  siteAssociationEntities,
  validateAssociationIntegrity,
  type Association,
  type Site,
} from ".";

const membershipField: FieldDefinition = {
  id: "membership",
  label: "Membership",
  inputType: "radio",
  options: [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
  ],
};

const urlSite: Site = {
  id: "asce-url-proof",
  clientId: "asce",
  name: "URL Association proof",
  templateType: "multi",
  status: "active",
  legacyClientId: "asce",
  associationSelection: { mode: "url-parameter", urlParameter: "association" },
  associationBranding: { useAssociationLogo: true },
};

const urlAssociation: Association = {
  id: "url-proof-association",
  clientId: "asce",
  name: "URL Proof Association",
  logo: "/association/url-proof.png",
  logoAlt: "URL Proof Association logo",
};

describe("canonical Association model", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.sessionStorage.clear();
  });

  it("represents one Client → one Site → one fixed Association", () => {
    expect(getAssociationsForSite("asce-default").map((entry) => entry.id)).toEqual([
      "american-society-of-civil-engineers",
    ]);
    expect(resolveActiveAssociation("asce-default").association?.name).toBe(
      "American Society of Civil Engineers",
    );
  });

  it("represents one Client → multiple Sites → the same Association", () => {
    expect(getSitesForAssociation("waepa").map((site) => site.id)).toEqual([
      "waepa-standard",
      "waepa-gi",
    ]);
    expect(getAssociationsForClient("waepa")).toHaveLength(1);
  });

  it("represents one Client → one Site → many Associations", () => {
    expect(getAssociationsForSite("isitrust-default")).toHaveLength(
      isitrustAssociationCount,
    );
    expect(isitrustAssociationCount).toBe(25);
  });

  it("keeps every Association and SiteAssociation foreign key valid", () => {
    expect(validateAssociationIntegrity()).toEqual([]);
    expect(new Set(associationEntities.map((entry) => entry.id)).size).toBe(
      associationEntities.length,
    );
    expect(new Set(siteAssociationEntities.map((entry) => entry.id)).size).toBe(
      siteAssociationEntities.length,
    );
    for (const relationship of siteAssociationEntities) {
      expect(getSite(relationship.siteId)?.clientId).toBe(
        getAssociation(relationship.associationId)?.clientId,
      );
    }
  });

  it("does not resolve an Association owned by another Client", () => {
    const foreignAssociation: Association = {
      id: "foreign-association",
      clientId: "ama",
      name: "Foreign Association",
    };
    expect(
      resolveAssociationSelection(
        urlSite,
        [foreignAssociation],
        { urlAssociationId: foreignAssociation.id },
      ).status,
    ).toBe("invalid");
  });

  it("resolves fixed Associations deterministically", () => {
    expect(resolveActiveAssociation("waepa-standard")).toMatchObject({
      status: "resolved",
      association: { id: "waepa" },
    });
    expect(resolveActiveAssociation("waepa-gi")).toMatchObject({
      status: "resolved",
      association: { id: "waepa" },
    });
  });

  it("resolves a valid association URL value against enabled canonical data", () => {
    expect(
      resolveAssociationSelection(urlSite, [urlAssociation], {
        urlAssociationId: urlAssociation.id,
      }),
    ).toMatchObject({ status: "resolved", association: urlAssociation });
  });

  it("returns explicit missing/invalid states without exposing arbitrary text", () => {
    expect(resolveAssociationSelection(urlSite, [urlAssociation]).status).toBe("missing");
    const invalid = resolveAssociationSelection(urlSite, [urlAssociation], {
      urlAssociationId: "<img src=x onerror=alert(1)>",
    });
    expect(invalid.status).toBe("invalid");
    expect(invalid.association).toBeUndefined();
    expect(invalid.message).not.toContain("<img");
  });

  it("uses the resolved URL Association in the membership attestation label", () => {
    const resolution = resolveAssociationSelection(urlSite, [urlAssociation], {
      urlAssociationId: urlAssociation.id,
    });
    expect(
      resolveAssociationMembershipField(
        membershipField,
        urlSite,
        [urlAssociation],
        resolution,
      ).label,
    ).toBe("Are you a member of URL Proof Association?");
  });

  it("can resolve a canonical URL-selected Association logo", () => {
    const asceBranding = getAssociation("american-society-of-civil-engineers")!;
    const effective = resolveBranding(
      {
        name: "ASCE Client",
        acronym: "ASCE",
        logo: "/client/asce/logo.png",
        logoAlt: "ASCE client logo",
      },
      urlSite,
      urlAssociation,
    );
    expect(asceBranding.logo).toBe("/client/asce/logo.png");
    expect(effective).toMatchObject({
      logo: "/association/url-proof.png",
      logoAlt: "URL Proof Association logo",
    });
  });

  it("generates select-mode options from canonical Site Associations", () => {
    const site = getSite("isitrust-default")!;
    const associations = getAssociationsForSite(site.id);
    const resolved = resolveAssociationMembershipField(
      membershipField,
      site,
      associations,
      { status: "unselected" },
    );
    expect(resolved.options).toEqual(
      associations.map((association) => ({
        label: association.name,
        value: association.id,
      })),
    );
  });

  it("retains every ISITRUST Association choice after migration", () => {
    window.history.replaceState(null, "", "/?site=isitrust-default");
    const membership = getClientPageFields("membership").find(
      (field) => field.id === "membership",
    );
    expect(membership).toMatchObject({
      label: "I am a member of",
      inputType: "searchable-select",
    });
    expect(membership?.options).toHaveLength(25);
    expect(membership?.options?.[0]).toEqual({
      label: "Akron Bar Association",
      value: "akron-bar-association",
    });
    expect(membership?.options?.at(-1)).toEqual({
      label: "USA Fencing",
      value: "usa-fencing",
    });
  });

  it("keeps WAEPA's special membership behavior intact", () => {
    window.history.replaceState(null, "", "/?site=waepa-standard");
    const membership = getClientPageFields("membership").find(
      (field) => field.id === "membership",
    );
    expect(membership).toMatchObject({
      label: "Are you a current WAEPA member, or are you becoming a new member?",
      inputType: "radio",
      options: [
        { label: "Current Member", value: "current" },
        { label: "New Member", value: "new" },
      ],
    });
  });

  it("keeps existing fixed single-Association client fields behaviorally intact", () => {
    window.history.replaceState(null, "", "/?site=avma-default");
    const membership = getClientPageFields("membership").find(
      (field) => field.id === "membership",
    );
    expect(membership?.label).toBe(
      "Are you a member of the American Veterinary Medical Association?",
    );
    expect(getSiteAssociations("avma-default")).toHaveLength(1);
  });
});
