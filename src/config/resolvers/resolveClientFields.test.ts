import { describe, expect, it } from "vitest";
import { clients } from "../clients";
import { resolveClientFieldsForPage } from "./resolveClientFields";

describe("resolveClientFieldsForPage", () => {
  it("inherited: a coverage-page field demo doesn't touch", () => {
    const fields = resolveClientFieldsForPage("coverage", clients.demo);
    const field = fields.find((f) => f.fieldId === "monthly-business-expenses");
    expect(field?.status).toBe("inherited");
    expect(field?.included).toBe(true);
    expect(field?.row.clientNote).toBeUndefined();
  });

  it("disabled: waepa hides average-employees-6-months on the coverage page", () => {
    const fields = resolveClientFieldsForPage("coverage", clients.waepa);
    const field = fields.find((f) => f.fieldId === "average-employees-6-months");
    expect(field?.status).toBe("disabled");
    expect(field?.included).toBe(false);
  });

  it("overridden: ama overrides the membership field's label and input type", () => {
    const fields = resolveClientFieldsForPage("membership", clients.ama);
    const field = fields.find((f) => f.fieldId === "membership");
    expect(field?.status).toBe("overridden");
    expect(field?.included).toBe(true);
    expect(field?.row.label).toBe("I am a (select one)");
    expect(field?.row.inputType).toBe("dropdown");
  });

  it("client-specific: avma adds membership-page fields not in the global catalog for that page", () => {
    const fields = resolveClientFieldsForPage("membership", clients.avma);
    const field = fields.find((f) => f.fieldId === "avma-vet-college");
    expect(field?.status).toBe("client-specific");
    expect(field?.included).toBe(true);
  });

  it("disabled: title is hidden by default on Membership unless a client overrides it", () => {
    const fields = resolveClientFieldsForPage("membership", clients.demo);
    const field = fields.find((f) => f.fieldId === "title");
    expect(field?.status).toBe("disabled");
    expect(field?.included).toBe(false);
  });

  it("inherited: ama is the one client that doesn't hide the title field", () => {
    const fields = resolveClientFieldsForPage("membership", clients.ama);
    const field = fields.find((f) => f.fieldId === "title");
    expect(field?.status).toBe("inherited");
    expect(field?.included).toBe(true);
  });

  it("client-specific: waepa's conditional extra field documents its visibility rule instead of hiding it", () => {
    const fields = resolveClientFieldsForPage("membership", clients.waepa);
    const field = fields.find((f) => f.fieldId === "waepa-declaration");
    expect(field?.status).toBe("client-specific");
    expect(field?.included).toBe(true);
    expect(field?.row.visibleWhen).toContain("membership equals new");
  });

  it("adds ASCE's required membership ID field", () => {
    const fields = resolveClientFieldsForPage("membership", clients.asce);
    const membership = fields.find((f) => f.fieldId === "membership");
    const memberId = fields.find((f) => f.fieldId === "asce-member-id");

    expect(membership?.row.label).toBe(
      "Are you a member of the American Society of Civil Engineers?",
    );
    expect(memberId?.status).toBe("client-specific");
    expect(memberId?.row.required).toBe("Yes");
  });
});
