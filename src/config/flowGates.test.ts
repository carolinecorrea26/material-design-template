import { describe, expect, it } from "vitest";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import type {
  CoverageCategoryId,
  CoverageDefinition,
  CoverageUnderwritingType,
} from "./coverages/types";
import {
  coverageSatisfiesFlowGate,
  coverageUnlocksPage,
  getFlowGateDefinition,
  resolveFlowGate,
  resolvePageParticipation,
} from "./flowGates";
import {
  getNextFormPageId,
  getPreviousFormPageId,
  shouldSkipPage,
} from "./formFlow";
import { getActiveProgressSteps } from "./progressSteps";

function coverage(
  id: string,
  categoryId: CoverageCategoryId,
  underwritingType: CoverageUnderwritingType,
  options?: { cir?: boolean },
): CoverageDefinition {
  return {
    id,
    code: id,
    categoryId,
    name: id,
    planCode: { primary: id },
    underwritingType,
    definition: id,
    applicants: ["member"],
    options: [],
    riders: options?.cir
      ? [
          {
            id: "cir",
            name: "CIR",
            description: "CIR",
            premiumFactor: 0,
          },
        ]
      : undefined,
  };
}

const li = coverage("li", "LI", "FUW");
const ad = coverage("ad", "AD", "NA");
const si = coverage("si", "DI", "SI");
const qd = coverage("qd", "LI", "QD");
const teleLi = coverage("tele-li", "LI", "TELE");
const teleDi = coverage("tele-di", "DI", "TELE");
const cir = coverage("cir-li", "LI", "FUW", { cir: true });
const catalog = [li, ad, si, qd, teleLi, teleDi, cir];

function selected(...coverageIds: string[]): ApplicationFormValues {
  return { coverageSelections: coverageIds };
}

describe("canonical flow gates", () => {
  it("activates Beneficiary for LI or AD and skips it otherwise", () => {
    expect(resolveFlowGate("beneficiary", selected("li"), catalog)).toBe(true);
    expect(resolveFlowGate("beneficiary", selected("ad"), catalog)).toBe(true);
    expect(resolveFlowGate("beneficiary", selected("si"), catalog)).toBe(false);
  });

  it("activates underwriting gates only for their selected types", () => {
    expect(resolveFlowGate("health-si", selected("si"), catalog)).toBe(true);
    expect(resolveFlowGate("health-si", selected("li"), catalog)).toBe(false);
    expect(resolveFlowGate("health-qd", selected("qd"), catalog)).toBe(true);
    expect(resolveFlowGate("health-qd", selected("li"), catalog)).toBe(false);
  });

  it("requires the matching category and TELE underwriting together", () => {
    expect(resolveFlowGate("health-li", selected("tele-li"), catalog)).toBe(true);
    expect(resolveFlowGate("health-li", selected("tele-di"), catalog)).toBe(false);
    expect(resolveFlowGate("health-di", selected("tele-di"), catalog)).toBe(true);
    expect(resolveFlowGate("health-di", selected("tele-li"), catalog)).toBe(false);
  });

  it("requires a selected CIR rider", () => {
    expect(
      resolveFlowGate(
        "health-cir",
        {
          coverageSelections: ["cir-li"],
          coverageRiders: { "cir-li:cir:member": true },
        },
        catalog,
      ),
    ).toBe(true);
    expect(resolveFlowGate("health-cir", selected("cir-li"), catalog)).toBe(false);
  });

  it("composes Client page enablement with gates", () => {
    expect(
      resolvePageParticipation("beneficiary", selected("li"), {
        coverages: catalog,
        pageRequirement: "none",
      }),
    ).toBe(false);
    expect(
      resolvePageParticipation("contact", {}, { pageRequirement: "required" }),
    ).toBe(true);
    expect(
      resolvePageParticipation("contact", {}, { pageRequirement: "optional" }),
    ).toBe(true);
    expect(
      resolvePageParticipation("contact", {}, { pageRequirement: "none" }),
    ).toBe(false);
  });

  it("keeps shouldSkipPage as a page-agnostic derived API", () => {
    expect(shouldSkipPage.toString()).not.toMatch(
      /beneficiary|health-si|health-li|health-qd|health-di|health-cir/,
    );
  });

  it("derives coverage discovery from the same gate definitions", () => {
    expect(coverageUnlocksPage.toString()).not.toMatch(
      /beneficiary|health-si|health-li|health-qd|health-di|health-cir/,
    );
    for (const [pageId, candidate] of [
      ["beneficiary", li],
      ["health-si", si],
      ["health-qd", qd],
      ["health-li", teleLi],
      ["health-di", teleDi],
      ["health-cir", cir],
    ] as const) {
      const definition = getFlowGateDefinition(pageId);
      expect(definition).toBeDefined();
      expect(coverageUnlocksPage(pageId, candidate)).toBe(
        coverageSatisfiesFlowGate(candidate, definition!.gate),
      );
    }
  });

  it("skips unsatisfied gates during next and previous navigation", () => {
    expect(getNextFormPageId("coverage", {})).toBe("contact");
    expect(getPreviousFormPageId("payment", {})).toBe("review");
  });

  it("filters progress pages through the same participation resolver", () => {
    const activeSteps = getActiveProgressSteps({});
    const activePageIds = activeSteps.flatMap((step) => step.pageIds);
    expect(activePageIds).not.toContain("beneficiary");
    expect(activePageIds).not.toContain("health-si");
    expect(activePageIds).not.toContain("health-li");
    expect(activePageIds).not.toContain("health-qd");
    expect(activePageIds).not.toContain("health-di");
    expect(activePageIds).not.toContain("health-cir");
    expect(activePageIds).toContain("contact");
    expect(activePageIds).toContain("review");
  });
});
