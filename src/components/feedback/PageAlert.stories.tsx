import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import PageAlert from "./PageAlert";

/**
 * PageAlert is the canonical full-width contextual alert rendered above form
 * content — it supersedes the now-deprecated PageErrorAlert (a 5-line
 * re-export kept only for old imports; see Guidelines/Dynamic Feedback &
 * Status). Renders nothing when `message` is falsy.
 */
const meta = {
  title: "Feedback/PageAlert",
  component: PageAlert,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageAlert>;

export default meta;

export const Error: StoryObj = {
  render: () => <PageAlert severity="error" message="Please complete the required fields before continuing." />,
};

export const Warning: StoryObj = {
  render: () => <PageAlert severity="warning" message="This plan is not available in your state." />,
};

export const Info: StoryObj = {
  render: () => <PageAlert severity="info" message="Membership verification is in progress." />,
};

export const Success: StoryObj = {
  render: () => <PageAlert severity="success" message="Your progress has been saved." />,
};

export const Dismissible: StoryObj = {
  render: () => <PageAlert severity="info" message="You can dismiss this message." onDismiss={() => {}} />,
};

export const NoMessage: StoryObj = {
  name: "No message (renders nothing)",
  render: () => (
    <Stack spacing={1}>
      <PageAlert />
      <Typography variant="caption" color="text.secondary">
        Nothing rendered above this line — the component returns{" "}
        <code>null</code> when <code>message</code> is undefined, so callers
        don't need to conditionally render <code>PageAlert</code> themselves.
      </Typography>
    </Stack>
  ),
};

export const AllSeverities: StoryObj = {
  render: () => (
    <Stack spacing={2}>
      <PageAlert severity="error" message="Error — blocking problem the user must resolve." />
      <PageAlert severity="warning" message="Warning — not blocking, but needs attention." />
      <PageAlert severity="info" message="Info — contextual, non-urgent detail." />
      <PageAlert severity="success" message="Success — confirms a completed action." />
    </Stack>
  ),
};
