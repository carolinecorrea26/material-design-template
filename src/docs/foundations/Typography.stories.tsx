import type { Meta, StoryObj } from '@storybook/react-vite';
import { Typography } from './Typography';

const meta = {
  title: 'Foundations/Typography',
  component: Typography,
  parameters: { layout: 'padded' },
  argTypes: { group: { control: 'select', options: ['headings', 'body', 'application'] } },
} satisfies Meta<typeof Typography>;
export default meta;
export const Headings: StoryObj<typeof meta> = { args: { group: 'headings' } };
export const BodyAndSupportingText: StoryObj<typeof meta> = { args: { group: 'body' } };
export const ApplicationTitlesAndLabels: StoryObj<typeof meta> = { args: { group: 'application' } };
