import { canonicalSiteKey } from '../domain/siteIdentity.mjs';
import { formFlow } from "./formFlow";
import type { PageId } from "../types";
import { getPagePath } from "./pages";
import type { SiteId } from "../data";

export function getSitePrototypeUrl(siteId: SiteId): string {
  return getSitePagePrototypeUrl(siteId, "home");
}

/** Full navigation boots the selected Site before the existing autofill initializer runs. */
export function getSitePagePrototypeUrl(siteId: SiteId, pageId: PageId, storedPath?: string): string {
  const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  const pagePath = (storedPath ?? getPagePath(pageId)).replace(/^\/+/, "");
  const url = new URL(pagePath, appBaseUrl);
  url.searchParams.set("site", canonicalSiteKey(siteId));
  if (formFlow.includes(pageId)) {
    url.searchParams.set("autofill", pageId);
    // Page inspection needs the full application chrome, independent of a
    // previously selected single-page template in this browser session.
    url.searchParams.set("template", "multi");
  }
  return url.toString();
}

