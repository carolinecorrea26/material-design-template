import { canonicalSiteKey } from '../domain/siteIdentity.mjs';
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
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

export function resolveSiteId(): SiteId {
  const params = new URLSearchParams(window.location.search);
  const activeBuild = getPrototypeLibrary()?.site.siteKey;
  if (activeBuild) return activeBuild;
  const requestedValue = params.get(SITE_QUERY_PARAM);
  const requestedSite = requestedValue ? canonicalSiteKey(requestedValue) : null;
  if (requestedSite && getSite(requestedSite)) {
    window.sessionStorage.setItem(SITE_STORAGE_KEY, requestedSite);
    return requestedSite;
  }

  const clientAlias = params.get(LEGACY_CLIENT_QUERY_PARAM);
  if (isClientId(clientAlias)) {
    const siteId = getSiteIdForClientAlias(clientAlias);
    window.sessionStorage.setItem(SITE_STORAGE_KEY, siteId);
    window.sessionStorage.setItem(LEGACY_CLIENT_STORAGE_KEY, clientAlias);
    return siteId;
  }

  const storedValue = window.sessionStorage.getItem(SITE_STORAGE_KEY);
  const storedSiteId = storedValue ? canonicalSiteKey(storedValue) : null;
  if (storedSiteId && getSite(storedSiteId)) return storedSiteId;

  const storedLegacyClientId = window.sessionStorage.getItem(LEGACY_CLIENT_STORAGE_KEY);
  if (isClientId(storedLegacyClientId)) return getSiteIdForClientAlias(storedLegacyClientId);

  return DEFAULT_SITE_ID;
}

export function getActiveSite() {
  return getSite(resolveSiteId())!;
}

export function getActiveSiteConfiguration() {
  return getPrototypeLibrary(resolveSiteId())?.client ?? getEffectiveSiteConfig(resolveSiteId());
}
