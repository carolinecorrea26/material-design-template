import { describe, expect, it } from "vitest";
import { formFlow } from "../../config/formFlow";
import { clients } from "../../config/clients";
import { resolveClientFields } from "../../config/resolvers";
import {
  getFieldDisplayType,
  getPageFieldRows,
  isClientSpecificField,
  pagesWithNoFields,
} from "./fieldRows";

describe("getFieldDisplayType", () => {
  it("reports formatted text controls by their rendered type", () => {
    expect(getFieldDisplayType({ inputType: "text", format: "email" })).toBe("email");
    expect(getFieldDisplayType({ inputType: "text", format: "phone" })).toBe("phone");
    expect(getFieldDisplayType({ inputType: "text", format: "currency" })).toBe("currency");
    expect(getFieldDisplayType({ inputType: "text", format: "ssn" })).toBe("ssn");
    expect(getFieldDisplayType({ inputType: "text", format: "month-year" })).toBe(
      "month-year",
    );
    expect(getFieldDisplayType({ inputType: "text", multiline: true })).toBe("textarea");
  });

  it("matches FieldRenderer's long-dropdown promotion", () => {
    expect(
      getFieldDisplayType({
        inputType: "dropdown",
        options: Array.from({ length: 10 }, (_, index) => ({
          value: String(index),
          label: String(index),
        })),
      }),
    ).toBe("searchable-select");
    expect(
      getFieldDisplayType({
        inputType: "dropdown",
        options: Array.from({ length: 9 }, (_, index) => ({
          value: String(index),
          label: String(index),
        })),
      }),
    ).toBe("dropdown");
  });

  it("documents every displayed field with a real ID and rendering component", () => {
    const rows = formFlow
      .filter((pageId) => !pagesWithNoFields.has(pageId))
      .flatMap((pageId) =>
        getPageFieldRows(pageId).filter((row) => !isClientSpecificField(row.fieldId)),
      );

    expect(rows.filter((row) => row.fieldId === "—")).toEqual([]);
    expect(rows.filter((row) => !row.storybook && !row.componentLabel)).toEqual([]);
  });

  it("documents bespoke Eligibility, Beneficiary, and Coverage controls accurately", () => {
    const eligibilityRows = getPageFieldRows("eligibility");
    const beneficiaryRows = getPageFieldRows("beneficiary");
    const coverageRows = getPageFieldRows("coverage");

    expect(eligibilityRows.some((row) => row.fieldId === "—")).toBe(false);
    expect(
      eligibilityRows.find((row) => row.fieldId === "zip-postal-code")?.componentLabel,
    ).toBe("MUI TextField (inline)");

    expect(beneficiaryRows.find((row) => row.fieldId === "beneficiary-type")).toMatchObject({
      inputType: "radio",
      storybook: { label: "RadioSelectionGroup" },
    });
    expect(
      beneficiaryRows.find((row) => row.fieldId === "beneficiary-designation")
        ?.componentLabel,
    ).toBe("MUI Tabs (inline)");
    expect(
      beneficiaryRows.find((row) => row.fieldId === "beneficiary-share")?.inputType,
    ).toBe("percent");

    expect(
      coverageRows
        .filter((row) => row.fieldId.startsWith("coverage-"))
        .every((row) => row.storybook?.label === "ProductCatalog"),
    ).toBe(true);
  });

  it("retains component ownership for every client's effective field rows", () => {
    const undocumented = Object.values(clients).flatMap((client) =>
      resolveClientFields(client).flatMap((page) =>
        page.fields
          .filter((field) => field.included)
          .filter((field) => !field.row.storybook && !field.row.componentLabel)
          .map((field) => `${client.id}:${page.pageId}:${field.fieldId}`),
      ),
    );

    expect(undocumented).toEqual([]);
  });
});
