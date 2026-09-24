import { describe, expect, it } from "vitest";
import { clients } from "../clients";
import { resolveClientCoverage } from "./resolveClientCoverage";
import { getCoverageAmountAssignment } from "../../utils/coverageAmounts";
import type { ClientConfig } from "../clients/types";

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
    expect(li10yr?.clientDiffs).toContain("coverageAmounts");
    expect(li10yr?.clientDiffs).toContain("name");
  });

  it("inherited: an enabled coverage with no client range/override/description", () => {
    const minimalClient = {
      ...clients.demo,
      coverages: { ...clients.demo.coverages, coverageAmounts: {}, overrides: {}, descriptions: {} },
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
    expect(
      getCoverageAmountAssignment(groupTerm!.effective, "member")?.selections,
    ).toEqual([
      { type: "range", min: 0, max: 1000000, increment: 10000 },
    ]);
    expect(groupTerm?.effective.gNumber?.primary).toBe("G-10500-1");
    expect(groupTerm?.effective.planCode.primary).toBe("101");
    expect(groupTerm?.effective.brochureUrl).toContain(
      "ASCE-Term-Life-Brochure.pdf",
    );
    expect(disability?.effective.underwritingType).toBe("FUW");
    expect(
      getCoverageAmountAssignment(disability!.effective, "spouse")?.selections,
    ).toEqual([{ type: "range", min: 500, max: 500, increment: 1 }]);
  });

  it("resolves scoped identifiers through the normal client override path", () => {
    const client: ClientConfig = {
      ...clients.demo,
      coverages: {
        ...clients.demo.coverages,
        overrides: {
          ...clients.demo.coverages.overrides,
          "li-term": {
            gNumber: {
              primary: "G-DEFAULT",
              scoped: [
                {
                  scope: { applicantType: "member", applicantClassId: "associate-member" },
                  value: { primary: "G-ASSOCIATE" },
                },
              ],
            },
          },
        },
      },
    };
    const resolved = resolveClientCoverage(client);
    const term = resolved.find((coverage) => coverage.id === "li-term");
    expect(term?.effective.gNumber?.primary).toBe("G-DEFAULT");
    expect(term?.effective.gNumber?.scoped?.[0].value.primary).toBe("G-ASSOCIATE");
    expect(term?.clientDiffs).toContain("gNumber");
  });
});
