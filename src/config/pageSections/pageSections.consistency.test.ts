import { describe, expect, it } from "vitest";
import { pageSections } from "./pageSections";
import { fieldCatalog } from "../fields";
import type { PageId } from "../../types";

/**
 * Sections also own inline placements. Every referenced field must have a shared definition.
 */
describe("pageSections fieldIds all reference canonical definitions", () => {
  const pageIds = Object.keys(pageSections) as PageId[];

  it.each(pageIds)("%s", (pageId) => {
    const sections = pageSections[pageId] ?? [];
    const declared = new Set(Object.keys(fieldCatalog));
    const referenced = sections.flatMap((s) => s.fieldIds);
    const missing = referenced.filter((id) => !declared.has(id));
    expect(missing).toEqual([]);
  });
});
