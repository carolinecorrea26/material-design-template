import { describe, expect, it } from "vitest";
import { showSinglePageArtwork } from "../homepagePresentation";
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
    expect(theme?.effective).toEqual({ type: "custom", primary: "#001F5F" });
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

it("documents additional fields from the runtime Membership registry", () => {
  const row = (id: keyof typeof clients) => resolveClientConfigurations(clients[id]).find(row => row.key === "ClientConfig.fields.membership.extra")!;
  expect(row("asce").page.id).toBe("membership");
  expect(row("asce").effective).toEqual(["asce-member-id"]);
  expect(row("ama").effective).toEqual(expect.arrayContaining(["ama-physician-type", "ama-physician-first-name"]));
  expect(row("waepa").effective).toEqual(expect.arrayContaining(["waepa-declaration", "waepa-attestation", "waepa-employer"]));
  expect(row("waepagi").effective).toEqual([]);
  expect(resolveClientConfigurations(clients.asce).some(row => row.key === "ClientConfig.fields.eligibility.extra")).toBe(false);
});


it("resolves opt-in artwork and restricts it to the single-page template", () => {
  const key = "ClientConfig.features.singlePageArtwork";
  const inherited = resolveClientConfigurations(clients.demo).find(row => row.key === key)!;
  expect(inherited.effective).toBe("none");
  expect(inherited.status).toBe("inherited");
  const features = { ...clients.demo.features, singlePageArtwork: "clouds-cat-umbrella" as const };
  const configured = resolveClientConfigurations({ ...clients.demo, features }).find(row => row.key === key)!;
  expect(configured.effective).toBe("clouds-cat-umbrella");
  expect(configured.status).toBe("overridden");
  expect(showSinglePageArtwork("single")).toBe(false);
  expect(showSinglePageArtwork("single", features)).toBe(true);
  expect(showSinglePageArtwork("multi", features)).toBe(false);
});
