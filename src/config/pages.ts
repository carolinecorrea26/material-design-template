import { getContent, resolveTemplate } from "../content";

export { defaultPages as pages } from "./pageCatalog";
import { defaultPages } from "./pageCatalog";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import type { Page } from "../domain/pages";

/** Saved applicant routes; internal authoring tools retain their registered routes. */
export function getConfiguredPages(): Page[] {
  const library = getPrototypeLibrary();
  return library ? [
    ...library.pages.filter(page => page.assigned && page.definition.flow !== "internal").map(page => page.definition),
    ...defaultPages.filter(page => page.flow === "internal"),
  ] : defaultPages;
}

export type PageType = "home" | "form" | "receipt" | "resume" | "internal";

export function getPagePath(id: Page["id"]) {
  const page = getConfiguredPages().find((page) => page.id === id);

  if (!page) {
    throw new Error(`Missing page path for page id: ${id}`);
  }

  return page.path;
}

export function getPageTitle(id: Page["id"]) {
  const contentPage = getContent().pages[id];
  if (contentPage?.title) return resolveTemplate(contentPage.title);

  return id;
}

export function getPageSubhead(id: Page["id"]) {
  const contentPage = getContent().pages[id];
  if (contentPage?.subhead) return resolveTemplate(contentPage.subhead);

  return undefined;
}

export function getPageInfoNote(id: Page["id"]) {
  const contentPage = getContent().pages[id];
  if (contentPage?.infoNote) return resolveTemplate(contentPage.infoNote);

  return undefined;
}

export function getPageSectionNote(
  pageId: Page["id"],
  sectionId: string,
) {
  const contentPage = getContent().pages[pageId];
  const note = contentPage?.sectionNotes?.[sectionId];
  if (note) return resolveTemplate(note);

  return undefined;
}

export function getPageNavTitle(id: Page["id"]) {
  const contentPage = getContent().pages[id];
  if (contentPage?.navTitle) return resolveTemplate(contentPage.navTitle);

  return id;
}
