import { afterEach, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { getRiderOnlyOptions, changeCoverageAmount, selectedRiderOnly } from "./coverageRiderOnly";
import { applicationUnderwriting, validateApplicationCoverages } from "./coverageRuntime";
import { getClientCoverages } from "../config/client/getActiveClientCoverages";
import { buildWaepaLegacyConfig } from "../data/waepa";

afterEach(() => installPrototypeLibrary(null));
it("uses the stored rider definition and Site policy, without enabling WAEPA GI or unrelated riders", () => {
  const db = createReviewedMigrationDatabase();
  const standard = resolvePrototypeLibrary(db, "waepa", "test");
  installPrototypeLibrary(standard);
  const product = standard.products.find(row => row.id === "li-group-term")!;
  expect(getRiderOnlyOptions(product, "member").map(row => row.id)).toEqual(["cir"]);
  expect(getRiderOnlyOptions(product, "spouse").map(row => row.id)).toEqual(["cir"]);
  expect(getRiderOnlyOptions(product, "child")).toEqual([]);
  const values = { ...changeCoverageAmount(product, "member", { coverageAmounts: { "other:member": 500 }, coverageRiders: { "other:rider:member": true } }, 0, "cir"), coverageSelections: [product.id], productApplicants: { [product.id]: ["member"] } };
  expect(selectedRiderOnly(product, "member", values)?.id).toBe("cir");
  expect(values.coverageAmounts["other:member"]).toBe(500);
  expect(values.coverageRiders["other:rider:member"]).toBe(true);
  expect(applicationUnderwriting(product, "member", values)).toEqual({ status: "resolved", underwritingType: "FUW" });
  expect(validateApplicationCoverages(standard.products, values)).toBeDefined(); // Missing age/residency facts remain blocking.
  expect(() => changeCoverageAmount(product, "member", values, 0, "abi")).toThrow("not available on its own");
  const gi = resolvePrototypeLibrary(db, "waepa-gi", "test");
  expect(getRiderOnlyOptions(gi.products.find(row => row.id === "li-group-term")!, "member")).toEqual([]);
  expect(getRiderOnlyOptions(getClientCoverages(buildWaepaLegacyConfig("waepa-gi")).find(row => row.id === "li-group-term")!, "member")).toEqual([]);
  const source = standard.site.configuration.products.find(row => row.productKey === product.id)!.riders.find(row => row.definition?.value.id === "cir")!;
  db.riders.find(row => row.key === source.key)!.definition.riderOnlyApplicants = [];
  const edited = resolvePrototypeLibrary(db, "waepa", "edited");
  expect(getRiderOnlyOptions(edited.products.find(row => row.id === product.id)!, "member")).toEqual([]);
}, 120000);
