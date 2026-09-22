import { useForm } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import DynamicList from "./DynamicList";
import type { FieldDefinition } from "../../config/fields/types";

/**
 * DynamicList is the shared add/edit/remove repeatable-record pattern
 * (beneficiaries, dependents, physicians, health-history entries). It hosts
 * its own isolated react-hook-form instance for the add/edit dialog — item
 * edits are staged there and only committed to the parent's `useFieldArray`
 * on Save — and a second confirmation dialog before removal. All of this is
 * real, interactive behavior below: click Add/Edit/Remove rather than
 * looking at a static screenshot.
 */
const meta = {
  title: "Forms/DynamicList",
  component: DynamicList,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DynamicList>;

export default meta;

const beneficiaryFields: FieldDefinition[] = [
  { id: "ds-first-name", label: "First Name", inputType: "text", required: true },
  { id: "ds-last-name", label: "Last Name", inputType: "text", required: true },
  {
    id: "ds-relationship",
    label: "Relationship",
    inputType: "dropdown",
    required: true,
    options: [
      { value: "spouse", label: "Spouse" },
      { value: "child", label: "Child" },
      { value: "parent", label: "Parent" },
      { value: "sibling", label: "Sibling" },
      { value: "other", label: "Other" },
    ],
  },
  { id: "ds-share", label: "% Share", inputType: "number", required: true },
];

const fieldToKey = {
  "ds-first-name": "firstName",
  "ds-last-name": "lastName",
  "ds-relationship": "relationship",
  "ds-share": "share",
} as const;

function renderBeneficiary(item: Record<string, string>) {
  return (
    <Typography variant="body2">
      <strong>
        {item.firstName} {item.lastName}
      </strong>{" "}
      — {item.relationship}, {item.share}% share
    </Typography>
  );
}

function getBeneficiaryLabel(item: Record<string, string>) {
  return `${item.firstName} ${item.lastName} (${item.share}%)`;
}

export const Empty: StoryObj = {
  render: () => {
    const { control } = useForm<Record<string, unknown>>({ defaultValues: { beneficiaries: [] } });
    return (
      <Box sx={{ maxWidth: 480 }}>
        <DynamicList
          control={control}
          name="beneficiaries"
          label="Beneficiary"
          mapping={{ fields: beneficiaryFields, fieldToKey }}
          getItemLabel={getBeneficiaryLabel}
          renderItem={renderBeneficiary}
        />
      </Box>
    );
  },
};

export const Populated: StoryObj = {
  render: () => {
    const { control } = useForm<Record<string, unknown>>({
      defaultValues: {
        beneficiaries: [
          { firstName: "Jordan", lastName: "Lee", relationship: "spouse", share: "60" },
          { firstName: "Avery", lastName: "Lee", relationship: "child", share: "40" },
        ],
      },
    });
    return (
      <Box sx={{ maxWidth: 480 }}>
        <DynamicList
          control={control}
          name="beneficiaries"
          label="Beneficiary"
          mapping={{ fields: beneficiaryFields, fieldToKey }}
          getItemLabel={getBeneficiaryLabel}
          renderItem={renderBeneficiary}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          Click <strong>Edit</strong> to reopen the dialog pre-filled, or{" "}
          <strong>Remove</strong> to see the "This cannot be undone"
          confirmation dialog (<code>role="alertdialog"</code>) before
          anything is actually removed.
        </Typography>
      </Box>
    );
  },
};

export const MaxItemsReached: StoryObj = {
  name: "Maximum items reached",
  render: () => {
    const { control } = useForm<Record<string, unknown>>({
      defaultValues: {
        beneficiaries: [
          { firstName: "Jordan", lastName: "Lee", relationship: "spouse", share: "50" },
          { firstName: "Avery", lastName: "Lee", relationship: "child", share: "50" },
        ],
      },
    });
    return (
      <Box sx={{ maxWidth: 480 }}>
        <DynamicList
          control={control}
          name="beneficiaries"
          label="Beneficiary"
          mapping={{ fields: beneficiaryFields, fieldToKey }}
          getItemLabel={getBeneficiaryLabel}
          renderItem={renderBeneficiary}
          maxItems={2}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          <code>maxItems=2</code>, 2 items already added — the Add button is
          hidden entirely rather than shown disabled.
        </Typography>
      </Box>
    );
  },
};

export const WithGridFields: StoryObj = {
  name: "Add/Edit dialog — 2-column field layout",
  render: () => {
    const { control } = useForm<Record<string, unknown>>({ defaultValues: { beneficiaries: [] } });
    return (
      <Box sx={{ maxWidth: 480 }}>
        <DynamicList
          control={control}
          name="beneficiaries"
          label="Beneficiary"
          mapping={{ fields: beneficiaryFields, fieldToKey, gridFields: ["ds-first-name", "ds-last-name"] }}
          getItemLabel={getBeneficiaryLabel}
          renderItem={renderBeneficiary}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          Click Add — First/Last name render side-by-side (
          <code>mapping.gridFields</code>) while Relationship and % Share
          stack below, full-width.
        </Typography>
      </Box>
    );
  },
};
