import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { getActiveSite } from "../data/activeSite";
import {
  getAssociationsForSite,
  getHostingAssociationForSite,
  getSiteIdForClientAlias,
} from "../data/registry";
import type { AssociationId, SiteId } from "../data/model";
import type { SiteContent } from "./types";
import type { DeepPartial } from "./types-util";
import {
  homeDefaults,
  coverageDefaults,
  navigationDefaults,
  footerDefaults,
  reviewDefaults,
  receiptDefaults,
  helpDefaults,
  sharedDefaults,
  pagesDefaults,
  beneficiaryDefaults,
  dialogsDefaults,
} from "./defaults";
import { siteContentOverrides } from "./clients";

/**
 * Deep merges a base object with a partial override object.
 * Arrays in the override fully replace the base array (no merging).
 */
function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: DeepPartial<T> | undefined,
): T {
  if (!override) return base;

  const result = { ...base };

  for (const key of Object.keys(override) as Array<keyof T>) {
    const overrideValue = (override as any)[key];

    if (overrideValue === undefined) continue;

    if (
      Array.isArray(overrideValue) ||
      typeof overrideValue !== "object" ||
      overrideValue === null
    ) {
      (result as Record<string, unknown>)[key as string] = overrideValue;
    } else if (
      typeof base[key] === "object" &&
      base[key] !== null &&
      !Array.isArray(base[key])
    ) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        base[key] as Record<string, unknown>,
        overrideValue as DeepPartial<Record<string, unknown>>,
      );
    } else {
      (result as Record<string, unknown>)[key as string] = overrideValue;
    }
  }

  return result;
}

export function buildContent(siteId: SiteId): SiteContent {
  const library = getPrototypeLibrary(siteId);
  if (library) return library.content;
  const overrides = siteContentOverrides[siteId];

  return {
    home: deepMerge(
      homeDefaults,
      overrides?.home as DeepPartial<typeof homeDefaults>,
    ),
    coverage: deepMerge(
      coverageDefaults,
      overrides?.coverage as DeepPartial<typeof coverageDefaults>,
    ),
    navigation: deepMerge(
      navigationDefaults,
      overrides?.navigation as DeepPartial<typeof navigationDefaults>,
    ),
    pages: deepMerge(
      pagesDefaults as Record<string, unknown>,
      overrides?.pages as DeepPartial<Record<string, unknown>>,
    ) as SiteContent["pages"],
    footer: deepMerge(
      footerDefaults,
      overrides?.footer as DeepPartial<typeof footerDefaults>,
    ),
    review: deepMerge(
      reviewDefaults,
      overrides?.review as DeepPartial<typeof reviewDefaults>,
    ),
    receipt: deepMerge(
      receiptDefaults,
      overrides?.receipt as DeepPartial<typeof receiptDefaults>,
    ),
    help: deepMerge(
      helpDefaults,
      overrides?.help as DeepPartial<typeof helpDefaults>,
    ),
    shared: deepMerge(
      sharedDefaults,
      overrides?.shared as DeepPartial<typeof sharedDefaults>,
    ),
    beneficiary: deepMerge(
      beneficiaryDefaults,
      overrides?.beneficiary as DeepPartial<typeof beneficiaryDefaults>,
    ),
    dialogs: deepMerge(
      dialogsDefaults,
      overrides?.dialogs as DeepPartial<typeof dialogsDefaults>,
    ),

  };
}

let cachedContent: SiteContent | null = null;
let cachedSiteId: SiteId | null = null;

/**
 * Returns the fully resolved content for the active Site.
 * Merges default content with Site-specific overrides.
 *
 * Installed database content owns the active revision. Cache only catalog
 * content, by Site, so an earlier read cannot shadow a saved revision.
 */
export function getContent(): SiteContent {
  const siteId = getActiveSite().id;
  const library = getPrototypeLibrary(siteId);
  if (library) return library.content;
  if (cachedContent && cachedSiteId === siteId) return cachedContent;

  cachedContent = buildContent(siteId);
  cachedSiteId = siteId;
  return cachedContent;
}

/**
 * Resolves a content string template by replacing placeholders.
 * Supported placeholders:
 * - {{clientName}} - Active client's full name
 * - {{clientAcronym}} - Active client's acronym
 * - {{associationName}} - Active canonical Association, falling back to Client name
 */
export function resolveBrandingTemplate(template: string, branding: { name: string; acronym?: string }, associationName = branding.name): string {
  return template.replace(/\{\{clientName\}\}/g, branding.name)
    .replace(/\{\{clientAcronym\}\}/g, branding.acronym ?? branding.name)
    .replace(/\{\{associationName\}\}/g, associationName);
}

export function resolveTemplate(
  template: string,
  associationId?: AssociationId | null,
): string {
  const site = getActiveSite();
  const client = getHostingAssociationForSite(site.id)!;
  const association = associationId
    ? getAssociationsForSite(site.id).find(
        (candidate) => candidate.id === associationId,
      )
    : undefined;
  return resolveBrandingTemplate(template, client, association?.name ?? client.name);
}

/** Temporary adapter for Storybook/design previews that still supply a legacy config ID. */
export function buildContentForClientAlias(clientAlias: Parameters<typeof getSiteIdForClientAlias>[0]) {
  return buildContent(getSiteIdForClientAlias(clientAlias));
}

export type { SiteContent } from "./types";
export type { DeepPartial } from "./types-util";
