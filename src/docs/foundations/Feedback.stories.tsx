import type { Meta, StoryObj } from '@storybook/react-vite';
import { DynamicFeedbackAndStatus as Example } from '../guidelines/DynamicFeedbackAndStatus';

const meta = { id: "foundations-feedback-and-status",
  title: "Components/Feedback and overlays/Alerts/Guidance", component: Example, parameters: { layout: 'padded' } } satisfies Meta<typeof Example>;
export default meta;
export const Guidance: StoryObj<typeof meta> = {};
