import type { Meta, StoryObj } from '@storybook/react';
import ClientSwitcher from '../components/dev/ClientSwitcher';

const meta = {
  title: 'Dev/ClientSwitcher',
  component: ClientSwitcher,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ClientSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};