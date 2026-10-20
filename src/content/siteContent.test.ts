import { beforeEach, describe, expect, it } from "vitest";
import { buildContent, resolveTemplate } from ".";

describe("Site-keyed content", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/?site=demo");
    window.sessionStorage.clear();
  });

  it("resolves distinct content overrides by Site ID", () => {
    expect(buildContent("waepa").home.hero.title).toBe(
      "Safeguard your family's future.",
    );
    expect(buildContent("waepa-gi").home.hero.title).not.toBe(
      "Safeguard your family's future.",
    );
  });

  it("resolves Association copy independently from Client identity", () => {
    window.history.replaceState(null, "", "/?site=isitrust");
    expect(
      resolveTemplate(
        "{{clientName}} | {{clientAcronym}} | {{associationName}}",
        "akron-bar-association",
      ),
    ).toBe("Insurance Specialists, Inc. | ISITRUST | Akron Bar Association");
    expect(
      resolveTemplate("{{associationName}}", "american-medical-association"),
    ).toBe("Insurance Specialists, Inc.");
  });
});
