import { describe, expect, it } from "vitest";
import { pageSections } from "../pageSections/pageSections";
import { siteFieldOverrides } from "../fields/fieldOverrides";
import {
  conditionDefinitions,
  evaluateCondition,
  evaluateConditionDefinition,
  formatConditionDefinition,
  resolveVisibilityCondition,
} from ".";
import {
  formatConditionVisibilityTargets,
  getConditionVisibilityTargets,
} from "./conditionTargets";
import { getApplicableSiteRules, siteRules } from "../../content/docs/siteRules";
import { getClientPageFields } from "../clientFields/getClientPageFields";
import { fieldCatalog } from "../fields";
import { getResolvedFieldRegistry } from "../fields/resolvedFieldRegistry";

describe("canonical executable conditions", () => {
  it("shows and hides Eligibility spouse information from one canonical condition", () => {
    expect(evaluateConditionDefinition("condition-spouse-selected", { dependents: ["spouse"] })).toBe(true);
    expect(evaluateConditionDefinition("condition-spouse-selected", { dependents: [] })).toBe(false);
  });

  it("shows the applicant-specific child section only when Child is selected", () => {
    const childSection = pageSections.eligibility?.find((section) => section.id === "childSection");
    if (!childSection) throw new Error("Missing childSection test fixture");
    expect(childSection.applicant).toBe("child");
    expect(resolveVisibilityCondition(childSection, { dependents: ["child"] })).toBe(true);
    expect(resolveVisibilityCondition(childSection, { dependents: ["spouse"] })).toBe(false);
  });

  it("preserves member Profile follow-up visibility", () => {
    const licenseSection = pageSections.profile?.find(
      (section) => section.id === "profilePersonalSelfDriversLicense",
    );
    if (!licenseSection) throw new Error("Missing Profile license test fixture");
    expect(resolveVisibilityCondition(licenseSection, { "has-drivers-license": "yes" })).toBe(true);
    expect(resolveVisibilityCondition(licenseSection, { "has-drivers-license": "no" })).toBe(false);
  });

  it("retains canonical not-equals operator behavior", () => {
    expect(evaluateCondition({
      id: "condition-test-not-equals",
      conditions: [{ fieldId: "membership", operator: "notEquals", value: "new" }],
      match: "all",
    }, { membership: "current" })).toBe(true);
    expect(evaluateCondition({
      id: "condition-test-not-equals",
      conditions: [{ fieldId: "membership", operator: "notEquals", value: "new" }],
      match: "all",
    }, { membership: "new" })).toBe(false);
  });

  it("fails closed when a target references an unknown condition", () => {
    expect(resolveVisibilityCondition(
      { visibilityConditionId: "condition-missing" },
      {},
    )).toBe(false);
  });

  it("evaluates AMA spouse physician information as a scope-neutral predicate", () => {
    expect(evaluateConditionDefinition("condition-membership-ama-spouse", { membership: "spouse" })).toBe(true);
    expect(evaluateConditionDefinition("condition-membership-ama-spouse", { membership: "physician" })).toBe(false);
  });

  it("resolves WAEPA New Member and qualification-specific predicates", () => {
    expect(evaluateConditionDefinition("condition-membership-waepa-new", { membership: "new" })).toBe(true);
    expect(evaluateConditionDefinition("condition-membership-waepa-new", { membership: "current" })).toBe(false);
    expect(evaluateConditionDefinition("condition-waepa-federal-active", { membership: "new", "waepa-attestation": "federal-active" })).toBe(true);
    expect(evaluateConditionDefinition("condition-waepa-federal-annuitant", { membership: "new", "waepa-attestation": "federal-annuitant" })).toBe(true);
    for (const value of ["spouse-associate", "child-associate"]) {
      expect(evaluateConditionDefinition("condition-waepa-associated-member", { membership: "new", "waepa-attestation": value })).toBe(true);
    }
  });

  it("resolves migrated runtime fields from the canonical conditions", () => {
    window.history.replaceState(null, "", "/?site=ama-default");
    expect(getClientPageFields("membership", { membership: "spouse" }).some((field) => field.id === "ama-physician-first-name")).toBe(true);
    expect(getClientPageFields("membership", { membership: "physician" }).some((field) => field.id === "ama-physician-first-name")).toBe(false);

    window.history.replaceState(null, "", "/?site=waepa-standard");
    const activeFields = getClientPageFields("membership", {
      membership: "new",
      "waepa-attestation": "federal-active",
    }).map((field) => field.id);
    expect(activeFields).toContain("waepa-employer");
    expect(activeFields).toContain("waepa-start-date");
    expect(activeFields).not.toContain("waepa-retired-employer");

    const annuitantFields = getClientPageFields("membership", {
      membership: "new",
      "waepa-attestation": "federal-annuitant",
    }).map((field) => field.id);
    expect(annuitantFields).toContain("waepa-retired-employer");
    expect(annuitantFields).toContain("waepa-retirement-date");

    for (const qualification of ["spouse-associate", "child-associate"]) {
      const fields = getClientPageFields("membership", {
        membership: "new",
        "waepa-attestation": qualification,
      }).map((field) => field.id);
      expect(fields).toEqual(expect.arrayContaining([
        "waepa-member-first-name",
        "waepa-member-last-name",
        "waepa-member-id",
      ]));
    }

    window.history.replaceState(null, "", "/?site=waepa-gi");
    expect(getClientPageFields("membership", {
      membership: "new",
      "waepa-attestation": "federal-active",
    }).some((field) => field.id.startsWith("waepa-"))).toBe(false);
  });

  it("references migrated visibility through condition IDs instead of duplicated visibleWhen objects", () => {
    const spouseSection = pageSections.eligibility?.find((section) => section.id === "spouseSection");
    expect(spouseSection?.visibilityConditionId).toBe("condition-spouse-selected");
    expect(
      Object.values(pageSections)
        .flatMap((sections) => sections ?? [])
        .every((section) => !("visibleWhen" in section)),
    ).toBe(true);
    const conditionalMembershipOverrides = siteFieldOverrides.filter(
      (override) =>
        override.pageId === "membership" &&
        override.include &&
        override.values?.visibilityConditionId,
    );
    expect(conditionalMembershipOverrides.length).toBeGreaterThan(0);
    for (const override of conditionalMembershipOverrides) {
      expect(override.values?.visibilityConditionId).toMatch(/^condition-/);
      expect("visibleWhen" in (override.values ?? {})).toBe(false);
    }
  });

  it("preserves page-section and applicant-specific visibility behavior", () => {
    const sections = Object.values(pageSections).flatMap((entries) => entries ?? []);
    const byId = (id: string) => sections.find((section) => section.id === id)!;

    expect(resolveVisibilityCondition(byId("selfCoverageTobacco"), { smoker: "yes" })).toBe(true);
    expect(resolveVisibilityCondition(byId("selfCoverageTobacco"), { smoker: "no" })).toBe(false);
    expect(resolveVisibilityCondition(byId("spouseCoverageTobacco"), {
      dependents: ["spouse"],
      "spouse-smoker": "yes",
    })).toBe(true);
    expect(resolveVisibilityCondition(byId("spouseCoverageTobacco"), {
      dependents: [],
      "spouse-smoker": "yes",
    })).toBe(false);
    expect(resolveVisibilityCondition(byId("profilePersonalSpouseDriversLicense"), {
      dependents: ["spouse"],
      "spouse-has-drivers-license": "yes",
    })).toBe(true);
    expect(resolveVisibilityCondition(byId("profilePersonalSpouseDriversLicense"), {
      dependents: ["spouse"],
      "spouse-has-drivers-license": "no",
    })).toBe(false);
    expect(resolveVisibilityCondition(byId("advisorLoginNew"), {
      "advisor-flow-type": "saved",
    })).toBe(false);
    expect(resolveVisibilityCondition(byId("advisorLoginSaved"), {
      "advisor-flow-type": "saved",
    })).toBe(true);
  });

  it("derives target descriptions without storing effects on condition definitions", () => {
    expect(conditionDefinitions.every((definition) => !("effect" in definition))).toBe(true);
    expect(getConditionVisibilityTargets("condition-spouse-selected")).toEqual(
      expect.arrayContaining([
        {
          type: "show-section",
          pageId: "eligibility",
          sectionId: "spouseSection",
          applicant: "spouse",
        },
        {
          type: "show-section",
          pageId: "contact",
          sectionId: "contactSpouse",
          applicant: "spouse",
        },
      ]),
    );
    expect(formatConditionVisibilityTargets("condition-membership-ama-spouse"))
      .toContain("show-fields ama-default");
    expect(formatConditionVisibilityTargets("condition-membership-waepa-new"))
      .toContain("show-fields waepa-standard");
    expect(formatConditionVisibilityTargets("condition-membership-waepa-new"))
      .not.toContain("waepa-gi");
  });

  it("discovers conditional fields outside Membership through the resolved registry", () => {
    const registry = getResolvedFieldRegistry();
    expect(registry.some((entry) =>
      entry.pageId === "profile" && entry.fieldId === "marital-status",
    )).toBe(true);

    const futureProfileCondition = "condition-test-profile" as const;
    expect(getConditionVisibilityTargets(futureProfileCondition, [{
      siteId: "demo-default",
      pageId: "profile",
      fieldId: "marital-status",
      field: {
        ...fieldCatalog["marital-status"],
        visibilityConditionId: futureProfileCondition,
      },
    }])).toEqual([{
      type: "show-fields",
      siteId: "demo-default",
      pageId: "profile",
      fieldIds: ["marital-status"],
    }]);
  });

  it("keeps all 94 rules, links every condition, and separates spouse validation from visibility", () => {
    expect(siteRules.length).toBe(94);
    expect(siteRules.slice(-6).every((rule) => rule.type === "conditional")).toBe(true);
    expect(siteRules.every((rule) => rule.type === "behavioral" || rule.conditionIds?.length)).toBe(true);
    const referencedConditionIds = new Set(siteRules.flatMap((rule) => rule.conditionIds ?? []));
    expect(conditionDefinitions.every((condition) => referencedConditionIds.has(condition.id))).toBe(true);
    expect(siteRules.find((rule) => rule.rule === "Spouse dependent requires spouse details"))
      .toMatchObject({ type: "behavioral", scope: "global" });
    expect(siteRules.find((rule) => rule.rule === "Spouse selection displays spouse information"))
      .toMatchObject({
        type: "conditional",
        scope: "global",
        conditionIds: ["condition-spouse-selected"],
      });
    expect(formatConditionDefinition("condition-waepa-associated-member")).toContain(" OR ");
  });

  it("derives applicable Site rules without treating overrides as rules", () => {
    const amaRules = getApplicableSiteRules({ clientId: "ama", siteId: "ama-default" });
    const waepaRules = getApplicableSiteRules({ clientId: "waepa", siteId: "waepa-standard" });
    const waepaGiRules = getApplicableSiteRules({ clientId: "waepa", siteId: "waepa-gi" });
    const waepaConditionIds = [
      "condition-membership-waepa-new",
      "condition-waepa-federal-active",
      "condition-waepa-federal-annuitant",
      "condition-waepa-associated-member",
    ];
    expect(amaRules.some((rule) => rule.conditionIds?.includes("condition-membership-ama-spouse"))).toBe(true);
    expect(amaRules.some((rule) => rule.conditionIds?.includes("condition-membership-waepa-new"))).toBe(false);
    expect(waepaRules.some((rule) => rule.conditionIds?.includes("condition-membership-waepa-new"))).toBe(true);
    expect(waepaGiRules.every((rule) =>
      !rule.conditionIds?.some((conditionId) => waepaConditionIds.includes(conditionId)),
    )).toBe(true);
    expect(waepaRules.every((rule) => !rule.id.startsWith("assignment-"))).toBe(true);
  });
});
