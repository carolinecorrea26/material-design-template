import { resolveMappedFields } from '../../domain/requirementFields';
import { requirementText } from '../../domain/requirementContent';
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
  render: () => <PageAlert severity="error" message={applicationRecovery.validation.message} />,
};

export const Warning: StoryObj = {
  render: () => <PageAlert severity="warning" message={requirementText("application.ui.you-re-entering-the-final-stages-of-your-application")} />,
};

export const Info: StoryObj = {
  render: () => <PageAlert severity="info" message={requirementText("coverage.increase.additional-note")} />,
};

export const Success: StoryObj = {
  render: () => <PageAlert severity="success" message={requirementText("recovery.resume-loaded")} />,
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

function ValidationOnNextDemo() {
  const { control, handleSubmit, formState: { errors } } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { email: '' } });
  const [showSummary, setShowSummary] = useState(false);
  return <Stack component="form" spacing={2} noValidate onSubmit={handleSubmit(() => setShowSummary(false), () => setShowSummary(true))}>
    {showSummary && <PageAlert message={applicationRecovery.validation.message} />}
    <FieldRenderer field={resolveMappedFields({ component: 'membership' }).find(field => field.id === 'email')!} control={control} errors={errors} />
    <Button type="submit" variant="contained">Next</Button>
  </Stack>;
}
export const FieldValidationOnNext: StoryObj = { render: () => <ValidationOnNextDemo />, parameters: { docs: { description: { story: 'Local example: specific feedback stays on the field, and Next adds one page summary. No request is made.' } } } };
