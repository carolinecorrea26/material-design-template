import { describe, expect, it } from "vitest";
import { configurationsData } from "./configurations";
import { siteRules } from "./siteRules";
import { associationEntities, clientEntities, siteAssociationEntities, siteEntities, tpaEntities } from "../../data";

describe("documentation entity IDs", () => {
  it("assigns unique, deterministic configuration IDs", () => {
    const ids = configurationsData.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("config-"))).toBe(true);
  });

  it("assigns unique, deterministic rule IDs", () => {
    const ids = siteRules.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("rule-"))).toBe(true);
  });

  it("exposes unique Client, Site, Association, and Site Association IDs", () => {
    for (const ids of [
      clientEntities.map((entry) => entry.id),
      tpaEntities.map((entry) => entry.id),
      siteEntities.map((entry) => entry.id),
      associationEntities.map((entry) => entry.id),
      siteAssociationEntities.map((entry) => entry.id),
    ]) {
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(
      siteAssociationEntities.every(
        (entry) => entry.id === `${entry.siteId}--${entry.associationId}`,
      ),
    ).toBe(true);
  });
});
