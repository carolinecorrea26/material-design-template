import type { ClientConfig } from "../clients/types";
import {
  getLegacyClientConfigForSite,
  siteEntities,
} from "../../data/registry";
import type { Site, SiteId } from "../../data/model";
import { fieldCatalog } from ".";
import { pageFieldOrder } from "./pageFieldOrder";
import type { FieldDefinition, FieldId } from "./types";
import type { PageId } from "../../types";
import {
  getApplicableFieldOverrides,
  normalizeClientFieldOverrides,
  siteFieldOverrides,
  type ScopedFieldOverride,
} from "./fieldOverrides";

export type ResolvedFieldRegistration = {
  siteId: SiteId;
  pageId: PageId;
  fieldId: FieldId;
  field: FieldDefinition;
};

export type ResolvedFieldResolution = ResolvedFieldRegistration & {
  included: boolean;
  status: "inherited" | "overridden" | "client-specific" | "disabled";
  notes: string[];
};

export type FieldRegistrySources = {
  sites: Site[];
  clientForSite: (site: Site) => ClientConfig;
  fieldOverrides: ScopedFieldOverride[];
};

const defaultSources: FieldRegistrySources = {
  sites: siteEntities,
  clientForSite: (site) => getLegacyClientConfigForSite(site.id),
  fieldOverrides: siteFieldOverrides,
};

function resolvePageFieldEntries(
  pageId: PageId,
  overrides: ScopedFieldOverride[],
): Omit<ResolvedFieldResolution, "siteId" | "pageId" | "fieldId">[] {
  const resolved = new Map<
    FieldId,
    Omit<ResolvedFieldResolution, "siteId" | "pageId" | "fieldId">
  >();
  for (const fieldId of pageFieldOrder[pageId] ?? []) {
    const field = fieldCatalog[fieldId];
    if (field) {
      resolved.set(fieldId, {
        field,
        included: true,
        status: "inherited",
        notes: [],
      });
    }
  }

  for (const override of overrides) {
    let entry = resolved.get(override.fieldId);
    if (override.include && !entry) {
      const field = fieldCatalog[override.fieldId];
      if (field) {
        entry = {
          field,
          included: true,
          status: "client-specific",
          notes: ["Added for this client"],
        };
        resolved.set(override.fieldId, entry);
      }
    }
    if (!entry) continue;

    const valueKeys = Object.keys(override.values ?? {});
    const requiredOnly =
      valueKeys.length === 1 &&
      valueKeys[0] === "required" &&
      override.values?.required === true;
    const notes = entry.status === "client-specific" || valueKeys.length === 0
      ? entry.notes
      : [
          ...entry.notes,
          requiredOnly
            ? "Required for this client"
            : `Overridden: ${valueKeys.join(", ")}`,
        ];
    const next = {
      ...entry,
      field: { ...entry.field, ...override.values },
      status:
        entry.status === "client-specific" || valueKeys.length === 0
          ? entry.status
          : "overridden" as const,
      notes,
    };

    if (override.hidden !== undefined) {
      next.included = !override.hidden;
      next.status = override.hidden ? "disabled" : "overridden";
      next.notes = override.hidden ? ["Hidden for this client"] : notes;
    }
    resolved.set(override.fieldId, next);
  }
  return [...resolved.values()];
}

export function getResolvedFieldResolutionsForSite(
  pageId: PageId,
  siteId: SiteId,
  sources: FieldRegistrySources = defaultSources,
): ResolvedFieldResolution[] {
  const site = sources.sites.find((candidate) => candidate.id === siteId);
  if (!site) return [];
  const client = sources.clientForSite(site);
  const overrides = getApplicableFieldOverrides(
    [
      ...normalizeClientFieldOverrides(client, site.clientId),
      ...sources.fieldOverrides,
    ],
    { clientId: site.clientId, siteId: site.id, pageId },
  );
  return resolvePageFieldEntries(
    pageId,
    overrides,
  ).map((entry) => ({
    ...entry,
    siteId: site.id,
    pageId,
    fieldId: entry.field.id as FieldId,
  }));
}

/** Resolves one Site/page through the same path used to build the full registry. */
export function getResolvedFieldsForSite(
  pageId: PageId,
  siteId: SiteId,
  sources: FieldRegistrySources = defaultSources,
): FieldDefinition[] {
  return getResolvedFieldResolutionsForSite(pageId, siteId, sources)
    .filter(({ included }) => included)
    .map(({ field }) => field);
}

/**
 * Canonical, effective Field-to-Site relationships used by documentation and
 * other registry consumers. It resolves every page and every Site through the
 * same scoped-override pipeline.
 */
export function getResolvedFieldRegistry(
  sources: FieldRegistrySources = defaultSources,
): ResolvedFieldRegistration[] {
  return sources.sites.flatMap((site) => {
    const client = sources.clientForSite(site);
    const overrides = [
      ...normalizeClientFieldOverrides(client, site.clientId),
      ...sources.fieldOverrides,
    ];
    const pageIds = new Set<PageId>([
      ...(Object.keys(pageFieldOrder) as PageId[]),
      ...overrides.map(({ pageId }) => pageId),
    ]);
    return [...pageIds].flatMap((pageId) =>
      getResolvedFieldResolutionsForSite(pageId, site.id, sources)
        .filter(({ included }) => included)
        .map(({ siteId, pageId: resolvedPageId, fieldId, field }) => ({
          siteId,
          pageId: resolvedPageId,
          fieldId,
          field,
        })),
    );
  });
}
