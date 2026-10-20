import type { SiteEnvironment, SiteEnvironmentLink } from "../domain/sites";

// Source: ASCE_Portal_Site_Rules.xlsx, URLs!A2:D8.
// GI/NCGI URLs are reference-only in docs/asce-corrective-pass.md.
export const siteEnvironmentLinks: SiteEnvironmentLink[] = [
  { key: "asce-production", environment: "production", linkType: "launch", label: "ASCE production", url: "https://asce.nylinsure.com", active: true },
  { key: "asce-pre-production", environment: "pre-production", linkType: "launch", label: "ASCE pre-production", url: "https://ascepreview.nylinsure2.com", active: true },
  { key: "asce-test", environment: "test", linkType: "launch", label: "ASCE test / model", url: "https://asce.nylinsure2.com", active: true },
  { key: "asce-automation", environment: "automation", linkType: "launch", label: "ASCE automation", url: "https://ascepreview2.nylinsure2.com", active: true },
  { key: "asce-campaign", environment: "production", linkType: "campaign", label: "ASCE campaign (pending confirmation)", url: "https://asce.nylinsure.com/?campaign=online", active: false },
  { key: "asce-apply", environment: "test", linkType: "apply", label: "ASCE apply form", url: "https://asce.nylinsure2.com/index.html?apply=form", active: true },
  { key: "asce-returning", environment: "production", linkType: "returning", label: "ASCE no-save variation (behavior unconfirmed)", url: "https://asce.nylinsure.com/?nsc=true", active: false },
].map((entry, position) => ({ ...entry, id: entry.key, siteKey: "asce", position })) as SiteEnvironmentLink[];

export function launchLinks(links: SiteEnvironmentLink[], siteKey: string, environments: SiteEnvironment[]) {
  return links.filter((link) => link.siteKey === siteKey && link.active && link.linkType === "launch" && environments.includes(link.environment) && /^https?:\/\//.test(link.url)).sort((a, b) => a.position - b.position);
}
