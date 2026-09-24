import { describe, expect, it } from "vitest";
import { getFieldStorybookReference } from "./fieldStorybook";

describe("getFieldStorybookReference", () => {
  it("distinguishes floating and standard labels", () => {
    expect(
      getFieldStorybookReference({ id: "first", label: "First name", inputType: "text" })
        ?.storyId,
    ).toBe("forms-fieldrenderer--text-floating-label");
    expect(
      getFieldStorybookReference({
        id: "details",
        label: "Details",
        inputType: "text",
        labelVariant: "standard",
      })?.storyId,
    ).toBe("forms-fieldrenderer--text-standard-label");
  });

  it("distinguishes phone controls with and without the type selector", () => {
    expect(
      getFieldStorybookReference({
        id: "phone",
        label: "Phone",
        inputType: "text",
        format: "phone",
      })?.storyId,
    ).toBe("forms-fieldrenderer--phone-with-type-selector");
    expect(
      getFieldStorybookReference({
        id: "business-phone",
        label: "Business phone",
        inputType: "text",
        format: "phone",
        showPhoneTypeSelector: false,
      })?.storyId,
    ).toBe("forms-fieldrenderer--phone-plain");
  });

  it("uses the searchable-select story for long dropdowns", () => {
    expect(
      getFieldStorybookReference({
        id: "state",
        label: "State",
        inputType: "dropdown",
        options: Array.from({ length: 10 }, (_, index) => ({
          value: String(index),
          label: String(index),
        })),
      })?.storyId,
    ).toBe("forms-fieldrenderer--searchable-select");
  });
});
