import { describe, expect, it } from "vitest";
import { formatProductIdentifiers, resolveScopedIdentifiers } from "./coverageIdentifiers";

describe("scoped product identifiers", () => {
  const identifiers = {
    primary: "G-DEFAULT",
    pdf: "G-PDF",
    scoped: [
      {
        scope: { applicantType: "member" as const, applicantClassId: "associate-member" },
        value: { primary: "G-ASSOCIATE" },
      },
    ],
  };

  it("merges the most-specific value over default variants", () => {
    expect(
      resolveScopedIdentifiers(identifiers, {
        applicantType: "member",
        applicantClassId: "associate-member",
      }),
    ).toEqual({ primary: "G-ASSOCIATE", pdf: "G-PDF" });
  });

  it("renders configured variants compactly for Site Details", () => {
    expect(
      formatProductIdentifiers(identifiers, {
        "associate-member": "Associate Member",
      }),
    ).toContain("Associate Member: G-ASSOCIATE");
  });
});
