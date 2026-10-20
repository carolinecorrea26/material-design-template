import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import type { PageId } from "../../types";
import { pageSections } from "./pageSections";
import type { PageSectionConfig } from "./types";

export function getPageSections(pageId: PageId): PageSectionConfig[] {
  const library = getPrototypeLibrary();
  return library ? library.site.configuration.pages.find(p => p.key === pageId)?.sections.map(s => s.definition.value) ?? [] : pageSections[pageId] ?? [];
}
