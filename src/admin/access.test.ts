import { describe, expect, it } from "vitest";
import { externalPersonaExamples, hasPermission, internalPersonas, isRecordInScope } from "./access";

describe("portal experience access model", () => {
  it("keeps external personas out of the internal persona selector", () => {
    expect(internalPersonas.every((persona) => persona.experience === "internal-admin")).toBe(true);
    expect(internalPersonas.map((persona) => persona.id)).not.toContain("advisor");
    expect(externalPersonaExamples.map((persona) => persona.experience)).toEqual(["tpa-admin", "advisor"]);
  });

  it("models permissions independently from persona labels", () => {
    const qa = internalPersonas.find((persona) => persona.id === "qa")!;
    expect(hasPermission(qa, "change.approve")).toBe(true);
    expect(hasPermission(qa, "users.manage")).toBe(false);
  });

  it("supports global and bounded record scopes", () => {
    expect(isRecordInScope({ type: "global" }, { site: "site-a" })).toBe(true);
    expect(isRecordInScope({ type: "site", ids: ["site-a"] }, { site: "site-a" })).toBe(true);
    expect(isRecordInScope({ type: "site", ids: ["site-a"] }, { site: "site-b" })).toBe(false);
  });
});
