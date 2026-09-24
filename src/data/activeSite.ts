import type { ClientId } from "../types";
import type { SiteId } from "./model";
import {
  getLegacyClientConfigForSite,
  getSite,
  getSiteIdForLegacyClient,
} from "./registry";

const SITE_QUERY_PARAM = "site";
const LEGACY_CLIENT_QUERY_PARAM = "client";
const SITE_STORAGE_KEY = "activeSiteId";
const LEGACY_CLIENT_STORAGE_KEY = "activeClientId";
const DEFAULT_SITE_ID: SiteId = "demo-default";

function isClientId(value: string | null): value is ClientId {
  return Boolean(value && getSiteIdForLegacyClient(value as ClientId) !== "demo-default") || value === "demo";
}

export function resolveSiteId(): SiteId {
  const params = new URLSearchParams(window.location.search);
  const requestedSite = params.get(SITE_QUERY_PARAM);
  if (requestedSite && getSite(requestedSite)) {
    window.sessionStorage.setItem(SITE_STORAGE_KEY, requestedSite);
    return requestedSite;
  }

  const legacyClientId = params.get(LEGACY_CLIENT_QUERY_PARAM);
  if (isClientId(legacyClientId)) {
    const siteId = getSiteIdForLegacyClient(legacyClientId);
    window.sessionStorage.setItem(SITE_STORAGE_KEY, siteId);
    window.sessionStorage.setItem(LEGACY_CLIENT_STORAGE_KEY, legacyClientId);
    return siteId;
  }

  const storedSiteId = window.sessionStorage.getItem(SITE_STORAGE_KEY);
  if (storedSiteId && getSite(storedSiteId)) return storedSiteId;

  const storedLegacyClientId = window.sessionStorage.getItem(LEGACY_CLIENT_STORAGE_KEY);
  if (isClientId(storedLegacyClientId)) return getSiteIdForLegacyClient(storedLegacyClientId);

  return DEFAULT_SITE_ID;
}

export function getActiveSite() {
  return getSite(resolveSiteId())!;
}

export function getActiveSiteClientConfig() {
  return getLegacyClientConfigForSite(resolveSiteId());
}

