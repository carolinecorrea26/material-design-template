import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, TextField } from "@mui/material";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import SectionDivider, { FieldGroup } from "./SectionDivider";
import FieldGrid from "./FieldGrid";

const meta = {
  id: "layout-sectiondivider",
  title: "Components/Layout/Headings and dividers/Section divider",
  component: SectionDivider,
  parameters: { docs: { description: { component: "Field-group labels use uppercase text with slight letter spacing. Titled and untitled groups share a rounded surface matching the page background, with white inputs and generous space between sections. The prototype uses these same components." } }, layout: "padded" },
} satisfies Meta<typeof SectionDivider>;

export default meta;

export const SubsectionPreset: StoryObj = {
  name: 'variant="subsection" (used by every real call site)',
  render: () => <>
    <SectionDivider label="Personal information" variant="subsection">
      <Stack spacing={2}>
        <FieldGrid columns="1fr 1fr" keepColumns>
          <TextField label="Height (feet)" defaultValue="5" fullWidth />
          <TextField label="Inches" defaultValue="6" fullWidth />
        </FieldGrid>
        <TextField label="Weight (lbs.)" defaultValue="150" fullWidth />
      </Stack>
    </SectionDivider>
    <SectionDivider label="Physician information" variant="subsection">
      <Stack spacing={2}>
        <TextField label="Physician first name" fullWidth />
        <TextField label="Physician last name" fullWidth />
      </Stack>
    </SectionDivider>
  </>,
};

export const SubsectionWithIcon: StoryObj = {
  render: () => <SectionDivider label="Business Information" icon={BusinessRoundedIcon} variant="subsection" />,
};

export const UntitledGroup: StoryObj = {
  render: () => <FieldGroup className="FieldGroup-root">
    <Stack spacing={2}>
      <FieldGrid columns="equal">
        <TextField label="First name" fullWidth />
        <TextField label="Last name" fullWidth />
      </FieldGrid>
      <TextField label="Phone number" fullWidth />
      <TextField label="Email" fullWidth />
    </Stack>
  </FieldGroup>,
};

export const ChipFilled: StoryObj = {
  name: 'chipVariant="filled" (explicit — not used by real call sites today)',
  render: () => <SectionDivider label="Filled" chipVariant="filled" />,
};

export const ChipOutlined: StoryObj = {
  name: 'chipVariant="outlined" (the raw default)',
  render: () => <SectionDivider label="Outlined" chipVariant="outlined" />,
};

export const ChipText: StoryObj = {
  name: 'chipVariant="text" (no chip, plain uppercase label)',
  render: () => <SectionDivider label="Plain text label" chipVariant="text" />,
};

export const ColorDefault: StoryObj = {
  name: 'chipColor="default" (explicit chip example)',
  render: () => <SectionDivider label="Neutral gray" chipVariant="filled" chipColor="default" />,
};

export const SizeComparison: StoryObj = {
  render: () => (
    <Stack spacing={3}>
      <SectionDivider label="size=&quot;default&quot; (applicant + category headers)" size="default" />
      <SectionDivider label="size=&quot;small&quot; (sub-sections + standalone)" size="small" />
    </Stack>
  ),
};
