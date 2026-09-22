import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, TextField, Typography } from "@mui/material";
import PageShell from "./PageShell";

/**
 * PageShell is the generic centered page wrapper (title, error banner, help
 * content, max-width, action row) underneath the shared FormRoutePage
 * template. In practice it's only ever used through FormRoutePage — no page
 * file calls it directly — but it's documented standalone here since it's
 * the real reusable primitive.
 */
const meta = {
  title: "Layout/PageShell",
  component: PageShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageShell>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <PageShell title="Profile" subhead="Tell us a bit about yourself.">
      <TextField label="First name" fullWidth sx={{ mb: 2 }} />
      <TextField label="Last name" fullWidth />
    </PageShell>
  ),
};

export const WithBackButton: StoryObj = {
  render: () => (
    <PageShell title="Profile" onBack={() => {}}>
      <TextField label="First name" fullWidth />
    </PageShell>
  ),
};

export const WithError: StoryObj = {
  render: () => (
    <PageShell title="Profile" error="Please complete the required fields before continuing.">
      <TextField label="First name" fullWidth error required />
    </PageShell>
  ),
};

export const WithHelpAndActions: StoryObj = {
  render: () => (
    <PageShell
      title="Coverage"
      subhead="Choose the coverage you'd like to apply for."
      help={<Typography variant="caption" color="text.secondary">Need help? Contact support.</Typography>}
      actions={<Button variant="contained">Continue</Button>}
    >
      <Typography variant="body2">Page content goes here.</Typography>
    </PageShell>
  ),
};

export const NoTitle: StoryObj = {
  name: "noTitle (title/back/error/help suppressed)",
  render: () => (
    <PageShell title="This title is not rendered" noTitle>
      <Typography variant="body2">
        Used by FormRoutePage, which renders its own PageHeader inside
        FormShell instead — PageShell's own title branch is intentionally
        unused in that composition.
      </Typography>
    </PageShell>
  ),
};

export const NarrowMaxWidth: StoryObj = {
  name: "maxWidth — narrow (resume-style pages)",
  render: () => (
    <PageShell title="Verify your email" maxWidth={480}>
      <TextField label="Email" fullWidth />
    </PageShell>
  ),
};

export const FullWidth: StoryObj = {
  name: 'maxWidth="100%" (vertical-stepper pages)',
  render: () => (
    <PageShell title="Coverage" maxWidth="100%">
      <Typography variant="body2" color="text.secondary">
        FormRoutePage passes <code>maxWidth="100%"</code> whenever the page
        has an active progress step, since the sidebar-stepper layout
        supplies its own width constraint.
      </Typography>
    </PageShell>
  ),
};
