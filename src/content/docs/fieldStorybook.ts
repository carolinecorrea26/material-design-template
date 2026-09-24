import type { FieldDefinition } from "../../config/fields/types";

export type FieldStorybookReference = {
  label: string;
  storyId: string;
};

const story = (slug: string, label: string): FieldStorybookReference => ({
  label,
  storyId: `forms-fieldrenderer--${slug}`,
});

/**
 * Resolves the concrete FieldRenderer story that matches a field's rendered
 * control, including automatic long-option promotion and text-field variants.
 */
export function getFieldStorybookReference(
  field: Pick<FieldDefinition, "id" | "label" | "inputType"> & Partial<FieldDefinition>,
): FieldStorybookReference | undefined {
  const standardLabel =
    field.labelVariant === "standard" ||
    (!field.labelVariant && field.label.length >= 40);

  if (field.multiline) return story("textarea", "Textarea");

  if (field.format === "email") return story("email", "Email");
  if (field.format === "phone") {
    return field.showPhoneTypeSelector === false
      ? story("phone-plain", "Phone — no type selector")
      : story("phone-with-type-selector", "Phone — with type selector");
  }
  if (field.format === "currency") return story("currency", "Currency");
  if (field.format === "percent" || field.inputType === "percent")
    return story("percent", "Percent");
  if (field.format === "ssn") return story("ssn", "SSN");
  if (field.format === "month-year") return story("month-year", "Month / year");

  if (
    field.inputType === "searchable-select" ||
    (field.inputType === "dropdown" && (field.options?.length ?? 0) >= 10)
  ) {
    return story("searchable-select", "Searchable select");
  }

  switch (field.inputType) {
    case "text":
      return standardLabel
        ? story("text-standard-label", "Text — standard label")
        : story("text-floating-label", "Text — floating label");
    case "number":
      return story("number-input", "Number");
    case "date":
      return story("date-input", "Date");
    case "dropdown":
      return standardLabel
        ? story("dropdown-standard-label", "Dropdown — standard label")
        : story("dropdown-floating-label", "Dropdown — floating label");
    case "radio":
      return story("radio", "Radio");
    case "checkbox":
      return story("checkbox-single", "Checkbox — single");
    case "checkbox-group":
      return story("checkbox-group", "Checkbox group");
    case "multi-select":
      return story("multi-select", "Multi-select");
    default:
      return undefined;
  }
}
