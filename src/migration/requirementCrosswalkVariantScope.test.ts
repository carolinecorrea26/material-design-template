import { expect, it } from "vitest";
import { currentMcrSource } from "./currentMcr";
import { reviewOutsideCurrentVariants } from "./requirementCrosswalkVariantScope";
import type { CrosswalkRow } from "./requirementCrosswalk";
it("checks exact named variant boundaries without excluding current AMA/WAEPA consent", () => {
  const references = ["Read & Sign!C8", "Read & Sign!C97", "Read & Sign!C114", "Read & Sign!B175", "Smoker Question!B22", "Standard Decision Wording !B7", "ElectrConsent!A72"];
  const rows = references.map(reference => ({ kind: "source-clause", sourceReferences: [reference], disposition: "review-pending" } as CrosswalkRow));
  reviewOutsideCurrentVariants(currentMcrSource.cells, rows);
  expect(rows.map(row => row.disposition)).toEqual(["source-reference","review-pending","review-pending","source-reference","source-reference","source-reference","source-reference"]);
  const changed = structuredClone(currentMcrSource.cells);
  changed.find(cell => cell.sheet === "Read & Sign" && cell.cell === "B8")!.value = "ABE";
  expect(() => reviewOutsideCurrentVariants(changed, rows)).toThrow("variant boundary changed");
});
