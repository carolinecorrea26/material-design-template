import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Stack } from '@mui/material';
import RecoveryAlert from './RecoveryAlert';
import PageAlert from './PageAlert';
import ControlledFieldRenderer from '../forms/ControlledFieldRenderer';
import type { RecoveryIncident } from '../../domain/recoveryIncident';

const meta = { id: 'feedback-technical-error', title: "Components/Feedback and overlays/Alerts/Save failure and conflict", component: RecoveryAlert, parameters: { layout: 'padded', docs: { description: { component: 'Save failure and conflict feedback. The application-wide offline bar is under Banners. Technical navigation, payment and submission failures use Pages / Error pages.' } } } } satisfies Meta<typeof RecoveryAlert>;
export default meta;
const incident: RecoveryIncident = { code: 'TECHNICAL_ERROR', operation: 'save', outcome: 'failed', reference: 'REQ-7C2F91AB' };
export const SaveConflict: StoryObj<typeof meta> = { args: { incident: { ...incident, code: 'SAVE_CONFLICT' } } };
function SaveFailureDemo() {
  const [value, setValue] = useState<string | boolean | string[]>('My entered answer');
  const [saved, setSaved] = useState(false);
  return <Stack spacing={2}>
    {saved ? <PageAlert severity="success" message="Your progress has been saved." /> : <RecoveryAlert incident={{ ...incident, code: 'SAVE_FAILED' }} onRetry={() => setSaved(true)} />}
    <ControlledFieldRenderer field={{ id: 'recovery-example-answer', label: 'First name', inputType: 'text' }} value={value} onChange={setValue} />
  </Stack>;
}
export const SaveFailurePreservesAnswers: StoryObj = { render: () => <SaveFailureDemo /> };
