import { describe, expect, it } from "vitest";
import { pageSections } from "./pageSections";
import { pageFields } from "../fields/pageFields";
import type { PageId } from "../../types";

/**
 * pageSections.ts (section/layout metadata) and pageFields.ts (flat field
 * membership, feeding getClientPageFields' RHF defaults) are hand-maintained
 * separately by design (see GlobalOverrideEffectiveArchitecture.md §8.6) —
 * unifying them into one PageDefinition is deferred to a future runtime
 * architecture phase. Until then, this is the enforcement that keeps them
 * from silently drifting: every field a section renders must also be
 * declared as belonging to that page in pageFields.ts.
 */
describe("pageSections fieldIds are all declared in pageFields", () => {
  const pageIds = Object.keys(pageSections) as PageId[];

  it.each(pageIds)("%s", (pageId) => {
    const sections = pageSections[pageId] ?? [];
    const declared = new Set(pageFields[pageId] ?? []);
    const referenced = sections.flatMap((s) => s.fieldIds);
    const missing = referenced.filter((id) => !declared.has(id));
    expect(missing).toEqual([]);
  });
});
