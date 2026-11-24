import { canonicalSiteKey } from '../domain/siteIdentity.mjs';
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { siteUsesRequirementFields } from '../domain/requirementFields';
import type { ClientId } from "../types";
import type { SiteId } from "./model";
import {
  getEffectiveSiteConfig,
  getSite,
  getSiteIdForClientAlias,
} from "../repositories/sites";

const SITE_QUERY_PARAM = "site";
const LEGACY_CLIENT_QUERY_PARAM = "client";
const SITE_STORAGE_KEY = "activeSiteId";
const LEGACY_CLIENT_STORAGE_KEY = "activeClientId";
const DEFAULT_SITE_ID: SiteId = "demo";

function isClientId(value: string | null): value is ClientId {
  return Boolean(value && getSiteIdForClientAlias(value as ClientId) !== "demo") || value === "demo";
}

/** Bootstrap supplies the loaded catalog's active Sites. Detached historical
 * examples retain their compatibility registry until a revision is installed. */
export function resolveSiteId(availableSiteKeys?: readonly string[]): SiteId {
  if (availableSiteKeys && availableSiteKeys.length === 0) throw new Error('The shared catalog has no active Sites.');
  const available = (key: string) => availableSiteKeys
    ? availableSiteKeys.includes(key)
    : siteUsesRequirementFields(key) || !!getSite(key);
  const params = new URLSearchParams(window.location.search);
  const activeBuild = getPrototypeLibrary()?.site.siteKey;
  if (activeBuild && (!availableSiteKeys || available(activeBuild))) return activeBuild;
  const requestedValue = params.get(SITE_QUERY_PARAM);
  const requestedSite = requestedValue ? canonicalSiteKey(requestedValue) : null;
  if (requestedSite && available(requestedSite)) {
    window.sessionStorage.setItem(SITE_STORAGE_KEY, requestedSite);
    return requestedSite;
  }

  const clientAlias = params.get(LEGACY_CLIENT_QUERY_PARAM);
  if (isClientId(clientAlias)) {
    const siteId = getSiteIdForClientAlias(clientAlias);
    if (available(siteId)) {
      window.sessionStorage.setItem(SITE_STORAGE_KEY, siteId);
      window.sessionStorage.setItem(LEGACY_CLIENT_STORAGE_KEY, clientAlias);
      return siteId;
    }
  }

  const storedValue = window.sessionStorage.getItem(SITE_STORAGE_KEY);
  const storedSiteId = storedValue ? canonicalSiteKey(storedValue) : null;
  if (storedSiteId && available(storedSiteId)) return storedSiteId;

  const storedLegacyClientId = window.sessionStorage.getItem(LEGACY_CLIENT_STORAGE_KEY);
  if (isClientId(storedLegacyClientId)) {
    const siteId = getSiteIdForClientAlias(storedLegacyClientId);
    if (available(siteId)) return siteId;
  }

  const fallback = availableSiteKeys?.[0] ?? DEFAULT_SITE_ID;
  if (availableSiteKeys) window.sessionStorage.setItem(SITE_STORAGE_KEY, fallback);
  return fallback;
}

export function getActiveSite() {
  return getSite(resolveSiteId())!;
}

export function getActiveSiteConfiguration() {
  return getPrototypeLibrary(resolveSiteId())?.client ?? getEffectiveSiteConfig(resolveSiteId());
}
