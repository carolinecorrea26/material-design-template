import { describe, expect, it } from "vitest";
import { clients } from "../config/clients";
import { buildContent } from "../content";
import { siteEntities, getEffectiveSiteConfig } from "../data";
import { lookupPrototypeTpa, resolveTpaOutcome } from "./tpaIntegration";

const facts = {
  "first-name": "Taylor",
  "last-name": "Morgan",
  "birth-date": "1990-08-26",
};
describe("client TPA policies", () => {
  it.each(["ama", "asce"] as const)(
    "%s requires existing member, active coverage and identity pass for portfolio/approval",
    (id) => {
      const client = clients[id];
      for (const existingMember of [false, true])
        for (const activeCoverage of [false, true])
          for (const identityPassed of [false, true]) {
            const result = resolveTpaOutcome(
              client,
              { existingMember, activeCoverage },
              identityPassed,
            );
            const eligible = existingMember && activeCoverage && identityPassed;
            expect(result.portfolio).toBe(eligible);
            expect(result.decision).toBe(
              eligible ? "auto-approve" : "manual-review",
            );
          }
      expect(
        resolveTpaOutcome(client, {
          existingMember: true,
          activeCoverage: true,
        }).verifyIdentity,
      ).toBe(true);
    },
  );
  it("ASCE lookup requires Membership ID and state while AMA uses name and DOB", () => {
    expect(lookupPrototypeTpa(clients.ama, facts).existingMember).toBe(true);
    expect(lookupPrototypeTpa(clients.asce, facts).existingMember).toBe(false);
    expect(
      lookupPrototypeTpa(clients.asce, {
        ...facts,
        "member-id": "ASCE12345",
        "state-province": "NY",
      }).existingMember,
    ).toBe(true);
    expect(lookupPrototypeTpa(clients.asce, { ...facts, "member-id": "ASCE12345", "state-province": "CA" }).existingMember).toBe(false);
    expect(clients.asce.tpaIntegration?.requireAddressBeforeVerification).toBe(true);
    expect(
      lookupPrototypeTpa(clients.asce, { ...facts, "member-id": "wrong" })
        .existingMember,
    ).toBe(false);
  });
  it.each(["waepa", "waepa-gi"] as const)(
    "%s never verifies or enables portfolio; only new members auto-approve",
    (siteId) => {
      const client = getEffectiveSiteConfig(siteId);
      for (const existingMember of [false, true])
        for (const activeCoverage of [false, true])
          for (const identityPassed of [undefined, false, true]) {
            expect(
              resolveTpaOutcome(
                client,
                { existingMember, activeCoverage },
                identityPassed,
              ),
            ).toEqual({
              verifyIdentity: false,
              verified: false,
              portfolio: false,
              decision: existingMember ? "manual-review" : "auto-approve",
            });
          }
      expect(client.theme).toEqual({ type: "custom", primary: "#001F5F" });
      expect(client.flows?.overrides?.tpaVerification).toBeDefined();
    },
  );
  it("all sites inherit the requested membership subtitle", () => {
    for (const site of siteEntities)
      expect(buildContent(site.id).pages.membership?.subhead).toBe(
        "Progress saves as you go, so you can stop anytime and finish later.",
      );
  });
});
