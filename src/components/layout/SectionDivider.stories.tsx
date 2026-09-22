import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, Stack, Typography } from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import SectionDivider from "./SectionDivider";

/**
 * SectionDivider is a full-width Divider with a centered label chip. Every
 * real call site in the app uses the `variant="subsection"` preset — no
 * page passes `chipVariant` directly.
 *
 * A real bug was fixed here as part of Phase 2B: `chipVariant` used to
 * render inverted from its name (passing "filled" rendered an MUI
 * `variant="outlined"` chip and vice versa), and the `variant="subsection"`
 * preset itself set the wrong internal value to compensate. Both are now
 * correct — `chipVariant="filled"` renders filled, `"outlined"` renders
 * outlined — with zero visual change for any of the ~12 existing call
 * sites, since they all go through the `subsection` preset either way.
 */
const meta = {
  title: "Layout/SectionDivider",
  component: SectionDivider,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SectionDivider>;

export default meta;

export const SubsectionPreset: StoryObj = {
  name: 'variant="subsection" (used by every real call site)',
  render: () => <SectionDivider label="Business Information" variant="subsection" />,
};

export const SubsectionWithIcon: StoryObj = {
  render: () => <SectionDivider label="Business Information" icon={BusinessOutlinedIcon} variant="subsection" />,
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
  name: 'chipColor="default" (used by the subsection preset)',
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

export const FixedNote: StoryObj = {
  name: "What was fixed",
  render: () => (
    <>
      <Alert severity="success" sx={{ maxWidth: 700 }}>
        <Typography variant="body2">
          Before this fix, <code>chipVariant="filled"</code> rendered an MUI{" "}
          <em>outlined</em> chip. Now it renders an actual filled chip — see{" "}
          <strong>Chip filled</strong> above for the corrected appearance.
        </Typography>
      </Alert>
    </>
  ),
};
