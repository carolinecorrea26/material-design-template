import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { getFieldStorybookReference, type FieldStorybookReference } from "../../../content/docs/fieldStorybook";
import { getAnalyticsTrackingRows, type AnalyticsTrackingRow } from "../../../analytics/trackingRows";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import type { AnalyticsTag } from "../../../domain/analytics";
import type { PageId } from "../../../types";
import { fieldSurfaceRows, type FieldSurfaceRow } from "./fieldSurfaceRows";
import { renderedControlRows } from "./renderedControlRows";

export type AnalyticsLibraryRow = AnalyticsTrackingRow & {
  components: FieldStorybookReference[];
  appearances: string[];
  placementMissing: boolean;
};

/** Analytics specifications stay stored and authoritative. Field labels, control
 * variants and section/tool ownership come from the same saved catalog as Fields.
 * Component links only use references present in the Storybook component catalog. */
export function analyticsLibraryRows(catalog: LibraryCatalog, siteKey: string, individual = false): AnalyticsLibraryRow[] {
  const fields = fieldSurfaceRows(catalog, siteKey);
  const index = new Map<string, FieldSurfaceRow[]>();
  for (const field of fields) for (const page of field.pages) {
    const key = `${page}:${field.field.id}`;
    index.set(key, [...(index.get(key) ?? []), field]);
  }
  const fieldMatches = (tag: AnalyticsTag) => index.get(`${tag.pageId}:${tag.elementKey}`) ?? [];
  const isField = (tag: AnalyticsTag) => tag.kind === "field" || tag.kind === "toggle";
  const controls = renderedControlRows(catalog, siteKey, fields);
  const storedTags = catalog.analyticsTags.filter(tag => (siteKey === "all" || tag.sites.includes(siteKey)) && (
    isField(tag) && catalog.data.pages.some(page => page.key === tag.pageId) || tag.kind === "page" && catalog.data.pages.some(page => page.key === tag.pageId) ||
    tag.kind === "navigation" && ["next", "back"].includes(tag.elementKey)
  ));
  const tags = [...storedTags, ...controls.tags].map(tag => {
    if (tag.kind === "page" && catalog.data.pages.some(page => page.key === tag.pageId)) {
      return { ...tag, label: getSiteDetailsPageLabel(tag.pageId as PageId) };
    }
    const matches = isField(tag) ? fieldMatches(tag) : [];
    const labels = [...new Set(matches.map(field => field.field.label))];
    return labels.length === 1 ? { ...tag, label: labels[0] } : { ...tag };
  });
  return getAnalyticsTrackingRows(tags, individual).map(row => {
    const appearances = new Set<string>();
    const components = new Map<string, FieldStorybookReference>();
    let placementMissing = false;
    for (const tag of row.placements) {
      if (isField(tag)) {
        const matches = fieldMatches(tag);
        if (!matches.length) placementMissing = true;
        for (const match of matches) {
          appearances.add(match.surface);
          const story = getFieldStorybookReference(match.field);
          if (story) components.set(story.storyId, story);
        }
      } else {
        const control = controls.metadata.get(tag.id);
        const page = catalog.data.pages.find(page => page.key === tag.pageId);
        if (control?.surface) appearances.add(control.surface);
        else if (page) appearances.add(`${getSiteDetailsPageLabel(page.key as PageId)} page${tag.kind === "navigation" ? tag.elementKey === "back" ? " · page header" : " · form actions" : ""}`);
        else placementMissing = true;
        // Older saved navigation specifications reference the page registry.
        // Resolve these two reviewed controls to their actual renderer without
        // treating arbitrary navigation tags as PageNav / PageTitle controls.
        const legacyNavigation = tag.source === "prototype-definition" && tag.sourceFile === "src/config/pages.ts" && tag.kind === "navigation";
        const sourceFile = control?.componentSource ?? (legacyNavigation && tag.elementKey === "next" ? "src/components/navigation/PageNav.tsx"
          : legacyNavigation && tag.elementKey === "back" ? "src/components/layout/PageTitle.tsx" : tag.sourceFile);
        const component = catalog.data.components.find(component => component.definition.source === sourceFile)?.definition;
        if (component) {
          const storyId = tag.kind === "navigation" && tag.elementKey === "back" && component.name === "PageTitle" ? "layout-pagetitle--with-back-button" : component.storyId;
          components.set(storyId, { label: component.name, storyId });
        }
      }
    }
    return { ...row, appearances: [...appearances], components: [...components.values()], placementMissing };
  });
}
