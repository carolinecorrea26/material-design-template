import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import type { FieldDefinition } from "../../../domain/fields";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import { getSiteFieldInventory } from "../../../config/fields/inspectionInventory";
import { resolvePrototypeLibrary } from "../../../domain/prototypeLibrary";
import { resolveRatePresentation } from "../../../domain/ratePresentation";
import { homeQuoteFieldIds } from "../../../config/fields/homeQuoteFields";
import { storedFieldRows, childCollection } from "./storedLibraryModel";
import { fieldSurfaceLabel } from "./fieldSurfaceLabel";
import { libraryApplicantText } from "./libraryApplicants";
import { resolvePageCatalog } from "../../../domain/pageCatalog";

export type FieldSurfaceRow = { position?: number; key: string; field: FieldDefinition; surface: string; pages: string[]; order: number | null; optionsNote?: string };

/** Saved page definitions remain authoritative; inspection metadata identifies shared tool surfaces. */
export function fieldSurfaceRows(catalog: LibraryCatalog, siteKey: string): FieldSurfaceRow[] {
  const fields = storedFieldRows(catalog, siteKey);
  const rows: FieldSurfaceRow[] = [];
  const sites = siteKey === "all" ? catalog.data.sites.map(site => site.key) : [siteKey];
  const supplementalRows: Array<ReturnType<typeof getSiteFieldInventory>[number]> = [];
  const effectiveFields = new Map<string, FieldDefinition>();
  const excludedFields = new Set<string>();
  const collectionFieldIds = new Set<string>();
  const toolRows = sites.flatMap(site => {
    const library = resolvePrototypeLibrary(catalog.data, site, catalog.revision);
    for (const collection of Object.values(library.fieldCollections)) for (const field of collection.mapping.fields) collectionFieldIds.add(field.id);
    const effective = library.site;
    const productKeys = new Set(effective.products.map(product => product.productKey));
    const pageKeys = new Set(effective.configuration.pages.filter(page => page.requirement !== "none").map(page => page.key));
    for (const page of effective.configuration.pages) for (const field of page.fields) {
      const key = `${page.key}:${field.key}`;
      if (field.included) effectiveFields.set(key, field.definition);
      else if (siteKey !== "all") excludedFields.add(key);
    }
    for (const surface of Object.values(library.fieldSurfaces)) for (const field of surface.mapping.fields) effectiveFields.set(`${surface.pageKey}:${field.id}`, field);
    const inventory = getSiteFieldInventory(site, library);
    const collection = childCollection(catalog, site);
    supplementalRows.push(...inventory.filter(row => row.pageId && pageKeys.has(row.pageId) && (row.area !== "childSection" || collection.collects && collection.fields.some(field => field.key === row.field.id)) && !excludedFields.has(`${row.pageId}:${row.field.id}`)));
    const quoteEnabled = effective.products.some(product => resolveRatePresentation(effective, product.productKey).quoteToolEnabled);
    return inventory.filter(row => row.group && (!row.field.id.startsWith("quote-selection:") && !row.field.id.startsWith("quote-amount:") || productKeys.has(row.field.id.split(":")[1])) && (row.group.id !== "quote-calculator" || quoteEnabled)).flatMap(row => {
      const placements = row.placements?.filter(placement => pageKeys.has(placement.pageId)) ?? [];
      if (!placements.length) return [];
      return [{ ...row, placements }];
    });
  });
  const quoteRank = (id: string) => id === "quote-categories" ? 0 : homeQuoteFieldIds.some(fieldId => fieldId === id) ? homeQuoteFieldIds.findIndex(fieldId => fieldId === id) + 1 : id.startsWith("quote-selection:") || id.startsWith("quote-amount:") ? 100 : 200;
  toolRows.sort((a, b) => a.group!.id.localeCompare(b.group!.id) || (a.group!.id === "quote-calculator" ? quoteRank(a.field.id) - quoteRank(b.field.id) : 0));
  for (const row of fields) {
    const placement = row.placements[0];
    // Home's first three inputs belong to its eligibility card. Remaining inputs
    // are owned by the quote tool, rather than an inline Home form.
    if (placement?.page === "home" && toolRows.some(tool => tool.field.id === row.key && tool.group?.id === "quote-calculator") && !homeQuoteFieldIds.slice(0, 3).some(id => id === row.key)) continue;
    if (siteKey !== "all" && placement?.page === "home" && toolRows.some(tool => tool.field.id === row.key && tool.placements.some(placement => placement.pageId === "home" && placement.presentation === "inline"))) continue;
    const surface = !placement ? "Unassigned" : placement.page === "home" ? "Home eligibility card" : fieldSurfaceLabel(catalog, placement.page, placement.section, row.key);
    const section = catalog.data.pageSections.find(section => section.pageKey === placement?.page && section.definition.id === placement?.section);
    rows.push({ position: (section?.position ?? 0) * 10000 + (placement?.order ?? 0), key: `${row.id}:${placement?.page ?? "unassigned"}`, field: row.definition, surface, pages: row.placements.map(placement => placement.page), order: placement ? placement.order + 1 : null });
  }
  // Supplement page-owned/repeated controls from the renderer inventory. No
  // application values are supplied: conditional inputs are all catalogued.
  const assigned = new Set(rows.flatMap(row => row.pages.map(page => `${page}:${row.field.id}`)));
  const companionIds = new Set(rows.filter(row => row.field.format === "phone" && row.field.showPhoneTypeSelector !== false).map(row => row.field.phoneTypeFieldId ?? "phone-type"));
  for (const row of supplementalRows) {
    const page = row.pageId!;
    const identity = `${page}:${row.field.id}`;
    if (assigned.has(identity) || excludedFields.has(identity) || companionIds.has(row.field.id)) continue;
    // Home is handled separately as an eligibility card and quote tool.
    if (page === "home") continue;
    const saved = catalog.data.fields.find(field => field.key === row.field.id)?.definition;
    const field = siteKey === "all" ? saved ?? row.field : effectiveFields.get(identity) ?? saved ?? row.field;
    const section = catalog.data.pageSections.find(section => section.pageKey === page && section.definition.id === row.area);
    const area = libraryApplicantText(row.area);
    const surface = section ? fieldSurfaceLabel(catalog, page, section.definition.id, field.id)
      : `${getSiteDetailsPageLabel(page)} page${row.area === "Page" ? "" : ` · ${area}`}`;
    rows.push({ position: (section?.position ?? catalog.data.pageSections.length) * 10000 + rows.filter(existing => existing.surface === surface).length, key: identity, field, surface, pages: [page], order: rows.filter(existing => existing.surface === surface).length + 1,
      optionsNote: !field.options?.length && ["dropdown", "radio", "checkbox-group"].includes(field.inputType) ? "Determined by selected products" : undefined });
    assigned.add(identity);
  }
  // Phone-type selectors are nested controls, positioned beside each phone
  // field even when their shared definition has no separate page placement.
  for (const row of [...rows]) {
    if (!row.pages.length || row.field.format !== "phone" || row.field.showPhoneTypeSelector === false) continue;
    const id = row.field.phoneTypeFieldId ?? "phone-type";
    if (rows.some(existing => existing.field.id === id && existing.surface === row.surface)) continue;
    const field = catalog.data.fields.find(field => field.key === id)?.definition ?? supplementalRows.find(candidate => candidate.field.id === id)?.field;
    if (!field) continue;
    rows.push({ position: (row.position ?? 0) + 0.5, key: `${row.key}:${id}`, field, surface: row.surface, pages: row.pages, order: row.order === null ? null : row.order + 0.5 });
  }
  const placedIds = new Set(rows.filter(row => row.pages.length).map(row => row.field.id));
  for (const id of collectionFieldIds) placedIds.add(id);
  for (let index = rows.length - 1; index >= 0; index--) if (!rows[index].pages.length && placedIds.has(rows[index].field.id)) rows.splice(index, 1);
  // Number each page area independently, retaining the configured relative order.
  const areaRows = new Map<string, FieldSurfaceRow[]>();
  for (const row of rows) if (row.order !== null) {
    const group = areaRows.get(row.surface) ?? [];
    group.push(row);
    areaRows.set(row.surface, group);
  }
  for (const group of areaRows.values()) {
    group.sort((a, b) => (a.position ?? a.order!) - (b.position ?? b.order!));
    group.forEach((row, index) => { row.order = index + 1; });
  }
  const pageOrder = new Map(resolvePageCatalog(catalog.data, siteKey === "all" ? undefined : siteKey)
    .map((page, index) => [page.key, index]));
  const surfaceOrder = new Map<string, number>();
  for (const row of rows) if (!surfaceOrder.has(row.surface)) surfaceOrder.set(row.surface, surfaceOrder.size);
  const pageRank = (row: FieldSurfaceRow) => pageOrder.get(row.pages[0]) ?? pageOrder.size;
  rows.sort((a, b) => pageRank(a) - pageRank(b) || surfaceOrder.get(a.surface)! - surfaceOrder.get(b.surface)! || (a.order ?? 0) - (b.order ?? 0));
  const toolOrders = new Map<string, Map<string, number>>();
  const seen = new Map<string, FieldSurfaceRow>();
  for (const row of toolRows) {
    for (const presentation of [...new Set(row.placements.map(placement => placement.presentation))]) {
      const surface = `${row.group!.label}${presentation === "drawer" ? " drawer" : " · Home page"}`;
      const saved = catalog.data.fields.find(field => field.key === row.field.id)?.definition;
      const field = saved ?? row.field;
      const key = JSON.stringify([surface, field]);
      const pages = row.placements.filter(placement => placement.presentation === presentation).map(placement => placement.pageId);
      const existing = seen.get(key);
      if (existing) { existing.pages = [...new Set([...existing.pages, ...pages])]; continue; }
      const orderKey = `${row.group!.id}:${presentation}`;
      const orders = toolOrders.get(orderKey) ?? new Map<string, number>();
      const order = orders.get(field.id) ?? orders.size + 1;
      orders.set(field.id, order);
      toolOrders.set(orderKey, orders);
      const result = { key, field, surface, pages, order, optionsNote: !field.options?.length && ["dropdown", "radio", "checkbox-group"].includes(field.inputType) ? "Determined by selected products" : undefined };
      seen.set(key, result);
      rows.push(result);
    }
  }
  return rows;
}
