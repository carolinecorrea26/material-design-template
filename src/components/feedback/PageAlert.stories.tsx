// Preview notes are documentation only; the canvas contains application UI.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "@mui/material";
import PageAlert from "./PageAlert";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@mui/material';
import FieldRenderer from '../forms/FieldRenderer';
import { applicationRecovery } from '../../content/applicationRecovery';

/**
 * PageAlert is the canonical full-width contextual alert rendered above form
 * content. Renders nothing when `message` is falsy.
 */
const meta = {
  id: "feedback-pagealert",
  title: "Components/Feedback and overlays/Alerts/Page alert",
  component: PageAlert,
  parameters: { docs: { description: { component: "Displays page-level errors, warnings, or informational messages." } }, layout: "padded" },
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
function ValidationOnNextDemo() {
  const { control, handleSubmit, formState: { errors } } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { 'feedback-email': '' } });
  const [showSummary, setShowSummary] = useState(false);
  return <Stack component="form" spacing={2} noValidate onSubmit={handleSubmit(() => setShowSummary(false), () => setShowSummary(true))}>
    {showSummary && <PageAlert message={applicationRecovery.validation.message} />}
    <FieldRenderer field={{ id: 'feedback-email', label: 'Email address', inputType: 'text', format: 'email', required: true }} control={control} errors={errors} />
    <Button type="submit" variant="contained">Next</Button>
  </Stack>;
}
export const FieldValidationOnNext: StoryObj = { render: () => <ValidationOnNextDemo />, parameters: { docs: { description: { story: 'Local example: specific feedback stays on the field, and Next adds one page summary. No request is made.' } } } };
