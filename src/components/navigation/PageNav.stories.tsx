import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import PageNav from "./PageNav";

/**
 * PageNav renders the single forward action (Next / Submit) at the bottom of
 * every FormRoutePage-based page. It has no back-navigation of its own — that
 * lives in PageHeader via PageTitle's onBack — so this component only ever
 * owns the `type="submit"` button tied to the page's `<form id={formId}>` via
 * the `form` attribute (not by DOM nesting), which is why every story below
 * wraps it in a real `<form>` with a matching id.
 */
const meta = {
  title: "Navigation/PageNav",
  component: PageNav,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 480 }}>
        <form id="demo-form" onSubmit={(e) => e.preventDefault()}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Form content would go here.
          </Typography>
        </form>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof PageNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { formId: "demo-form" },
};

export const CustomLabel: Story = {
  args: { formId: "demo-form", nextLabel: "Submit application" },
};

export const Transitioning: Story = {
  name: "isTransitioning (submit in flight)",
  args: { formId: "demo-form", isTransitioning: true },
  parameters: {
    docs: {
      description: {
        story:
          "Shows a spinner in place of the label and disables the button. The accessible name switches to `\"{label} — submitting\"` (via `aria-label`) so assistive tech still announces what's happening instead of losing the button's name entirely.",
      },
    },
  },
};

export const Disabled: Story = {
  name: "disabled (validation not met)",
  args: { formId: "demo-form", disabled: true },
  parameters: {
    docs: {
      description: {
        story:
          "The theme's `.Mui-disabled` override keeps full brand-color contrast (not MUI's default washed-out disabled look) so the button stays legible — this is a deliberate contrast fix, not an oversight, per the component's sx override.",
      },
    },
  },
};
