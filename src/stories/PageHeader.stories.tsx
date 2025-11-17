import type { Meta, StoryObj } from '@storybook/react';
import PageHeader from '../components/layout/PageHeader';

const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Application Form',
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Coverage Selection',
    subtitle: 'Choose the coverage options that best fit your needs',
  },
};