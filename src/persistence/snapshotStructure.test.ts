import { describe, expect, expectTypeOf, it } from "vitest";
import { validateSnapshotData } from "./snapshot";

describe("snapshot structural validation", () => {
  it("narrows only checked row properties and leaves domain properties unknown", () => {
    const data: unknown = { sites: [{ id: "site", name: 123 }] };
    validateSnapshotData(data, ["sites"]);
    expectTypeOf(data.sites[0].id).toEqualTypeOf<string>();
    expectTypeOf(data.sites[0].name).toEqualTypeOf<unknown>();
    expect(data.sites[0].name).toBe(123);
  });

  it.each([null, [], {}, { sites: [], clients: [] }])("rejects unexpected table structure %j", data => {
    expect(() => validateSnapshotData(data, ["sites"])).toThrow("Incomplete or unexpected snapshot tables.");
  });

  it.each([null, {}, [null], [[]], [{}], [{ id: "" }], [{ id: 1 }]])("rejects malformed row structure %j", rows => {
    expect(() => validateSnapshotData({ sites: rows }, ["sites"])).toThrow("Malformed snapshot rows: sites");
  });

  it("keeps duplicate IDs and operational flags outside configuration snapshots", () => {
    expect(() => validateSnapshotData({ sites: [{ id: "same" }, { id: "same" }] }, ["sites"])).toThrow("Duplicate snapshot row: sites");
    expect(() => validateSnapshotData({ flagAssignments: [{ id: "flag", applicationId: "app" }] }, ["flagAssignments"])).toThrow("Operational application flags");
    expect(() => validateSnapshotData({ flagAssignments: [{ id: "flag", applicationId: null }] }, ["flagAssignments"])).not.toThrow();
  });
});
