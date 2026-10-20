import { describe, expect, it } from "vitest";
import {
  configurationsData,
  getConfigurationAvailableOptions,
  getConfigurationPage,
} from "./configurations";

describe("configuration option documentation", () => {
  it("assigns support-banner chat to the shared portal scope", () => {
    const chat = configurationsData.find(row => row.name === "ClientConfig.features.chat / chatUrl")!;
    expect(getConfigurationPage(chat)).toEqual({ id: "global", label: "Global" });
    expect(chat.usedIn).toBe("ClientHelpBanner");
    expect(chat.description).not.toContain("app header");
  });
  it("documents the available values for every provisioning option", () => {
    const undocumented = configurationsData.filter(
      (row) => getConfigurationAvailableOptions(row) === "No configurable values documented",
    );

    expect(undocumented.map((row) => row.name)).toEqual([]);
  });
});
