import type { AnalyticsTag } from "../domain/analytics";

export type AnalyticsTrackingRow = AnalyticsTag & {
  placements: AnalyticsTag[];
  /** Where the control lives, separately from pages that can open shared UI. */
  pageIds: string[];
  sharedArea?: string;
  accessPageIds: string[];
};

function sharedArea(tag: AnalyticsTag): string | undefined {
  if (tag.kind === "field" && tag.elementKey.startsWith("needs-")) return "Coverage needs calculator drawer";
  return undefined;
}

/** Explicit reusable families, not label matching: identically labeled unrelated
 * controls stay separate. Runtime tag IDs and vendor specifications are untouched. */
function family(tag: AnalyticsTag): string {
  if (tag.kind === "field") {
    if (tag.elementKey.startsWith("needs-")) return `needs-calculator/${tag.elementKey}`;
    if (/^(coverage-(applicant|amount|waiting|benefit|rider|rider-amount)|payment-(method|frequency)|quote-(selection|amount)):/.test(tag.elementKey)) {
      // Rider keys carry a rider suffix: retain it, collapsing product/applicant only.
      const parts = tag.elementKey.split(":");
      return `${tag.pageId}/${parts[0]}${parts[0].startsWith("coverage-rider") ? `/${parts[2]}` : ""}`;
    }
    const detail = tag.elementKey.match(/^health-(si|li|di)-q\d+(?:-spouse)?-details\[\]\.(.+)$/);
    if (detail) return `${tag.pageId}/health-details/${detail[2]}`;
  }
  if (tag.kind === "navigation" && ["next", "back"].includes(tag.elementKey)) return `page-navigation/${tag.elementKey}`;
  if (tag.sourceFile === "src/components/forms/QuoteCalculator.tsx") return `quote-calculator/${tag.kind}/${tag.elementKey}`;
  return tag.id;
}

export function getAnalyticsTrackingRows(tags: AnalyticsTag[], individual = false): AnalyticsTrackingRow[] {
  const groups = new Map<string, AnalyticsTrackingRow>();
  for (const tag of tags) {
    // Never combine different events, instrumentation states, or vendor mappings.
    const identity = JSON.stringify([individual ? tag.id : family(tag), tag.kind, tag.label, tag.events, tag.status, tag.adobe, tag.contentsquare]);
    const existing = groups.get(identity);
    if (existing) {
      existing.placements.push(tag);
      existing.sites = [...new Set([...existing.sites, ...tag.sites])];
      if (existing.sharedArea) existing.accessPageIds = [...new Set([...existing.accessPageIds, tag.pageId])];
      else existing.pageIds = [...new Set([...existing.pageIds, tag.pageId])];
    } else {
      const area = sharedArea(tag);
      groups.set(identity, { ...tag, sites: [...tag.sites], placements: [tag], pageIds: [area ?? tag.pageId], sharedArea: area, accessPageIds: area ? [tag.pageId] : [] });
    }
  }
  return [...groups.values()];
}
