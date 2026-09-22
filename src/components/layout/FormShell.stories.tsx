import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typography } from "@mui/material";
import FormShell from "./FormShell";

/**
 * FormShell is the rounded, elevated Paper container every FormRoutePage-
 * based page renders its content inside. Resume, ResumeCode, and ResumeMethod
 * now compose it with PageShell and PageHeader as well.
 */
const meta = {
  title: "Layout/FormShell",
  component: FormShell,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FormShell>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <FormShell sx={{ px: { xs: 2, sm: "48px" }, py: { xs: 2, sm: "32px" }, maxWidth: 480 }}>
      <Typography variant="body1">
        Any page content — FormShell only supplies the radius, shadow, and
        background surface.
      </Typography>
    </FormShell>
  ),
};

export const CustomPadding: StoryObj = {
  name: "Custom sx (PaperProps passthrough)",
  render: () => (
    <FormShell sx={{ p: 4, maxWidth: 480 }}>
      <Typography variant="body2" color="text.secondary">
        FormShell forwards any <code>PaperProps</code> and merges caller{" "}
        <code>sx</code> with its own base styles (radius + shadow), rather
        than overwriting them.
      </Typography>
    </FormShell>
  ),
};
