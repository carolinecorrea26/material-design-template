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

  it("assigns page-owned configuration settings to the canonical page list", () => {
    const resolved = resolveClientConfigurations(clients.demo);
    const homeVariant = resolved.find(
      (r) => r.key === "ClientConfig.features.homePageVariant",
    );
    expect(homeVariant?.page).toEqual({ id: "home", label: "Home" });
    expect(homeVariant?.global.defaultDisplay).toBe("Default");
  });

  it("excludes editable content and global implementation details from site configuration", () => {
    const resolved = resolveClientConfigurations(clients.demo);
    expect(resolved.some((r) => r.key.startsWith("content."))).toBe(false);
    expect(resolved.some((r) => r.key === "ClientConfig.coverages.categories")).toBe(false);
    expect(resolved.some((r) => r.key === "fieldCatalog")).toBe(false);
  });
});
