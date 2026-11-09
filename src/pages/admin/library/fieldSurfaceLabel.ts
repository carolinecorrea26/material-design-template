import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { libraryApplicantLabel, libraryApplicantText } from "./libraryApplicants";
import { storedSectionLabel } from "./storedLibraryModel";

/** Follow configured section descriptions, applicant ownership and nesting. */
export function fieldSurfaceLabel(catalog: LibraryCatalog, pageId: string, sectionId: string, fieldKey: string): string {
  const sections = catalog.data.pageSections.filter(row => row.pageKey === pageId).sort((a, b) => a.position - b.position);
  const index = sections.findIndex(row => row.definition.id === sectionId);
  const section = sections[index]?.definition;
  const page = catalog.data.pages.find(page => page.key === pageId)?.definition.displayName ?? pageId;
  if (section?.applicant) {
    const applicant = libraryApplicantLabel(section.applicant) ?? section.applicant;
    // A conditional group without its own heading belongs to the preceding
    // named subsection for the same applicant in the configured sequence.
    const parent = !section.description && section.presentation === "conditional"
      ? sections.slice(0, index).reverse().find(row => row.definition.applicant === section.applicant && (row.definition.title || row.definition.description))?.definition
      : undefined;
    const title = section.title && !libraryApplicantLabel(section.title) ? section.title : undefined;
    const parentTitle = parent?.title && !libraryApplicantLabel(parent.title) ? parent.title : undefined;
    const label = section.description ?? title ?? parent?.description ?? parentTitle;
    if (label) return `${page} page · ${applicant} · ${libraryApplicantText(label)}`;
    return `${page} page · ${applicant}`;
  }
  const label = storedSectionLabel(catalog, { key: fieldKey, placements: [{ page: pageId, section: sectionId, order: 0, collection: "" }] } as Parameters<typeof storedSectionLabel>[1]);
  return `${page} page${label === "Page fields" ? "" : ` · ${libraryApplicantText(label)}`}`;
}
