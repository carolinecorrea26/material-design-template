import { describe, expect, it } from "vitest";
import {
  configurationsData,
  getConfigurationAvailableOptions,
} from "./configurations";

describe("configuration option documentation", () => {
  it("documents the available values for every provisioning option", () => {
    const undocumented = configurationsData.filter(
      (row) => getConfigurationAvailableOptions(row) === "No configurable values documented",
    );

    expect(undocumented.map((row) => row.name)).toEqual([]);
  });
});
