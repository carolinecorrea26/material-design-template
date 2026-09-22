import { describe, expect, it } from "vitest";
import { clients } from "../clients";
import { classifyConfigurable, resolveClientConfigurations } from "./resolveClientConfigurations";

describe("classifyConfigurable", () => {
  it("classifies the explicit configuration scope", () => {
    expect(classifyConfigurable("Client Configurable")).toBe("client");
    expect(classifyConfigurable("Global")).toBe("global");
  });
});

describe("resolveClientConfigurations", () => {
  it("overridden: a client-configurable row with a non-default live value", () => {
    const resolved = resolveClientConfigurations(clients.waepa);
    const theme = resolved.find((r) => r.key === "ClientConfig.theme");
    expect(theme?.kind).toBe("client");
    expect(theme?.liveValueAvailable).toBe(true);
    expect(theme?.status).toBe("overridden");
    expect(theme?.effective).toEqual({ type: "preset", preset: "dark-blue" });
  });

  it("inherited: a client-configurable row this client leaves at its default", () => {
    const resolved = resolveClientConfigurations(clients.demo);
    const theme = resolved.find((r) => r.key === "ClientConfig.theme");
    expect(theme?.status).toBe("inherited");
    expect(theme?.effective).toEqual({ type: "preset", preset: "default" });
    expect(theme?.global.defaultDisplay).toContain("#0668FF");
    expect(theme?.page.label).toBe("Global");
  });

  it("assigns page-owned settings to the canonical page list", () => {
    const resolved = resolveClientConfigurations(clients.demo);
    const hero = resolved.find((r) => r.key === "content.home.hero.*");
    expect(hero?.page).toEqual({ id: "home", label: "Home" });
    expect(hero?.global.defaultDisplay).toContain("Safeguard your financial future.");
    expect(hero?.global.defaultDisplay).toContain(
      "Coverage designed exclusively for {client name} members. Get started today!",
    );
  });

  it("schema-only rows (no live accessor, or not client-configurable) report inherited without fabricating a value", () => {
    const resolved = resolveClientConfigurations(clients.demo);
    const rules = resolved.find((r) => r.key === "content.navigation");
    expect(rules?.liveValueAvailable).toBe(false);
    expect(rules?.status).toBe("inherited");
  });
});
