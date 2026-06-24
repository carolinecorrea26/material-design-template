import { getActiveClient } from "../config/client/getActiveClient";
import type { ClientId } from "../types";
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
} from "./defaults";
import { clientContentOverrides } from "./clients";

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

function buildContent(clientId: ClientId): SiteContent {
  const overrides = clientContentOverrides[clientId];

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
  };
}

let cachedContent: SiteContent | null = null;

/**
 * Returns the fully resolved site content for the active client.
 * Merges default content with any client-specific overrides.
 *
 * Content is cached after the first call since the active client
 * does not change during a session.
 */
export function getContent(): SiteContent {
  if (cachedContent) return cachedContent;

  const client = getActiveClient();
  cachedContent = buildContent(client.id);
  return cachedContent;
}

/**
 * Resolves a content string template by replacing placeholders.
 * Supported placeholders:
 * - {{clientName}} - Active client's full name
 * - {{clientAcronym}} - Active client's acronym
 * - {{associationName}} - Same as clientName (used in help content)
 */
export function resolveTemplate(template: string): string {
  const client = getActiveClient();
  return template
    .replace(/\{\{clientName\}\}/g, client.branding.name)
    .replace(/\{\{clientAcronym\}\}/g, client.branding.acronym)
    .replace(/\{\{associationName\}\}/g, client.branding.name);
}

export type { SiteContent } from "./types";
export type { DeepPartial } from "./types-util";
