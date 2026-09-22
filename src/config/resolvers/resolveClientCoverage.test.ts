import { describe, expect, it } from "vitest";
import { clients } from "../clients";
import { resolveClientCoverage } from "./resolveClientCoverage";

describe("resolveClientCoverage", () => {
  it("disabled: csea only enables di-ltd, so li-term is excluded", () => {
    const resolved = resolveClientCoverage(clients.csea);
    const liTerm = resolved.find((c) => c.id === "li-term");
    expect(liTerm?.status).toBe("disabled");
    expect(liTerm?.effective).toEqual(liTerm?.global);
    expect(liTerm?.clientDiffs).toEqual([]);
  });

  it("overridden: avma renames and re-underwrites li-10yr via a range + override", () => {
    const resolved = resolveClientCoverage(clients.avma);
    const li10yr = resolved.find((c) => c.id === "li-10yr");
    expect(li10yr?.status).toBe("overridden");
    expect(li10yr?.effective.name).toBe("10-Year Level Term Life Insurance");
    expect(li10yr?.effective.underwritingType).toBe("QD");
    expect(li10yr?.clientDiffs).toContain("range");
    expect(li10yr?.clientDiffs).toContain("name");
  });

  it("inherited: an enabled coverage with no client range/override/description", () => {
    const minimalClient = {
      ...clients.demo,
      coverages: { ...clients.demo.coverages, ranges: {}, overrides: {}, descriptions: {} },
    };
    const resolved = resolveClientCoverage(minimalClient);
    const liTerm = resolved.find((c) => c.id === "li-term");
    expect(liTerm?.status).toBe("inherited");
    expect(liTerm?.effective).toEqual(liTerm?.global);
  });

  it("computes which health pages a coverage's effective underwriting type unlocks", () => {
    const resolved = resolveClientCoverage(clients.abe);
    const teleDi = resolved.find((c) => c.id === "di-mtd");
    expect(teleDi?.healthPagesUnlocked).toContain("health-di");
  });

  it("resolves ASCE product names, ranges, underwriting, and brochure links", () => {
    const resolved = resolveClientCoverage(clients.asce);
    const groupTerm = resolved.find((c) => c.id === "li-term");
    const disability = resolved.find((c) => c.id === "di-ltd");

    expect(groupTerm?.effective.name).toBe("Group Term Life Insurance");
    expect(groupTerm?.effective.maxAmount).toBe(1000000);
    expect(groupTerm?.effective.brochureUrl).toContain(
      "ASCE-Term-Life-Brochure.pdf",
    );
    expect(disability?.effective.underwritingType).toBe("FUW");
    expect(disability?.effective.spouseMinAmount).toBe(500);
    expect(disability?.effective.spouseMaxAmount).toBe(500);
  });
});
