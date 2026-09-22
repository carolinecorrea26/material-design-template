import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import FieldRenderer from "./FieldRenderer";
import type { FieldDefinition, FieldInputType } from "../../config/fields/types";

/**
 * FieldRenderer is the single dispatcher every application page routes its
 * fields through — it owns validation rules, error/helper-text wiring, and
 * accessibility association (aria-describedby, radiogroup/group roles,
 * labelId) for every field type in the app. There is no per-type wrapper
 * component; this file demonstrates the real component with a real
 * react-hook-form context, not a mock.
 */
const meta = {
  title: "Forms/FieldRenderer",
  component: FieldRenderer,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FieldRenderer>;

export default meta;

type DemoValues = Record<string, string | boolean | string[]>;

type FieldStoryArgs = {
  label: string;
  inputType: FieldInputType;
  required: boolean;
  disabled: boolean;
  labelVariant: "floating" | "standard";
  helperText: string;
  tooltip: string;
};

const OPTION_TYPES = new Set<FieldInputType>([
  "dropdown",
  "radio",
  "searchable-select",
  "checkbox-group",
  "multi-select",
]);

const PLAYGROUND_OPTIONS = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

/** Mounts FieldRenderer with a real, isolated react-hook-form context. */
function FieldHarness({
  field,
  forceError = false,
  maxWidth = 420,
}: {
  field: FieldDefinition;
  forceError?: boolean;
  maxWidth?: number;
}) {
  const {
    control,
    trigger,
    formState: { errors },
  } = useForm<DemoValues>({
    mode: "onChange",
    defaultValues: {
      [field.id]: field.inputType === "checkbox" ? false : field.inputType === "checkbox-group" || field.inputType === "multi-select" ? [] : "",
      "phone-type": "mobile",
    },
  });

  useEffect(() => {
    if (forceError) void trigger();
  }, [forceError, trigger]);

  return (
    <Box sx={{ maxWidth }}>
      <FieldRenderer field={field} control={control} errors={errors} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Playground — build a field config from Storybook controls
// ---------------------------------------------------------------------------

export const Playground: StoryObj<FieldStoryArgs> = {
  args: {
    label: "First name",
    inputType: "text",
    required: true,
    disabled: false,
    labelVariant: "floating",
    helperText: "",
    tooltip: "",
  },
  argTypes: {
    inputType: {
      control: "select",
      options: ["text", "number", "date", "dropdown", "radio", "checkbox", "checkbox-group", "multi-select", "searchable-select"] satisfies FieldInputType[],
    },
    labelVariant: { control: "select", options: ["floating", "standard"] },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    helperText: { control: "text" },
    tooltip: { control: "text" },
  },
  render: (args) => {
    const field: FieldDefinition = {
      id: "playground-field",
      label: args.label,
      inputType: args.inputType,
      required: args.required,
      disabled: args.disabled,
      labelVariant: args.labelVariant,
      helperText: args.helperText || undefined,
      tooltip: args.tooltip || undefined,
      options: OPTION_TYPES.has(args.inputType) ? PLAYGROUND_OPTIONS : undefined,
    };
    return <FieldHarness field={field} maxWidth={480} />;
  },
};

// ---------------------------------------------------------------------------
// One story per supported input pattern (adapted from the retired in-app
// field examples; this story is now the source of truth).
// ---------------------------------------------------------------------------

export const TextFloatingLabel: StoryObj = {
  render: () => (
    <FieldHarness
      field={{ id: "text-floating", label: "First name", inputType: "text", required: true, autoComplete: "given-name" }}
    />
  ),
};

export const TextStandardLabel: StoryObj = {
  name: "Text — standard label",
  render: () => (
    <FieldHarness
      field={{ id: "text-standard", label: "Last name", inputType: "text", labelVariant: "standard", required: true, autoComplete: "family-name" }}
    />
  ),
};

export const Email: StoryObj = {
  render: () => (
    <FieldHarness field={{ id: "email", label: "Email address", inputType: "text", format: "email", required: true, autoComplete: "email" }} />
  ),
};

export const PhoneWithTypeSelector: StoryObj = {
  name: "Phone — with type selector",
  render: () => <FieldHarness field={{ id: "phone", label: "Phone number", inputType: "text", format: "phone", required: true }} />,
};

export const PhonePlain: StoryObj = {
  name: "Phone — no type selector",
  render: () => (
    <FieldHarness field={{ id: "phone-plain", label: "Business phone", inputType: "text", format: "phone", showPhoneTypeSelector: false }} />
  ),
};

export const NumberInput: StoryObj = {
  name: "Number",
  render: () => <FieldHarness field={{ id: "number", label: "Years self-employed", inputType: "number" }} />,
};

export const Currency: StoryObj = {
  render: () => <FieldHarness field={{ id: "currency", label: "Average monthly income", inputType: "text", format: "currency" }} />,
};

export const Percent: StoryObj = {
  render: () => <FieldHarness field={{ id: "percent", label: "Ownership share", inputType: "text", format: "percent" }} />,
};

export const Ssn: StoryObj = {
  name: "SSN",
  render: () => (
    <FieldHarness field={{ id: "ssn", label: "Social Security Number", inputType: "text", format: "ssn", required: true }} />
  ),
};

export const DateInput: StoryObj = {
  name: "Date",
  render: () => <FieldHarness field={{ id: "date", label: "Date of birth", inputType: "date", required: true, autoComplete: "bday" }} />,
};

export const MonthYear: StoryObj = {
  render: () => (
    <>
      <FieldHarness field={{ id: "month-year", label: "Coverage start", inputType: "text", format: "month-year" }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Fully implemented but not currently used by any real field config in{" "}
        <code>src/config/fields/index.ts</code> — kept documented so the code
        path stays covered.
      </Typography>
    </>
  ),
};

export const Textarea: StoryObj = {
  render: () => (
    <FieldHarness
      field={{ id: "textarea", label: "Additional details", inputType: "text", multiline: true, minRows: 3, placeholder: "Add any additional context here…" }}
    />
  ),
};

export const DropdownFloatingLabel: StoryObj = {
  name: "Dropdown — floating label",
  render: () => (
    <FieldHarness
      field={{ id: "dropdown-floating", label: "State", inputType: "dropdown", required: true, options: [{ value: "ny", label: "New York" }, { value: "ca", label: "California" }, { value: "tx", label: "Texas" }] }}
    />
  ),
};

export const DropdownStandardLabel: StoryObj = {
  name: "Dropdown — standard label",
  render: () => (
    <FieldHarness
      field={{ id: "dropdown-standard", label: "Business type", inputType: "dropdown", labelVariant: "standard", options: [{ value: "sole-prop", label: "Sole Proprietor" }, { value: "corp", label: "Professional Corporation" }, { value: "llc", label: "LLC" }] }}
    />
  ),
};

export const SearchableSelect: StoryObj = {
  render: () => (
    <>
      <FieldHarness
        field={{
          id: "searchable-select",
          label: "AVMA graduation year",
          inputType: "searchable-select",
          options: Array.from({ length: 6 }, (_, i) => {
            const year = String(2024 - i);
            return { value: year, label: year };
          }),
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Any <code>dropdown</code> field is automatically promoted to a
        searchable select once it has 10+ options (e.g. the WAEPA federal
        agency list), unless it opts out.
      </Typography>
    </>
  ),
};

export const MultiSelect: StoryObj = {
  render: () => (
    <FieldHarness
      field={{
        id: "multi-select",
        label: "Tobacco products used",
        inputType: "multi-select",
        options: [{ value: "cigarettes", label: "Cigarettes" }, { value: "cigars", label: "Cigars" }, { value: "vaping", label: "Vaping / e-cigarettes" }, { value: "chewing", label: "Chewing tobacco" }],
      }}
    />
  ),
};

export const Radio: StoryObj = {
  render: () => (
    <FieldHarness
      field={{ id: "radio", label: "Do you use tobacco products?", inputType: "radio", required: true, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }}
    />
  ),
};

export const CheckboxSingle: StoryObj = {
  name: "Checkbox — single",
  render: () => (
    <FieldHarness field={{ id: "checkbox", label: "I authorize this bank account for premium payments.", inputType: "checkbox", required: true }} />
  ),
};

export const CheckboxGroup: StoryObj = {
  render: () => (
    <FieldHarness
      field={{
        id: "checkbox-group",
        label: "Which of these apply to you?",
        inputType: "checkbox-group",
        options: [{ value: "self-employed", label: "Self-employed" }, { value: "work-from-home", label: "Work from home" }, { value: "travel-often", label: "Travel outside the US often" }],
      }}
    />
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <>
      <FieldHarness field={{ id: "disabled-text", label: "Locked field", inputType: "text", disabled: true }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Not previously demonstrated anywhere in the app's own documentation —
        added in this pass.
      </Typography>
    </>
  ),
};

// ---------------------------------------------------------------------------
// Error states — forced via `trigger()` on mount, using FieldRenderer's real
// validation rules, not a mocked error prop.
// ---------------------------------------------------------------------------

export const TextErrorRequired: StoryObj = {
  name: "Error — required text",
  render: () => (
    <FieldHarness forceError field={{ id: "error-text", label: "Email address", inputType: "text", format: "email", required: true }} />
  ),
};

export const DropdownErrorRequired: StoryObj = {
  name: "Error — required dropdown",
  render: () => (
    <FieldHarness
      forceError
      field={{ id: "error-dropdown", label: "State", inputType: "dropdown", required: true, options: [{ value: "ny", label: "New York" }, { value: "ca", label: "California" }] }}
    />
  ),
};

export const RadioErrorRequired: StoryObj = {
  name: "Error — required radio group",
  render: () => (
    <FieldHarness
      forceError
      field={{ id: "error-radio", label: "Do you use tobacco products?", inputType: "radio", required: true, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }}
    />
  ),
};

export const CheckboxErrorRequired: StoryObj = {
  name: "Error — required checkbox",
  render: () => (
    <FieldHarness forceError field={{ id: "error-checkbox", label: "I authorize this bank account for premium payments.", inputType: "checkbox", required: true }} />
  ),
};

// ---------------------------------------------------------------------------
// Completion-icon debug mode — gated behind the `?inputChecks` URL param
// (FieldRenderer's `inputChecksEnabled()`), not a Storybook global. Not
// discoverable anywhere in the app's own docs before this story.
// ---------------------------------------------------------------------------

export const CompletionIconsDebugMode: StoryObj = {
  name: "Completion icons (debug — ?inputChecks)",
  render: () => {
    const hasParam = new URLSearchParams(window.location.search).has("inputChecks");
    const toggle = () => {
      const url = new URL(window.location.href);
      if (hasParam) url.searchParams.delete("inputChecks");
      else url.searchParams.set("inputChecks", "1");
      window.location.href = url.toString();
    };
    return (
      <Box sx={{ maxWidth: 480 }}>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          FieldRenderer shows a green check / red X end-adornment per field
          only when the URL contains <code>?inputChecks</code>. It is off by
          default and not exposed anywhere in the UI — this is the only place
          it's documented as a toggle.
        </Typography>
        <button onClick={toggle} type="button" style={{ marginBottom: 16 }}>
          {hasParam ? "Disable" : "Enable"} completion icons (reloads the preview)
        </button>
        <FieldHarness field={{ id: "completion-demo", label: "First name", inputType: "text", required: true }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Currently: {hasParam ? "enabled" : "disabled"}. Type a value to see
          the completed-state icon when enabled.
        </Typography>
      </Box>
    );
  },
};
