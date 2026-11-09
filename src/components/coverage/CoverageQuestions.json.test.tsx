import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DisabilitySelected, WithSpouse } from "./CoverageQuestions.stories";
import { getPrototypeLibrary, installPrototypeLibrary } from "../../domain/prototypeLibrary";

vi.mock("../../persistence/sharedCatalog", async original => {
  const source = await original<typeof import("../../persistence/sharedCatalog")>();
  const { readFileSync } = await import("node:fs");
  const catalog = JSON.parse(readFileSync("public/catalog/portal.json", "utf8"));
  return { ...source, readSharedCatalog: async () => catalog };
});
afterEach(() => vi.unstubAllGlobals());

it.each([[DisabilitySelected, "question"], [WithSpouse, "spouse note"]] as const)("renders reviewed Coverage JSON in the standalone %s story", async (story, example) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const previous = getPrototypeLibrary();
  installPrototypeLibrary(null);
  const container = document.createElement("div"), root = createRoot(container);
  document.body.append(container);
  try {
    const render = story.render as unknown as (args: object, context: object) => ReactNode;
    await act(async () => root.render(<MemoryRouter>{render({}, {})}</MemoryRouter>));
    if (example === "question") {
      expect(container.querySelector('input[name="self-employed-under-one-year"]')).not.toBeNull();
      expect(container.querySelector('input[name="is-self-employed"]')).toBeNull();
      expect(container.querySelector('input[name="years-self-employed"]')).toBeNull();
    } else {
      expect(container.textContent).toContain("Spouse coverage can’t exceed member coverage.");
    }
    expect(getPrototypeLibrary()).toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(previous); }
});
