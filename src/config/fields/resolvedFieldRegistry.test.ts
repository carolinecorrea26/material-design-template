import { describe, expect, it } from "vitest";
import { resolveVisibleFields } from "../conditions";
import { pageSections } from "../pageSections/pageSections";
import { clients } from "../clients";
import { getSite } from "../../data";
import { resolveClientFieldsForPage } from "../resolvers/resolveClientFields";
import { fieldCatalog } from ".";
import {
  normalizeClientFieldOverrides,
  siteFieldOverrides,
  type ScopedFieldOverride,
} from "./fieldOverrides";
import { pageFieldOrder } from "./pageFieldOrder";
import {
  getResolvedFieldRegistry,
  getResolvedFieldsForSite,
} from "./resolvedFieldRegistry";

describe("resolved field registry architecture", () => {
  it("discovers every base page placement through the resolved registry", () => {
    const registrations = getResolvedFieldRegistry();
    const missing = Object.entries(pageFieldOrder).flatMap(([pageId, fieldIds]) =>
      (fieldIds ?? [])
        .filter((fieldId) =>
          !registrations.some(
            (registration) =>
              registration.pageId === pageId && registration.fieldId === fieldId,
          ),
        )
        .map((fieldId) => `${pageId}:${fieldId}`),
    );

    expect(missing).toEqual([]);
  });

  it("preserves canonical page field ordering", () => {
    expect(getResolvedFieldsForSite("profile", "demo-default").map(({ id }) => id))
      .toEqual(pageFieldOrder.profile);
  });

  it("applies client field overrides through the registry selector", () => {
    const spouseMembership = getResolvedFieldsForSite(
      "eligibility",
      "abe-default",
    ).find(({ id }) => id === "spouse-membership");

    expect(spouseMembership?.label).toBe(
      "Is your spouse also an active member of a State, Local, or Specialty Bar Association?",
    );
  });

  it("normalizes ClientConfig.fields into client-scoped canonical overrides", () => {
    expect(normalizeClientFieldOverrides(clients.abe, "abe")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scope: "client",
          clientIds: ["abe"],
          pageId: "coverage",
          fieldId: "average-employees-6-months",
          hidden: true,
        }),
        expect.objectContaining({
          scope: "client",
          clientIds: ["abe"],
          pageId: "eligibility",
          fieldId: "spouse-membership",
          values: expect.objectContaining({
            label: expect.stringContaining("State, Local, or Specialty Bar"),
          }),
        }),
      ]),
    );
  });

  it("applies global, Client, then Site precedence deterministically", () => {
    const site = getSite("demo-default");
    if (!site) throw new Error("Missing demo Site test fixture");
    const overrides: ScopedFieldOverride[] = [
      {
        pageId: "membership",
        fieldId: "membership",
        scope: "site",
        siteIds: [site.id],
        values: { label: "Site label" },
      },
      {
        pageId: "membership",
        fieldId: "membership",
        scope: "global",
        values: { label: "Global label" },
      },
      {
        pageId: "membership",
        fieldId: "membership",
        scope: "client",
        clientIds: [site.clientId],
        values: { label: "Client label" },
      },
    ];
    const membership = getResolvedFieldsForSite(
      "membership",
      site.id,
      {
        sites: [site],
        clientForSite: () => clients.demo,
        fieldOverrides: overrides,
      },
    ).find(({ id }) => id === "membership");

    expect(membership?.label).toBe("Site label");
  });

  it("applies Site-specific Membership configuration without sibling leakage", () => {
    expect(
      getResolvedFieldsForSite("membership", "ama-default")
        .find(({ id }) => id === "membership"),
    ).toMatchObject({ label: "I am a (select one)", inputType: "dropdown" });

    expect(
      getResolvedFieldsForSite("membership", "waepa-standard")
        .some(({ id }) => id === "waepa-declaration"),
    ).toBe(true);
    expect(
      getResolvedFieldsForSite("membership", "waepa-gi")
        .some(({ id }) => id === "waepa-declaration"),
    ).toBe(false);
  });

  it("expresses Membership only through canonical scoped overrides", () => {
    expect(
      siteFieldOverrides
        .filter(({ pageId }) => pageId === "membership")
        .every(({ scope, siteIds }) => scope === "site" && siteIds?.length === 1),
    ).toBe(true);
    expect(
      siteFieldOverrides
        .filter(({ include }) => include)
        .every(({ fieldId }) => Boolean(fieldCatalog[fieldId])),
    ).toBe(true);
  });

  it("keeps conditional fields on the canonical visibility path", () => {
    const fields = getResolvedFieldsForSite("membership", "waepa-standard");
    const declaration = fields.find(({ id }) => id === "waepa-declaration");
    expect(declaration?.visibilityConditionId).toBe("condition-membership-waepa-new");
    expect(resolveVisibleFields(fields, { membership: "current" }))
      .not.toContainEqual(expect.objectContaining({ id: "waepa-declaration" }));
    expect(resolveVisibleFields(fields, { membership: "new" }))
      .toContainEqual(expect.objectContaining({ id: "waepa-declaration" }));
  });

  it("resolves Membership and ordinary pages through the same public selector", () => {
    const registry = getResolvedFieldRegistry();
    for (const pageId of ["membership", "profile"] as const) {
      expect(getResolvedFieldsForSite(pageId, "ama-default").map(({ id }) => id))
        .toEqual(
          registry
            .filter(
              (registration) =>
                registration.siteId === "ama-default" &&
                registration.pageId === pageId,
            )
            .map(({ fieldId }) => fieldId),
        );
    }
  });

  it("gives documentation the same effective values as runtime resolution", () => {
    const runtimeField = getResolvedFieldsForSite("eligibility", "abe-default")
      .find(({ id }) => id === "spouse-membership");
    const documentedField = resolveClientFieldsForPage("eligibility", clients.abe)
      .find(({ fieldId }) => fieldId === "spouse-membership");

    expect(documentedField?.row.label).toBe(runtimeField?.label);
    expect(documentedField?.included).toBe(true);
  });

  it("preserves member, spouse, and child section applicability", () => {
    const memberSection = pageSections.profile?.find(
      ({ id }) => id === "profilePersonalSelf",
    );
    const spouseSection = pageSections.profile?.find(
      ({ id }) => id === "profilePersonalSpouse",
    );
    const childSection = pageSections.eligibility?.find(
      ({ id }) => id === "childSection",
    );

    expect(memberSection?.applicant).toBe("self");
    expect(spouseSection?.applicant).toBe("spouse");
    expect(childSection).toMatchObject({
      applicant: "child",
      visibilityConditionId: "condition-child-selected",
      fieldIds: [],
    });

    const resolvedIds = new Set(
      getResolvedFieldsForSite("profile", "demo-default").map(({ id }) => id),
    );
    expect(memberSection?.fieldIds.every((fieldId) => resolvedIds.has(fieldId)))
      .toBe(true);
    expect(spouseSection?.fieldIds.every((fieldId) => resolvedIds.has(fieldId)))
      .toBe(true);
  });

  it("has one stable canonical definition for every field ID", () => {
    const entries = Object.entries(fieldCatalog);
    expect(new Set(entries.map(([, field]) => field.id)).size).toBe(entries.length);
    expect(entries.filter(([fieldId, field]) => field.id !== fieldId)).toEqual([]);
  });
});
