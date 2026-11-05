import { canonicalSiteKey } from '../domain/siteIdentity.mjs';
import { formFlow } from "./formFlow";
import type { PageId } from "../types";
import { getPagePath } from "./pages";
import type { SiteId } from "../data";

export function getSitePrototypeUrl(siteId: SiteId, storedHomePath?: string): string {
  return getSitePagePrototypeUrl(siteId, "home", storedHomePath);
}

/** Full navigation boots the selected Site before the existing autofill initializer runs. */
export function getSitePagePrototypeUrl(siteId: SiteId, pageId: PageId, storedPath?: string): string {
  const standalone = import.meta.env.VITE_STANDALONE_HTML;
  const appBaseUrl = standalone ? new URL(window.location.href) : new URL(import.meta.env.BASE_URL, window.location.origin);
  const pagePath = (storedPath ?? getPagePath(pageId)).replace(/^\/+/, "");
  const url = standalone ? new URL(appBaseUrl.href.split('#')[0]) : new URL(pagePath, appBaseUrl);
  if (standalone) { url.search = ''; url.hash = '/' + pagePath; }
  url.searchParams.set("site", canonicalSiteKey(siteId));
  if (formFlow.includes(pageId)) {
    url.searchParams.set("autofill", pageId);
    // Page inspection needs the full application chrome, independent of a
    // previously selected single-page template in this browser session.
    url.searchParams.set("template", "multi");
  }
  return url.toString();
}

