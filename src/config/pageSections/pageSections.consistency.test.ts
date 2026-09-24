import { describe, expect, it } from "vitest";
import { pageSections } from "./pageSections";
import { pageFieldOrder } from "../fields/pageFieldOrder";
import type { PageId } from "../../types";

/**
 * Sections own layout and applicant grouping; pageFieldOrder owns placement
 * and base order. Every field rendered by a section must have a placement.
 */
describe("pageSections fieldIds all have canonical page placement", () => {
  const pageIds = Object.keys(pageSections) as PageId[];

  it.each(pageIds)("%s", (pageId) => {
    const sections = pageSections[pageId] ?? [];
    const declared = new Set(pageFieldOrder[pageId] ?? []);
    const referenced = sections.flatMap((s) => s.fieldIds);
    const missing = referenced.filter((id) => !declared.has(id));
    expect(missing).toEqual([]);
  });
});
