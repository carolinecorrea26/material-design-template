import { getClientAliasForSite, getSite } from "../repositories/sites";

/** Unique Site acronym for selectors; accepts historical Site aliases. */
export function getSiteAcronym(siteKey: string): string {
  return (getSite(siteKey) ? getClientAliasForSite(siteKey) : siteKey).toUpperCase();
}
