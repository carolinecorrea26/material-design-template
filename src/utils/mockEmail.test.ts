import { beforeEach, describe, expect, it } from "vitest";
import {
  readMockEmailPreviews,
  sendReceiptMockEmail,
} from "./mockEmail";

describe("Site-keyed mock email previews", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/?site=isitrust-default");
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("stores the Site ID and resolves Association-aware copy", async () => {
    await sendReceiptMockEmail(
      {
        email: "applicant@example.com",
        membership: "akron-bar-association",
      },
      "CONF-TEST",
    );

    const receipt = readMockEmailPreviews("isitrust-default").find(
      (preview) => preview.type === "receipt" && preview.id !== "sample-receipt",
    );
    expect(receipt?.siteId).toBe("isitrust-default");
    expect(receipt?.clientId).toBe("isitrust");
    expect(receipt?.html).toContain("Akron Bar Association");
  });

  it("generates Site-based resume links for either WAEPA Site", () => {
    const standard = readMockEmailPreviews("waepa-standard").find(
      (preview) => preview.type === "autosave",
    );
    const gi = readMockEmailPreviews("waepa-gi").find(
      (preview) => preview.type === "autosave",
    );
    expect(standard?.html).toContain("/resume?site=waepa-standard");
    expect(gi?.html).toContain("/resume?site=waepa-gi");
  });

  it("maps legacy persisted previews to their Site when read", () => {
    window.localStorage.setItem(
      "mockEmail:previews",
      JSON.stringify([
        {
          id: "legacy-waepa-gi",
          type: "receipt",
          clientId: "waepagi",
          fromName: "Test",
          fromEmail: "test@example.com",
          toEmail: "applicant@example.com",
          subject: "Legacy",
          createdAt: "2026-01-01T00:00:00.000Z",
          html: "<p>Legacy</p>",
        },
      ]),
    );

    expect(
      readMockEmailPreviews("waepa-gi").some(
        (preview) =>
          preview.id === "legacy-waepa-gi" && preview.siteId === "waepa-gi",
      ),
    ).toBe(true);
  });
});
