import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ConfiguredApplicationDocumentPreview from "./ConfiguredApplicationDocumentPreview";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../../domain/prototypeLibrary";
import { validateSharedCatalog } from "../../persistence/sharedCatalog";
import type { RateDisplayState } from "../../domain/rateDisplay";

const rates = vi.hoisted(() => ({ member: { status: "available", amount: 21.23 } as RateDisplayState }));
vi.mock("../usePrototypeRates", () => ({
  usePrototypeRates: () => ({ enabled: true, display: (key: string) => key.endsWith(":member") ? rates.member : { status: "available", amount: 17.64 } }),
}));
let root: Root | undefined, container: HTMLDivElement;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove();
  root = undefined;
  installPrototypeLibrary(null);
  vi.unstubAllGlobals();
});
it("shows applicant-specific coverage amounts and mock rates without a bottom estimate bar or download", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/review?site=asce");
  const catalog = validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")));
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, "asce", "test:preview"));
  const values = {
    membership: "yes", dependents: ["spouse"], "first-name": "Taylor", "spouse-first-name": "Sam",
    coverageSelections: ["li-term"], productApplicants: { "li-term": ["member", "spouse"] },
    coverageAmounts: { "li-term:member": 100000, "li-term:spouse": 50000 },
  };
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  const render = () => root!.render(<MemoryRouter><ConfiguredApplicationDocumentPreview values={values} signatureName="" signedDate="" currentDate="2026-09-28" hideSignature /></MemoryRouter>);
  await act(async () => { render(); });
  expect(container.textContent).toContain("$21.23/mo");
  expect(container.textContent).toContain("$17.64/mo");
  expect(container.textContent).toContain("$100,000");
  expect(container.textContent).toContain("$50,000");
  expect([...container.querySelectorAll("*")].filter(element => element.children.length === 0 && element.textContent === "Amount")).toHaveLength(2);
  expect(container.textContent).not.toMatch(/Self amount|Spouse amount|Estimated monthly cost|Download application/i);
  rates.member = { status: "unavailable", reason: "technical" };
  await act(async () => { render(); });
  expect(container.textContent).toContain("Estimate unavailable");
});
